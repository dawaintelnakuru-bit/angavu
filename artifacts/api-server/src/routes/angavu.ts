import { and, eq, inArray } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { Router, type RequestHandler } from "express";
import { db } from "@workspace/db";
import {
  angavuSettingsTable,
  angavuSyncLedgerTable,
} from "@workspace/db";
import {
  GetAngavuDashboardQueryParams,
  GetAngavuDashboardResponse,
  GetAngavuLookupsQueryParams,
  GetAngavuLookupsResponse,
  GetAngavuSettingsResponse,
  SyncAngavuEntriesBody,
  SyncAngavuEntriesResponse,
  UpdateAngavuSettingsBody,
  UpdateAngavuSettingsResponse,
} from "@workspace/api-zod";
import {
  appendSheetRows,
  readSheetMetadata,
  readSheetValues,
} from "../lib/googleSheets";

const router = Router();

const requireAuth: RequestHandler = (req, res, next) => {
  if (!getAuth(req).userId) {
    res.status(401).json({ error: "Sign in to access Angavu data." });
    return;
  }
  next();
};

router.use("/angavu", requireAuth);

type Module = "finance" | "pharmacy" | "inventory" | "analytics";
type EntryModule = Exclude<Module, "analytics">;
type Entry = ReturnType<typeof SyncAngavuEntriesBody.parse>["entries"][number];
type DashboardData = ReturnType<typeof GetAngavuDashboardResponse.parse>;

function spreadsheetIdFromUrl(value: string | null | undefined) {
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Enter a valid Google Sheets URL.");
  }

  const match =
    url.hostname === "docs.google.com"
      ? url.pathname.match(/^\/spreadsheets\/d\/([a-zA-Z0-9_-]+)(?:\/|$)/)
      : null;
  if (!match) {
    throw new Error("Use a Google Sheets link ending in /spreadsheets/d/…");
  }
  return match[1];
}

function spreadsheetUrlFromId(value: string | null) {
  return value
    ? `https://docs.google.com/spreadsheets/d/${value}/edit`
    : null;
}

async function getSettings(userId: string) {
  const [settings] = await db
    .select()
    .from(angavuSettingsTable)
    .where(eq(angavuSettingsTable.userId, userId))
    .limit(1);
  return settings;
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateValue(value: unknown): Date | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const date = new Date(Date.UTC(1899, 11, 30) + value * 86_400_000);
    return Number.isNaN(date.valueOf()) ? null : date;
  }
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    month: "short",
    timeZone: "Africa/Nairobi",
  }).format(date);
}

function demoInventoryDashboard() {
  const now = new Date();
  const trend = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - 13 + index);
    return {
      date: date.toISOString().slice(0, 10),
      label: new Intl.DateTimeFormat("en-KE", {
        day: "numeric",
        month: "short",
        timeZone: "Africa/Nairobi",
      }).format(date),
      income: 18 + (index % 4) * 3,
      expense: 11 + (index % 3) * 2,
      net: 7 + (index % 2),
    };
  });
  return {
    module: "inventory" as const,
    source: "demo" as const,
    refreshedAt: now.toISOString(),
    metrics: [
      { label: "Items tracked", value: 48, unit: "items", change: null, tone: "neutral" as const },
      { label: "Stock value", value: 684_200, unit: "KES", change: null, tone: "positive" as const },
      { label: "Low stock", value: 5, unit: "items", change: null, tone: "warning" as const },
      { label: "Out of stock", value: 1, unit: "items", change: null, tone: "negative" as const },
    ],
    trend,
    alerts: [
      { id: "demo-inventory-low", title: "Reorder items running low", detail: "Sample inventory includes 5 items at or below their reorder level.", severity: "warning" as const, action: "Review inventory" },
    ],
    stock: [
      { itemName: "Maize flour 2kg", sku: "FOD-204", category: "Dry goods", stock: 7, unit: "bags", reorderLevel: 10, unitCost: 185, location: "Nairobi", status: "LOW STOCK", daysRemaining: null, nearestExpiry: null, expiryDays: null },
      { itemName: "Cooking oil 1L", sku: "FOD-118", category: "Household", stock: 0, unit: "bottles", reorderLevel: 8, unitCost: 310, location: "Nairobi", status: "OUT OF STOCK", daysRemaining: null, nearestExpiry: null, expiryDays: null },
      { itemName: "Laundry soap", sku: "HOM-076", category: "Household", stock: 36, unit: "bars", reorderLevel: 12, unitCost: 95, location: "Nakuru", status: "OK", daysRemaining: null, nearestExpiry: null, expiryDays: null },
    ],
  };
}

