/**
 * @jest-environment node
 */
import { requeueUnsyncedExperiments } from '../firestore';

const mockGetAllOutbox = jest.fn();
const mockInsertOutbox = jest.fn();
const mockResultsFindAll = jest.fn();
const mockSessionsFindById = jest.fn();

jest.mock('../auth', () => ({
  getCurrentUser: () => ({ uid: 'user-a' }),
  getUserProfile: async () => ({ role: 'student' }),
}));

jest.mock('../profiles', () => ({
  getTeamTeacherId: async () => 'teacher-1',
}));

jest.mock('../../store/sessionStore', () => ({
  useSessionStore: {
    getState: () => ({
      teamName: 'Team Alpha',
      teamId: 'team-1',
      studentId: 'student-1',
    }),
  },
}));

jest.mock('../firebase', () => ({
  getFirestoreDb: () => null,
}));

jest.mock('../db/sqlite', () => ({
  getAllOutbox: () => mockGetAllOutbox(),
  insertOutbox: (...args: unknown[]) => mockInsertOutbox(...args),
  resultsDao: {
    findAll: () => mockResultsFindAll(),
  },
  sessionsDao: {
    findById: (...args: unknown[]) => mockSessionsFindById(...args),
  },
  deleteOutboxIds: jest.fn(),
  markResultSynced: jest.fn(),
}));

describe('requeueUnsyncedExperiments', () => {
  beforeEach(() => {
    mockGetAllOutbox.mockReset();
    mockInsertOutbox.mockReset();
    mockResultsFindAll.mockReset();
    mockSessionsFindById.mockReset();
  });

  it('rebuilds outbox for unsynced results missing queue rows', async () => {
    mockGetAllOutbox.mockResolvedValueOnce([]);
    mockResultsFindAll.mockResolvedValueOnce([
      {
        id: 'result-1',
        sessionId: 'result-1',
        activityType: 'sound',
        score: 68,
        synced: 0,
        teamId: 'team-1',
        studentId: 'student-1',
        userId: 'user-a',
        dataJson: JSON.stringify({ teamName: 'Team Alpha', submittedAt: 1234, peakDb: 70 }),
      },
    ]);
    mockSessionsFindById.mockResolvedValueOnce(null);

    await requeueUnsyncedExperiments();

    expect(mockInsertOutbox).toHaveBeenCalledTimes(2);
    expect(mockInsertOutbox).toHaveBeenCalledWith(
      'scores/result-1',
      expect.objectContaining({ sessionId: 'result-1', userId: 'user-a', authAnonymous: true }),
    );
    expect(mockInsertOutbox).toHaveBeenCalledWith(
      'sessions/result-1',
      expect.objectContaining({ activityType: 'sound', authAnonymous: true }),
    );
  });
});
