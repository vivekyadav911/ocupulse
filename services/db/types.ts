export type Team = {
  id: string;
  name: string;
};

export type Student = {
  id: string;
  firstName: string;
  teamId: string | null;
};

export type Session = {
  id: string;
  teamId: string | null;
  activityType: string | null;
  startTime: number | null;
};

export type ExperimentResult = {
  id: string;
  sessionId: string | null;
  activityType: string | null;
  score: number | null;
  dataJson: string | null;
  synced: 0 | 1;
};

export type OutboxRow = {
  id: number;
  path: string;
  payload: string;
  createdAt: number;
};

export type OutboxInsert = Omit<OutboxRow, 'id'>;