function demoAnalyticsDashboard() {
  const now = new Date();
  const trend = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + index, 1),
    );
    const income = 735_000 + index * 42_000;
    const expense = 486_000 + index * 24_000;
    return {
      date: `${monthKey(date)}-01`,
      label: monthLabel(date),
      income,
      expense,
      net: income - expense,
    };
  });
  return {
    module: "analytics" as const,
    source: "demo" as const,
    refreshedAt: now.toISOString(),
    metrics: [
      { label: "Income", value: 946_200, unit: "KES", change: 8.4, tone: "positive" as const },
      { label: "Expenses", value: 618_450, unit: "KES", change: 3.1, tone: "warning" as const },
      { label: "Net position", value: 327_750, unit: "KES", change: 14.2, tone: "positive" as const },
      { label: "Low stock items", value: 12, unit: "items", change: null, tone: "warning" as const },
    ],
    trend,
    alerts: [
      { id: "demo-analytics-stock", title: "Several items need review", detail: "Connect your workbooks to see live stock and finance alerts.", severity: "warning" as const, action: "Review inventory" },
    ],
    stock: [
      { itemName: "Paracetamol 500mg", stock: 34, unit: "tablets", daysRemaining: 6, status: "CRITICAL", nearestExpiry: null, expiryDays: null },
      { itemName: "Maize flour 2kg", sku: "FOD-204", category: "Dry goods", stock: 7, unit: "bags", reorderLevel: 10, unitCost: 185, location: "Nairobi", status: "LOW STOCK", daysRemaining: null, nearestExpiry: null, expiryDays: null },
    ],
  };
}

function demoDashboard(module: Module) {
  const now = new Date();
  if (module === "finance") {
    const trend = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + index, 1),
      );
      const income = 735_000 + index * 42_000;
      const expense = 486_000 + index * 24_000;
      return {
        date: `${monthKey(date)}-01`,
        label: monthLabel(date),
        income,
        expense,
        net: income - expense,
      };
    });
    return {
      module,
      source: "demo" as const,
      refreshedAt: now.toISOString(),
      metrics: [
        { label: "Income", value: 946_200, unit: "KES", change: 8.4, tone: "positive" as const },
        { label: "Expenses", value: 618_450, unit: "KES", change: 3.1, tone: "warning" as const },
        { label: "Net position", value: 327_750, unit: "KES", change: 14.2, tone: "positive" as const },
        { label: "Supplier claims pending", value: 82_000, unit: "KES", change: null, tone: "neutral" as const },
      ],
      trend,
      alerts: [
        {
          id: "demo-claims",
          title: "Supplier claims need review",
          detail: "KES 82,000 is shown as pending in this sample workspace.",
          severity: "warning" as const,
          action: "Review claims",
        },
      ],
      stock: [],
    };
  }

  if (module === "analytics") return demoAnalyticsDashboard();
  if (module === "inventory") return demoInventoryDashboard();

  const trend = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - 13 + index);
    return {
      date: date.toISOString().slice(0, 10),
      label: new Intl.DateTimeFormat("en-KE", {
        day: "numeric",
        month: "short",
        timeZone: "Africa/Nairobi",
      }).format(date),
      income: 31 + (index % 5) * 4,
      expense: 24 + (index % 4) * 3,
      net: 7 + (index % 3),
    };
  });
  return {
    module,
    source: "demo" as const,
    refreshedAt: now.toISOString(),
    metrics: [
      { label: "Stockouts", value: 2, unit: "items", change: null, tone: "negative" as const },
      { label: "Critical stock", value: 4, unit: "items", change: null, tone: "warning" as const },
      { label: "Low stock", value: 7, unit: "items", change: null, tone: "warning" as const },
      { label: "Expiry alerts", value: 3, unit: "batches", change: null, tone: "neutral" as const },
      { label: "Expired batches", value: 1, unit: "batches", change: null, tone: "negative" as const },
      { label: "Needs action", value: 10, unit: "items", change: null, tone: "warning" as const },
    ],
    trend,
    alerts: [
      {
        id: "demo-stockout",
        title: "Reorder priority items",
        detail: "Sample data includes 2 stockouts and 4 critical stock items.",
        severity: "critical" as const,
        action: "Open stock list",
      },
    ],
    stock: [
      { itemName: "Paracetamol 500mg", stock: 34, daysRemaining: 6, unit: "tablets", status: "CRITICAL", nearestExpiry: null, expiryDays: null },
      { itemName: "Amoxicillin 250mg", stock: 0, daysRemaining: 0, unit: "capsules", status: "STOCKOUT", nearestExpiry: null, expiryDays: null },
      { itemName: "Cetirizine 10mg", stock: 92, daysRemaining: 28, unit: "tablets", status: "OK", nearestExpiry: null, expiryDays: null },
      { itemName: "Oral rehydration salts", stock: 16, daysRemaining: 5, unit: "sachets", status: "CRITICAL", nearestExpiry: null, expiryDays: null },
    ],
  };
}

