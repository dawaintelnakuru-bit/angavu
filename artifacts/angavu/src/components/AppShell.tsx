import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useClerk, useUser } from '@clerk/react';
import { Activity, ArrowUpRight, BarChart3, ChevronDown, CircleHelp, LogOut, Menu, Plus, Settings2 } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Analytics', icon: BarChart3 },
  { href: '/inventory', label: 'Inventory', icon: Activity },
  { href: '/entry', label: 'Quick entry', icon: Plus },
  { href: '/settings', label: 'Spreadsheet setup', icon: Settings2 },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [path] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();
  const identity = user?.firstName || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'Business owner';
  return (
    <div className="min-h-[100dvh] bg-background md:flex">
      <button className="fixed bottom-4 right-4 z-50 grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle navigation" data-testid="button-toggle-navigation"><Menu size={20}/></button>
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col bg-sidebar px-4 pb-5 pt-6 text-sidebar-foreground transition-transform md:static md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Link href="/dashboard" className="mb-10 flex items-center gap-3 px-2" data-testid="link-brand-home">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-sidebar text-lg font-extrabold">a</span>
          <span><span className="block font-display text-[19px] font-extrabold tracking-[-.04em]">angavu</span><span className="text-[10px] uppercase tracking-[.2em] text-sidebar-foreground/55">business intelligence</span></span>
        </Link>
        <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[.2em] text-sidebar-foreground/45">Workspace</div>
        <nav className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = path === href;
            return <Link key={href} href={href} onClick={() => setMobileOpen(false)} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`} className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-medium transition-colors ${active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'}`}><Icon size={17} strokeWidth={1.8}/><span className="flex-1">{label}</span>{active && <span className="h-1.5 w-1.5 rounded-full bg-primary"/>}</Link>;
          })}
        </nav>
        <div className="mt-auto rounded-2xl border border-sidebar-border bg-sidebar-accent/55 p-4">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold text-sidebar-foreground/70"><Activity size={14} className="text-primary"/> YOUR DATA, IN VIEW</div>
          <p className="text-xs leading-5 text-sidebar-foreground/55">Finance, pharmacy and inventory in one clear picture.</p>
          <Link href="/settings" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">Check connections <ArrowUpRight size={13}/></Link>
        </div>
        <div className="mt-4 flex items-center gap-3 border-t border-sidebar-border px-2 pt-4">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e5d9bd] text-xs font-bold text-[#263c42]">{identity.slice(0, 1).toUpperCase()}</div>
          <div className="min-w-0 flex-1"><div className="truncate text-xs font-semibold">{identity}</div><div className="truncate text-[10px] text-sidebar-foreground/50">{user?.primaryEmailAddress?.emailAddress || 'Angavu account'}</div></div>
          <button aria-label="Sign out" onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL || '/' })} className="rounded-lg p-2 text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-foreground" data-testid="button-sign-out"><LogOut size={15}/></button>
        </div>
      </aside>
      {mobileOpen && <button aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-[#152a30]/35 md:hidden"/>}
      <section className="min-w-0 flex-1">
        <header className="flex h-[72px] items-center justify-between border-b border-border/70 px-5 md:px-9">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="font-data text-[11px]">ANGAVU</span><span>/</span><span className="text-foreground">{navItems.find((n) => n.href === path)?.label || 'Workspace'}</span></div>
          <div className="flex items-center gap-2"><div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] text-muted-foreground sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-[#42886c]"/> Your workspace <ChevronDown size={12}/></div><Link href="/settings" className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-muted" aria-label="Help and setup" data-testid="link-help"><CircleHelp size={17}/></Link></div>
        </header>
        <main className="mx-auto w-full max-w-[1500px] px-4 pb-14 pt-7 sm:px-6 md:px-9 md:pt-9">{children}</main>
      </section>
    </div>
  );
}

export function Wordmark() {
  return <Link href="/" className="inline-flex items-center gap-2.5" data-testid="link-angavu-home"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e5a12c] font-display text-lg font-extrabold text-[#20363d]">a</span><span className="font-display text-[21px] font-extrabold tracking-[-.05em] text-[#243b41]">angavu</span></Link>;
}
