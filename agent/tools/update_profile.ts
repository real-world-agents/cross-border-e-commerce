import { defineTool } from "eve/tools";
import { z } from "zod";
import {
  emptyProfile,
  isInterviewComplete,
  needsInterview,
  profileState,
  type Profile,
} from "../../lib/profile";

const factKey = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9_.-]+$/, "Use lowercase keys like seller.stage or market.primary");

export default defineTool({
  description:
    "Update the user's profile after learning durable facts. Merges fact keys, optionally appends notes, and can mark the onboarding interview complete. Prefer after confirming a short summary with the user.",
  inputSchema: z.object({
    facts: z
      .record(factKey, z.string().min(1).max(2000))
      .optional()
      .describe("Stable key→value facts to merge into the profile."),
    notes: z
      .string()
      .max(8000)
      .optional()
      .describe("Freeform prose. Appended by default; use notesMode replace to overwrite."),
    notesMode: z.enum(["append", "replace"]).optional().default("append"),
    markInterviewComplete: z
      .boolean()
      .optional()
      .describe("Set true when the onboarding interview has finished successfully."),
  }),
  async execute({ facts, notes, notesMode, markInterviewComplete }) {
    const now = new Date().toISOString();
    const current = profileState.get() ?? emptyProfile(now);

    const nextFacts: Record<string, string> = { ...current.facts, ...(facts ?? {}) };
    if (markInterviewComplete) {
      nextFacts["interview.completed"] = "true";
      nextFacts["interview.completed_at"] = now;
    }

    let nextNotes = current.notes ?? "";
    if (notes !== undefined) {
      if (notesMode === "replace") {
        nextNotes = notes;
      } else if (notes.trim().length === 0) {
        // no-op
      } else if (nextNotes.trim().length === 0) {
        nextNotes = notes.trim();
      } else {
        nextNotes = `${nextNotes.trim()}\n\n${notes.trim()}`;
      }
    }

    const next: Profile = {
      schemaVersion: 1,
      updatedAt: now,
      facts: nextFacts,
      notes: nextNotes,
    };

    profileState.update(() => next);

    return {
      ...next,
      interviewComplete: isInterviewComplete(next),
      needsInterview: needsInterview(next),
    };
  },
});
