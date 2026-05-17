/**
 * @jest-environment node
 */
import { syncOutbox } from '../services/firestore';

const mockGetAll = jest.fn();
const mockDelete = jest.fn();
const mockSetDoc = jest.fn();

jest.mock('../services/db/sqlite', () => ({
  getAllOutbox: () => mockGetAll(),
  deleteOutboxIds: (ids: number[]) => mockDelete(ids),
}));

jest.mock('../services/firebase', () => ({
  getFirestoreDb: () => ({}),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => ({})), // firestoreDocRef placeholder - real impl not called when rows empty
  setDoc: jest.fn((...args: unknown[]) => mockSetDoc(args)),
}));

describe('syncOutbox orchestration', () => {
  beforeEach(() => {
    mockGetAll.mockReset();
    mockDelete.mockReset();
    mockSetDoc.mockReset();
  });

  it('no-ops on empty outbox', async () => {
    mockGetAll.mockResolvedValueOnce([]);
    await syncOutbox();
    expect(mockSetDoc).not.toHaveBeenCalled();
  });
});
