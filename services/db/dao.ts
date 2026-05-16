import type * as SQLite from 'expo-sqlite';

type BindParams = SQLite.SQLiteBindParams;

export type Dao<T, TId extends string | number = string, TInsert = T> = {
  insert: (row: TInsert) => Promise<void>;
  update: (row: T) => Promise<void>;
  findById: (id: TId) => Promise<T | null>;
  findAll: () => Promise<T[]>;
};

type DaoConfig<T, TId extends string | number, TInsert = T> = {
  table: string;
  idColumn: string;
  getId: (row: T) => TId;
  insertColumns: readonly string[];
  toInsertParams: (row: TInsert) => readonly unknown[];
  updateColumns: readonly string[];
  toUpdateParams: (row: T) => readonly unknown[];
  fromRow: (row: Record<string, unknown>) => T;
};

export function createDao<T, TId extends string | number = string, TInsert = T>(
  getDatabase: () => Promise<SQLite.SQLiteDatabase>,
  config: DaoConfig<T, TId, TInsert>,
): Dao<T, TId, TInsert> {
  const insertCols = config.insertColumns.join(', ');
  const insertPh = config.insertColumns.map(() => '?').join(', ');
  const setClause = config.updateColumns.map((c) => `${c} = ?`).join(', ');

  return {
    async insert(row: TInsert): Promise<void> {
      const database = await getDatabase();
      await database.runAsync(`INSERT INTO ${config.table} (${insertCols}) VALUES (${insertPh})`, [
        ...config.toInsertParams(row),
      ] as BindParams);
    },

    async update(row: T): Promise<void> {
      const database = await getDatabase();
      await database.runAsync(
        `UPDATE ${config.table} SET ${setClause} WHERE ${config.idColumn} = ?`,
        [...config.toUpdateParams(row), config.getId(row)] as BindParams,
      );
    },

    async findById(id: TId): Promise<T | null> {
      const database = await getDatabase();
      const row = await database.getFirstAsync<Record<string, unknown>>(
        `SELECT * FROM ${config.table} WHERE ${config.idColumn} = ?`,
        [id],
      );
      return row ? config.fromRow(row) : null;
    },

    async findAll(): Promise<T[]> {
      const database = await getDatabase();
      const rows = await database.getAllAsync<Record<string, unknown>>(
        `SELECT * FROM ${config.table}`,
      );
      return rows.map((row) => config.fromRow(row));
    },
  };
}
