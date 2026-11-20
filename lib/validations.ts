import { z } from 'zod';

export const ContentTypeSchema = z.string().transform((val) => {
  return val.toUpperCase().replace(/[\s-]+/g, '_');
}).pipe(z.enum([
  'SOCIAL_MEDIA_POST', 'ADVERTISEMENT', 'PRODUCT_DESCRIPTION', 'WEBSITE_COPY', 'EMAIL_CAMPAIGN', 'PRESS_RELEASE', 'OTHER',
]));

export const ChannelSchema = z.string().transform((val) => {
  return val.toUpperCase().replace(/[\s-]+/g, '_');
}).pipe(z.enum(['WEBSITE', 'INSTAGRAM', 'LINKEDIN', 'EMAIL', 'ADVERTISING', 'OTHER']));

export const CreateSubmissionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content_type: ContentTypeSchema,
  channel: ChannelSchema,
  original_content: z.string().min(1, 'Content is required').max(50000),
});

export const UpdateSubmissionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content_type: ContentTypeSchema.optional(),
  channel: ChannelSchema.optional(),
  original_content: z.string().min(1).max(50000).optional(),
  current_content: z.string().max(50000).optional(),
  status: z.enum(['DRAFT', 'ANALYZING', 'NEEDS_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'FAILED']).optional(),
  risk_level: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().nullable(),
  reviewer_id: z.string().max(100).optional().nullable(),
  submitted_at: z.string().datetime().optional().nullable(),
});

export const CreateGuidelineSchema = z.object({
  rule_code: z.string().min(1).max(50).regex(/^[A-Z0-9-]+$/, 'Use uppercase letters, numbers and hyphens'),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  category: z.enum(['TONE', 'TERMINOLOGY', 'CLAIMS', 'FORMATTING', 'LEGAL', 'POSITIONING', 'OTHER']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  examples: z.any().optional().nullable(),
  active: z.boolean().optional(),
  version: z.number().int().positive().optional(),
});

export const UpdateGuidelineSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(2000).optional(),
  category: z.enum(['TONE', 'TERMINOLOGY', 'CLAIMS', 'FORMATTING', 'LEGAL', 'POSITIONING', 'OTHER']).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  examples: z.any().optional().nullable(),
  active: z.boolean().optional(),
  version: z.number().int().positive().optional(),
});

export const CreateFactSchema = z.object({
  product_id: z.string().uuid().optional().nullable(),
  fact_code: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  fact_text: z.string().min(1).max(5000),
  entity_name: z.string().max(200).optional().nullable(),
  source_document_id: z.string().max(100).optional().nullable(),
  source_name: z.string().min(1).max(200),
  source_reference: z.string().max(500).optional().nullable(),
  source_excerpt: z.string().max(2000).optional().nullable(),
  verification_status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  effective_from: z.string().datetime().optional().nullable(),
  expires_at: z.string().datetime().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const UpdateFactSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  fact_text: z.string().min(1).max(5000).optional(),
  entity_name: z.string().max(200).optional().nullable(),
  source_name: z.string().min(1).max(200).optional(),
  source_reference: z.string().max(500).optional().nullable(),
  source_excerpt: z.string().max(2000).optional().nullable(),
  verification_status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  effective_from: z.string().datetime().optional().nullable(),
  expires_at: z.string().datetime().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const ReviewDecisionSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED', 'CHANGES_REQUESTED']),
  comment: z.string().max(2000).optional().nullable(),
});

export const FindingFeedbackSchema = z.object({
  feedback_type: z.enum(['ACCEPTED', 'OVERRIDDEN', 'EDITED_CORRECTION', 'REJECTED_CORRECTION', 'MARKED_AMBIGUOUS']),
  reason: z.string().max(1000).optional().nullable(),
});

export const GuidelineSuggestionSchema = z.object({
  guideline_id: z.string(),
  title: z.string().min(1).max(200),
  suggested_change: z.string().min(1).max(4000),
  supporting_feedback_ids: z.array(z.string()).optional(),
});

export type CreateSubmissionInput = z.infer<typeof CreateSubmissionSchema>;
export type UpdateSubmissionInput = z.infer<typeof UpdateSubmissionSchema>;
export type CreateGuidelineInput = z.infer<typeof CreateGuidelineSchema>;
export type UpdateGuidelineInput = z.infer<typeof UpdateGuidelineSchema>;
export type CreateFactInput = z.infer<typeof CreateFactSchema>;
export type UpdateFactInput = z.infer<typeof UpdateFactSchema>;
export type ReviewDecisionInput = z.infer<typeof ReviewDecisionSchema>;
export type FindingFeedbackInput = z.infer<typeof FindingFeedbackSchema>;
export type GuidelineSuggestionInput = z.infer<typeof GuidelineSuggestionSchema>;
