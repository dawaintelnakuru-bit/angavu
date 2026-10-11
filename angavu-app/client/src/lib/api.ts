import {
  useQuery,
  useMutation,
  type UseQueryOptions,
  type UseMutationOptions,
  type UseQueryResult,
  type UseMutationResult,
  type QueryKey,
} from "@tanstack/react-query";

// Types
export interface AngavuMetric {
  label: string;
  value: number;
  unit: string;
  change?: number | null;
  tone?: "positive" | "negative" | "neutral" | "warning";
}

export interface AngavuTrendPoint {
  date: string;
  label: string;
  income: number;
  expense: number;
  net: number;
}

export interface AngavuAlert {
  id: string;
  title: string;
  detail: string;
  severity: "critical" | "warning" | "info";
  action?: string | null;
}

export interface AngavuStockItem {
  itemName: string;
  sku?: string | null;
  category?: string | null;
  unit?: string | null;
  stock: number;
  daysRemaining?: number | null;
  reorderLevel?: number | null;
  unitCost?: number | null;
  location?: string | null;
  status: string;
  nearestExpiry?: string | null;
  expiryDays?: number | null;
}

export interface AngavuDashboard {
  module: "finance" | "pharmacy" | "inventory" | "analytics";
  source: "sheets" | "demo" | "disconnected" | "mixed";
  refreshedAt: string;
  metrics: AngavuMetric[];
  trend: AngavuTrendPoint[];
  alerts: AngavuAlert[];
  stock: AngavuStockItem[];
}

export interface AngavuProduct {
  name: string;
  unit: string;
  sku?: string | null;
  unitCost?: number | null;
  reorderLevel?: number | null;
}

export interface AngavuLookups {
  branches: string[];
  categories: string[];
  products: AngavuProduct[];
}

export interface AngavuSettings {
  financeSpreadsheetUrl: string | null;
  pharmacySpreadsheetUrl: string | null;
  inventorySpreadsheetUrl: string | null;
  googleSheetsReady: boolean;
}

export interface AngavuSettingsInput {
  financeSpreadsheetUrl?: string | null;
  pharmacySpreadsheetUrl?: string | null;
  inventorySpreadsheetUrl?: string | null;
}

export interface AngavuEntryInput {
  id: string;
  module: "finance" | "pharmacy" | "inventory";
  date: string;
  type: string;
  branch?: string;
  category?: string;
  description?: string;
  amount?: number;
  paymentMethod?: string;
  employee?: string;
  pharmacy?: string;
  staffName?: string;
  drugName?: string;
  itemName?: string;
  sku?: string;
  unit?: string;
  unitCost?: number;
  reorderLevel?: number;
  quantity?: number;
  expiryDate?: string | null;
  notes?: string;
}

export interface AngavuSyncInput {
  entries: AngavuEntryInput[];
}

export interface AngavuSyncFailure {
  id: string;
  message: string;
}

export interface AngavuSyncResult {
  syncedIds: string[];
  failures: AngavuSyncFailure[];
  syncedAt: string;
}

export interface HealthStatus {
  status: string;
}

export interface GetAngavuDashboardParams {
  module: "finance" | "pharmacy" | "inventory" | "analytics";
}

export interface GetAngavuLookupsParams {
  module: "finance" | "pharmacy" | "inventory";
}

// Request helper
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    credentials: "include",
  });

  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");

  if (!response.ok) {
    let message = response.statusText;
    if (isJson) {
      try {
        const errorJson = (await response.json()) as { error?: string };
        message = errorJson.error || message;
      } catch {
        // Fallback to status text
      }
    } else {
      const text = await response.text();
      if (text) message = text;
    }
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return isJson ? ((await response.json()) as T) : ({} as T);
}

// Query keys
export const getGetAngavuDashboardQueryKey = (params?: GetAngavuDashboardParams) =>
  ["/api/angavu/dashboard", ...(params ? [params] : [])] as const;

export const getGetAngavuLookupsQueryKey = (params?: GetAngavuLookupsParams) =>
  ["/api/angavu/lookups", ...(params ? [params] : [])] as const;

export const getGetAngavuSettingsQueryKey = () =>
  ["/api/angavu/settings"] as const;

export const getHealthCheckQueryKey = () =>
  ["/api/healthz"] as const;

export const getUpdateAngavuSettingsMutationKey = () =>
  ["updateAngavuSettings"] as const;