async function financeDashboard(spreadsheetId: string) {
  const [summary, transactions] = await Promise.all([
    readSheetValues(spreadsheetId, "Dashboard!B9:K10"),
    readSheetValues(spreadsheetId, "'Daily Transactions'!A6:L1000"),
  ]);
  const summaryRow = summary.values?.[1] ?? [];
  const totalIncome = numberValue(summaryRow[0]);
  const totalExpenses = numberValue(summaryRow[3]);
  const net = numberValue(summaryRow[6]);
  const pendingClaims = numberValue(summaryRow[9]);

  const now = new Date();
  const monthStarts = Array.from({ length: 6 }, (_, index) =>
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + index, 1)),
  );
  const buckets = new Map(
    monthStarts.map((date) => [
      monthKey(date),
      { income: 0, expense: 0 },
    ]),
  );

  for (const row of transactions.values ?? []) {
    const date = dateValue(row[0]);
    if (!date) continue;
    const bucket = buckets.get(monthKey(date));
    if (!bucket) continue;
    const type = String(row[2] ?? "").trim().toLowerCase();
    const amount = numberValue(row[5]);
    if (type === "income") bucket.income += amount;
    if (type === "expense") bucket.expense += amount;
  }

  const trend = monthStarts.map((date) => {
    const bucket = buckets.get(monthKey(date)) ?? { income: 0, expense: 0 };
    return {
      date: `${monthKey(date)}-01`,
      label: monthLabel(date),
      income: bucket.income,
      expense: bucket.expense,
      net: bucket.income - bucket.expense,
    };
  });

  const alerts = [];
  if (net < 0) {
    alerts.push({
      id: "net-negative",
      title: "Net position is below zero",
      detail: "Review branch costs against recorded income.",
      severity: "critical" as const,
      action: "Review dashboard",
    });
  }
  if (pendingClaims > 0) {
    alerts.push({
      id: "claims-pending",
      title: "Supplier claims are pending",
      detail: `${pendingClaims.toLocaleString("en-KE")} KES is awaiting follow-up.`,
      severity: "warning" as const,
      action: "Review claims",
    });
  }

  return GetAngavuDashboardResponse.parse({
    module: "finance",
    source: "sheets",
    refreshedAt: new Date().toISOString(),
    metrics: [
      { label: "Income", value: totalIncome, unit: "KES", change: null, tone: "positive" },
      { label: "Expenses", value: totalExpenses, unit: "KES", change: null, tone: "warning" },
      { label: "Net position", value: net, unit: "KES", change: null, tone: net < 0 ? "negative" : "positive" },
      { label: "Supplier claims pending", value: pendingClaims, unit: "KES", change: null, tone: "neutral" },
    ],
    trend,
    alerts,
    stock: [],
  });
}

const NON_INVENTORY_SHEETS = new Set([
  "Instructions",
  "Batch Register",
  "Overview Dashboard",
  "Form Responses 1",
]);

async function pharmacySheetName(spreadsheetId: string) {
  const metadata = await readSheetMetadata(spreadsheetId);
  const title = metadata.sheets
    ?.map((sheet) => sheet.properties?.title)
    .find((name) => name && !NON_INVENTORY_SHEETS.has(name));
  if (!title) {
    throw new Error("No pharmacy stock tab was found in this spreadsheet.");
  }
  return title;
}

function quoteSheetName(title: string) {
  return `'${title.replace(/'/g, "''")}'`;
}

