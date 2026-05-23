/** Minimal in-memory SQL shim for Expo web (avoids expo-sqlite WASM). */
type Row = Record<string, unknown>;

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

function tableNameFromSql(sql: string): string | null {
  const m =
    sql.match(/(?:INSERT INTO|UPDATE|DELETE FROM|FROM)\s+([a-z_]+)/i) ??
    sql.match(/SELECT \* FROM\s+([a-z_]+)/i);
  return m?.[1] ?? null;
}

export class WebMemoryDatabase {
  async execAsync(_sql: string): Promise<void> {
    /* schema created eagerly */
  }

  async runAsync(sql: string, params: unknown[] = []): Promise<void> {
    const table = tableNameFromSql(sql);
    if (!table) return;

    if (sql.includes('INSERT INTO schema_migrations')) {
      tables.schema_migrations.push({ version: params[0], applied_at: params[1] });
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
      return;
    }

    if (sql.startsWith('DELETE FROM outbox WHERE id IN')) {
      const ids = new Set(params);
      tables.outbox = tables.outbox.filter((r) => !ids.has(r.id));
    }
  }

  async getFirstAsync<T extends Row>(sql: string, params: unknown[] = []): Promise<T | null> {
    const rows = await this.getAllAsync<T>(sql, params);
    return rows[0] ?? null;
  }

  async getAllAsync<T extends Row>(sql: string, params: unknown[] = []): Promise<T[]> {
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
}
