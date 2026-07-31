import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: "Get the latest trends on Twitter/X",
  inputSchema: z.object({
    woeid: z
      .int()
      .describe("The WOEID of the location. Example: 2418046 (1 = worldwide)."),
    count: z
      .int()
      .min(1)
      .optional()
      .describe("Number of trends to return. Default is 1."),
  }),
  async execute({ woeid, count }) {
    const url = new URL(`${process.env.AISA_DATA_BASE_URL}/twitter/trends`);
    url.searchParams.set("woeid", String(woeid));
    if (count !== undefined) url.searchParams.set("count", String(count));

    const trendsRes = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.AISA_API_KEY}` },
    });

    if (!trendsRes.ok) {
      const body = await trendsRes.text();
      throw new Error(`Failed to get trends (${trendsRes.status}): ${body}`);
    }

    return trendsRes.json();
  },
});
