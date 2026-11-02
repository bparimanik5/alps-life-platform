# Test strategy

- Jest + ts-jest executes TypeScript tests without a separate test compile.
- Domain tests cover pricing, missing smoker answers, referral, over-50 eligibility/cap, stable integer rounding, document lifecycle and restrictions, handler rotation, compounded/capped payout, beneficiary shares, trust deeds, and cooling-off refunds.
- Supertest exercises Express in-process, including validation, quote creation/email, claims/document transitions, policy share rejection, cancellation email contents, and health.
- API tests use fresh in-memory repositories and email outbox. No network, external service, or database is required.
- Run `npm run build`, `npm test` and optional `npm run lint`.
