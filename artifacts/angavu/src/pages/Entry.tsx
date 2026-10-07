import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGetAngavuLookups, getGetAngavuLookupsQueryKey, useSyncAngavuEntries, getGetAngavuDashboardQueryKey, type AngavuEntryInput } from '@workspace/api-client-react';
import { AlertTriangle, Check, CircleArrowUp, CloudOff, LoaderCircle, Plus, RotateCw, Trash2 } from 'lucide-react';
import { LoadingState } from '@/components/LoadingState';
import { readQueue, removeQueueEntries, saveQueueEntry } from '@/lib/offline-queue';

type Module = 'finance' | 'pharmacy';
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const createId = () => typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `entry-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const entryTypes: Record<Module, string[]> = { finance: ['Income', 'Expense'], pharmacy: ['Dispensed', 'Received', 'Returned', 'Expired'] };
const cashMethods = ['Cash', 'M-Pesa', 'Bank transfer', 'Card', 'Credit'];

export default function Entry() {
  const [module, setModule] = useState<Module>('finance');
  const lookupsKey = getGetAngavuLookupsQueryKey({ module });
  const { data: lookups, isLoading: lookupsLoading, isError: lookupsError } = useGetAngavuLookups({ module }, { query: { queryKey: lookupsKey } });
  const [queue, setQueue] = useState<AngavuEntryInput[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [lastFailures, setLastFailures] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  const syncMutation = useSyncAngavuEntries();
  const mutateAsyncRef = useRef(syncMutation.mutateAsync);
  mutateAsyncRef.current = syncMutation.mutateAsync;
  const busyRef = useRef(false);
  const queueRef = useRef(queue);
  queueRef.current = queue;
  const [fields, setFields] = useState({ date: today(), type: 'Income', branch: '', category: '', description: '', amount: '', paymentMethod: 'Cash', employee: '', pharmacy: '', staffName: '', drugName: '', quantity: '1', expiryDate: '', notes: '' });

  useEffect(() => {
    let active = true;
    readQueue().then((entries) => { if (active) { setQueue(entries); setHydrated(true); } }).catch(() => { if (active) { setHydrated(true); setFormError('Local storage is unavailable. Entries may not survive reloads on this browser.'); } });
    return () => { active = false; };
  }, []);

  const syncEntries = useCallback(async () => {
    if (!navigator.onLine || busyRef.current || !queueRef.current.length) return;
    busyRef.current = true;
    setNotice('');
    try {
      const response = await mutateAsyncRef.current({ data: { entries: queueRef.current.slice(0, 100) } });
      const confirmed = response.syncedIds || [];
      if (confirmed.length) {
        await removeQueueEntries(confirmed);
        setQueue((current) => current.filter((entry) => !confirmed.includes(entry.id)));
        setLastFailures((current) => { const next = { ...current }; confirmed.forEach((id) => delete next[id]); return next; });
      }
      if (response.failures?.length) {
        setLastFailures((current) => ({ ...current, ...Object.fromEntries(response.failures.map((f) => [f.id, f.message])) }));
      }
      setNotice(confirmed.length ? `${confirmed.length} ${confirmed.length === 1 ? 'entry' : 'entries'} synced · ${new Date(response.syncedAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}` : 'Entries remain pending until the sheet confirms receipt.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetAngavuDashboardQueryKey({ module: 'finance' }) }),
        queryClient.invalidateQueries({ queryKey: getGetAngavuDashboardQueryKey({ module: 'pharmacy' }) }),
      ]);
    } catch {
      setNotice('Could not reach your spreadsheet. Your entries are saved here and will retry when you’re online.');
    } finally {
      busyRef.current = false;
    }
  }, [queryClient]);

  useEffect(() => {
    if (hydrated && navigator.onLine && queue.length) void syncEntries();
  }, [hydrated, queue.length, syncEntries]);
  useEffect(() => {
    const handleOnline = () => { void syncEntries(); };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncEntries]);

  const changeModule = (next: Module) => {
    setModule(next);
    setFields((current) => ({ ...current, type: entryTypes[next][0], branch: '', pharmacy: '', drugName: '' }));
    setFormError('');
  };
  const update = (key: keyof typeof fields, value: string) => setFields((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    if (module === 'pharmacy' && !fields.drugName) { setFormError('Choose a medicine before saving.'); return; }
    if (module === 'finance' && (!fields.amount || Number(fields.amount) < 0)) { setFormError('Enter a valid amount.'); return; }
    const entry: AngavuEntryInput = {
      id: createId(), module, date: fields.date, type: fields.type as AngavuEntryInput['type'],
      ...(fields.branch ? { branch: fields.branch } : {}),
      ...(fields.category ? { category: fields.category } : {}),
      ...(fields.description ? { description: fields.description } : {}),
      ...(module === 'finance' ? { amount: Number(fields.amount), paymentMethod: fields.paymentMethod, ...(fields.employee ? { employee: fields.employee } : {}) } : {}),
      ...(fields.pharmacy ? { pharmacy: fields.pharmacy } : {}),
      ...(fields.staffName ? { staffName: fields.staffName } : {}),
      ...(module === 'pharmacy' ? { drugName: fields.drugName, quantity: Number(fields.quantity), expiryDate: fields.expiryDate || null } : {}),
      ...(fields.notes ? { notes: fields.notes } : {}),
    };
    try {
      await saveQueueEntry(entry);
      setQueue((current) => [entry, ...current]);
      setNotice(navigator.onLine ? 'Entry saved locally. Waiting for spreadsheet confirmation…' : 'Saved on this device. It will sync when you’re back online.');
      setFields((current) => ({ ...current, description: '', amount: '', employee: '', staffName: '', quantity: '1', expiryDate: '', notes: '' }));
    } catch {
      setFormError('We couldn’t save this entry to this device. Check available storage and try again.');
    }
  };
  const dropEntry = async (id: string) => {
    await removeQueueEntries([id]);
    setQueue((current) => current.filter((entry) => entry.id !== id));
    setLastFailures((current) => { const next = { ...current }; delete next[id]; return next; });
  };
  const queueTotal = queue.reduce((sum, entry) => sum + 1, 0);
  if (!hydrated) return <LoadingState rows={2}/>;
  return <div className="space-y-7">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="text-[11px] font-semibold uppercase tracking-[.19em] text-[#b4781c]">Quick capture</div><h1 className="mt-2 font-display text-3xl font-bold tracking-[-.055em] sm:text-[38px]">Log it while it’s fresh.</h1><p className="mt-2 max-w-lg text-sm text-muted-foreground">Fast entry for the moments that keep your records useful.</p></div><div className={`inline-flex items-center gap-2 self-start rounded-full border px-3 py-2 text-[11px] font-semibold ${navigator.onLine ? 'border-[#c9ddce] bg-[#eef5ee] text-[#42735a]' : 'border-[#e8d7b5] bg-[#fbf4e5] text-[#927022]'}`}>{navigator.onLine ? <CircleArrowUp size={14}/> : <CloudOff size={14}/>} {navigator.onLine ? 'Online · syncing available' : 'Offline · saved on this device'}</div></div>
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(330px,.85fr)]">
      <form onSubmit={submit} className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-5"><div><h2 className="font-display text-lg font-bold">New entry</h2><p className="mt-1 text-xs text-muted-foreground">A few details now. You can get back to business.</p></div><div className="flex rounded-xl bg-muted p-1">{(['finance','pharmacy'] as Module[]).map((option) => <button key={option} type="button" onClick={() => changeModule(option)} className={`rounded-lg px-3.5 py-2 text-xs font-semibold capitalize ${module === option ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`} data-testid={`button-entry-module-${option}`}>{option}</button>)}</div></div>
        {lookupsError && <div className="mt-4 rounded-xl border border-[#e8c5b9] bg-[#fff8f3] px-4 py-3 text-xs text-[#99513f]">Lookup details are unavailable. You can still enter the record manually.</div>}
        <div className="mt-5 grid gap-x-4 gap-y-4 sm:grid-cols-2">
          <Field label="Date" required><input type="date" value={fields.date} onChange={(e) => update('date', e.target.value)} required className="control" data-testid="input-entry-date"/></Field>
          <Field label="Type" required><select value={fields.type} onChange={(e) => update('type', e.target.value)} className="control" data-testid="select-entry-type">{entryTypes[module].map((type) => <option key={type} value={type}>{type}</option>)}</select></Field>
          {module === 'finance' ? <>
            <Field label="Amount (KSh)" required><input type="number" min="0" step="0.01" inputMode="decimal" placeholder="0.00" value={fields.amount} onChange={(e) => update('amount', e.target.value)} required className="control" data-testid="input-entry-amount"/></Field>
            <Field label="Payment method"><select value={fields.paymentMethod} onChange={(e) => update('paymentMethod', e.target.value)} className="control" data-testid="select-payment-method">{cashMethods.map((method) => <option key={method}>{method}</option>)}</select></Field>
            <Field label="Branch"><select value={fields.branch} onChange={(e) => update('branch', e.target.value)} className="control" data-testid="select-entry-branch"><option value="">Choose a branch</option>{lookups?.branches.map((branch) => <option key={branch}>{branch}</option>)}</select></Field>
            <Field label="Category"><input value={fields.category} onChange={(e) => update('category', e.target.value)} placeholder={fields.type === 'Income' ? 'e.g. Retail sales' : 'e.g. Stock purchase'} className="control" data-testid="input-entry-category"/></Field>
            <Field label="Description"><input value={fields.description} onChange={(e) => update('description', e.target.value)} placeholder="What was this for?" className="control" data-testid="input-entry-description"/></Field>
            <Field label="Recorded by"><input value={fields.employee} onChange={(e) => update('employee', e.target.value)} placeholder="Team member" className="control" data-testid="input-entry-employee"/></Field>
          </> : <>
            <Field label="Medicine" required><select value={fields.drugName} onChange={(e) => update('drugName', e.target.value)} required className="control" data-testid="select-entry-drug"><option value="">Choose medicine</option>{lookupsLoading ? <option disabled>Loading medicines…</option> : lookups?.products.map((product) => <option key={product.name} value={product.name}>{product.name} · {product.unit}</option>)}</select></Field>
            <Field label="Quantity" required><input type="number" min="1" step="1" value={fields.quantity} onChange={(e) => update('quantity', e.target.value)} required className="control" data-testid="input-entry-quantity"/></Field>
            <Field label="Pharmacy / branch">{lookupsError ? <input value={fields.pharmacy} onChange={(e) => update('pharmacy', e.target.value)} placeholder="Location" className="control" data-testid="input-entry-pharmacy"/> : <select value={fields.pharmacy} onChange={(e) => update('pharmacy', e.target.value)} className="control" data-testid="select-entry-pharmacy"><option value="">Choose a location</option>{lookups?.branches.map((branch) => <option key={branch}>{branch}</option>)}</select>}</Field>
            <Field label="Expiry date"><input type="date" value={fields.expiryDate} onChange={(e) => update('expiryDate', e.target.value)} className="control" data-testid="input-entry-expiry"/></Field>
            <Field label="Staff member"><input value={fields.staffName} onChange={(e) => update('staffName', e.target.value)} placeholder="Team member" className="control" data-testid="input-entry-staff"/></Field>
            <Field label="Notes"><input value={fields.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Optional context" className="control" data-testid="input-entry-notes"/></Field>
          </>}
        </div>
        {formError && <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#e8c5b9] bg-[#fff8f3] px-3.5 py-3 text-xs text-[#99513f]" role="alert"><AlertTriangle size={15} className="mt-0.5 shrink-0"/>{formError}</div>}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border/80 pt-5"><p className="max-w-xs text-[10px] leading-4 text-muted-foreground">Saved on this device first. It stays pending until Angavu confirms the spreadsheet sync.</p><button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-[#243d43] px-5 py-3 text-xs font-semibold text-[#fff9ea] transition hover:bg-[#34565b]" data-testid="button-save-entry"><Plus size={15}/> Save entry</button></div>
      </form>
      <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h2 className="font-display text-lg font-bold">Waiting to sync</h2><span className="rounded-full bg-[#f4ead4] px-2 py-0.5 text-[10px] font-semibold text-[#8f6a1e]" data-testid="status-pending-count">{queueTotal}</span></div><p className="mt-1 text-xs text-muted-foreground">Only confirmed entries leave this list.</p></div><button onClick={() => void syncEntries()} disabled={!queue.length || syncMutation.isPending || !navigator.onLine} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-[11px] font-semibold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45" data-testid="button-sync-entries">{syncMutation.isPending ? <LoaderCircle className="animate-spin" size={13}/> : <RotateCw size={13}/>} Sync now</button></div>
        {!navigator.onLine && <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#fbf4e5] px-3 py-2.5 text-[11px] text-[#87691e]"><CloudOff size={14}/> Your entries will retry automatically when you’re back online.</div>}
        {notice && <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#edf3eb] px-3 py-2.5 text-[11px] leading-5 text-[#4d7159]" role="status" data-testid="status-sync-feedback"><Check size={14} className="mt-0.5 shrink-0"/>{notice}</div>}
        <div className="mt-4 space-y-2.5">{queue.length ? queue.map((entry) => <article key={entry.id} className="rounded-xl border border-border/80 bg-background/60 p-3.5" data-testid={`pending-entry-${entry.id}`}><div className="flex items-start gap-2"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${lastFailures[entry.id] ? 'bg-[#b95e49]' : 'bg-[#c2922e]'}`}/><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><div className="text-xs font-semibold">{entry.module === 'finance' ? entry.type : `${entry.type} · ${entry.drugName}`}</div><div className="font-data text-[10px] text-muted-foreground">{entry.module === 'finance' ? `KSh ${Number(entry.amount || 0).toLocaleString('en-KE')}` : `×${entry.quantity}`}</div></div><div className="mt-1 text-[10px] text-muted-foreground">{entry.date}{entry.branch ? ` · ${entry.branch}` : ''}{entry.paymentMethod ? ` · ${entry.paymentMethod}` : ''}</div>{lastFailures[entry.id] && <div className="mt-2 text-[10px] leading-4 text-[#a55240]">{lastFailures[entry.id]}</div>}<div className="mt-2 text-[9px] font-semibold uppercase tracking-[.12em] text-[#997523]">{lastFailures[entry.id] ? 'Retry needed' : 'Pending confirmation'}</div></div><button onClick={() => void dropEntry(entry.id)} aria-label="Remove pending entry" className="rounded-md p-1.5 text-muted-foreground hover:bg-[#f6e5e0] hover:text-[#a9513f]" data-testid={`button-remove-entry-${entry.id}`}><Trash2 size={13}/></button></div></article>) : <div className="grid min-h-[230px] place-items-center rounded-xl border border-dashed border-border px-5 text-center"><div><div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-[#e9efe8] text-[#507963]"><Check size={19}/></div><div className="mt-3 text-sm font-semibold">All caught up</div><p className="mx-auto mt-1 max-w-[230px] text-xs leading-5 text-muted-foreground">New entries will appear here until your spreadsheet confirms them.</p></div></div>}</div>
        {queue.length > 100 && <p className="mt-3 text-[10px] text-muted-foreground">Sync sends up to 100 records at a time. The rest remain queued.</p>}
      </section>
    </div>
    <style>{`.control{width:100%;height:42px;border:1px solid hsl(var(--input));border-radius:10px;background:hsl(var(--background));padding:0 12px;font-size:12px;color:hsl(var(--foreground));outline:none;transition:border-color .15s,box-shadow .15s}.control:focus{border-color:#bf8629;box-shadow:0 0 0 3px rgba(191,134,41,.13)}.control::placeholder{color:#929b95}`}</style>
  </div>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-[11px] font-semibold text-[#53635f]">{label}{required && <span className="ml-1 text-[#b35e49]">*</span>}</span>{children}</label>;
}
