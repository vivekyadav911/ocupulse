export type UserRole = 'teacher' | 'student';

export type UserProfile = {
  uid: string;
  role: UserRole;
  displayName: string;
  email?: string;
  teamId?: string;
  studentId?: string;
  createdAt: number;
  updatedAt: number;
};

export type Team = {
  id: string;
  name: string;
  teacherId?: string | null;
  schoolId?: string | null;
  synced: 0 | 1;
};

export type Student = {
  id: string;
  firstName: string;
  teamId: string | null;
  uid?: string | null;
  deviceId?: string | null;
  synced: 0 | 1;
};

export type Session = {
  id: string;
  teamId: string | null;
  activityType: string | null;
  startTime: number | null;
  studentId?: string | null;
  createdBy?: string | null;
  synced: 0 | 1;
};

export type ExperimentResult = {
  id: string;
  sessionId: string | null;
  activityType: string | null;
  score: number | null;
  dataJson: string | null;
  synced: 0 | 1;
  teamId?: string | null;
  studentId?: string | null;
  userId?: string | null;
  mediaUrlsJson?: string | null;
};

export type MediaAsset = {
  id: string;
  sessionId: string | null;
  localUri: string | null;
  remoteUrl: string | null;
  mimeType: string | null;
  synced: 0 | 1;
};

export type OutboxRow = {
  id: number;
  path: string;
  payload: string;
  createdAt: number;
};

export type OutboxInsert = Omit<OutboxRow, 'id'>;
