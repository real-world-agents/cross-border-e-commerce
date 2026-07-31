import { defineTool } from "eve/tools";
import { z } from "zod";
import { dataforseoLive } from "../../lib/aisa.js";

function toRow(item: any) {
  const row = item?.keyword_data ?? item;
  return {
    keyword: row?.keyword ?? null,
    volume: row?.keyword_info?.search_volume ?? null,
    cpc: row?.keyword_info?.cpc ?? null,
    competition: row?.keyword_info?.competition_level ?? null,
    difficulty: row?.keyword_properties?.keyword_difficulty ?? null,
    intent: row?.search_intent_info?.main_intent ?? null,
  };
}

export default defineTool({
  description:
    "Expand a seed keyword into a validated keyword list for a target market, with real Google search volume, CPC, competition, difficulty, and intent per keyword. mode: 'suggestions' (long-tail phrases containing the seed, default), 'ideas' (broader category terms), or 'related' (semantically related terms).",
  inputSchema: z.object({
    seed_keyword: z.string().min(1).describe("Seed keyword, e.g. 'yoga mat'."),
    location_name: z
      .string()
      .optional()
      .describe("Destination country, e.g. 'Germany'. Defaults to 'United States'."),
    language_code: z
      .string()
      .optional()
      .describe("Two-letter language code, e.g. 'de'. Defaults to 'en'."),
    mode: z
      .enum(["suggestions", "ideas", "related"])
      .optional()
      .describe("Defaults to suggestions."),
    limit: z.int().min(1).max(50).optional().describe("Max keywords. Default 20."),
  }),
  async execute({ seed_keyword, location_name, language_code, mode = "suggestions", limit = 20 }) {
    const path = `/dataforseo/dataforseo_labs/google/${
      mode === "ideas" ? "keyword_ideas" : mode === "related" ? "related_keywords" : "keyword_suggestions"
    }/live`;
    const task = await dataforseoLive(path, {
      ...(mode === "ideas" ? { keywords: [seed_keyword] } : { keyword: seed_keyword }),
      location_name: location_name ?? "United States",
      language_code: language_code ?? "en",
      limit,
    });
    const items: any[] = task?.result?.[0]?.items ?? [];
    return {
      seed: seed_keyword,
      market: location_name ?? "United States",
      keywords: items.map(toRow).filter((r) => r.keyword !== null),
    };
  },
});
