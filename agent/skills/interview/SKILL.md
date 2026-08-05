---
description: Mandatory onboarding needs interview. Load immediately when turn instructions report the interview is incomplete, or when the user asks to redo discovery / onboarding.
---

# Adaptive Needs Interview

Run a short, adaptive discovery interview so you deeply understand this
seller's situation before recommending markets, platforms, products, or SEO.

This is **not** a fixed survey. Cover required topics; generate each next
question from prior answers. Prefer depth over breadth.

## When to run

This skill is **mandatory** whenever turn instructions say the onboarding
interview is incomplete (`get_profile` reports the same as
`needsInterview: true`). In that case:

1. Start this skill immediately (do not research first).
2. Run the adaptive interview with `ask_question`.
3. Close out into `update_profile`.

Also load it when the user asks to redo onboarding, or when advice would be
guesswork without knowing their offer, market, or constraints.

If the user explicitly declines, call `update_profile` with
`facts: { "interview.skipped": "true" }` and a brief note, then continue
with clarifying questions as needed.

## Objective

Capture durable context that improves later recommendations:

- Who they are and how they sell today
- What they sell (or want to sell) and how they source
- Destination market intent and platforms already in mind
- Constraints (budget, logistics, compliance, language, risk)
- The job they are hiring this agent for, and what "good" looks like

Write the result into the user profile via `update_profile` (see Close-out).

Suggested fact keys: `references/fact-keys.md`.

## Interaction model (GenUI)

Ask **every substantive question** with the built-in `ask_question` tool so
channels/frontends can render choices (buttons / select) — this is the GenUI
surface for the interview.

```
ask_question({
  prompt: "...",
  options: [{ id, label }, ...],   // 2–5 concrete choices when possible
  allowFreeform: true              // almost always true
})
```

Rules:

- Prefer options for common answers; always set `allowFreeform: true` so the
  user can answer in their own words.
- One cognitive idea per question — never stack three asks into one prompt.
- After each answer, decide the **next** question (or a probe) from what they
  said. Do not march through a fixed script.
- If they already answered a later topic, mark it covered and skip it.
- Keep light narration between questions (acknowledge, then ask). Do not dump
  analysis mid-interview unless they ask.

## Conversation design (best practices)

### Structure: goals fixed, path adaptive

- Be rigid about **topic coverage** and **insight quality**.
- Be flexible about wording, order, and which probes you use.
- Target **4–6 topics**, about **8–15 questions** total including probes.
- Cap probes at **2–3 follow-ups per topic**, then move on.

### Question style

- Open with **behavioral / concrete** prompts, not vague attitudes.
  - Good: "Walk me through the last time you tried entering a new market."
  - Bad: "How do you feel about cross-border e-commerce?"
- Prefer *what* / *how* / *walk me through* over stacked *why* chains.
- Never lead ("You probably want Amazon.de, right?").
- Never invent facts about their business; only record what they said or
  clearly confirmed.

### Probe triggers (dig deeper when you hear…)

| Signal | Probe move |
|---|---|
| Vague claim ("trending products", "good margins") | Ask for a specific SKU, market, or recent episode |
| Checkable market claim ("X is booming", "gets tons of searches") | Run the claim-check protocol below (if budget allows) |
| Contradiction | Reflect both sides and ask which is closer |
| Strong emotion / urgency | Ask what happened just before that feeling |
| Workaround / DIY process | Ask how they discovered it and what still hurts |
| "I don't know" on a core topic | Offer options via `ask_question`, or note the gap and continue |

If answers stay thin after 2–3 probes, record the uncertainty in `notes` and
advance — do not interrogate.

### Permission & tone

Open once with a short framing, then interview:

> I'll ask a few short questions so recommendations fit your situation. There
> are no wrong answers — specifics and constraints help most. You can skip
> anything.

Stay neutral, concise, and professional. Match the user's language if they
write in Chinese or another language.

## Claim checks & calibration (pushback protocol)

You are not just a recorder. When the user asserts something about the market
that live data can test, verify it — and at least once per interview, test how
well-calibrated their instincts are before showing them the data.

### What is checkable

| Claim type | Check with |
|---|---|
| Trend claim ("X is booming / dying / seasonal") | `quick_check` mode `demand_trend` |
| Volume claim ("my keyword gets tons of searches") | `quick_check` mode `search_volume` |
| Platform claim ("Coupang dominates", "everyone buys on Y") | `quick_check` mode `platform_presence` |
| Qualitative claim (fees, entry difficulty, regulation) | `aisa__post_tavily_search` with small `max_results` |

Claims about their own business (their margins, their factory, their MOQ) are
not externally checkable — use the probe table above instead.

### When to check (gate)

Run a check only when **all** of these hold:

1. If the claim were false, a recommendation would change.
2. One call can test it (local-language keywords can operationalize it).
3. Budget remains: **max 3 `quick_check` calls per interview**; 1–2 is
   typical. Never chain checks or escalate to heavy analysis tools.

Checkable claims that fail the gate are still recorded — as `untested`
(see Close-out).

### Guaranteed calibration (at least once per interview)

Every interview must include **at least one** estimate-before-reveal test.
If the user volunteers a checkable claim, use it. If none has surfaced by the
time market intent is covered, create one from their main product/keyword and
destination (e.g. monthly search volume for their lead SKU keyword).

### Estimate first, then verify

Lock in their estimate with `ask_question` **before** fetching data:

