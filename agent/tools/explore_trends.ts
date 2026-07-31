import { defineTool } from "eve/tools";
import { z } from "zod";
import { dataforseoLive } from "../../lib/aisa.js";

export default defineTool({
  description:
    "Google-Trends-style search demand for keywords in a destination country. mode 'interest_over_time' (default) returns a weekly demand series plus a rising/falling verdict; 'demography' returns age/gender interest; 'subregions' returns which regions of the country search most.",
  inputSchema: z.object({
    keywords: z
      .array(z.string())
      .min(1)
      .max(5)
      .describe("1-5 keywords or product categories, e.g. ['yoga mat']."),
    location_name: z
      .string()
      .optional()
      .describe("Destination country, e.g. 'Germany'. Omit for worldwide."),
    date_from: z
      .string()
      .optional()
      .describe("Start date YYYY-MM-DD. Defaults to the past 12 months."),
    mode: z
      .enum(["interest_over_time", "demography", "subregions"])
      .optional()
      .describe("Defaults to interest_over_time."),
  }),
  async execute({ keywords, location_name, date_from, mode = "interest_over_time" }) {
    const path =
      mode === "demography"
        ? "/dataforseo/keywords_data/dataforseo_trends/demography/live"
        : mode === "subregions"
          ? "/dataforseo/keywords_data/dataforseo_trends/subregion_interests/live"
          : "/dataforseo/keywords_data/dataforseo_trends/explore/live";

    const task = await dataforseoLive(path, {
      keywords,
      ...(location_name !== undefined && { location_name }),
      ...(date_from !== undefined && { date_from }),
    });
    const items: any[] = task?.result?.[0]?.items ?? [];

    if (mode === "interest_over_time") {
      const graph = items.find((i) => Array.isArray(i?.data));
      const data: any[] = graph?.data ?? [];
      const perKeyword = keywords.map((keyword, idx) => {
        const points = data
          .filter((d) => Array.isArray(d.values))
          .map((d) => ({ week: d.date_from as string, value: d.values[idx] ?? null }));
        const values = points.map((p) => p.value).filter((v): v is number => v !== null);
        const quarter = Math.max(1, Math.floor(values.length / 4));
        const avg = (arr: number[]) =>
          arr.length === 0 ? null : arr.reduce((a, b) => a + b, 0) / arr.length;
        const recent = avg(values.slice(-quarter));
        const prior = avg(values.slice(-2 * quarter, -quarter));
        const direction =
          recent === null || prior === null
            ? "unknown"
            : recent > prior * 1.15
              ? "rising"
              : recent < prior * 0.85
                ? "falling"
                : "stable";
        // Halve the series when long; the averages carry the signal.
        const sampled = points.length > 30 ? points.filter((_, i) => i % 2 === 0) : points;
        return { keyword, direction, recentAvg: recent, priorAvg: prior, weekly: sampled };
      });
      return { location: location_name ?? "worldwide", keywords: perKeyword };
    }

    if (mode === "subregions") {
      const sub = items.find((i) => Array.isArray(i?.data));
      const rows: any[] = (sub?.data ?? [])
        .map((d: any) => ({
          region: d.geo_name ?? d.geo_id ?? null,
          values: d.values ?? d.value ?? null,
        }))
        .slice(0, 15);
      return { location: location_name ?? "worldwide", keywords, topRegions: rows };
    }

    // demography: pass through, size-capped
    const demo = items.find((i) => i?.data !== undefined)?.data ?? items;
    const oversized = JSON.stringify(demo).length > 6000;
    return {
      location: location_name ?? "worldwide",
      keywords,
      demography: oversized ? null : demo,
      ...(oversized && {
        note: "Demography payload too large; retry with fewer keywords.",
      }),
    };
  },
});
