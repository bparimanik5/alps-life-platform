# ALPS - Aviva Life Platform (mock)

A self-contained Node.js + TypeScript demo for life cover quotes, claims and policy servicing. It uses Express 4, strict TypeScript, Zod validation, in-memory repository interfaces, a local email outbox, and a plain HTML/JavaScript UI. No real insurer, email, payment, or underwriting integrations are called. All customers are fictional.

## Requirements and run

- Node.js 18 or newer and npm.
- Run `npm ci` (or `npm install`), `npm run build`, `npm test`, then `npm start`.
- Open <http://localhost:4000>. Set `PORT` to use another port. `npm run dev` starts via ts-node.
- Demo policies `POL-1001` and `POL-1002` seed automatically. State resets on restart.

## API

JSON requests and responses unless uploading raw bytes. Quote cover is whole pounds; premiums, policy and payout money returned by APIs is integer pence. Invalid requests return 400; missing records return 404.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/quotes` | Create standard/Over-50 quote; `smokerStatus` is optional, price withheld until answered |
| GET | `/api/quotes/:id` | Read quote |
| PATCH | `/api/quotes/:id/smoker` | Answer smoker question and price eligible quote |
| POST | `/api/quotes/:id/email` | Queue quote summary and resume link; accepts optional `{ "email": "..." }` |
| POST | `/api/claims` | Create claim for seeded policy; optional `policyYearsInForce` |
| POST | `/api/claims/:id/documents` | Upload raw PDF/JPEG/PNG bytes with `?type=...&filename=...`; validated metadata JSON is also supported |
| GET | `/api/claims/:id` | Read claim/status/handler |
| GET | `/api/claims/:id/payout` | Calculate indexed payout in pence |
| GET | `/api/policies/:id` | Read policy |
| PUT | `/api/policies/:id/beneficiaries` | Replace beneficiaries; total share must be 100 |
| POST | `/api/policies/:id/trust` | Put policy in trust and return generated deed text |
| POST | `/api/policies/:id/cancel` | Cancel and return calculated refund in pence |
| POST | `/api/policies/:id/switch` | Switch product (`{ "product": "standard" | "over50" }`) |
| GET | `/api/outbox` | Inspect demo emails |

Example quote:

```json
{
  "age": 40,
  "coverAmount": 100000,
  "smokerStatus": false,
  "product": "standard",
  "customerEmail": "demo@example.test",
  "preExistingConditions": [false, false]
}
```

See [docs/business-rules.md](docs/business-rules.md) for numeric rules, [docs/architecture.md](docs/architecture.md) for components, and [docs/test-strategy.md](docs/test-strategy.md) for validation.

## Jira traceability (mock project SCRUM, label ALPS)

| Epic / story title | Implementation | Regression coverage |
|---|---|---|
| Epic 1 - ALPS: Life cover quote journey - capture age, smoker status and cover; withhold premium until smoker answer | `src/domain/quote/quote.ts`; `POST /api/quotes`, `PATCH /api/quotes/:id/smoker` | quote domain and API tests |
| Show monthly level term and decreasing term side by side; smoker rate table | `src/data/rate-tables.ts`; quote pricing | rate comparison/pricing tests |
| Medical declaration yes routes to REFERRAL | quote condition evaluation | referral test |
| Over-50 ages 50-80 and GBP 25,000 cap; bug: "Over-50 quote accepts applicant age 49" | quote eligibility | age-49/cap regression tests |
| Stable base, integer pence, half-up rounding; bug: "Premium rounding drifts" | integer quote pricing | repeat-cover determinism regression test |
| Email quote summary and resume link | `EmailService`; `/api/quotes/:id/email` | API outbox test |
| Epic 2 - ALPS: Claims for life and protection - create from death notification, round-robin handler | `src/domain/claims/claims.ts` | claims domain tests |
| Upload death certificate and claimant ID; bug: "Claim status stays Pending after document upload" | `/api/claims/:id/documents`; transition after both docs | required docs lifecycle regression test |
| Payout sum assured plus compounded/capped indexation | claims payout | compound/cap test |
| Notify each beneficiary by email at each stage | claims status notifier + outbox | API notification test |
| Epic 3 - ALPS: Policy servicing and beneficiaries; bug: "Beneficiary share percentages can total over 100" | beneficiary replacement endpoint | over-total rejection regression test |
| Put policy in trust and generate deed | trust domain service | deed test |
| Cancel/switch inside 30 days with full refund; none after; cancellation email number in subject/body | cooling-off service and cancel route | cooling-off/cancellation email tests |

## Disclaimer

This simplified mock is for demo and test-design ingestion only. It is not financial, legal, underwriting, or claims advice and is not production-ready.
