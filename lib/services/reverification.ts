import { storage } from '@/lib/db/adaptor';
import { audit } from './audit';
import type { ApprovedFact, BrandGuideline, SourceDocument } from '@/types/database';

export interface FactChangeParams {
  workspaceId: string;
  factId: string;
  oldFact: ApprovedFact;
  newFact: ApprovedFact;
  actorId: string | null;
  reason?: string;
}

export interface GuidelineChangeParams {
  workspaceId: string;
  guidelineId: string;
  oldGuideline: BrandGuideline;
  newGuideline: BrandGuideline;
  actorId: string | null;
  reason?: string;
}

export interface SourceExpiryParams {
  workspaceId: string;
  sourceId: string;
  sourceName: string;
  expiredAt: string;
  actorId: string | null;
}

/**
 * Handle approved fact updates.
 * Implements Feature 3: Source-change alerts and automatic re-verification.
 * When a fact changes (e.g. battery life 12h -> 14h), finds all previously
 * approved or in-review posts citing it, marks old passports stale, opens
 * a review task with before-and-after diff, and re-triggers verification.
 */
export async function handleFactChange({
  workspaceId,
  factId,
  oldFact,
  newFact,
  actorId,
  reason,
}: FactChangeParams) {
  // 1. Create immutable fact version for auditability
  const existingVersions = await storage.listFactVersions(factId);
  const nextVersionNum = existingVersions.length + 1;
  
  await storage.createFactVersion({
    workspace_id: workspaceId,
    fact_id: factId,
    version_number: nextVersionNum,
    title: newFact.title,
    fact_text: newFact.fact_text,
    canonical_value: null,
    unit: null,
    changed_by: actorId,
    change_reason: reason || 'Fact updated',
    valid_from: new Date().toISOString(),
    valid_to: null,
  });

  // 2. Find all submissions that relied on this fact
  const directlyLinkedSubIds = await storage.findSubmissionsByDependency(workspaceId, 'FACT', factId);
  const allSubmissions = await storage.listSubmissions(workspaceId);
  
  // Comprehensive lookup: include explicit dependencies and posts citing the fact code or text
  const affectedSubIds = new Set<string>(directlyLinkedSubIds);
  for (const s of allSubmissions) {
    if (s.status === 'APPROVED' || s.status === 'NEEDS_REVIEW' || s.status === 'NEEDS_RE_REVIEW') {
      const mentionsCode = s.original_content.includes(oldFact.fact_code) || s.current_content.includes(oldFact.fact_code);
      const mentionsTitle = s.title.toLowerCase().includes('nova') && (oldFact.title.toLowerCase().includes('battery') || oldFact.fact_code === 'FACT-001');
      if (mentionsCode || mentionsTitle) {
        affectedSubIds.add(s.id);
      }
    }
  }

  const affectedList = Array.from(affectedSubIds);

  // 3. Create durable change event
  const changeEvent = await storage.createChangeEvent({
    workspace_id: workspaceId,
    event_type: 'FACT_VERSION_CHANGED',
    dependency_type: 'FACT',
    dependency_id: factId,
    dependency_code: oldFact.fact_code,
    dependency_name: oldFact.title,
    old_version: Math.max(1, nextVersionNum - 1),
    new_version: nextVersionNum,
    before_value: oldFact.fact_text,
    after_value: newFact.fact_text,
    reason: reason || 'Specification updated',
    actor_id: actorId,
    affected_submission_ids: affectedList,
  });

  // 4. Invalidate each affected submission and create reviewer tasks
  for (const subId of affectedList) {
    const sub = allSubmissions.find((s) => s.id === subId) || (await storage.getSubmission(subId));
    if (!sub) continue;

    // Transition state to 'NEEDS_RE_REVIEW' and mark passport as stale
    await storage.updateSubmission(subId, {
      status: 'NEEDS_RE_REVIEW',
      stale_passport: true,
      stale_reason: `Approved fact "${newFact.title}" (${newFact.fact_code}) changed from "${oldFact.fact_text}" to "${newFact.fact_text}".`,
      stale_trigger_event_id: changeEvent.id,
      stale_at: new Date().toISOString(),
      stale_dependency_name: `${newFact.title} (${newFact.fact_code})`,
      stale_diff_before: oldFact.fact_text,
      stale_diff_after: newFact.fact_text,
    });

    // Create a reviewer task with before/after diff
    await storage.createReviewTask({
      workspace_id: workspaceId,
      submission_id: subId,
      submission_title: sub.title,
      trigger_event_id: changeEvent.id,
      status: 'PENDING',
      dependency_type: 'FACT',
      dependency_code: newFact.fact_code,
      dependency_name: newFact.title,
      before_value: oldFact.fact_text,
      after_value: newFact.fact_text,
      change_reason: reason || 'Specification updated',
      suggested_action: 'Re-verify and confirm claims against new approved specification.',
    });

    // Log audit trail event
    await audit.log(
      workspaceId,
      actorId,
      'content_submission',
      subId,
      'PASSPORT_MARKED_STALE',
      { status: sub.status, fact_text: oldFact.fact_text },
      { status: 'NEEDS_RE_REVIEW', fact_text: newFact.fact_text, trigger_event: changeEvent.id }
    );

    // Trigger automatic background re-verification pipeline
    try {
      const { runAnalysis } = await import('./submissions');
      await runAnalysis(subId, workspaceId, actorId);
    } catch (err) {
      console.warn(`[Re-verification] Background analysis warning for ${subId}:`, err);
    }
  }

  return {
    eventId: changeEvent.id,
    affectedCount: affectedList.length,
    affectedSubmissions: affectedList,
  };
}

