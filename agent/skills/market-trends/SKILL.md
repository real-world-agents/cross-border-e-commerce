---
description: Use when the user wants trend analysis for a destination country or market — what is trending, consumer demand signals, rising or falling product categories.
---

# Destination Market Trend Analysis

Produce a multi-signal trend report for a destination market. Never rely on a
single source: gather at least three independent signals before synthesizing.

## Step 1: Resolve the destination

- `location_name`: country name in English, e.g. `Germany`.
- `language_code`: primary market language, e.g. `de`.
- Twitter WOEID for the country (e.g. Germany 23424829, Japan 23424856,
  Brazil 23424768, South Korea 23424868, United Kingdom 23424975,
  United States 23424977). Use the worldwide WOEID `1` only as a fallback.

## Step 2: Gather signals (call at least 3 of 4)

1. **Social trending** — `get_twitter_trends` with the country WOEID, then
   `aisa__get_twitter_tweet_advanced_search` (params: `query`, `queryType` =
   `Top` or `Latest`) on the most commerce-relevant trends to gauge volume
   and sentiment.
2. **Search demand curves** — `explore_trends` with candidate category
   keywords and the destination `location_name`. Default mode returns a
   weekly demand series with a rising/falling verdict per keyword. Use
   `mode: "demography"` (who buys) and `mode: "subregions"` (where in the
   country) when audience targeting matters.
3. **News velocity** — `aisa__post_tavily_search` with
   `{"query": "...", "topic": "news", "days": 7, "max_results": 10}`. Note
   whether coverage is accelerating.
4. **Community signals** — `aisa__get_reddit-search` for organic consumer
   discussion of candidate categories.

## Step 3: Synthesize

Report per candidate category or topic:

- Direction: rising / falling / stable / mixed, with a 0-100 confidence score.
- Signal agreement: do social, search, and news point the same way?
- Who and where: demography and subregion data when gathered.
- Sourced evidence for every claim; never invent metrics. If a source
  returned nothing, list it under data gaps rather than guessing.
- Interview claims: if the profile contains `claim.*` facts about this
  market, address each explicitly — confirm it, refute it with fresh data,
  or list it as untested. Never silently repeat a `contradicted` claim as
  fact.
