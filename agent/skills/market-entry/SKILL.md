---
description: Use when recommending which e-commerce platforms to sell on in a destination country, or which products/SKUs to sell there.
---

# Platform Selection and Product Selection

Ground every recommendation in data. LLM knowledge may propose candidates, but
traffic, SERP, and marketplace data must confirm them.

## Part A: Which platforms to sell on

1. **Candidate list** — propose the marketplaces plausibly relevant for the
   destination (e.g. Germany: amazon.de, otto.de, kaufland.de, ebay.de;
   Brazil: mercadolivre.com.br, amazon.com.br, shopee.com.br; Poland:
   allegro.pl; Korea: coupang.com, gmarket.co.kr).
2. **Traffic evidence** — `estimate_domain_traffic` with the candidate
   domains and the destination `location_name`/`language_code` to compare
   organic reach.
3. **SERP dominance** — `check_serp` for 3-5 transactional queries in the
   local language (e.g. "yogamatte kaufen"). Which marketplaces occupy the
   top results?
4. **Qualitative landscape** — `aisa__post_perplexity-sonar-pro` for
   marketplace fees, cross-border seller requirements, payment and logistics
   norms in that country. Cite its sources.
5. Recommend 2-3 platforms ranked by evidence, stating the reasoning.

## Part B: What to sell

1. Start from trending categories (load the `market-trends` skill first if
   trends have not been analyzed yet).
2. **Amazon demand** — `amazon_keywords` (mode `volume`) for candidate
   product keywords. Coverage is strongest for the United States; if the
   destination market is unsupported, use US data as a proxy and say so.
3. **Competition** — `search_amazon_products` for live listings (prices,
   ratings, review counts, bought-past-month). Many reviews on every top
   listing means a saturated niche; high search volume with weak or few
   listings is the opportunity.
4. **Cross-check demand direction** with `explore_trends` so you do not
   recommend a declining category.
5. Recommend specific product niches with: demand evidence, competition
   evidence, sourcing angle (why China supply is advantaged), and risk notes.

## Known data gaps — state them explicitly

Product-level data covers Amazon and Google Shopping only. There is no native
TikTok Shop, eBay, Etsy, Shopee, or Mercado Libre product data. For those
platforms, use `aisa__post_tavily_search` and
`aisa__post_perplexity-sonar-pro` for qualitative signals and label the
findings as unverified by structured data.
