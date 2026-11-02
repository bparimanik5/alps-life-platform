# Business rules

All money is represented as integer pence in domain code and API responses. HTTP quote cover amounts are whole GBP; premiums and policy money fields are pence.

## Quotes

- Standard ages: 18-75 inclusive; cover: GBP 1-GBP 500,000 inclusive.
- Over-50 ages: 50-80 inclusive (49 is rejected); cover: GBP 1-GBP 25,000 inclusive.
- Smoker means smoked in the preceding 12 months. A quote without an answer remains `AWAITING_SMOKER_STATUS` and contains no premium.
- Any declared pre-existing condition results in `REFERRAL`; no instant price is returned.
- Monthly rates are pence per GBP 1,000 of cover, by age band and smoker status: see `src/data/rate-tables.ts`. Smoker rates are higher at every equivalent band.
- Level premium uses original whole-pound cover. Decreasing term uses 82% of that rate. Integer arithmetic and half-up rounding are applied once to each final premium; no intermediate updates exist, so changing cover cannot accumulate rounding drift.
- Quote emails contain premiums and a resume link and are recorded only in the local outbox.

## Claims

- Claims created from a known policy start as `PENDING`; handler assignment rotates A. Patel, J. Wilson, M. Chen.
- Required document types are `death-certificate` and `claimant-id`. PDF (`application/pdf`), JPEG (`image/jpeg`) and PNG (`image/png`) are accepted; each file must be 1 byte-10 MiB inclusive. The API accepts raw document bytes or validated metadata; binary data is not persisted.
- Once both required types are present, status becomes `DOCUMENTS_RECEIVED`; beneficiaries receive one email per status transition.
- Payout starts with policy sum assured. It compounds at 3% per policy year, rounding half-up to pence per year; total uplift is capped at 25% of sum assured.
- `policyYearsInForce` is an explicit demo input (defaults to zero); production should derive it from authoritative dates.

## Policy servicing

- Beneficiary shares are integer percentages; at least one beneficiary is required and shares must equal exactly 100%. Beneficiary email addresses must be unique.
- Trust service generates readable text and marks the policy in trust; it is not legal advice or a legal PDF.
- Cooling-off is inclusive through day 30 from the UTC policy start date. Cancellation and switching report all recorded premiums paid as refund during that window, otherwise zero. No payment is executed.
- Cancellation confirmation is sent to the customer, with policy number in both subject and body.