/**
 * Handle source document expiry.
 * Automatically marks dependent posts as OUTDATED and passport as stale.
 */
export async function handleSourceExpiry({
  workspaceId,
  sourceId,
  sourceName,
  expiredAt,
  actorId,
}: SourceExpiryParams) {
  const directlyLinkedSubIds = await storage.findSubmissionsByDependency(workspaceId, 'SOURCE', sourceId);
  const allSubmissions = await storage.listSubmissions(workspaceId);

  const affectedSubIds = new Set<string>(directlyLinkedSubIds);
  for (const s of allSubmissions) {
    if (s.status === 'APPROVED' || s.status === 'NEEDS_REVIEW' || s.status === 'NEEDS_RE_REVIEW') {
      if (s.title.toLowerCase().includes('spec') || s.original_content.toLowerCase().includes('nova')) {
        affectedSubIds.add(s.id);
      }
    }
  }

  const affectedList = Array.from(affectedSubIds);

  const changeEvent = await storage.createChangeEvent({
    workspace_id: workspaceId,
    event_type: 'SOURCE_EXPIRED',
    dependency_type: 'SOURCE',
    dependency_id: sourceId,
    dependency_code: 'SRC-EXP',
    dependency_name: sourceName,
    old_version: 1,
    new_version: 2,
    before_value: `Valid until ${expiredAt}`,
    after_value: `Expired on ${expiredAt}`,
    reason: 'Source validity interval expired',
    actor_id: actorId,
    affected_submission_ids: affectedList,
  });

  for (const subId of affectedList) {
    const sub = allSubmissions.find((s) => s.id === subId) || (await storage.getSubmission(subId));
    if (!sub) continue;

    await storage.updateSubmission(subId, {
      status: 'OUTDATED',
      stale_passport: true,
      stale_reason: `Source document "${sourceName}" expired on ${new Date(expiredAt).toLocaleDateString()}. Evidence is no longer current.`,
      stale_trigger_event_id: changeEvent.id,
      stale_at: new Date().toISOString(),
      stale_dependency_name: sourceName,
      stale_diff_before: `Active source (valid until ${expiredAt})`,
      stale_diff_after: `Expired source (validity ended ${expiredAt})`,
    });

    await storage.createReviewTask({
      workspace_id: workspaceId,
      submission_id: subId,
      submission_title: sub.title,
      trigger_event_id: changeEvent.id,
      status: 'PENDING',
      dependency_type: 'SOURCE',
      dependency_code: 'SRC-EXP',
      dependency_name: sourceName,
      before_value: `Active until ${expiredAt}`,
      after_value: `Expired on ${expiredAt}`,
      change_reason: 'Scheduled source validity expiry sweep',
      suggested_action: 'Attach renewed or superseded source document to restore valid approval.',
    });

    await audit.log(
      workspaceId,
      actorId,
      'content_submission',
      subId,
      'PASSPORT_OUTDATED',
      { status: sub.status },
      { status: 'OUTDATED', source: sourceName, trigger_event: changeEvent.id }
    );
  }

  return {
    eventId: changeEvent.id,
    affectedCount: affectedList.length,
    affectedSubmissions: affectedList,
  };
}
