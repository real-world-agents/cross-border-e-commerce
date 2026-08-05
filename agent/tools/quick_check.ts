import { defineTool } from "eve/tools";
import { z } from "zod";
import { dataforseoLive } from "../../lib/aisa.js";
import { trendDirection } from "../../lib/trend-verdict.js";

export default defineTool({
  description:
    "Fast interview-time fact check for a single user claim about a market. One cheap live call, compact verdict — safe to use mid-interview. NOT for full analysis (use explore_trends / keyword_metrics / check_serp after the interview). Modes: 'demand_trend' — is interest rising or falling; 'search_volume' — monthly Google searches per keyword; 'platform_presence' — which domains rank on Google for a query. Pass the user's claim verbatim so the result can be recorded against it.",
  inputSchema: z.object({
    claim: z
      .string()
      .max(300)
      .describe("The user's claim being tested, near-verbatim."),
    mode: z.enum(["demand_trend", "search_volume", "platform_presence"]),
    keywords: z
      .array(z.string())
      .min(1)
      .max(3)
      .describe(
        "Local-language keywords that operationalize the claim. platform_presence uses only the first.",
      ),
    location_name: z
      .string()
      .optional()
      .describe("Destination country, e.g. 'South Korea'."),
    language_code: z
      .string()
      .optional()
      .describe("Two-letter language code, e.g. 'ko'. Defaults to 'en'."),
  }),
  async execute({ claim, mode, keywords, location_name, language_code }) {
    const market =
      location_name ?? (mode === "demand_trend" ? "worldwide" : "United States");
    try {
      if (mode === "demand_trend") {
        const task = await dataforseoLive(
          "/dataforseo/keywords_data/dataforseo_trends/explore/live",
          {
            keywords,
            ...(location_name !== undefined && { location_name }),
          },
        );
        const items: any[] = task?.result?.[0]?.items ?? [];
        const graph = items.find((i) => Array.isArray(i?.data));
        const data: any[] = graph?.data ?? [];
        const perKeyword = keywords.map((keyword, idx) => {
          const values = data
            .filter((d) => Array.isArray(d.values))
            .map((d) => d.values[idx])
            .filter((v): v is number => v !== null && v !== undefined);
          const { direction, recentAvg, priorAvg, pctChange } = trendDirection(values);
          const round = (n: number | null) => (n === null ? null : Math.round(n * 10) / 10);
          return {
            keyword,
            direction,
            recentAvg: round(recentAvg),
            priorAvg: round(priorAvg),
            pctChange,
          };
        });
        return { claim, mode, market, data: perKeyword };
      }

      if (mode === "search_volume") {
        const task = await dataforseoLive(
          "/dataforseo/keywords_data/google_ads/search_volume/live",
          {
            keywords,
            location_name: market,
            language_code: language_code ?? "en",
          },
        );
        // google_ads rows sit directly in result[], not under items
        const rows = (task?.result ?? []).map((r: any) => ({
          keyword: r?.keyword ?? null,
          monthlySearches: r?.search_volume ?? null,
          cpc: r?.cpc ?? null,
          competition: r?.competition ?? null,
        }));
        return { claim, mode, market, data: rows };
      }

      // platform_presence
      const task = await dataforseoLive("/dataforseo/serp/google/organic/live/advanced", {
        keyword: keywords[0],
        location_name: market,
        language_code: language_code ?? "en",
        depth: 10,
      });
      const items: any[] = task?.result?.[0]?.items ?? [];
      const topDomains = items
        .filter((i) => i?.type === "organic")
        .slice(0, 5)
        .map((i) => ({ rank: i.rank_absolute ?? null, domain: i.domain ?? null }));
      return { claim, mode, market, data: { query: keywords[0], topDomains } };
    } catch (err) {
      // 40501 "Invalid Field" usually means the dataset does not cover the market.
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("40501")) {
        return {
          claim,
          mode,
          market,
          data: null,
          note: "Dataset does not cover this market; treat the claim as untestable, not false.",
        };
      }
      throw err;
    }
  },
});
