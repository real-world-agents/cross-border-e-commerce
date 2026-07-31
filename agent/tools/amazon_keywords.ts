import { defineTool } from "eve/tools";
import { z } from "zod";
import { dataforseoLive } from "../../lib/aisa.js";

export default defineTool({
  description:
    "Amazon keyword intelligence for listing SEO. mode 'volume' (default) returns Amazon search volume for given keywords; mode 'related' expands one keyword via Amazon's 'Related searches'. Coverage is strongest for the United States; some markets are unsupported and will return a coverage error.",
  inputSchema: z.object({
    keywords: z
      .array(z.string())
      .min(1)
      .max(100)
      .describe("Keywords. mode 'related' uses only the first as the seed."),
    location_name: z
      .string()
      .optional()
      .describe("Amazon market country. Defaults to 'United States'."),
    language_code: z
      .string()
      .optional()
      .describe("Two-letter language code, e.g. 'en'. Defaults to 'en'."),
    mode: z.enum(["volume", "related"]).optional().describe("Defaults to volume."),
    limit: z
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe("Max rows for mode 'related'. Default 20."),
  }),
  async execute({ keywords, location_name, language_code, mode = "volume", limit = 20 }) {
    const location = location_name ?? "United States";
    const language = language_code ?? "en";
    try {
      if (mode === "related") {
        const task = await dataforseoLive(
          "/dataforseo/dataforseo_labs/amazon/related_keywords/live",
          { keyword: keywords[0], location_name: location, language_code: language, limit },
        );
        const items: any[] = task?.result?.[0]?.items ?? [];
        return {
          seed: keywords[0],
          market: location,
          keywords: items.map((i) => ({
            keyword: i?.keyword_data?.keyword ?? null,
            amazonVolume: i?.keyword_data?.keyword_info?.search_volume ?? null,
            relatedSearches: i?.related_keywords ?? [],
          })),
        };
      }
      const task = await dataforseoLive(
        "/dataforseo/dataforseo_labs/amazon/bulk_search_volume/live",
        { keywords, location_name: location, language_code: language },
      );
      const items: any[] = task?.result?.[0]?.items ?? [];
      return {
        market: location,
        keywords: items.map((i) => ({
          keyword: i?.keyword ?? null,
          amazonVolume: i?.search_volume ?? null,
        })),
      };
    } catch (error) {
      // DataForSEO reports unsupported markets as "Invalid Field: 'location_name'"
      if (error instanceof Error && error.message.includes("Invalid Field")) {
        throw new Error(
          `Amazon keyword data does not cover this market (${location}) for mode '${mode}'. Retry with location_name 'United States' and note the coverage gap in your answer.`,
        );
      }
      throw error;
    }
  },
});
