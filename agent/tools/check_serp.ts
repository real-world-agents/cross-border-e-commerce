import { defineTool } from "eve/tools";
import { z } from "zod";
import { dataforseoLive } from "../../lib/aisa.js";

export default defineTool({
  description:
    "Live Google search results for a keyword in a destination country: top organic results (rank, title, domain, url) plus which SERP features appear. Use to see which sites/marketplaces dominate a query and validate keyword targeting.",
  inputSchema: z.object({
    keyword: z.string().min(1).describe("Search query, ideally in the local language."),
    location_name: z
      .string()
      .optional()
      .describe("Destination country, e.g. 'Germany'. Defaults to 'United States'."),
    language_code: z
      .string()
      .optional()
      .describe("Two-letter language code, e.g. 'de'. Defaults to 'en'."),
    top: z.int().min(1).max(20).optional().describe("Organic results to return. Default 10."),
  }),
  async execute({ keyword, location_name, language_code, top = 10 }) {
    const task = await dataforseoLive("/dataforseo/serp/google/organic/live/advanced", {
      keyword,
      location_name: location_name ?? "United States",
      language_code: language_code ?? "en",
      depth: Math.max(top, 10),
    });
    const result = task?.result?.[0];
    const items: any[] = result?.items ?? [];
    const organic = items
      .filter((i) => i?.type === "organic")
      .slice(0, top)
      .map((i) => ({
        rank: i.rank_absolute ?? null,
        title: i.title ?? null,
        domain: i.domain ?? null,
        url: i.url ?? null,
      }));
    const serpFeatures = [...new Set(items.map((i) => i?.type).filter((t) => t !== "organic"))];
    return {
      keyword,
      market: location_name ?? "United States",
      totalResults: result?.se_results_count ?? null,
      organic,
      serpFeatures,
    };
  },
});