async function pharmacyDashboard(spreadsheetId: string) {
  const inventoryTitle = await pharmacySheetName(spreadsheetId);
  const escapedTitle = quoteSheetName(inventoryTitle);
  const [summary, stockRows, movements] = await Promise.all([
    readSheetValues(spreadsheetId, "'Overview Dashboard'!B4:G5"),
    readSheetValues(spreadsheetId, `${escapedTitle}!A3:M200`),
    readSheetValues(spreadsheetId, "'Form Responses 1'!A2:J1000"),
  ]);

  const counts = summary.values?.[1] ?? [];
  const labels = [
    "Stockouts",
    "Critical stock",
    "Low stock",
    "Expiry warnings",
    "Expired batches",
    "Needs action",
  ];
  const metrics = labels.map((label, index) => {
    const value = numberValue(counts[index]);
    const tone =
      index === 0 || index === 4
        ? value > 0
          ? "negative"
          : "positive"
        : value > 0
          ? "warning"
          : "positive";
    return { label, value, unit: index > 2 ? "batches" : "items", tone };
  });

  const stock = (stockRows.values ?? [])
    .slice(1)
    .filter((row) => String(row[0] ?? "").trim())
    .map((row) => {
      const expiryValue = row[8];
      const expiryDate = dateValue(expiryValue);
      const daysValue = numberValue(row[5]);
      return {
        itemName: String(row[0]).trim(),
        unit: String(row[1] ?? "").trim() || null,
        stock: numberValue(row[2]),
        daysRemaining: Number.isFinite(daysValue) ? daysValue : 0,
        status: String(row[7] ?? "UNKNOWN").trim() || "UNKNOWN",
        nearestExpiry: expiryDate?.toISOString().slice(0, 10) ?? null,
        expiryDays:
          row[9] === undefined || row[9] === "" ? null : Math.trunc(numberValue(row[9])),
      };
    });

  const points = new Map<string, { date: Date; dispensed: number; received: number }>();
  for (const row of movements.values ?? []) {
    const date = dateValue(row[2]);
    if (!date) continue;
    const key = date.toISOString().slice(0, 10);
    const point = points.get(key) ?? { date, dispensed: 0, received: 0 };
    const movement = String(row[5] ?? "").trim().toLowerCase();
    const quantity = numberValue(row[6]);
    if (movement === "dispensed") point.dispensed += quantity;
    if (movement === "received") point.received += quantity;
    if (movement === "returned") point.received += quantity;
    points.set(key, point);
  }
  const latestMovementDates = [...points.values()]
    .sort((a, b) => a.date.valueOf() - b.date.valueOf())
    .slice(-14);
  const trend = latestMovementDates.map((point) => ({
    date: point.date.toISOString().slice(0, 10),
    label: new Intl.DateTimeFormat("en-KE", {
      day: "numeric",
      month: "short",
      timeZone: "Africa/Nairobi",
    }).format(point.date),
    income: point.dispensed,
    expense: point.received,
    net: point.received - point.dispensed,
  }));

  const alerts = metrics
    .filter((metric) => metric.value > 0)
    .slice(0, 4)
    .map((metric, index) => ({
      id: `pharmacy-alert-${index}`,
      title: `${metric.value} ${metric.label.toLowerCase()}`,
      detail: `Review the ${inventoryTitle} stock and batch register.`,
      severity: metric.tone === "negative" ? "critical" : "warning",
      action: "Open stock list",
    }));

  return GetAngavuDashboardResponse.parse({
    module: "pharmacy",
    source: "sheets",
    refreshedAt: new Date().toISOString(),
    metrics,
    trend,
    alerts,
    stock,
  });
}

async function inventorySheetName(spreadsheetId: string) {
  const metadata = await readSheetMetadata(spreadsheetId);
  const title = metadata.sheets
    ?.map((sheet) => sheet.properties?.title)
    .find((name) => name?.trim().toLowerCase() === "stock movements");
  if (!title) {
    throw new Error('Add a tab named "Stock Movements" to the inventory workbook.');
  }
  return title;
}

