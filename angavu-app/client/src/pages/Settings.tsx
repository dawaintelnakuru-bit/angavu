import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetAngavuSettingsQueryKey,
  getGetAngavuDashboardQueryKey,
  useGetAngavuSettings,
  useUpdateAngavuSettings,
  type AngavuSettingsInput,
} from "@/lib/api";
import {
  AlertTriangle,
  Check,
  CircleHelp,
  ExternalLink,
  FileSpreadsheet,
  LoaderCircle,
  Save,
  ShieldCheck,
  Unplug,
  Lock,
} from "lucide-react";
import { LoadingState } from "@/components/LoadingState";

export default function Settings() {
  const queryKey = getGetAngavuSettingsQueryKey();
  const { data, isLoading, isError, refetch } = useGetAngavuSettings({
    query: { queryKey },
  });
  const updateSettings = useUpdateAngavuSettings();
  const queryClient = useQueryClient();
  const [financeSpreadsheetUrl, setFinance] = useState("");
  const [pharmacySpreadsheetUrl, setPharmacy] = useState("");
  const [inventorySpreadsheetUrl, setInventory] = useState("");
  const [feedback, setFeedback] = useState("");
  const [failure, setFailure] = useState("");

  useEffect(() => {
    if (data) {
      setFinance(data.financeSpreadsheetUrl || "");
      setPharmacy(data.pharmacySpreadsheetUrl || "");
      setInventory(data.inventorySpreadsheetUrl || "");
    }
  }, [data]);

  if (isLoading) return <LoadingState rows={2} />;
  if (isError || !data)
    return (
      <div className="max-w-xl rounded-2xl border border-[#e8c5b9] bg-[#fff8f3] p-7 text-center">
        <AlertTriangle className="mx-auto text-[#a95643]" size={24} />
        <h2 className="mt-3 font-display text-xl font-bold">
          Setup details aren’t available
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Try again to check your spreadsheet connections.
        </p>
        <button
          onClick={() => refetch()}
          className="mt-5 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background"
          data-testid="button-retry-settings"
        >
          Try again
        </button>
      </div>
    );

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback("");
    setFailure("");
    const values: AngavuSettingsInput = {
      financeSpreadsheetUrl: financeSpreadsheetUrl.trim() || null,
      pharmacySpreadsheetUrl: pharmacySpreadsheetUrl.trim() || null,
      inventorySpreadsheetUrl: inventorySpreadsheetUrl.trim() || null,
    };
    updateSettings.mutate(
      { data: values },
      {
        onSuccess: (result) => {
          queryClient.setQueryData(queryKey, result);
          setFeedback("Spreadsheet settings saved successfully.");
          void Promise.all([
            queryClient.invalidateQueries({
              queryKey: getGetAngavuDashboardQueryKey({ module: "finance" }),
            }),
            queryClient.invalidateQueries({
              queryKey: getGetAngavuDashboardQueryKey({ module: "pharmacy" }),
            }),
            queryClient.invalidateQueries({
              queryKey: getGetAngavuDashboardQueryKey({ module: "inventory" }),
            }),
            queryClient.invalidateQueries({
              queryKey: getGetAngavuDashboardQueryKey({ module: "analytics" }),
            }),
          ]);
        },
        onError: (err) =>
          setFailure(
            err.message ||
              "We couldn’t save these links. Check your connection and try again.",
          ),
      },
    );
  };

  return (
    <div className="mx-auto max-w-[980px] space-y-7">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[.19em] text-[#b4781c]">
          Your data connections
        </div>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-[-.055em] sm:text-[38px]">
          Spreadsheet setup
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Connect your Google Sheets to bring finance, pharmacy and inventory
          activity into Angavu.
        </p>
      </div>

      <div
        className={`flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between ${
          data.googleSheetsReady
            ? "border-[#c9ddce] bg-[#eef5ee]"
            : "border-[#e6d8b8] bg-[#fbf5e8]"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
              data.googleSheetsReady
                ? "bg-[#dcebdc] text-[#47775d]"
                : "bg-[#f2e7c8] text-[#94701d]"
            }`}
          >
            {data.googleSheetsReady ? (
              <ShieldCheck size={19} />
            ) : (
              <Unplug size={18} />
            )}
          </div>
          <div>
            <div className="text-sm font-semibold">
              {data.googleSheetsReady
                ? "Google Sheets connection ready"
                : "Configure Google Service Account on server"}
            </div>
            <p className="mt-1 max-w-lg text-xs leading-5 text-muted-foreground">
              {data.googleSheetsReady
                ? "Your server is connected to Google Sheets via secure service account authentication. Client data is private and encrypted."
                : "Add your Google Service Account credentials to the server environment variables to activate live sheet synchronization."}
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 self-start rounded-full px-3 py-1.5 text-[10px] font-semibold ${
            data.googleSheetsReady
              ? "bg-[#deecdf] text-[#47775d]"
              : "bg-[#f3e9d0] text-[#8c6e25]"
          }`}
          data-testid="status-google-sheets"
        >
          {data.googleSheetsReady ? "CONNECTED" : "NOT CONFIGURED"}
        </span>
      </div>

      <form onSubmit={save} className="space-y-4">
        <SpreadsheetCard
          title="Finance workbook"
          description="Income, expense and daily cash movement."
          icon="finance"
          value={financeSpreadsheetUrl}
          onChange={setFinance}
          testId="finance"
        />
        <SpreadsheetCard
          title="Pharmacy workbook"
          description="Medicine movement, current stock and expiry dates."
          icon="pharmacy"
          value={pharmacySpreadsheetUrl}
          onChange={setPharmacy}
          testId="pharmacy"
        />
        <SpreadsheetCard
          title="Inventory workbook"
          description="Use a “Stock Movements” tab with Date, Type, Item, SKU, Category, Quantity, Unit, Unit Cost, Reorder Level, Location, Notes and Entry ID columns."
          icon="inventory"
          value={inventorySpreadsheetUrl}
          onChange={setInventory}
          testId="inventory"
        />

        {failure && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-xl border border-[#e8c5b9] bg-[#fff8f3] px-4 py-3 text-xs text-[#99513f]"
          >
            <AlertTriangle size={15} />
            {failure}
          </div>
        )}
        {feedback && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-xl border border-[#c9ddce] bg-[#eef5ee] px-4 py-3 text-xs text-[#42735a]"
            data-testid="status-settings-feedback"
          >
            <Check size={15} />
            {feedback}
          </div>
        )}

        <div className="flex flex-col justify-between gap-4 border-t border-border/80 pt-5 sm:flex-row sm:items-center">
          <p className="max-w-md text-[11px] leading-5 text-muted-foreground">
            Angavu reads only the workbooks you choose to connect. Your backend
            database and service keys remain strictly private on your server.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setFinance("");
                setPharmacy("");
                setInventory("");
              }}
              className="rounded-xl border border-border px-4 py-3 text-xs font-semibold text-muted-foreground hover:bg-muted"
              data-testid="button-clear-links"
            >
              Clear links
            </button>
            <button
              disabled={updateSettings.isPending}
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#243d43] px-5 py-3 text-xs font-semibold text-[#fff9ea] transition hover:bg-[#34565b] disabled:opacity-55"
              data-testid="button-save-settings"
            >
              {updateSettings.isPending ? (
                <LoaderCircle size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}{" "}
              {updateSettings.isPending ? "Saving…" : "Save connections"}
            </button>
          </div>
        </div>
      </form>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-card-border bg-card p-5">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <FileSpreadsheet size={15} className="text-[#b4781c]" /> Finding your
            spreadsheet link
          </div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Open your workbook in Google Sheets and copy the browser address.
            Share view/edit permissions with your private service account email.
          </p>
          <a
            href="https://support.google.com/docs/answer/2494822"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#8e6a21] hover:underline"
          >
            Google Sheets sharing guide <ExternalLink size={11} />
          </a>
        </div>
        <div className="rounded-2xl border border-card-border bg-card p-5">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Lock size={15} className="text-[#557d6a]" /> Privacy Guarantee
          </div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            New entries are stored on your device while offline and stay in the
            queue until Angavu confirms they reached your sheet safely.
          </p>
          <div className="mt-3 text-[10px] font-medium text-[#597767]">
            Data is protected by server-side encryption and never exposed.
          </div>
        </div>
      </div>
    </div>
  );
}

function SpreadsheetCard({
  title,
  description,
  icon,
  value,
  onChange,
  testId,
}: {
  title: string;
  description: string;
  icon: "finance" | "pharmacy" | "inventory";
  value: string;
  onChange: (value: string) => void;
  testId: string;
}) {
  return (
    <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <div
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
            icon === "finance"
              ? "bg-[#f5ecd8] text-[#a8771b]"
              : icon === "pharmacy"
                ? "bg-[#e6eee7] text-[#4f7b65]"
                : "bg-[#e8e9f3] text-[#626b9a]"
          }`}
        >
          <FileSpreadsheet size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <span
          className={`mt-1 h-2 w-2 rounded-full ${
            value ? "bg-[#4e906a]" : "bg-[#c7c9be]"
          }`}
          aria-label={value ? "Link added" : "No link added"}
        />
      </div>
      <label className="mt-5 block">
        <span className="mb-1.5 block text-[11px] font-semibold text-[#53635f]">
          Google Sheets URL
        </span>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="url"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/…"
            className="h-11 min-w-0 flex-1 rounded-xl border border-input bg-background px-3 text-xs outline-none transition placeholder:text-[#969e98] focus:border-[#bf8629] focus:ring-2 focus:ring-[#bf8629]/15"
            data-testid={`input-${testId}-spreadsheet-url`}
          />
          {value && (
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border px-3 text-xs font-semibold text-muted-foreground hover:bg-muted"
              data-testid={`link-open-${testId}-spreadsheet`}
            >
              Open sheet <ExternalLink size={13} />
            </a>
          )}
        </div>
      </label>
    </section>
  );
}
