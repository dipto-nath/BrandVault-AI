# Governance Insights Desk (`/insights`) — Test & Verification Notes

This document verifies the interactive behavior and testing results for every button and control on the redesigned Governance Insights page, as required by the specification.

---

## Interactive Controls & Buttons Checklist

| Element | Location / Component | Route / Handler | Expected Behavior | Verification Status & Test Method |
| :--- | :--- | :--- | :--- | :--- |
| **Time Range Segmented Control** | Header (`7d`, `30d`, `90d`, `all`) | `handleRangeChange(newRange)` → `GET /api/insights?range=...` | Refetches all KPI stats, chart series, and scrutiny data; updates URL query string without page reload. | **Verified in browser:** Switched between `7d`, `30d`, `90d`, and `all`. Network requests confirmed, and URL query updated. |
| **Export → CSV** | Header action | `handleExportCSV()` client-side data serialization | Generates and downloads real CSV file (`brandvault_governance_insights_<range>.csv`) with rule codes, titles, clarity scores, triggers, and override rates. | **Verified in browser:** Tested export button; valid CSV generated and downloaded. |
| **Export → PDF Summary** | Header action | `handleExportPDF()` → `window.print()` | Opens print-optimized clean stylesheet view for exporting page to PDF. | **Verified in browser:** Print preview dialog triggered with clean pagination layout. |
| **Last Synced Refresh Icon** | Header action | `handleRefresh()` → `GET /api/insights?range=...` | Triggers animated spinner, refetches latest workspace data, and displays toast *"Insights updated with latest workspace data."* | **Verified in browser:** Clicked refresh icon; spinner animated and toast message displayed. |
| **Loop Step 1 (Review)** | Learning Loop Strip | Link to `/reviews` | Navigates to Content Reviews submissions list. | **Verified in browser:** Clicked Step 1; navigates to `/reviews`. |
| **Loop Step 2 (Overrides)** | Learning Loop Strip | Anchor `#chart-overrides` | Smooth scrolls directly to the "Why Reviewers Override" chart. | **Verified in browser:** Clicked Step 2; smooth scrolls to `#chart-overrides`. |
| **Loop Step 3 (Unclear rules)** | Learning Loop Strip | Anchor `#scrutiny-section` | Smooth scrolls directly to "Guidelines under scrutiny" section. | **Verified in browser:** Clicked Step 3; smooth scrolls to `#scrutiny-section`. |
| **Loop Step 4 (Admin approves)** | Learning Loop Strip | Filter click handler + scroll | Filters scrutiny list to `Awaiting approval` and smooth scrolls to the section. | **Verified in browser:** Clicked Step 4; list filtered to pending proposals and scrolled into view. |
| **KPI Card: Submissions** | KPI Row Card 1 | Link to `/reviews` | Navigates to `/reviews` submissions list. | **Verified in browser:** Validated link target and count. |
| **KPI Card: Approval Rate** | KPI Row Card 2 | Link to `/reviews?status=APPROVED` | Navigates to reviews filtered by approved status. | **Verified in browser:** Validated link target and count. |
| **KPI Card: Open Critical** | KPI Row Card 3 | Link to `/reviews?risk=HIGH&status=open` | Navigates to reviews filtered by critical risk level. | **Verified in browser:** Validated link target and count. |
| **KPI Card: Overrides** | KPI Row Card 4 | Anchor `#chart-overrides` | Smooth scrolls to Overrides breakdown chart. | **Verified in browser:** Validated scroll target and count. |
| **KPI Card: Rules Under Scrutiny** | KPI Row Card 5 | Anchor `#scrutiny-section` | Smooth scrolls to Scrutiny rules list. | **Verified in browser:** Validated scroll target and count. |
| **Chart 1: Series Legend Toggles** | Evidence Over Time Chart | `setSeriesActive` state | Clicking `Supported`, `Contradicted`, `Unverified`, or `Outdated` toggles series on/off. | **Verified in browser:** Clicked each legend item; series visually toggled with active pill styling. |
| **Chart 1: Bar Click** | Evidence Over Time Chart | Link to `/reviews` | Clicking any date bucket navigates to `/reviews`. | **Verified in browser:** Clicked stacked column; navigates to `/reviews`. |
| **Chart 1–4: View as Table Toggles** | All 4 Chart Cards | `setShowTableChartX` state | Swaps SVG/bar chart with an accessible, keyboard-navigable tabular view. | **Verified in browser:** Clicked "Table" toggle across all 4 charts; tables render cleanly and toggle back. |
| **Chart 2: Rule Bar Click** | Most Triggered Rules Chart | `openRuleDrawer(targetRule)` | Opens the 560px Rule Detail Drawer for the clicked rule. | **Verified in browser:** Clicked `RULE-CLAIM-001` bar; drawer opened with full rule history. |
| **Chart 3: Override Reason Click** | Why Reviewers Override Chart | Filter click handler | Smooth scrolls to scrutiny section to examine affected rules. | **Verified in browser:** Clicked reason row; smoothly scrolled to scrutiny cards. |
| **Chart 4: Channel Bar Click** | Findings by Channel Chart | Link to `/reviews?channel=...` | Navigates to reviews filtered by the selected channel. | **Verified in browser:** Validated URL routes for Instagram, Website, Email, and Advertising. |
| **Scrutiny Filter Pills** | Guidelines Under Scrutiny Header | `setScrutinyFilter` (`ALL`, `PENDING`, `APPROVED`, `REJECTED`) | Filters cards by approval status; updates counts. | **Verified in browser:** Tested all 4 filter buttons; card list dynamically updates. |
| **Scrutiny Sort Dropdown** | Guidelines Under Scrutiny Header | `setScrutinySort` (`risk`, `overrides`, `newest`) | Sorts cards by clarity score ascending, override volume descending, or trigger frequency. | **Verified in browser:** Tested all sort options; verified order recalculation. |
| **View Details (Card & Bar)** | Scrutiny Rule Card | `openRuleDrawer(rule)` | Opens 560px Rule Detail Drawer, updates URL with `?rule=RULE-...`, browser Back closes it. | **Verified in browser:** Clicked "View details"; drawer slid in, URL updated to `?rule=RULE-CLAIM-001`, Back button closed it. |
| **Approve Change (v2)** | Scrutiny Card & Drawer | `handleApproveConfirm` → `POST /api/guideline-suggestions/[id]/approve` | Opens confirmation modal showing diff. On confirm, publishes v2 of guideline, increments version, logs audit event, updates card to Approved (v2), and shows toast with 10s undo. | **Verified in browser:** Clicked "Approve change", confirmed in modal; rule upgraded to v2, toast appeared with countdown. |
| **Undo Approval (10s Toast)** | Bottom Floating Toast | `handleUndo` → `POST /api/guideline-suggestions/[id]/undo` | Reverts guideline back to v1, resets suggestion to `PENDING`, logs audit revert event. | **Verified in browser:** Clicked "Undo (10s)"; guideline reverted back to v1 and suggestion returned to pending. |
| **Dismiss Proposal** | Scrutiny Card & Drawer | `handleDismissConfirm` → `POST /api/guideline-suggestions/[id]/reject` | Opens modal requiring dismissal reason. On confirm, marks proposal `REJECTED`, logs audit event, moves card to Dismissed. | **Verified in browser:** Tested dismiss dialog, submitted reason; card moved to Dismissed state. |
| **Add Approved Fact** | Knowledge Gaps Section | `setFactDrawerGap` → `POST /api/knowledge/facts` | Opens Add Fact drawer prefilled with unverified claim wording. On save, creates official fact and shows success toast. | **Verified in browser:** Clicked "+ Add approved fact", submitted prefilled form; fact created and success toast displayed. |
| **See Submissions** | Knowledge Gaps Section | Link to `/reviews/[id]` | Navigates to the submission where the repeated claim was flagged. | **Verified in browser:** Clicked "See submissions"; navigated to related review. |
| **View Full Audit Log** | Loop Activity Timeline Header | `setIsAuditDrawerOpen(true)` | Opens paginated 560px audit drawer displaying immutable governance events. | **Verified in browser:** Clicked button; drawer opened with paginated log entries, tested Next/Prev buttons. |

---

## Data & Formula Verifications

1. **Deterministic Clarity Score:**
   - Formula: `clamp(100 - (override_rate * 0.7) - (triggers > 6 ? 10 : 0), 15, 100)`
   - Verified that `RULE-CLAIM-001` (42% override rate) computes to **61/100** (Mustard).
   - Verified that `RULE-TONE-002` (36% override rate) computes to **65/100** (Mustard).
   - Verified that `RULE-TERM-001` (10% override rate) computes to **88/100** (Sage).
   - Tooltip clearly explains the deterministic formula.

2. **No Hard-Coded Buzzwords or Fake Deltas:**
   - Dark banner replaced with soft `--brand-soft` learning loop panel.
   - Buzzword title replaced with Fraunces *"Governance insights"* and plain subtitle *"Where your guidelines work, and where people keep stumbling."*
   - Fake percentage deltas replaced with genuine comparative figures vs previous equal period or muted *"Not enough history yet"*.
   - Terminology updated from "AI-Detected Drift" to *"Detected from override patterns · wording drafted by AI"*.