```
ask_question({
  prompt: "Quick calibration: how many Google searches per month does 'yoga mat' get in South Korea?",
  options: [
    { id: "lt_1k", label: "Under 1K" },
    { id: "1k_10k", label: "1K–10K" },
    { id: "10k_100k", label: "10K–100K" },
    { id: "gt_100k", label: "Over 100K" }
  ],
  allowFreeform: true
})
```

- Volume claims: log-scale ranges as above.
- Trend claims: `rising / flat / falling`.
- Platform claims: "Which site ranks #1 on Google for '<query>' in <market>?"
  with 3–4 marketplace options.

Call `quick_check` immediately after their answer arrives — they just
finished answering, so the wait is barely felt. `search_volume` returns in
about a second; `demand_trend` and `platform_presence` can take ~10s, so add
one line of narration before slow checks ("pulling the live number…").

### Reveal, score, push back

- Bucket the live number into the same ranges you offered: same bucket =
  `accurate`; adjacent bucket = `accurate` (note the direction); 2+ buckets
  off = `overestimate` / `underestimate`. Always reveal the real number.
- **When data disagrees**, challenge the claim, not the person:
  - Agree-then-data: "That was the story last year — live data shows interest
    down 22% since spring. What are you seeing that the data might miss?"
  - Reconcile: "You estimated 10K–100K; the live number is 4,400/mo. Does
    that change how central this keyword is to your plan?"
  - Never say "you're wrong"; never reveal-then-gloat. Always give them the
    floor — their explanation is prime interview material (feed it back into
    the probe table).
- **When data agrees**, say so in one line, record the claim `verified`, and
  move on. Confirmations build trust; don't linger.
- If `quick_check` returns a "dataset does not cover this market" note, tell
  the user the claim is untestable and record it `untested` — untestable is
  not false.

## Topic map (cover these; order may vary)

Use seed openers only when the topic is still uncovered. Generate follow-ups
yourself.

### 1. Seller & stage

Seed options via GenUI, e.g. idea / first shipment / scaling / multi-market.

Probe for: role, team size, prior cross-border experience, home base.

### 2. Offer & supply

Seed: what they sell or want to sell; own brand vs reseller; factory vs agent.

Probe for: differentiation, MOQ/inventory constraints, SKUs already decided
vs still exploring.

### 3. Market intent

Seed: destination country (or shortlist); platforms already considered.

Probe for: why that market, urgency, whether they need platform pick vs
already committed.

### 4. Job-to-be-done (why they are here)

Seed: what they want from this agent now — trends / platforms / products /
SEO / full brief / other.

Probe for: the struggling moment ("what went wrong or felt stuck last time
you tried to decide?") and the outcome they need ("so that I can…").

### 5. Constraints & risk

Seed: budget band, logistics posture, compliance unknowns, language needs,
risk tolerance.

Probe only where answers are thin or block recommendations.

### 6. Success criteria & timeline

Seed: timeline and definition of done (e.g. ranked platforms, niche shortlist,
per-SKU keyword plan).

## Adaptive loop

For each turn while interviewing:

1. Update a mental coverage checklist (topics above).
2. If a critical gap remains, craft the next `ask_question` from prior answers
   (branch into the richest uncovered thread; otherwise open the next topic).
3. If all required topics are "good enough" for personalized advice, go to
   Close-out — do not keep asking for completeness theater.
4. If the user pivots to an urgent analysis request mid-interview, pause,
   summarize what you have, offer to finish later, and only proceed if they
   insist (then note incompleteness in the profile).

Minimum viable coverage before close-out: **offer or exploration intent**,
**destination market (or explicit "help me choose")**, **primary goal for
this agent**, and **at least one constraint** (or explicit "none").

## Close-out → profile update

1. Give a **short confirmation summary** (5–8 bullets) of what you understood.
   When any claim checks ran, add a **"What we checked"** block: claims
   verified, claims contradicted (with the live number), claims left untested,
   and one calibration line (e.g. "your search-volume instinct ran high").
2. Ask them to correct anything (`ask_question` with options like
   `looks_good` / `needs_edits`, `allowFreeform: true`).
3. On confirmation, call `update_profile`:
   - `facts`: model-chosen keys (see `references/fact-keys.md`); store
     concrete values as short strings. Include `claim.N.*` for every
     checkable claim (even `untested` ones), `calibration.N.*` for each
     estimate test, `calibration.overall`, and `interview.claims_checked`.
   - `notes`: 1–3 short paragraphs with JTBD phrasing, open questions, and
     nuance that does not fit neat keys. When a claim was contradicted, add a
     sentence like "User believed Korean pet supplies were surging; trends
     data showed flat — re-verify before recommending this category."
   - `markInterviewComplete: true`
4. Tell them the profile was saved, then ask which analysis to run next
   (trends / platforms / products / SEO / full brief), using their stated
   `goal.primary` as the default recommendation.

## Guardrails

- During the interview the only data tools permitted are `quick_check`
  (max 3 calls) and `aisa__post_tavily_search` (qualitative claims only).
  Never call explore_trends, keyword_metrics, research_keywords, check_serp,
  amazon_keywords, search_amazon_products, estimate_domain_traffic, or
  get_twitter_trends mid-interview — they are slow, expensive, or verbose;
  save them for the analysis phase.
- Do not store secrets, passwords, payment details, or private credentials in
  the profile.
- Do not overwrite unrelated existing facts; merge only what this interview
  learned. Use `notesMode: "append"` unless the user asked to replace notes.
- If `get_profile` already shows a rich completed interview, do not restart
  unless the user asks — instead ask what changed.
