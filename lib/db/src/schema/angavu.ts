import { createInsertSchema } from "drizzle-zod";
import { pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const angavuSettingsTable = pgTable("angavu_settings", {
  userId: text("user_id").primaryKey(),
  financeSpreadsheetId: text("finance_spreadsheet_id"),
  pharmacySpreadsheetId: text("pharmacy_spreadsheet_id"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertAngavuSettingsSchema = createInsertSchema(
  angavuSettingsTable,
).omit({ updatedAt: true });
export type InsertAngavuSettings = z.infer<typeof insertAngavuSettingsSchema>;
export type AngavuSettings = typeof angavuSettingsTable.$inferSelect;

export const angavuSyncLedgerTable = pgTable(
  "angavu_sync_ledger",
  {
    userId: text("user_id").notNull(),
    entryId: text("entry_id").notNull(),
    module: text("module").notNull(),
    syncedAt: timestamp("synced_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.entryId] })],
);

export const insertAngavuSyncLedgerSchema = createInsertSchema(
  angavuSyncLedgerTable,
).omit({ syncedAt: true });
export type InsertAngavuSyncLedger = z.infer<
  typeof insertAngavuSyncLedgerSchema
>;
export type AngavuSyncLedger = typeof angavuSyncLedgerTable.$inferSelect;
