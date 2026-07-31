import { defineTool } from "eve/tools";
import { z } from "zod";
import { dataforseoLive } from "../../lib/aisa.js";

export default defineTool({
  description:
    "Validate a list of keywords for a target market in one call: real Google monthly search volume, CPC, competition, ranking difficulty (0-100), and search intent per keyword. Use this to score keywords you already have; use research_keywords to discover new ones.",
  inputSchema: z.object({
    keywords: z
      .array(z.string())
      .min(1)
      .max(100)
      .describe("Keywords to validate."),
    location_name: z
      .string()
      .optional()
      .describe("Destination country, e.g. 'Germany'. Defaults to 'United States'."),
    language_code: z
      .string()
      .optional()
      .describe("Two-letter language code, e.g. 'de'. Defaults to 'en'."),
  }),
  async execute({ keywords, location_name, language_code }) {
    const location = location_name ?? "United States";
    const language = language_code ?? "en";

    const [volumeRes, difficultyRes, intentRes] = await Promise.allSettled([
      dataforseoLive("/dataforseo/keywords_data/google_ads/search_volume/live", {
        keywords,
        location_name: location,
        language_code: language,
      }),
      dataforseoLive("/dataforseo/dataforseo_labs/google/bulk_keyword_difficulty/live", {
        keywords,
        location_name: location,
        language_code: language,
      }),
      // search_intent is language-scoped only
      dataforseoLive("/dataforseo/dataforseo_labs/google/search_intent/live", {
        keywords,
        language_code: language,
      }),
    ]);

    const rows = new Map<
      string,
      {
        keyword: string;
        volume: number | null;
        cpc: number | null;
        competition: string | null;
        difficulty: number | null;
        intent: string | null;
      }
    >();
    for (const k of keywords) {
      rows.set(k.toLowerCase(), {
        keyword: k,
        volume: null,
        cpc: null,
        competition: null,
        difficulty: null,
        intent: null,
      });
    }
    const errors: string[] = [];

    if (volumeRes.status === "fulfilled") {
      // google_ads rows sit directly in result[], not under items
      for (const r of volumeRes.value?.result ?? []) {
        const row = rows.get(String(r?.keyword ?? "").toLowerCase());
        if (row === undefined) continue;
        row.volume = r.search_volume ?? null;
        row.cpc = r.cpc ?? null;
        row.competition = r.competition ?? null;
      }
    } else errors.push(`volume: ${volumeRes.reason}`);

    if (difficultyRes.status === "fulfilled") {
      for (const r of difficultyRes.value?.result?.[0]?.items ?? []) {
        const row = rows.get(String(r?.keyword ?? "").toLowerCase());
        if (row !== undefined) row.difficulty = r.keyword_difficulty ?? null;
      }
    } else errors.push(`difficulty: ${difficultyRes.reason}`);

    if (intentRes.status === "fulfilled") {
      for (const r of intentRes.value?.result?.[0]?.items ?? []) {
        const row = rows.get(String(r?.keyword ?? "").toLowerCase());
        if (row !== undefined) row.intent = r.keyword_intent?.label ?? null;
      }
    } else errors.push(`intent: ${intentRes.reason}`);

    return {
      market: location,
      keywords: [...rows.values()],
      ...(errors.length > 0 && { errors }),
    };
  },
});
