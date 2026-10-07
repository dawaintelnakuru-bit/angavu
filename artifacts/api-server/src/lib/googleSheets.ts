import { ReplitConnectors } from "@replit/connectors-sdk";

export type SheetValues = {
  values?: unknown[][];
};

export type SheetMetadata = {
  sheets?: Array<{ properties?: { title?: string } }>;
};

type ConnectorRequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

async function sheetsRequest<T>(
  path: string,
  init: ConnectorRequestOptions = {},
): Promise<T> {
  // Recreate the SDK client per request so refreshed connector identity is used.
  const connectors = new ReplitConnectors();
  const response = await connectors.proxy("google-sheet", path, init);
  const text = await response.text();

  if (!response.ok) {
    let message = response.statusText || "Google Sheets request failed";
    try {
      const error = JSON.parse(text) as {
        error?: { message?: string };
      };
      message = error.error?.message || message;
    } catch {
      // Keep the upstream status text if its error body is not JSON.
    }
    throw new Error(`Google Sheets returned ${response.status}: ${message}`);
  }

  return (text ? JSON.parse(text) : {}) as T;
}

function spreadsheetPath(spreadsheetId: string) {
  return `/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}`;
}

export function readSheetValues(
  spreadsheetId: string,
  range: string,
): Promise<SheetValues> {
  const query = new URLSearchParams({
    valueRenderOption: "UNFORMATTED_VALUE",
    dateTimeRenderOption: "SERIAL_NUMBER",
  });
  return sheetsRequest<SheetValues>(
    `${spreadsheetPath(spreadsheetId)}/values/${encodeURIComponent(range)}?${query}`,
  );
}

export function readSheetMetadata(
  spreadsheetId: string,
): Promise<SheetMetadata> {
  const query = new URLSearchParams({ fields: "sheets.properties.title" });
  return sheetsRequest<SheetMetadata>(
    `${spreadsheetPath(spreadsheetId)}?${query}`,
  );
}

export function appendSheetRows(
  spreadsheetId: string,
  range: string,
  values: unknown[][],
) {
  const query = new URLSearchParams({
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
  });
  return sheetsRequest<unknown>(
    `${spreadsheetPath(spreadsheetId)}/values/${encodeURIComponent(range)}:append?${query}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values }),
    },
  );
}
