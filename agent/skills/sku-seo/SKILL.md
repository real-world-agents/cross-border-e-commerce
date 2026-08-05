---
description: Use when building a data-backed SEO or keyword plan for product SKUs in a target market — keyword research, listing titles, search intent, SERP validation.
---

# SKU SEO from Real Data

Build a per-SKU keyword plan from live metrics. The model may generate seed
ideas and cluster results, but every recommended keyword must carry real
volume/difficulty data — never invent metrics.

Always pass the destination `location_name` and `language_code`.

## Step 1: Seeds

Derive seed keywords from each SKU: product type, key attributes, use cases,
audience, and local-language synonyms. Mark these as hypotheses. If the
profile's `calibration.overall` is `overconfident`, treat user-supplied
keyword importance as hypotheses to validate, not priors.

## Step 2: Expand the keyword universe

`research_keywords` per seed — mode `suggestions` (long-tail, default),
`ideas` (category terms), or `related` (semantic neighbors). Rows come back
with volume, CPC, competition, difficulty, and intent already attached. Keep
the default limit of 20 per call; raise it only when a cluster needs depth.

## Step 3: Validate your own candidates

`keyword_metrics` for any keyword list you assembled yourself (from SKU
attributes or translations) — returns volume, difficulty (0-100), and intent
in one call. Drop keywords with no volume data rather than guessing. Keep
local-language variants separate from English ones.

## Step 4: Amazon listing keywords (marketplace SEO)

`amazon_keywords` — mode `volume` for Amazon search volume of candidate
listing terms, mode `related` to expand from a seed. Coverage is strongest
for the United States; if the destination is unsupported, use US data as a
proxy and label it.

## Step 5: SERP validation

For the strongest candidates, `check_serp` with the destination location to
see what actually ranks: dominant domains, marketplaces present, and SERP
features. Weak results signal an opening.

## Step 6: Deliverable per SKU

- Primary keyword (transactional intent, best volume-to-difficulty ratio) and
  2-4 secondary keywords, each with volume, difficulty, and intent.
- High-opportunity keywords: difficulty < 40 AND volume > 1000. If none
  qualify, say so and list the nearest candidates instead of loosening the
  thresholds silently.
- Suggested listing title and bullet keywords in the local language (Amazon
  data) plus backend search terms.
- SERP-based page recommendation (product page, category page, comparison
  page, or blog content) with the observed evidence.
- Data gaps and assumptions.
