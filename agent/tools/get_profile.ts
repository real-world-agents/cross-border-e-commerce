import { defineTool } from "eve/tools";
import { z } from "zod";
import {
  isInterviewComplete,
  needsInterview,
  profileState,
} from "../../lib/profile";

export default defineTool({
  description:
    "Read the current user's profile (facts, notes, interview status). Call at the start of every session to decide whether the onboarding interview is still required.",
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
