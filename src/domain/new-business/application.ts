import { randomUUID } from 'node:crypto';
import { DomainError } from '../shared/errors';

export type ApplicationStatus = 'DRAFT' | 'READY_TO_SUBMIT' | 'REFERRED' | 'SUBMITTED';

export interface Applicant {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  residency: 'UK' | 'OTHER';
}

export interface NewBusinessApplicationInput {
  quoteId: string;
  applicant: Applicant;
  coverAmount: number;
  monthlyPremiumPence: number;
  termYears: number;
  paymentMethodConfirmed: boolean;
  materialFactsConfirmed: boolean;
  privacyConsent: boolean;
  termsAccepted: boolean;
  sanctionsMatch?: boolean;
  politicallyExposedPerson?: boolean;
}

export interface NewBusinessApplication extends NewBusinessApplicationInput {
  id: string;
  status: ApplicationStatus;
  outstandingRequirements: string[];
  referralReasons: string[];
  createdAt: string;
  submittedAt?: string;
}

export interface NewBusinessApplicationRepository {
  get(id: string): NewBusinessApplication | undefined;
  save(application: NewBusinessApplication): void;
}

export class InMemoryNewBusinessApplicationRepository implements NewBusinessApplicationRepository {
  private readonly items = new Map<string, NewBusinessApplication>();

  get(id: string): NewBusinessApplication | undefined {
    return this.items.get(id);
  }

  save(application: NewBusinessApplication): void {
    this.items.set(application.id, application);
  }
}

function ageOn(dateOfBirth: string, onDate: Date): number {
  const birth = new Date(`${dateOfBirth}T00:00:00Z`);
  if (Number.isNaN(birth.getTime()) || birth > onDate) throw new DomainError('Date of birth must be a valid past date');
  let age = onDate.getUTCFullYear() - birth.getUTCFullYear();
  const birthdayPending =
    onDate.getUTCMonth() < birth.getUTCMonth() ||
    (onDate.getUTCMonth() === birth.getUTCMonth() && onDate.getUTCDate() < birth.getUTCDate());
  if (birthdayPending) age--;
  return age;
}

export function createApplication(
  input: NewBusinessApplicationInput,
  id: string = randomUUID(),
  now = new Date()
): NewBusinessApplication {
  const age = ageOn(input.applicant.dateOfBirth, now);
  if (age < 18 || age > 75) throw new DomainError('New Business applicants must be aged 18 to 75');
  if (!Number.isInteger(input.coverAmount) || input.coverAmount < 1 || input.coverAmount > 500000) {
    throw new DomainError('New Business cover must be between GBP 1 and GBP 500,000');
  }
  if (!Number.isInteger(input.monthlyPremiumPence) || input.monthlyPremiumPence < 1) {
    throw new DomainError('A positive quoted monthly premium is required');
  }
  if (!Number.isInteger(input.termYears) || input.termYears < 5 || input.termYears > 40 || age + input.termYears > 85) {
    throw new DomainError('Term must be 5 to 40 years and end by age 85');
  }

  const outstandingRequirements = [
    ...(!input.paymentMethodConfirmed ? ['payment-method'] : []),
    ...(!input.materialFactsConfirmed ? ['material-facts-confirmation'] : []),
    ...(!input.privacyConsent ? ['privacy-consent'] : []),
    ...(!input.termsAccepted ? ['terms-and-conditions'] : [])
  ];
  const referralReasons = [
    ...(input.applicant.residency !== 'UK' ? ['non-UK-residency'] : []),
    ...(input.sanctionsMatch ? ['sanctions-screening-match'] : []),
    ...(input.politicallyExposedPerson ? ['politically-exposed-person'] : [])
  ];
  const status: ApplicationStatus = referralReasons.length
    ? 'REFERRED'
    : outstandingRequirements.length
      ? 'DRAFT'
      : 'READY_TO_SUBMIT';

  return {
    ...input,
    id,
    status,
    outstandingRequirements,
    referralReasons,
    createdAt: now.toISOString()
  };
}

export function submitApplication(application: NewBusinessApplication, now = new Date()): NewBusinessApplication {
  if (application.status !== 'READY_TO_SUBMIT') {
    throw new DomainError('Only a complete, non-referred application can be submitted');
  }
  return { ...application, status: 'SUBMITTED', submittedAt: now.toISOString() };
}