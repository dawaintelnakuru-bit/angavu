import { test } from "node:test";
import assert from "node:assert/strict";
import {
  spreadsheetIdFromUrl,
  spreadsheetUrlFromId,
  numberValue,
  dateValue,
  demoDashboard,
  financeRow,
  pharmacyRow,
  inventoryRow,
} from "../src/routes/angavu";

test("spreadsheetIdFromUrl extracts id from valid Google Sheets URLs", () => {
  const url =
    "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0";
  const id = spreadsheetIdFromUrl(url);
  assert.equal(id, "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms");

  const urlWithTrailing =
    "https://docs.google.com/spreadsheets/d/test-id-123_abc/";
  assert.equal(spreadsheetIdFromUrl(urlWithTrailing), "test-id-123_abc");
});

test("spreadsheetIdFromUrl throws error on invalid URLs", () => {
  assert.throws(() => spreadsheetIdFromUrl("not-a-url"), /Enter a valid Google Sheets URL/);
  assert.throws(
    () => spreadsheetIdFromUrl("https://example.com/not-sheets"),
    /Use a Google Sheets link/,
  );
});

test("spreadsheetUrlFromId reconstructs standard edit URL", () => {
  assert.equal(
    spreadsheetUrlFromId("sample-id"),
    "https://docs.google.com/spreadsheets/d/sample-id/edit",
  );
  assert.equal(spreadsheetUrlFromId(null), null);
  assert.equal(spreadsheetUrlFromId(undefined), null);
});

test("numberValue correctly parses various number and currency formats", () => {
  assert.equal(numberValue(42), 42);
  assert.equal(numberValue("42"), 42);
  assert.equal(numberValue("KES 48,250"), 48250);
  assert.equal(numberValue("-1,250.50"), -1250.5);
  assert.equal(numberValue(null), 0);
  assert.equal(numberValue(undefined), 0);
  assert.equal(numberValue("invalid"), 0);
});

test("dateValue parses ISO strings and Excel serial date numbers", () => {
  const iso = "2026-03-15T00:00:00.000Z";
  const parsedIso = dateValue(iso);
  assert.ok(parsedIso instanceof Date);
  assert.equal(parsedIso.getUTCFullYear(), 2026);

  // Excel serial number test (45000 is approximately 2023-03-15)
  const excelSerial = 45000;
  const parsedSerial = dateValue(excelSerial);
  assert.ok(parsedSerial instanceof Date);
  assert.equal(parsedSerial.getUTCFullYear(), 2023);

  assert.equal(dateValue(""), null);
  assert.equal(dateValue(null), null);
});

test("demoDashboard generates complete schema-compliant dashboards for all modules", () => {
  const modules = ["finance", "pharmacy", "inventory", "analytics"] as const;

  for (const mod of modules) {
    const dashboard = demoDashboard(mod);
    assert.equal(dashboard.module, mod);
    assert.equal(dashboard.source, "demo");
    assert.ok(Array.isArray(dashboard.metrics));
    assert.ok(dashboard.metrics.length > 0);
    assert.ok(Array.isArray(dashboard.trend));
    assert.ok(Array.isArray(dashboard.alerts));
    assert.ok(Array.isArray(dashboard.stock));
  }
});

test("row mappers format entry objects into correct Google Sheets column arrays", () => {
  const entry = {
    id: "entry-001",
    module: "finance" as const,
    date: "2026-03-15",
    type: "Income",
    branch: "Nakuru",
    category: "Retail Sales",
    description: "Daily Cash Till",
    amount: 15400,
    paymentMethod: "M-Pesa",
    employee: "Ezra",
    notes: "Verified against till",
  };

  const fRow = financeRow(entry);
  assert.equal(fRow[0], "2026-03-15");
  assert.equal(fRow[1], "Nakuru");
  assert.equal(fRow[2], "Income");
  assert.equal(fRow[5], 15400);
  assert.equal(fRow[11], "entry-001"); // ID is in column L (index 11)

  const pharmEntry = {
    id: "entry-pharm-002",
    module: "pharmacy" as const,
    date: "2026-03-15",
    type: "Dispensed",
    pharmacy: "Mary Wanjiku Pharmacy",
    drugName: "Amoxicillin 250mg",
    quantity: 2,
    expiryDate: "2026-12-01",
    employee: "Pharmacist A",
  };
  const pRow = pharmacyRow(pharmEntry);
  assert.equal(pRow[1], "Mary Wanjiku Pharmacy");
  assert.equal(pRow[4], "Amoxicillin 250mg");
  assert.equal(pRow[5], "Dispensed");
  assert.equal(pRow[6], 2);
  assert.equal(pRow[9], "entry-pharm-002"); // ID is in column J (index 9)

  const invEntry = {
    id: "entry-inv-003",
    module: "inventory" as const,
    date: "2026-03-15",
    type: "Stock In",
    itemName: "Maize flour 2kg",
    sku: "FOD-204",
    quantity: 50,
    unit: "bags",
    unitCost: 185,
    reorderLevel: 10,
    branch: "Nairobi",
  };
  const iRow = inventoryRow(invEntry);
  assert.equal(iRow[1], "Stock In");
  assert.equal(iRow[2], "Maize flour 2kg");
  assert.equal(iRow[3], "FOD-204");
  assert.equal(iRow[5], 50);
  assert.equal(iRow[11], "entry-inv-003"); // ID is in column L (index 11)
});
