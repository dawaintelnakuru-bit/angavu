import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";

// Use a temporary database for testing
const testDbPath = path.resolve(process.cwd(), "test-angavu.db");
process.env.DATABASE_PATH = testDbPath;

import {
  getSettings,
  upsertSettings,
  getSyncedEntryIds,
  recordSyncedEntries,
  closeDatabase,
  resetDatabase,
} from "../src/db";

beforeEach(() => {
  resetDatabase();
});

after(() => {
  closeDatabase();
  if (fs.existsSync(testDbPath)) {
    try {
      fs.unlinkSync(testDbPath);
    } catch {
      // Ignore cleanup error on windows if file handle released asynchronously
    }
  }
});

test("upsertSettings saves and updates user spreadsheet settings", async () => {
  const userId = "user_test_123";

  // Initial read is null
  const initial = await getSettings(userId);
  assert.equal(initial, null);

  // First save
  await upsertSettings(userId, {
    financeSpreadsheetId: "sheet_fin_001",
    pharmacySpreadsheetId: "sheet_pharm_001",
    inventorySpreadsheetId: null,
  });

  const updated = await getSettings(userId);
  assert.ok(updated);
  assert.equal(updated.userId, userId);
  assert.equal(updated.financeSpreadsheetId, "sheet_fin_001");
  assert.equal(updated.pharmacySpreadsheetId, "sheet_pharm_001");
  assert.equal(updated.inventorySpreadsheetId, null);

  // Update existing
  await upsertSettings(userId, {
    financeSpreadsheetId: "sheet_fin_updated",
    pharmacySpreadsheetId: "sheet_pharm_001",
    inventorySpreadsheetId: "sheet_inv_001",
  });

  const reloaded = await getSettings(userId);
  assert.ok(reloaded);
  assert.equal(reloaded.financeSpreadsheetId, "sheet_fin_updated");
  assert.equal(reloaded.inventorySpreadsheetId, "sheet_inv_001");
});

test("sync ledger idempotently deduplicates entries across repeated syncs", async () => {
  const userId = "user_test_456";
  const entryIds = ["entry-101", "entry-102", "entry-103"];

  // Initially none synced
  const synced1 = await getSyncedEntryIds(userId, entryIds);
  assert.deepEqual(synced1, []);

  // Record 2 entries
  await recordSyncedEntries(userId, [
    { entryId: "entry-101", module: "finance" },
    { entryId: "entry-102", module: "finance" },
  ]);

  const synced2 = await getSyncedEntryIds(userId, entryIds);
  assert.equal(synced2.length, 2);
  assert.ok(synced2.includes("entry-101"));
  assert.ok(synced2.includes("entry-102"));
  assert.ok(!synced2.includes("entry-103"));

  // Re-inserting entry-101 must not throw and must remain idempotent
  await recordSyncedEntries(userId, [
    { entryId: "entry-101", module: "finance" },
    { entryId: "entry-103", module: "finance" },
  ]);

  const synced3 = await getSyncedEntryIds(userId, entryIds);
  assert.equal(synced3.length, 3);
});
