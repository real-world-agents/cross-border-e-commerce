import { defineTool } from "eve/tools";
import { z } from "zod";
import { dataforseoLive } from "../../lib/aisa.js";

export default defineTool({
  description:
    "Compare estimated organic Google traffic of websites (e.g. marketplace domains) in a destination country. Use to rank which e-commerce platforms dominate a market.",
  inputSchema: z.object({
    domains: z
      .array(z.string())
      .min(1)
      .max(10)
      .describe("Domains without protocol, e.g. ['amazon.de', 'otto.de']."),
    location_name: z
      .string()
      .optional()
      .describe("Destination country, e.g. 'Germany'. Defaults to 'United States'."),
    language_code: z
      .string()
      .optional()
      .describe("Two-letter language code, e.g. 'de'. Defaults to 'en'."),
  }),
  async execute({ domains, location_name, language_code }) {
    const task = await dataforseoLive(
      "/dataforseo/dataforseo_labs/google/bulk_traffic_estimation/live",
      {
        targets: domains,
        location_name: location_name ?? "United States",
        language_code: language_code ?? "en",
      },
    );
    const items: any[] = task?.result?.[0]?.items ?? [];
    const rows = items
      .map((i) => ({
        domain: i?.target ?? null,
        monthlyOrganicTraffic: Math.round(i?.metrics?.organic?.etv ?? 0),
        rankedKeywords: i?.metrics?.organic?.count ?? 0,
        monthlyPaidTraffic: Math.round(i?.metrics?.paid?.etv ?? 0),
      }))
      .sort((a, b) => b.monthlyOrganicTraffic - a.monthlyOrganicTraffic);
    return { market: location_name ?? "United States", domains: rows };
  },
});
