import { createApplication, submitApplication } from '../src/domain/new-business/application';

const completeInput = {
  quoteId: 'quote-1001',
  applicant: {
    firstName: 'Asha',
    lastName: 'Shah',
    dateOfBirth: '1990-06-15',
    email: 'asha@example.test',
    residency: 'UK' as const
  },
  coverAmount: 250000,
  monthlyPremiumPence: 3850,
  termYears: 25,
  paymentMethodConfirmed: true,
  materialFactsConfirmed: true,
  privacyConsent: true,
  termsAccepted: true
};

describe('New Business application rules', () => {
  test('a complete eligible application is ready and can be submitted', () => {
    const application = createApplication(completeInput, 'APP-1001', new Date('2026-11-05T10:00:00Z'));
    expect(application.status).toBe('READY_TO_SUBMIT');
    expect(submitApplication(application, new Date('2026-11-05T10:05:00Z'))).toMatchObject({
      id: 'APP-1001',
      status: 'SUBMITTED',
      submittedAt: '2026-11-05T10:05:00.000Z'
    });
  });

  test('missing confirmations keep the application in draft', () => {
    const application = createApplication(
      { ...completeInput, paymentMethodConfirmed: false, privacyConsent: false },
      'APP-1002',
      new Date('2026-11-05T10:00:00Z')
    );
    expect(application.status).toBe('DRAFT');
    expect(application.outstandingRequirements).toEqual(['payment-method', 'privacy-consent']);
    expect(() => submitApplication(application)).toThrow('Only a complete, non-referred application');
  });

  test('screening and residency flags route to referral', () => {
    const application = createApplication(
      { ...completeInput, applicant: { ...completeInput.applicant, residency: 'OTHER' }, sanctionsMatch: true },
      'APP-1003',
      new Date('2026-11-05T10:00:00Z')
    );
    expect(application.status).toBe('REFERRED');
    expect(application.referralReasons).toEqual(['non-UK-residency', 'sanctions-screening-match']);
  });

  test('term must end by age 85', () => {
    expect(() =>
      createApplication({ ...completeInput, applicant: { ...completeInput.applicant, dateOfBirth: '1956-11-04' }, termYears: 20 }, 'APP-1004', new Date('2026-11-05T10:00:00Z'))
    ).toThrow('Term must be 5 to 40 years and end by age 85');
  });
});