export const getSyncAngavuEntriesMutationKey = () =>
  ["syncAngavuEntries"] as const;

// Standalone fetch functions
export const getAngavuDashboard = async (
  params: GetAngavuDashboardParams,
): Promise<AngavuDashboard> => {
  const query = new URLSearchParams({ module: params.module });
  return request<AngavuDashboard>(`/api/angavu/dashboard?${query}`);
};

export const getAngavuLookups = async (
  params: GetAngavuLookupsParams,
): Promise<AngavuLookups> => {
  const query = new URLSearchParams({ module: params.module });
  return request<AngavuLookups>(`/api/angavu/lookups?${query}`);
};

export const getAngavuSettings = async (): Promise<AngavuSettings> => {
  return request<AngavuSettings>("/api/angavu/settings");
};

export const updateAngavuSettings = async (
  input: AngavuSettingsInput,
): Promise<AngavuSettings> => {
  return request<AngavuSettings>("/api/angavu/settings", {
    method: "PUT",
    body: JSON.stringify(input),
  });
};

export const syncAngavuEntries = async (
  input: AngavuSyncInput,
): Promise<AngavuSyncResult> => {
  return request<AngavuSyncResult>("/api/angavu/sync", {
    method: "POST",
    body: JSON.stringify(input),
  });
};

export const healthCheck = async (): Promise<HealthStatus> => {
  return request<HealthStatus>("/api/healthz");
};

// React Query hooks
export function useGetAngavuDashboard(
  params: GetAngavuDashboardParams,
  options?: {
    query?: Omit<
      UseQueryOptions<AngavuDashboard, Error, AngavuDashboard, QueryKey>,
      "queryKey" | "queryFn"
    > & { queryKey?: QueryKey };
  },
): UseQueryResult<AngavuDashboard, Error> {
  const queryKey = options?.query?.queryKey ?? getGetAngavuDashboardQueryKey(params);
  return useQuery({
    queryKey,
    queryFn: () => getAngavuDashboard(params),
    ...options?.query,
  });
}

export function useGetAngavuLookups(
  params: GetAngavuLookupsParams,
  options?: {
    query?: Omit<
      UseQueryOptions<AngavuLookups, Error, AngavuLookups, QueryKey>,
      "queryKey" | "queryFn"
    > & { queryKey?: QueryKey };
  },
): UseQueryResult<AngavuLookups, Error> {
  const queryKey = options?.query?.queryKey ?? getGetAngavuLookupsQueryKey(params);
  return useQuery({
    queryKey,
    queryFn: () => getAngavuLookups(params),
    ...options?.query,
  });
}

export function useGetAngavuSettings(options?: {
  query?: Omit<
    UseQueryOptions<AngavuSettings, Error, AngavuSettings, QueryKey>,
    "queryKey" | "queryFn"
  > & { queryKey?: QueryKey };
}): UseQueryResult<AngavuSettings, Error> {
  const queryKey = options?.query?.queryKey ?? getGetAngavuSettingsQueryKey();
  return useQuery({
    queryKey,
    queryFn: () => getAngavuSettings(),
    ...options?.query,
  });
}

export function useUpdateAngavuSettings(options?: {
  mutation?: UseMutationOptions<
    AngavuSettings,
    Error,
    { data: AngavuSettingsInput }
  >;
}): UseMutationResult<AngavuSettings, Error, { data: AngavuSettingsInput }> {
  return useMutation({
    mutationKey: getUpdateAngavuSettingsMutationKey(),
    mutationFn: ({ data }) => updateAngavuSettings(data),
    ...options?.mutation,
  });
}

export function useSyncAngavuEntries(options?: {
  mutation?: UseMutationOptions<
    AngavuSyncResult,
    Error,
    { data: AngavuSyncInput }
  >;
}): UseMutationResult<AngavuSyncResult, Error, { data: AngavuSyncInput }> {
  return useMutation({
    mutationKey: getSyncAngavuEntriesMutationKey(),
    mutationFn: ({ data }) => syncAngavuEntries(data),
    ...options?.mutation,
  });
}

export function useHealthCheck(options?: {
  query?: Omit<
    UseQueryOptions<HealthStatus, Error, HealthStatus, QueryKey>,
    "queryKey" | "queryFn"
  >;
}): UseQueryResult<HealthStatus, Error> {
  return useQuery({
    queryKey: getHealthCheckQueryKey(),
    queryFn: () => healthCheck(),
    ...options?.query,
  });
}
