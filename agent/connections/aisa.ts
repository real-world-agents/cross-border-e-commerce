import { defineOpenAPIConnection } from "eve/connections";

// AIsa data APIs (https://aisa.one/docs/api-reference).
//
// Only operations with small input schemas live here. The heavy DataForSEO
// endpoints (whose spec schemas are 10-40 KB each and would bloat the model's
// prompt on every turn) are wrapped in hand-written tools instead:
// explore_trends, research_keywords, keyword_metrics, amazon_keywords,
// check_serp, estimate_domain_traffic, search_amazon_products.
export default defineOpenAPIConnection({
  spec: "https://aisa.one/openapi.yaml",
  baseUrl: "https://api.aisa.one/apis/v1",
  description:
    "AIsa data APIs: Tavily news/web search, Twitter/X tweet search, Reddit search, and Perplexity sourced research.",
  auth: {
    getToken: async () => ({ token: process.env.AISA_API_KEY! }),
  },
  operations: {
    allow: [
      "post_tavily_search",
      "get_twitter_tweet_advanced_search",
      "get_reddit-search",
      "post_perplexity-sonar-pro",
    ],
  },
});
