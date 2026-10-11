import { google } from "googleapis";

export type SheetValues = {
  values?: unknown[][];
};

export type SheetMetadata = {
  sheets?: Array<{ properties?: { title?: string } }>;
};

let cachedSheetsClient: ReturnType<typeof google.sheets> | null = null;

export function isGoogleSheetsConfigured(): boolean {
  return Boolean(
    (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) ||
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
  );
}

export function getSheetsClient() {
  if (cachedSheetsClient) {
    return cachedSheetsClient;
  }

  if (!isGoogleSheetsConfigured()) {
    throw new Error(
      "Google Service Account is not configured. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in your server environment.",
    );
  }

  let authClient;

  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY.trim();
      const decoded = raw.startsWith("{")
        ? raw
        : Buffer.from(raw, "base64").toString("utf-8");
      const creds = JSON.parse(decoded) as {
        client_email: string;
        private_key: string;
      };
      authClient = new google.auth.JWT({
        email: creds.client_email,
        key: creds.private_key,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });
    } catch {
      throw new Error(
        "Invalid GOOGLE_SERVICE_ACCOUNT_KEY format: expected a valid JSON or base64 encoded JSON string.",
      );
    }
  } else if (
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY
  ) {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL.trim();
    const key = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");
    authClient = new google.auth.JWT({
      email,
      key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  } else {
    authClient = new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  }

  cachedSheetsClient = google.sheets({ version: "v4", auth: authClient });
  return cachedSheetsClient;
}

export async function readSheetValues(
  spreadsheetId: string,
  range: string,
): Promise<SheetValues> {
  const sheets = getSheetsClient();
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
      valueRenderOption: "UNFORMATTED_VALUE",
      dateTimeRenderOption: "SERIAL_NUMBER",
    });
    return {
      values: response.data.values as unknown[][] | undefined,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Google Sheets request failed";
    throw new Error(`Google Sheets read error: ${message}`);
  }
}

export async function readSheetMetadata(
  spreadsheetId: string,
): Promise<SheetMetadata> {
  const sheets = getSheetsClient();
  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: "sheets.properties.title",
    });
    return {
      sheets: (response.data.sheets ?? []).map((sheet) => ({
        properties: {
          title: sheet.properties?.title ?? undefined,
        },
      })),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Google Sheets metadata failed";
    throw new Error(`Google Sheets metadata error: ${message}`);
  }
}

export async function appendSheetRows(
  spreadsheetId: string,
  range: string,
  values: unknown[][],
): Promise<unknown> {
  const sheets = getSheetsClient();
  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values,
      },
    });
    return response.data;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Google Sheets append failed";
    throw new Error(`Google Sheets append error: ${message}`);
  }
}