async function inventoryDashboard(spreadsheetId: string) {
  const sheetTitle = await inventorySheetName(spreadsheetId);
  const result = await readSheetValues(
    spreadsheetId,
    `${quoteSheetName(sheetTitle)}!A1:L2000`,
  );
  const items = new Map<string, {
    itemName: string;
    sku: string | null;
    category: string | null;
    unit: string | null;
    stock: number;
    reorderLevel: number | null;
    unitCost: number | null;
    location: string | null;
  }>();
  const daily = new Map<string, { date: Date; incoming: number; outgoing: number }>();

  for (const row of (result.values ?? []).slice(1)) {
    const itemName = String(row[2] ?? "").trim();
    if (!itemName) continue;
    const sku = String(row[3] ?? "").trim() || null;
    const key = (sku || itemName).toLowerCase();
    const current = items.get(key) ?? {
      itemName,
      sku,
      category: null,
      unit: null,
      stock: 0,
      reorderLevel: null,
      unitCost: null,
      location: null,
    };
    const movement = String(row[1] ?? "").trim().toLowerCase();
    const quantity = numberValue(row[5]);
    if (movement === "stock in") current.stock += quantity;
    if (movement === "stock out") current.stock -= quantity;
    if (movement === "stock count") current.stock = quantity;
    current.category = String(row[4] ?? "").trim() || current.category;
    current.unit = String(row[6] ?? "").trim() || current.unit;
    current.unitCost = row[7] === undefined || row[7] === "" ? current.unitCost : numberValue(row[7]);
    current.reorderLevel = row[8] === undefined || row[8] === "" ? current.reorderLevel : numberValue(row[8]);
    current.location = String(row[9] ?? "").trim() || current.location;
    items.set(key, current);

    const date = dateValue(row[0]);
    if (date && (movement === "stock in" || movement === "stock out")) {
      const day = date.toISOString().slice(0, 10);
      const point = daily.get(day) ?? { date, incoming: 0, outgoing: 0 };
      if (movement === "stock in") point.incoming += quantity;
      if (movement === "stock out") point.outgoing += quantity;
      daily.set(day, point);
    }
  }

  const stock = [...items.values()].map((item) => {
    const status = item.stock <= 0
      ? "OUT OF STOCK"
      : item.reorderLevel !== null && item.stock <= item.reorderLevel
        ? "LOW STOCK"
        : "OK";
    return {
      ...item,
      status,
      daysRemaining: null,
      nearestExpiry: null,
      expiryDays: null,
    };
  });
  const low = stock.filter((item) => item.status === "LOW STOCK");
  const out = stock.filter((item) => item.status === "OUT OF STOCK");
  const stockValue = stock.reduce(
    (total, item) => total + item.stock * (item.unitCost ?? 0),
    0,
  );
  const trend = [...daily.values()]
    .sort((a, b) => a.date.valueOf() - b.date.valueOf())
    .slice(-14)
    .map((point) => ({
      date: point.date.toISOString().slice(0, 10),
      label: new Intl.DateTimeFormat("en-KE", {
        day: "numeric",
        month: "short",
        timeZone: "Africa/Nairobi",
      }).format(point.date),
      income: point.incoming,
      expense: point.outgoing,
      net: point.incoming - point.outgoing,
    }));
  const alerts = [
    ...out.slice(0, 4).map((item, index) => ({
      id: `inventory-out-${index}`,
      title: `${item.itemName} is out of stock`,
      detail: item.location ? `Check stock at ${item.location}.` : "Reorder or update the stock count.",
      severity: "critical" as const,
      action: "Review inventory",
    })),
    ...low.slice(0, 4).map((item, index) => ({
      id: `inventory-low-${index}`,
      title: `${item.itemName} is running low`,
      detail: `${item.stock} ${item.unit ?? "units"} remaining; reorder level is ${item.reorderLevel}.`,
      severity: "warning" as const,
      action: "Review inventory",
    })),
  ].slice(0, 6);

  return GetAngavuDashboardResponse.parse({
    module: "inventory",
    source: "sheets",
    refreshedAt: new Date().toISOString(),
    metrics: [
      { label: "Items tracked", value: stock.length, unit: "items", change: null, tone: "neutral" },
      { label: "Stock value", value: stockValue, unit: "KES", change: null, tone: "positive" },
      { label: "Low stock", value: low.length, unit: "items", change: null, tone: low.length ? "warning" : "positive" },
      { label: "Out of stock", value: out.length, unit: "items", change: null, tone: out.length ? "negative" : "positive" },
    ],
    trend,
    alerts,
    stock,
  });
}

async function analyticsDashboard(settings: Awaited<ReturnType<typeof getSettings>>) {
  const [finance, pharmacy, inventory] = await Promise.all([
    settings?.financeSpreadsheetId ? financeDashboard(settings.financeSpreadsheetId) : null,
    settings?.pharmacySpreadsheetId ? pharmacyDashboard(settings.pharmacySpreadsheetId) : null,
    settings?.inventorySpreadsheetId ? inventoryDashboard(settings.inventorySpreadsheetId) : null,
  ]);
  const available = [finance, pharmacy, inventory].filter(
    (dashboard): dashboard is DashboardData => dashboard !== null,
  );
  if (!available.length) {
    return GetAngavuDashboardResponse.parse(demoAnalyticsDashboard());
  }

  const metrics: DashboardData["metrics"] = [];
  for (const label of ["Income", "Expenses", "Net position"] as const) {
    const metric = finance?.metrics.find((candidate) => candidate.label === label);
    if (metric) metrics.push(metric);
  }
  for (const [dashboard, label] of [
    [pharmacy, "Pharmacy low stock"],
    [inventory, "Inventory low stock"],
  ] as const) {
    const metric = dashboard?.metrics.find((candidate) =>
      candidate.label === (label.startsWith("Pharmacy") ? "Low stock" : "Low stock"),
    );
    if (metric) metrics.push({ ...metric, label });
  }
  const inventoryValue = inventory?.metrics.find((metric) => metric.label === "Stock value");
  if (inventoryValue) metrics.push(inventoryValue);

  const alerts = available.flatMap((dashboard) =>
    dashboard.alerts.map((alert) => ({
      ...alert,
      id: `${dashboard.module}-${alert.id}`,
      detail: `${dashboard.module[0].toUpperCase()}${dashboard.module.slice(1)}: ${alert.detail}`,
    })),
  );
  return GetAngavuDashboardResponse.parse({
    module: "analytics",
    source: available.length === 3 ? "sheets" : "mixed",
    refreshedAt: new Date().toISOString(),
    metrics,
    trend: finance?.trend ?? [],
    alerts,
    stock: [...(pharmacy?.stock ?? []), ...(inventory?.stock ?? [])],
  });
}

