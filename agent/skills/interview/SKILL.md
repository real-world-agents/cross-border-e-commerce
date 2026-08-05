---
description: Mandatory onboarding needs interview. Load immediately when get_profile reports needsInterview is true, or when the user asks to redo discovery / onboarding.
---

# Adaptive Needs Interview

Run a short, adaptive discovery interview so you deeply understand this
seller's situation before recommending markets, platforms, products, or SEO.

This is **not** a fixed survey. Cover required topics; generate each next
question from prior answers. Prefer depth over breadth.

## When to run

This skill is **mandatory** when `get_profile` returns `needsInterview: true`.
In that case:

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
2. Ask them to correct anything (`ask_question` with options like
   `looks_good` / `needs_edits`, `allowFreeform: true`).
3. On confirmation, call `update_profile`:
   - `facts`: model-chosen keys (see `references/fact-keys.md`); store
     concrete values as short strings.
   - `notes`: 1–3 short paragraphs with JTBD phrasing, open questions, and
     nuance that does not fit neat keys.
   - `markInterviewComplete: true`
4. Tell them the profile was saved, then ask which analysis to run next
   (trends / platforms / products / SEO / full brief), using their stated
   `goal.primary` as the default recommendation.

## Guardrails

- Do not run heavy market-data tools during the interview unless the user
  asks for a quick fact mid-stream.
- Do not store secrets, passwords, payment details, or private credentials in
  the profile.
- Do not overwrite unrelated existing facts; merge only what this interview
  learned. Use `notesMode: "append"` unless the user asked to replace notes.
- If `get_profile` already shows a rich completed interview, do not restart
  unless the user asks — instead ask what changed.
