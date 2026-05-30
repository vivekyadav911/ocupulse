import {
  canDeleteExperiment,
  getOwnerEmail,
  isAnonymousExperiment,
  isRegisteredExperiment,
  shouldIncludeExperimentForStudent,
} from '../deleteAuth';

describe('deleteAuth', () => {
  const emailActor = {
    userId: 'email-user',
    isAnonymous: false,
    email: 'student@school.edu',
  };
  const anonActor = { userId: 'anon-a', isAnonymous: true, email: null };

  it('treats no-email anonymous saves as anonymous experiments', () => {
    expect(isAnonymousExperiment({ authAnonymous: true }, 'other-uid')).toBe(true);
    expect(isAnonymousExperiment({ authAnonymous: true, ownerEmail: null }, 'uid')).toBe(true);
    expect(isAnonymousExperiment({}, null)).toBe(true);
    expect(isAnonymousExperiment({ userId: 'legacy-anon-uid' }, 'legacy-anon-uid')).toBe(true);
  });

  it('treats email-owned saves as registered experiments', () => {
    expect(
      isAnonymousExperiment(
        { authAnonymous: false, ownerEmail: 'student@school.edu' },
        'email-user',
      ),
    ).toBe(false);
    expect(isRegisteredExperiment({ ownerEmail: 'student@school.edu' }, 'email-user')).toBe(true);
  });

  it('lets any signed-in student delete anonymous experiments', () => {
    expect(canDeleteExperiment(anonActor, 'other-anon-uid', { authAnonymous: true })).toBe(true);
    expect(canDeleteExperiment(emailActor, 'other-anon-uid', { authAnonymous: true })).toBe(true);
    expect(canDeleteExperiment(anonActor, null, {})).toBe(true);
  });

  it('blocks deleting registered experiments unless email or uid matches', () => {
    expect(
      canDeleteExperiment(anonActor, 'email-user', {
        authAnonymous: false,
        ownerEmail: 'student@school.edu',
        userId: 'email-user',
      }),
    ).toBe(false);
    expect(
      canDeleteExperiment(
        { userId: 'other', isAnonymous: false, email: 'other@school.edu' },
        'email-user',
        { authAnonymous: false, ownerEmail: 'student@school.edu' },
      ),
    ).toBe(false);
  });

  it('lets the matching email account delete its registered experiments', () => {
    expect(
      canDeleteExperiment(emailActor, 'email-user', {
        authAnonymous: false,
        ownerEmail: 'student@school.edu',
      }),
    ).toBe(true);
  });

  it('shows anonymous experiments to all students and registered ones only to owner', () => {
    expect(shouldIncludeExperimentForStudent(anonActor, 'other-uid', { authAnonymous: true })).toBe(
      true,
    );
    expect(
      shouldIncludeExperimentForStudent(emailActor, 'other-uid', { authAnonymous: true }),
    ).toBe(true);
    expect(
      shouldIncludeExperimentForStudent(emailActor, 'email-user', {
        authAnonymous: false,
        ownerEmail: 'student@school.edu',
      }),
    ).toBe(true);
    expect(
      shouldIncludeExperimentForStudent(emailActor, 'other-user', {
        authAnonymous: false,
        ownerEmail: 'other@school.edu',
      }),
    ).toBe(false);
  });

  it('normalizes owner email from payload', () => {
    expect(getOwnerEmail({ ownerEmail: '  Student@School.edu ' })).toBe('student@school.edu');
  });
});