router.get("/angavu/settings", async (req, res, next) => {
  try {
    const userId = getAuth(req).userId!;
    const settings = await getSettings(userId);
    res.json(
      GetAngavuSettingsResponse.parse({
        financeSpreadsheetUrl: spreadsheetUrlFromId(
          settings?.financeSpreadsheetId ?? null,
        ),
        pharmacySpreadsheetUrl: spreadsheetUrlFromId(
          settings?.pharmacySpreadsheetId ?? null,
        ),
        inventorySpreadsheetUrl: spreadsheetUrlFromId(
          settings?.inventorySpreadsheetId ?? null,
        ),
        googleSheetsReady: true,
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.put("/angavu/settings", async (req, res, next) => {
  try {
    const userId = getAuth(req).userId!;
    const body = UpdateAngavuSettingsBody.parse(req.body);
    const previous = await getSettings(userId);
    const financeSpreadsheetId =
      body.financeSpreadsheetUrl === undefined
        ? previous?.financeSpreadsheetId ?? null
        : spreadsheetIdFromUrl(body.financeSpreadsheetUrl);
    const pharmacySpreadsheetId =
      body.pharmacySpreadsheetUrl === undefined
        ? previous?.pharmacySpreadsheetId ?? null
        : spreadsheetIdFromUrl(body.pharmacySpreadsheetUrl);
    const inventorySpreadsheetId =
      body.inventorySpreadsheetUrl === undefined
        ? previous?.inventorySpreadsheetId ?? null
        : spreadsheetIdFromUrl(body.inventorySpreadsheetUrl);

    await db
      .insert(angavuSettingsTable)
      .values({ userId, financeSpreadsheetId, pharmacySpreadsheetId, inventorySpreadsheetId })
      .onConflictDoUpdate({
        target: angavuSettingsTable.userId,
        set: { financeSpreadsheetId, pharmacySpreadsheetId, inventorySpreadsheetId },
      });

    res.json(
      UpdateAngavuSettingsResponse.parse({
        financeSpreadsheetUrl: spreadsheetUrlFromId(financeSpreadsheetId),
        pharmacySpreadsheetUrl: spreadsheetUrlFromId(pharmacySpreadsheetId),
        inventorySpreadsheetUrl: spreadsheetUrlFromId(inventorySpreadsheetId),
        googleSheetsReady: true,
      }),
    );
  } catch (error) {
    if (error instanceof Error && (
      error.message.startsWith("Enter a valid Google Sheets") ||
      error.message.startsWith("Use a Google Sheets")
    )) {
      res.status(400).json({ error: error.message });
      return;
    }
    next(error);
  }
});

router.get("/angavu/dashboard", async (req, res, next) => {
  try {
    const { module } = GetAngavuDashboardQueryParams.parse(req.query);
    const userId = getAuth(req).userId!;
    const settings = await getSettings(userId);
    if (module === "analytics") {
      res.json(await analyticsDashboard(settings));
      return;
    }
    const spreadsheetId =
      module === "finance"
        ? settings?.financeSpreadsheetId
        : module === "pharmacy"
          ? settings?.pharmacySpreadsheetId
          : settings?.inventorySpreadsheetId;
    if (!spreadsheetId) {
      res.json(GetAngavuDashboardResponse.parse(demoDashboard(module)));
      return;
    }
    const result = module === "finance"
      ? await financeDashboard(spreadsheetId)
      : module === "pharmacy"
        ? await pharmacyDashboard(spreadsheetId)
        : await inventoryDashboard(spreadsheetId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/angavu/lookups", async (req, res, next) => {
  try {
    const { module } = GetAngavuLookupsQueryParams.parse(req.query);
    const userId = getAuth(req).userId!;
    const settings = await getSettings(userId);
    const spreadsheetId =
      module === "finance"
        ? settings?.financeSpreadsheetId
        : module === "pharmacy"
          ? settings?.pharmacySpreadsheetId
          : settings?.inventorySpreadsheetId;
    if (!spreadsheetId) {
      res.json(
        GetAngavuLookupsResponse.parse(
          module === "finance"
            ? {
                branches: ["Nairobi", "Nakuru", "Eldoret"],
                categories: ["Employee Salaries", "KPLC", "Rent", "Supplier Claims", "Wifi", "Other Expense"],
                products: [],
              }
            : module === "pharmacy"
              ? {
                branches: ["Mary Wanjiku Pharmacy"],
                categories: [],
                products: [
                  { name: "Paracetamol 500mg", unit: "tablets" },
                  { name: "Amoxicillin 250mg", unit: "capsules" },
                  { name: "Cetirizine 10mg", unit: "tablets" },
                ],
              }
              : {
                  branches: ["Nairobi", "Nakuru"],
                  categories: ["Dry goods", "Household"],
                  products: [
                    { name: "Maize flour 2kg", unit: "bags", sku: "FOD-204", unitCost: 185, reorderLevel: 10 },
                    { name: "Cooking oil 1L", unit: "bottles", sku: "FOD-118", unitCost: 310, reorderLevel: 8 },
                  ],
                },
        ),
      );
      return;
    }

    if (module === "finance") {
      const [branches, categories] = await Promise.all([
        readSheetValues(spreadsheetId, "Dashboard!B16:B23"),
        readSheetValues(spreadsheetId, "'Daily Transactions'!D5:D40"),
      ]);
      const branchNames = (branches.values ?? [])
        .map((row) => String(row[0] ?? "").trim())
        .filter(Boolean);
      const categoryNames = [
        ...new Set(
          (categories.values ?? [])
            .map((row) => String(row[0] ?? "").trim())
            .filter(Boolean),
        ),
      ];
      res.json(
        GetAngavuLookupsResponse.parse({
          branches: branchNames,
          categories: categoryNames,
          products: [],
        }),
      );
      return;
    }

    if (module === "pharmacy") {
      const inventoryTitle = await pharmacySheetName(spreadsheetId);
      const inventory = await readSheetValues(
        spreadsheetId,
        `${quoteSheetName(inventoryTitle)}!A4:B100`,
      );
      res.json(
        GetAngavuLookupsResponse.parse({
          branches: [inventoryTitle],
          categories: [],
          products: (inventory.values ?? [])
            .filter((row) => String(row[0] ?? "").trim())
            .map((row) => ({
              name: String(row[0]).trim(),
              unit: String(row[1] ?? "units").trim() || "units",
            })),
        }),
      );
      return;
    }

    const sheetTitle = await inventorySheetName(spreadsheetId);
    const inventoryRows = await readSheetValues(
      spreadsheetId,
      `${quoteSheetName(sheetTitle)}!A1:L2000`,
    );
    const rows = (inventoryRows.values ?? []).slice(1);
    const products = new Map<string, {
      name: string;
      unit: string;
      sku: string | null;
      unitCost: number | null;
      reorderLevel: number | null;
    }>();
    const locations = new Set<string>();
    const categories = new Set<string>();
    for (const row of rows) {
      const name = String(row[2] ?? "").trim();
      if (!name) continue;
      const sku = String(row[3] ?? "").trim() || null;
      const key = (sku || name).toLowerCase();
      products.set(key, {
        name,
        unit: String(row[6] ?? "units").trim() || "units",
        sku,
        unitCost: row[7] === undefined || row[7] === "" ? null : numberValue(row[7]),
        reorderLevel: row[8] === undefined || row[8] === "" ? null : numberValue(row[8]),
      });
      const location = String(row[9] ?? "").trim();
      const category = String(row[4] ?? "").trim();
      if (location) locations.add(location);
      if (category) categories.add(category);
    }
    res.json(
      GetAngavuLookupsResponse.parse({
        branches: [...locations],
        categories: [...categories],
        products: [...products.values()],
      }),
    );
  } catch (error) {
    next(error);
  }
});

function financeRow(entry: Entry) {
  return [
    entry.date,
    entry.branch ?? "",
    entry.type,
    entry.category ?? "",
    entry.description ?? "",
    entry.amount ?? 0,
    entry.paymentMethod ?? "",
    entry.notes ?? "",
    "",
    entry.employee ?? "",
    "",
    entry.id,
  ];
}

function pharmacyRow(entry: Entry) {
  return [
    new Date().toISOString(),
    entry.pharmacy ?? entry.branch ?? "",
    entry.date,
    entry.staffName ?? entry.employee ?? "",
    entry.drugName ?? "",
    entry.type,
    entry.quantity ?? 1,
    entry.expiryDate ?? "",
    entry.notes ?? "",
    entry.id,
  ];
}

function inventoryRow(entry: Entry) {
  return [
    entry.date,
    entry.type,
    entry.itemName ?? "",
    entry.sku ?? "",
    entry.category ?? "",
    entry.quantity ?? 0,
    entry.unit ?? "",
    entry.unitCost ?? "",
    entry.reorderLevel ?? "",
    entry.branch ?? "",
    entry.notes ?? "",
    entry.id,
  ];
}

async function syncModuleEntries(
  userId: string,
  module: EntryModule,
  spreadsheetId: string,
  entries: Entry[],
  syncedIds: string[],
  failures: Array<{ id: string; message: string }>,
) {
  const ids = entries.map((entry) => entry.id);
  const previous = await db
    .select({ entryId: angavuSyncLedgerTable.entryId })
    .from(angavuSyncLedgerTable)
    .where(
      and(
        eq(angavuSyncLedgerTable.userId, userId),
        inArray(angavuSyncLedgerTable.entryId, ids),
      ),
    );
  const knownIds = new Set(previous.map((row) => row.entryId));
  for (const entry of entries) {
    if (knownIds.has(entry.id)) syncedIds.push(entry.id);
  }
  const pending = entries.filter((entry) => !knownIds.has(entry.id));
  if (!pending.length) return;

  try {
    const idRange =
      module === "finance"
        ? "'Daily Transactions'!L6:L2000"
        : module === "pharmacy"
          ? "'Form Responses 1'!J2:J2000"
          : `${quoteSheetName(await inventorySheetName(spreadsheetId))}!L2:L2000`;
    const existing = await readSheetValues(spreadsheetId, idRange);
    const sheetIds = new Set(
      (existing.values ?? [])
        .map((row) => String(row[0] ?? "").trim())
        .filter(Boolean),
    );
    const present = pending.filter((entry) => sheetIds.has(entry.id));
    const append = pending.filter((entry) => !sheetIds.has(entry.id));
    if (append.length) {
      const target =
        module === "finance"
          ? "'Daily Transactions'!A5:L"
          : module === "pharmacy"
            ? "'Form Responses 1'!A1:J"
            : `${quoteSheetName(await inventorySheetName(spreadsheetId))}!A1:L`;
      await appendSheetRows(
        spreadsheetId,
        target,
        append.map(
          module === "finance"
            ? financeRow
            : module === "pharmacy"
              ? pharmacyRow
              : inventoryRow,
        ),
      );
    }

    const completed = [...present, ...append];
    if (completed.length) {
      await db
        .insert(angavuSyncLedgerTable)
        .values(
          completed.map((entry) => ({
            userId,
            entryId: entry.id,
            module,
          })),
        )
        .onConflictDoNothing();
      syncedIds.push(...completed.map((entry) => entry.id));
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not sync these rows. Check the sheet and try again.";
    failures.push(...pending.map((entry) => ({ id: entry.id, message })));
  }
}

router.post("/angavu/sync", async (req, res, next) => {
  try {
    const userId = getAuth(req).userId!;
    const { entries } = SyncAngavuEntriesBody.parse(req.body);
    const settings = await getSettings(userId);
    const syncedIds: string[] = [];
    const allowedTypes: Record<EntryModule, readonly string[]> = {
      finance: ["Income", "Expense"],
      pharmacy: ["Dispensed", "Received", "Returned", "Expired"],
      inventory: ["Stock In", "Stock Out", "Stock Count"],
    };
    const invalidEntries = entries.filter(
      (entry) => !allowedTypes[entry.module].includes(entry.type),
    );
    const validEntries = entries.filter(
      (entry) => allowedTypes[entry.module].includes(entry.type),
    );
    const failures: Array<{ id: string; message: string }> = invalidEntries.map(
      (entry) => ({
        id: entry.id,
        message: `Entry type "${entry.type}" is not valid for ${entry.module}.`,
      }),
    );

    for (const module of ["finance", "pharmacy", "inventory"] as const) {
      const moduleEntries = validEntries.filter((entry) => entry.module === module);
      if (!moduleEntries.length) continue;
      const spreadsheetId =
        module === "finance"
          ? settings?.financeSpreadsheetId
          : module === "pharmacy"
            ? settings?.pharmacySpreadsheetId
            : settings?.inventorySpreadsheetId;
      if (!spreadsheetId) {
        failures.push(
          ...moduleEntries.map((entry) => ({
            id: entry.id,
            message: `Connect the ${module} Google Sheet in Settings before syncing.`,
          })),
        );
        continue;
      }
      await syncModuleEntries(
        userId,
        module,
        spreadsheetId,
        moduleEntries,
        syncedIds,
        failures,
      );
    }

    res.json(
      SyncAngavuEntriesResponse.parse({
        syncedIds: [...new Set(syncedIds)],
        failures,
        syncedAt: new Date().toISOString(),
      }),
    );
  } catch (error) {
    next(error);
  }
});

export default router;
