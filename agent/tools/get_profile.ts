import { defineTool } from "eve/tools";
import { z } from "zod";
import {
  isInterviewComplete,
  needsInterview,
  profileState,
} from "../../lib/profile";

export default defineTool({
  description:
    "Read the current user's profile (facts, notes, interview status). Usually unnecessary — turn instructions already inject the status and completed profile; use to re-check right after an update.",
  inputSchema: z.object({}),
  async execute() {
    const profile = profileState.get();
    return {
      ...profile,
      interviewComplete: isInterviewComplete(profile),
      needsInterview: needsInterview(profile),
    };
  },
});
