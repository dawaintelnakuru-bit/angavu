import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

export interface AngavuSettings {
  userId: string;
  financeSpreadsheetId: string | null;
  pharmacySpreadsheetId: string | null;
  inventorySpreadsheetId: string | null;
  updatedAt: string;
}

export interface AngavuSyncLedger {
  userId: string;
  entryId: string;
  module: string;
  syncedAt: string;
}

let dbInstance: Database.Database | null = null;

function resolveDatabasePath(): string {
  const customPath = process.env.DATABASE_PATH;
  if (customPath) {
    const resolved = path.resolve(process.cwd(), customPath);
    const dir = path.dirname(resolved);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return resolved;
  }
  return path.resolve(process.cwd(), "angavu.db");
}

export function getDb(): Database.Database {
  if (dbInstance) return dbInstance;

  const dbPath = resolveDatabasePath();
  dbInstance = new Database(dbPath);
  dbInstance.pragma("journal_mode = WAL");

  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS angavu_settings (
      user_id TEXT PRIMARY KEY,
      finance_spreadsheet_id TEXT,
      pharmacy_spreadsheet_id TEXT,
      inventory_spreadsheet_id TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS angavu_sync_ledger (
      user_id TEXT NOT NULL,
      entry_id TEXT NOT NULL,
      module TEXT NOT NULL,
      synced_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, entry_id)
    );

    CREATE INDEX IF NOT EXISTS idx_sync_ledger_user ON angavu_sync_ledger(user_id);
  `);

  return dbInstance;
}

export async function getSettings(userId: string): Promise<AngavuSettings | null> {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT
      user_id as userId,
      finance_spreadsheet_id as financeSpreadsheetId,
      pharmacy_spreadsheet_id as pharmacySpreadsheetId,
      inventory_spreadsheet_id as inventorySpreadsheetId,
      updated_at as updatedAt
    FROM angavu_settings
    WHERE user_id = ?
    LIMIT 1
  `);
  const row = stmt.get(userId) as AngavuSettings | undefined;
  return row ?? null;
}

export async function upsertSettings(
  userId: string,
  data: {
    financeSpreadsheetId: string | null;
    pharmacySpreadsheetId: string | null;
    inventorySpreadsheetId: string | null;
  },
): Promise<AngavuSettings> {
  const db = getDb();
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO angavu_settings (
      user_id,
      finance_spreadsheet_id,
      pharmacy_spreadsheet_id,
      inventory_spreadsheet_id,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      finance_spreadsheet_id = excluded.finance_spreadsheet_id,
      pharmacy_spreadsheet_id = excluded.pharmacy_spreadsheet_id,
      inventory_spreadsheet_id = excluded.inventory_spreadsheet_id,
      updated_at = excluded.updated_at
  `);
  stmt.run(
    userId,
    data.financeSpreadsheetId,
    data.pharmacySpreadsheetId,
    data.inventorySpreadsheetId,
    now,
  );

  return {
    userId,
    financeSpreadsheetId: data.financeSpreadsheetId,
    pharmacySpreadsheetId: data.pharmacySpreadsheetId,
    inventorySpreadsheetId: data.inventorySpreadsheetId,
    updatedAt: now,
  };
}

export async function getSyncedEntryIds(
  userId: string,
  entryIds: string[],
): Promise<string[]> {
  if (!entryIds.length) return [];
  const db = getDb();
  const placeholders = entryIds.map(() => "?").join(",");
  const stmt = db.prepare(`
    SELECT entry_id as entryId
    FROM angavu_sync_ledger
    WHERE user_id = ? AND entry_id IN (${placeholders})
  `);
  const rows = stmt.all(userId, ...entryIds) as Array<{ entryId: string }>;
  return rows.map((r) => r.entryId);
}

export async function recordSyncedEntries(
  userId: string,
  entries: Array<{ entryId: string; module: string }>,
): Promise<void> {
  if (!entries.length) return;
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO angavu_sync_ledger (user_id, entry_id, module, synced_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, entry_id) DO NOTHING
  `);

  const insertMany = db.transaction(
    (rows: Array<{ entryId: string; module: string }>) => {
      const now = new Date().toISOString();
      for (const row of rows) {
        stmt.run(userId, row.entryId, row.module, now);
      }
    },
  );

  insertMany(entries);
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

export function resetDatabase(): void {
  const db = getDb();
  db.exec(`
    DELETE FROM angavu_settings;
    DELETE FROM angavu_sync_ledger;
  `);
}
