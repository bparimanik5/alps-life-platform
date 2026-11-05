# New Business requirements

## Business requirement

ALPS must convert a valid priced life-cover quote into a reviewable New Business application. The application must preserve the quoted cover and premium, collect the applicant's identity and declarations, screen referral conditions, prevent incomplete submission and expose a clear audit state.

## User stories and acceptance criteria

### NB-01 Start from a priced quote

As a customer, I want to start an application from my quote so that the offered terms are carried forward without re-keying.

- Only a quote in `QUOTED` status can start an application.
- The application copies the quote ID, cover amount and level-term monthly premium.
- Missing, awaiting-smoker-status and referred quotes are rejected.
- The quote snapshot does not change if another quote is later created.

### NB-02 Capture applicant identity

As an operations user, I need complete applicant details so that the application can be screened and serviced.

- First name, last name, date of birth and valid email are mandatory.
- Applicants must be aged 18 to 75 inclusive on the application date.
- Dates in the future or invalid calendar dates are rejected.
- UK and non-UK residency are recorded explicitly; non-UK residency routes to referral.

### NB-03 Validate term and cover

As an underwriter, I need the requested term to remain within product limits.

- Cover is GBP 1 to GBP 500,000 inclusive.
- Term is 5 to 40 whole years inclusive.
- The policy must end no later than the applicant's 85th birthday.
- Boundary values are accepted; values immediately outside a boundary are rejected.

### NB-04 Completion controls

As a compliance owner, I need required confirmations before submission.

- Payment method, material-facts declaration, privacy consent and terms acceptance are mandatory.
- Missing confirmations leave the application in `DRAFT` and are listed in `outstandingRequirements`.
- A draft cannot be submitted.
- Completing required confirmations without a referral makes the application `READY_TO_SUBMIT`.

### NB-05 Referral screening

As an underwriter, I need screening flags routed for manual review.

- Non-UK residency, a sanctions match or politically exposed person flag produces `REFERRED`.
- Every referral reason is retained in `referralReasons`.
- A referred application cannot be submitted through the straight-through path.
- Referral does not silently remove outstanding completion requirements.

### NB-06 Submit and audit

As an operations user, I want a complete application submitted once with an audit timestamp.

- Only `READY_TO_SUBMIT` can transition to `SUBMITTED`.
- Submission records an ISO-8601 UTC timestamp.
- Repeated submission is rejected.
- Submitted application data remains retrievable by application ID.

## Process flow

```text
Priced quote
  -> create application
  -> validate applicant, cover and term
  -> evaluate completion controls
  -> evaluate referral screening
  -> DRAFT | REFERRED | READY_TO_SUBMIT
  -> submit READY_TO_SUBMIT
  -> SUBMITTED
```

## Test data

| Case | Age | Residency | Term | Confirmations | Screening | Expected |
|---|---:|---|---:|---|---|---|
| NB-DATA-01 | 36 | UK | 25 | all complete | none | READY_TO_SUBMIT |
| NB-DATA-02 | 18 | UK | 40 | all complete | none | READY_TO_SUBMIT |
| NB-DATA-03 | 75 | UK | 10 | all complete | none | reject: ends after age 85 |
| NB-DATA-04 | 40 | UK | 20 | privacy missing | none | DRAFT |
| NB-DATA-05 | 45 | OTHER | 15 | all complete | none | REFERRED |
| NB-DATA-06 | 50 | UK | 15 | all complete | sanctions match | REFERRED |

## Historical defect themes

- Quote premium or cover changed while copying into the application.
- Date-of-birth timezone conversion changed age at a birthday boundary.
- A term ending after age 85 was accepted.
- Missing privacy consent still allowed submission.
- Referred applications were submitted through the straight-through endpoint.
- Double-clicking submit created duplicate applications.