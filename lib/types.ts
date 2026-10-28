import { z } from "zod";

export const DifficultyTier = z.enum(["quick", "moderate", "enterprise"]);
export type DifficultyTier = z.infer<typeof DifficultyTier>;

export const StepOwner = z.enum(["agent_found", "agent_can_draft", "you_must_do"]);
export type StepOwner = z.infer<typeof StepOwner>;

export const EvidenceLevel = z.enum([
  "fetched_and_read",
  "search_result_only",
  "manually_verified",
]);
export type EvidenceLevel = z.infer<typeof EvidenceLevel>;

export const GuideStep = z.object({
  text: z.string(),
  owner: StepOwner,
});
export type GuideStep = z.infer<typeof GuideStep>;

export const Source = z.object({
  url: z.string(),
  title: z.string(),
  evidence: EvidenceLevel,
});
export type Source = z.infer<typeof Source>;

export const Guide = z.object({
  appName: z.string(),
  website: z.string(),
  slug: z.string(),
  difficulty: DifficultyTier,
  // null means the sources didn't state a number — shown honestly as "not specified", never guessed.
  setupTimeMinutes: z.number().nullable(),
  approvalWaitDays: z.number().nullable(),
  summary: z.string(),
  requirements: z.array(z.string()),
  steps: z.array(GuideStep),
  blockers: z.array(z.string()),
  sources: z.array(Source),
  confidence: z.enum(["low", "medium", "high"]),
  uncertainNotes: z.array(z.string()),
  manuallyVerified: z.boolean().default(false),
  verificationNotes: z.array(z.string()).default([]),
  generatedAt: z.string(),
  isLive: z.boolean().default(false),
});
export type Guide = z.infer<typeof Guide>;

// Shape the model must produce (no slug/generatedAt/isLive - those are added by the pipeline)
export const GuideDraft = Guide.omit({
  slug: true,
  generatedAt: true,
  isLive: true,
  manuallyVerified: true,
  verificationNotes: true,
  sources: true,
}).extend({
  sources: z.array(Source.omit({ evidence: true })),
});
export type GuideDraft = z.infer<typeof GuideDraft>;
