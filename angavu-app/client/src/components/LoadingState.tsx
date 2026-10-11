export function LoadingState({ rows = 4 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-4" aria-label="Loading">
      <div className="h-7 w-52 rounded-lg bg-muted" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl border border-border bg-card/70" />
        ))}
      </div>
      <div className="h-64 rounded-2xl border border-border bg-card/70" />
    </div>
  );
}
