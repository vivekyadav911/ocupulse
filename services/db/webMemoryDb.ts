/** Minimal in-memory SQL shim for Expo web (avoids expo-sqlite WASM). */
type Row = Record<string, unknown>;

const STORAGE_KEY = 'ocupulse_web_db_v1';

const tables: Record<string, Row[]> = {
  schema_migrations: [],
  teams: [],
  students: [],
  sessions: [],
  experiment_results: [],
  outbox: [],
  media_assets: [],
};

let outboxSeq = 1;
let hydrated = false;

function persistTables(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tables, outboxSeq }));
  } catch (e) {
    console.warn('[Ocupulse] web DB persist failed', e);
  }
}

function hydrateTables(): void {
  if (hydrated) return;
  hydrated = true;
  if (typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { tables?: Record<string, Row[]>; outboxSeq?: number };
    if (parsed.tables) {
      for (const key of Object.keys(tables)) {
        if (Array.isArray(parsed.tables[key])) {
          tables[key] = parsed.tables[key];
        }
      }
    }
    if (typeof parsed.outboxSeq === 'number') {
      outboxSeq = parsed.outboxSeq;
    }
  } catch (e) {
    console.warn('[Ocupulse] web DB hydrate failed', e);
  }
}

function tableNameFromSql(sql: string): string | null {
  const m =
    sql.match(/(?:INSERT INTO|UPDATE|DELETE FROM|FROM)\s+([a-z_]+)/i) ??
    sql.match(/SELECT \* FROM\s+([a-z_]+)/i);
  return m?.[1] ?? null;
}

function deleteRow(table: string, idCol: string, id: unknown): void {
  if (!tables[table]) return;
  tables[table] = tables[table].filter((r) => r[idCol] !== id);
}

export class WebMemoryDatabase {
  constructor() {
    hydrateTables();
  }

  async execAsync(_sql: string): Promise<void> {
    /* schema created eagerly */
  }

  async runAsync(sql: string, params: unknown[] = []): Promise<void> {
    hydrateTables();
    const table = tableNameFromSql(sql);
    if (!table) return;

    if (sql.includes('INSERT INTO schema_migrations')) {
      tables.schema_migrations.push({ version: params[0], applied_at: params[1] });
      persistTables();
      return;
    }

    if (sql.startsWith('INSERT INTO')) {
      const colsMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
      if (!colsMatch) return;
      const cols = colsMatch[1].split(',').map((c) => c.trim());
      const row: Row = {};
      cols.forEach((col, i) => {
        row[col] = params[i];
      });
      if (table === 'outbox' && row.id == null) {
        row.id = outboxSeq++;
      }
      if (!tables[table]) tables[table] = [];
      tables[table].push(row);
      persistTables();
      return;
    }

    if (sql.startsWith('UPDATE')) {
      const idCol = sql.includes('experiment_results')
        ? 'id'
        : (sql.match(/WHERE\s+(\w+)\s*=\s*\?/i)?.[1] ?? 'id');
      const id = params[params.length - 1];
      const idx = tables[table].findIndex((r) => r[idCol] === id);
      if (idx < 0) return;
      const setPart = sql.split('SET')[1]?.split('WHERE')[0] ?? '';
      const assignments = setPart.split(',').map((s) => s.trim());
      assignments.forEach((assignment, i) => {
        const col = assignment.split('=')[0]?.trim();
        if (col) tables[table][idx][col] = params[i];
      });
      persistTables();
      return;
    }

    if (sql.startsWith('DELETE FROM outbox WHERE id IN')) {
      const ids = new Set(params);
      tables.outbox = tables.outbox.filter((r) => !ids.has(r.id));
      persistTables();
      return;
    }

    if (sql.startsWith('DELETE FROM outbox WHERE path =')) {
      const path = params[0];
      tables.outbox = tables.outbox.filter((r) => r.path !== path);
      persistTables();
      return;
    }

    if (sql.startsWith('DELETE FROM experiment_results WHERE id =')) {
      deleteRow('experiment_results', 'id', params[0]);
      persistTables();
      return;
    }

    if (sql.startsWith('DELETE FROM sessions WHERE id =')) {
      deleteRow('sessions', 'id', params[0]);
      persistTables();
      return;
    }

    if (sql.startsWith('DELETE FROM media_assets WHERE session_id =')) {
      deleteRow('media_assets', 'session_id', params[0]);
      persistTables();
      return;
    }
  }

  async getFirstAsync<T extends Row>(sql: string, params: unknown[] = []): Promise<T | null> {
    const rows = await this.getAllAsync<T>(sql, params);
    return rows[0] ?? null;
  }

  async getAllAsync<T extends Row>(sql: string, params: unknown[] = []): Promise<T[]> {
    hydrateTables();
    const table = tableNameFromSql(sql);
    if (!table || !tables[table]) return [];
    if (sql.includes('WHERE')) {
      const idCol = sql.match(/WHERE\s+(\w+)\s*=\s*\?/i)?.[1] ?? 'id';
      return tables[table].filter((r) => r[idCol] === params[0]) as T[];
    }
    return [...tables[table]] as T[];
  }

  async closeAsync(): Promise<void> {
    /* no-op */
  }
}

export function resetWebMemoryTables(): void {
  for (const key of Object.keys(tables)) {
    tables[key] = [];
  }
  outboxSeq = 1;
  hydrated = true;
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}
