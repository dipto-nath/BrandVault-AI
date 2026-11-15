import { storage } from '@/lib/db/adaptor';
import { audit } from './audit';
import { extractDocumentText, sanitizeExtractedText } from '@/lib/ai/documents';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const UPLOAD_DIR = join(process.cwd(), '.brandvault', 'uploads');

export async function listFacts(workspaceId: string) {
  return storage.listFacts(workspaceId, { active: true });
}

export async function createFact(workspaceId: string, userId: string | null, data: any) {
  const fact = await storage.createFact({
    workspace_id: workspaceId,
    fact_code: data.fact_code,
    title: data.title,
    fact_text: data.fact_text,
    entity_name: data.entity_name ?? null,
    source_name: data.source_name,
    source_reference: data.source_reference ?? null,
    source_document_id: data.source_document_id ?? null,
    source_excerpt: data.source_excerpt ?? null,
    verification_status: 'APPROVED',
    effective_from: data.effective_from ?? null,
    expires_at: data.expires_at ?? null,
    notes: data.notes ?? null,
    created_by: userId,
  });
  await audit.log(workspaceId, userId, 'approved_fact', fact.id, 'CREATE', null, { fact_code: fact.fact_code, title: fact.title });
  return fact;
}

export async function updateFact(id: string, workspaceId: string, userId: string | null, data: any) {
  const existing = await storage.getFact(id);
  if (!existing || existing.workspace_id !== workspaceId) throw new Error('Fact not found');
  const fact = await storage.updateFact(id, {
    title: data.title,
    fact_text: data.fact_text,
    entity_name: data.entity_name ?? null,
    source_name: data.source_name,
    source_reference: data.source_reference ?? null,
    source_excerpt: data.source_excerpt ?? null,
    verification_status: data.verification_status,
    effective_from: data.effective_from ?? null,
    expires_at: data.expires_at ?? null,
    notes: data.notes ?? null,
  });
  await audit.log(workspaceId, userId, 'approved_fact', id, 'UPDATE', { title: existing.title }, { title: fact.title });
  return fact;
}

export async function listDocuments(workspaceId: string) {
  return storage.listDocuments(workspaceId);
}

export async function uploadDocument(workspaceId: string, userId: string | null, fileBuffer: Buffer, filename: string, mimeType: string) {
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (fileBuffer.length > maxSize) throw new Error('File too large (max 10MB)');
  const allowed = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
  ];
  if (!allowed.includes(mimeType) && !filename.match(/\.(pdf|docx|doc|txt)$/i)) {
    throw new Error('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
  }

  if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = join(UPLOAD_DIR, `${Date.now()}-${sanitizedFilename}`);
  writeFileSync(storagePath, fileBuffer);
  const doc = await storage.createDocument({
    workspace_id: workspaceId,
    filename,
    storage_path: storagePath,
    mime_type: mimeType,
    file_size: fileBuffer.length,
    source_name: filename,
    document_status: 'EXTRACTING',
    extracted_text: null,
    extraction_error: null,
    uploaded_by: userId,
  });
  const extraction = await extractDocumentText(storagePath, mimeType);
  const text = sanitizeExtractedText(extraction.text);
  await storage.updateDocument(doc.id, {
    document_status: extraction.success ? 'PENDING_REVIEW' : 'FAILED',
    extracted_text: extraction.success ? text : null,
    extraction_error: extraction.success ? null : extraction.error,
  });
  await audit.log(workspaceId, userId, 'source_document', doc.id, 'UPLOAD', null, { filename, mime_type: mimeType, status: doc.document_status });
  return { document: await storage.getDocument(doc.id), extractedText: text, success: extraction.success };
}

export async function approveDocument(id: string, workspaceId: string, userId: string | null) {
  const doc = await storage.getDocument(id);
  if (!doc || doc.workspace_id !== workspaceId) throw new Error('Document not found');
  const updated = await storage.approveDocument(id);
  await audit.log(workspaceId, userId, 'source_document', id, 'APPROVE', null, {});
  return updated;
}
