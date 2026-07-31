import { defineTool } from "eve/tools";
import { z } from "zod";
import { aisaFetch } from "../../lib/aisa.js";

// DataForSEO's merchant endpoints are async (task_post -> poll task_get).
// This tool hides that lifecycle: it posts a task, polls until the result is
// ready (or ~90s pass), and returns a trimmed product list. If the task is
// still queued when time runs out, it returns the task_id so a follow-up call
// with { task_id } can fetch the finished result.

const POLL_INTERVAL_MS = 5_000;
const POLL_BUDGET_MS = 90_000;

// The Amazon merchant endpoint accepts locale-style codes (de_DE), not bare
// ISO 639-1 codes (de). Normalize the common ones; pass locale codes through.
const LOCALE_BY_LANGUAGE: Record<string, string> = {
  ar: "ar_SA",
  cs: "cs_CZ",
  de: "de_DE",
  en: "en_US",
  es: "es_ES",
  fr: "fr_FR",
  he: "he_IL",
  hi: "hi_IN",
  it: "it_IT",
  ja: "ja_JP",
  ko: "ko_KR",
  nl: "nl_NL",
  pl: "pl_PL",
  pt: "pt_BR",
  sv: "sv_SE",
  tr: "tr_TR",
  zh: "zh_CN",
};

function toAmazonLocale(code: string): string {
  if (code.includes("_")) return code;
  return LOCALE_BY_LANGUAGE[code.toLowerCase()] ?? "en_US";
}

interface RawItem {
  type?: string;
  rank_absolute?: number;
  domain?: string;
  title?: string;
  asin?: string;
  data_asin?: string;
  url?: string;
  price_from?: number;
  price_to?: number;
  currency?: string;
  bought_past_month?: number;
  rating?: { value?: number; votes_count?: number };
  is_amazon_choice?: boolean;
  is_best_seller?: boolean;
}

function extractProducts(task: any, limit: number) {
  const items: RawItem[] = task?.result?.[0]?.items ?? [];
  return items
    .filter((item) => item.title !== undefined)
    .slice(0, limit)
    .map((item) => {
      const asin = item.data_asin ?? item.asin ?? null;
      return {
        rank: item.rank_absolute ?? null,
        sponsored: item.type === "amazon_paid",
        title: item.title ?? null,
        asin,
        // Sponsored listings carry huge redirect URLs; build a canonical one.
        url:
          asin !== null && item.domain !== undefined
            ? `https://${item.domain}/dp/${asin}`
            : null,
        price: item.price_from ?? null,
        currency: item.currency ?? null,
        boughtPastMonth: item.bought_past_month ?? null,
        rating: item.rating?.value ?? null,
        reviews: item.rating?.votes_count ?? null,
        amazonChoice: item.is_amazon_choice ?? false,
        bestSeller: item.is_best_seller ?? false,
      };
    });
}

export default defineTool({
  description:
    "Search live Amazon listings in a destination market (via DataForSEO merchant data). Pass a keyword plus the destination location/language to get ranked products with price, rating, and review counts. Results can take a minute to prepare; if the response says status 'pending', call this tool again with the returned task_id to fetch the finished result.",
  inputSchema: z.object({
    keyword: z
      .string()
      .min(1)
      .optional()
      .describe("Product search phrase, e.g. 'yoga mat'. Required unless task_id is given."),
    location_name: z
      .string()
      .optional()
      .describe("Destination country, e.g. 'Germany'. Defaults to 'United States'."),
    language_code: z
      .string()
      .optional()
      .describe(
        "Language of the market, e.g. 'de' or 'de_DE'. Defaults to English.",
      ),
    limit: z
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe("Max products to return. Default 15."),
    task_id: z
      .string()
      .optional()
      .describe("Fetch the result of a previously posted task instead of starting a new search."),
  }),
  async execute({ keyword, location_name, language_code, limit = 15, task_id }, ctx) {
    const getTask = async (id: string) => {
      const data = await aisaFetch(
        `/dataforseo/merchant/amazon/products/task_get/advanced/${id}`,
      );
      return data?.tasks?.[0];
    };

    if (task_id === undefined) {
      if (keyword === undefined) {
        throw new Error("Provide either a keyword or a task_id.");
      }
      const posted = await aisaFetch("/dataforseo/merchant/amazon/products/task_post", {
        method: "POST",
        body: JSON.stringify([
          {
            keyword,
            location_name: location_name ?? "United States",
            language_code: toAmazonLocale(language_code ?? "en"),
            depth: 100,
          },
        ]),
      });
      const postedTask = posted?.tasks?.[0];
      if (postedTask?.id === undefined) {
        throw new Error(`Unexpected task_post response: ${JSON.stringify(posted).slice(0, 500)}`);
      }
      task_id = postedTask.id as string;
    }

    const deadline = Date.now() + POLL_BUDGET_MS;
    while (Date.now() < deadline) {
      if (ctx.abortSignal.aborted) throw new Error("Aborted.");
      const task = await getTask(task_id);
      if (task?.result?.[0]?.items !== undefined && task.result[0].items !== null) {
        return {
          status: "ready" as const,
          task_id,
          keyword: keyword ?? task?.data?.keyword ?? null,
          location: location_name ?? task?.data?.location_name ?? null,
          products: extractProducts(task, limit),
        };
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    return {
      status: "pending" as const,
      task_id,
      message:
        "Amazon results are still being prepared. Call search_amazon_products again with this task_id to fetch them.",
    };
  },
});
