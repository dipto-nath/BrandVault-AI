# BrandVault AI
BrandVault AI is a pre-publication review gate for brand content. It compares each claim with approved sources, explains every finding with its evidence, and leaves the final decision to a person.

---

## Authentication & Route Protection Architecture

1. **Default-Deny Policy (`middleware.ts`)**:
   - All dashboard routes (`/overview`, `/reviews`, `/knowledge`, `/guidelines`, `/passports`, `/insights`, `/settings`) and API endpoints are strictly protected by default.
   - Unauthenticated page requests redirect to `/?auth=required&next=<encoded_path>`, opening the `<AuthGateModal />`.
   - Unauthenticated API calls return `401 Unauthorized` JSON.
   - Open redirect targets (`next=//evil.com`, `next=https://evil.com`) are sanitized to internal routes only.

2. **Defense-in-Depth (`app/(dashboard)/layout.tsx`)**:
   - The protected layout verifies the session server-side before generating or rendering any child components or sensitive data.

3. **Judge & Evaluator Sandbox Access**:
   - **Credentials**: `demo@nexatech.example` / `demo12345`
   - One-click "Fill demo credentials" helper on `/login`.
   - Real, server-verified authentication into the pre-loaded **NexaTech** sandbox workspace.

