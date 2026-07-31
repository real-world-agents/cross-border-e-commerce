import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { defineAgent } from "eve";

const aisa = createOpenAICompatible({
  baseURL: process.env.AISA_BASE_URL!,
  apiKey: process.env.AISA_API_KEY!,
  name: "aisa",
});

export default defineAgent({
  model: aisa("kimi-k2.6"),
  modelContextWindowTokens: 128_000,
});