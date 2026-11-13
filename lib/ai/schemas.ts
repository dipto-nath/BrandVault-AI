import { z } from 'zod';

export const FindingTypeSchema = z.enum([
  'FACTUAL_CONTRADICTION', 'UNSUPPORTED_CLAIM', 'UNVERIFIED_CLAIM', 'TONE_VIOLATION', 'TERMINOLOGY_VIOLATION', 'GUIDELINE_VIOLATION', 'OTHER',
]);

export const VerificationStatusSchema = z.enum(['SUPPORTED', 'CONTRADICTED', 'UNVERIFIED']);
export const SeveritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);
export const RiskLevelSchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);

export const ClaimResultSchema = z.object({
  claimText: z.string().min(1),
  claimType: z.string().min(1),
  verificationStatus: VerificationStatusSchema,
  explanation: z.string(),
  evidenceIds: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

export const FindingResultSchema = z.object({
  type: FindingTypeSchema,
  severity: SeveritySchema,
  title: z.string().min(1),
  excerpt: z.string().min(1),
  explanation: z.string().min(1),
  ruleId: z.string().nullable().optional(),
  evidenceIds: z.array(z.string()),
  suggestedCorrection: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1),
});

export const AnalysisOutputSchema = z.object({
  summary: z.string().min(1),
  riskLevel: RiskLevelSchema,
  claims: z.array(ClaimResultSchema),
  findings: z.array(FindingResultSchema),
  suggestedContent: z.string().min(1),
  analysisNotes: z.string().optional(),
});

export type ClaimResult = z.infer<typeof ClaimResultSchema>;
export type FindingResult = z.infer<typeof FindingResultSchema>;
export type AnalysisOutput = z.infer<typeof AnalysisOutputSchema>;

export const PROMPT_VERSION = 'v1.0';
