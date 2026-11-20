# BrandVault AI - Full Implementation Plan

## Phase 1: Critical Security & Auth (Week 1)
- [ ] 1.1 Create Sign-in Gate Modal component
- [ ] 1.2 Update Landing Page with auth state awareness
- [ ] 1.3 Implement Role-Based Access Control (add Manager, Agency roles)
- [ ] 1.4 Add Workspace Isolation enforcement in API routes
- [ ] 1.5 Fix Overview page to show real workspace data (no demo fallback)
- [ ] 1.6 Add cache-control headers for auth pages
- [ ] 1.7 Sign-in Gate Redirect Logic

## Phase 2: Core Feature Completion (Week 1-2)
- [ ] 2.1 Connect Review Studio product selector to real products
- [ ] 2.2 Add role enforcement to Review Studio actions (override, approve)
- [ ] 2.3 Add status filter UI to Reviews page
- [ ] 2.4 Fix Findings filter chip contrast
- [ ] 2.5 Implement Guideline Candidates queue UI
- [ ] 2.6 Fix Approved Knowledge: source excerpts, unit/qualifier fields, version history
- [ ] 2.7 Fix Evidence Passports: SHA-256 hash, honest language, JSON export
- [ ] 2.8 Fix Governance Insights: honest "not enough data" state

## Phase 3: Settings & Global Elements (Week 2)
- [ ] 3.1 Fix Settings: AI disclosure toggle, team invitations API
- [ ] 3.2 Add AI status chip (global)
- [ ] 3.3 Implement real Notifications from API
- [ ] 3.4 Fix Workspace Isolation in file adapter
- [ ] 3.5 Fix Sign-up page: terms acceptance, company name in header

## Phase 4: Polish & Edge Cases (Week 2-3)
- [ ] 4.1 Add analysis progress states (granular)
- [ ] 4.2 Add file upload extraction preview
- [ ] 4.3 Add knowledge health warnings
- [ ] 4.4 Add version history for facts
- [ ] 4.5 Fix passport misleading language ("certified" → "approved")
- [ ] 4.6 Add JSON export for passports
- [ ] 4.7 Demo sandbox read-only behavior