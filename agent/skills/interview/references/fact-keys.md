# Suggested profile fact keys

Prefer short lowercase dotted keys. Invent new keys when needed; reuse these
when they fit so later turns stay consistent.

## Interview meta

| Key | Example value |
|---|---|
| `interview.completed` | `true` (set by `update_profile` with `markInterviewComplete`) |
| `interview.completed_at` | ISO timestamp |
| `interview.skipped` | `true` if the user declined full interview |

## Seller & business

| Key | Example value |
|---|---|
| `seller.role` | `founder`, `ops`, `sourcing agent` |
| `seller.company_stage` | `idea`, `first shipment`, `scaling`, `multi-market` |
| `seller.team_size` | `solo`, `2-5`, `6-20` |
| `seller.experience_years` | `0`, `1-2`, `3+` |
| `seller.home_base` | `Guangzhou`, `Yiwu`, `Hangzhou` |

## Offer & supply

| Key | Example value |
|---|---|
| `product.category` | `home fitness`, `porcelain tableware` |
| `product.skus` | `yoga mat`, `resistance bands` |
| `product.differentiation` | `OEM branding`, `patented design`, `price` |
| `supply.model` | `own factory`, `sourcing agent`, `1688 reseller` |
| `supply.moq_constraint` | `flexible`, `high MOQ` |

## Market intent

| Key | Example value |
|---|---|
| `market.primary` | `South Korea` |
| `market.secondary` | `Japan, Germany` |
| `market.platforms_considered` | `Coupang, Amazon.de` |
| `goal.primary` | `validate demand`, `pick platform`, `SKU SEO` |
| `goal.timeline` | `this month`, `90 days`, `exploratory` |
| `goal.success_metric` | `first 100 orders`, `shortlist of niches` |

## Constraints

| Key | Example value |
|---|---|
| `constraint.budget` | `under $2k test`, `no ads yet` |
| `constraint.logistics` | `DDP preferred`, `no overseas warehouse` |
| `constraint.compliance` | `CE unknown`, `needs FDA path` |
| `constraint.language` | `Chinese-first UI`, `needs Korean listings` |
| `constraint.risk_tolerance` | `low`, `medium`, `high` |

## Notes prose (not facts)

Put nuance, contradictions, open questions, and job-to-be-done phrasing in
`notes`, for example:

> When I cannot tell which Korean marketplace to bet on first, I want a
> ranked shortlist with traffic evidence so I can commit inventory without
> guessing.
