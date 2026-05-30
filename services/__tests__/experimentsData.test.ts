/**
 * @jest-environment node
 */
import {
  deleteExperiment,
  experimentRecordFromStored,
  mergeExperimentRows,
  type ExperimentRecord,
} from '../experimentsData';

const mockFindById = jest.fn();
const mockDeleteResult = jest.fn();
const mockDeleteSession = jest.fn();
const mockDeleteMedia = jest.fn();
const mockDeleteOutbox = jest.fn();
const mockFindAll = jest.fn();
const mockGetAllOutbox = jest.fn();

jest.mock('../db/sqlite', () => ({
  resultsDao: {
    findById: (...args: unknown[]) => mockFindById(...args),
    findAll: (...args: unknown[]) => mockFindAll(...args),
  },
  getAllOutbox: (...args: unknown[]) => mockGetAllOutbox(...args),
  deleteResultById: (...args: unknown[]) => mockDeleteResult(...args),
  deleteSessionById: (...args: unknown[]) => mockDeleteSession(...args),
  deleteMediaBySessionId: (...args: unknown[]) => mockDeleteMedia(...args),
  deleteOutboxByPaths: (...args: unknown[]) => mockDeleteOutbox(...args),
}));

jest.mock('../firebase', () => ({
  getFirestoreDb: () => null,
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  onSnapshot: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
}));

function sampleRecord(id: string, submittedAt: number): ExperimentRecord {
  return experimentRecordFromStored(id, 'sound', 70, {
    teamName: 'Team',
    submittedAt,
    sessionId: id,
    userId: 'user-a',
  });
}

describe('mergeExperimentRows', () => {
  it('keeps local rows when remote is empty', () => {
    const local = [sampleRecord('local-1', 1000)];
    expect(mergeExperimentRows([], local)).toHaveLength(1);
    expect(mergeExperimentRows([], local)[0]?.sessionId).toBe('local-1');
  });

  it('prefers the newest duplicate by submittedAt', () => {
    const older = sampleRecord('same', 1000);
    const newer = sampleRecord('same', 2000);
    const merged = mergeExperimentRows([older], [newer]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.submittedAt).toBe(2000);
  });
});

describe('deleteExperiment', () => {
  beforeEach(() => {
    mockFindById.mockReset();
    mockDeleteResult.mockReset();
  });

  it('rejects deleting another email account experiment', async () => {
    mockFindById.mockResolvedValueOnce({
      id: 'sess-1',
      userId: 'other-user',
      dataJson: JSON.stringify({
        userId: 'other-user',
        authAnonymous: false,
        ownerEmail: 'other@school.edu',
      }),
    });

    await expect(
      deleteExperiment('sess-1', {
        userId: 'user-a',
        isAnonymous: false,
        email: 'student@school.edu',
      }),
    ).rejects.toThrow('Only the signed-in account for other@school.edu');
    expect(mockDeleteResult).not.toHaveBeenCalled();
  });

  it('allows any student to delete anonymous experiments', async () => {
    mockFindById.mockResolvedValueOnce({
      id: 'sess-1',
      userId: 'other-anon',
      dataJson: JSON.stringify({ userId: 'other-anon', authAnonymous: true, ownerEmail: null }),
    });

    await deleteExperiment('sess-1', {
      userId: 'email-user',
      isAnonymous: false,
      email: 'student@school.edu',
    });
    expect(mockDeleteResult).toHaveBeenCalledWith('sess-1');
  });

  it('blocks anonymous login from deleting email-registered experiments', async () => {
    mockFindById.mockResolvedValueOnce({
      id: 'sess-1',
      userId: 'email-user',
      dataJson: JSON.stringify({
        userId: 'email-user',
        authAnonymous: false,
        ownerEmail: 'student@school.edu',
      }),
    });

    await expect(
      deleteExperiment('sess-1', { userId: 'anon-a', isAnonymous: true, email: null }),
    ).rejects.toThrow('Only the signed-in account for student@school.edu');
    expect(mockDeleteResult).not.toHaveBeenCalled();
  });

  it('deletes local rows for the matching email owner', async () => {
    mockFindById.mockResolvedValueOnce({
      id: 'sess-1',
      userId: 'user-a',
      dataJson: JSON.stringify({
        userId: 'user-a',
        authAnonymous: false,
        ownerEmail: 'student@school.edu',
      }),
    });

    await deleteExperiment('sess-1', {
      userId: 'user-a',
      isAnonymous: false,
      email: 'student@school.edu',
    });
    expect(mockDeleteResult).toHaveBeenCalledWith('sess-1');
    expect(mockDeleteSession).toHaveBeenCalledWith('sess-1');
  });
});
