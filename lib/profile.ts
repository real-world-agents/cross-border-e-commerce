import { defineState } from "eve/context";
import { z } from "zod";

export const ProfileSchema = z.object({
  schemaVersion: z.literal(1),
  updatedAt: z.string(),
  facts: z.record(z.string(), z.string()),
  notes: z.string().default(""),
});

export type Profile = z.infer<typeof ProfileSchema>;

export function emptyProfile(now = new Date().toISOString()): Profile {
  return {
    schemaVersion: 1,
    updatedAt: now,
    facts: {},
    notes: "",
  };
}

export function isInterviewComplete(profile: Profile): boolean {
  return profile.facts["interview.completed"] === "true";
}

/** True until the user finishes or explicitly skips the onboarding interview. */
export function needsInterview(profile: Profile): boolean {
  return (
    profile.facts["interview.completed"] !== "true" &&
    profile.facts["interview.skipped"] !== "true"
  );
}

/** Durable per-session profile. Survives turns; not shared across sessions. */
export const profileState = defineState<Profile>(
  "e-commerce-agent.profile",
  () => emptyProfile(),
);
