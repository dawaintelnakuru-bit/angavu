import { useEffect, useRef, type ReactNode } from 'react';
import { ClerkProvider, SignIn, SignUp, useAuth, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/shared/keys';
import { shadcn } from '@clerk/themes';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Route, Switch, Redirect, Link, useLocation, Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppShell, Wordmark } from '@/components/AppShell';
import Landing from '@/pages/Landing';
import Dashboard from '@/pages/Dashboard';
import Entry from '@/pages/Entry';
import Settings from '@/pages/Settings';
import { LoadingState } from '@/components/LoadingState';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#bd8423',
    colorForeground: '#263b42',
    colorMutedForeground: '#667671',
    colorDanger: '#a9513f',
    colorBackground: '#fffdf8',
    colorInput: '#fbf9f3',
    colorInputForeground: '#263b42',
    colorNeutral: '#dcd6c8',
    fontFamily: 'DM Sans, sans-serif',
    borderRadius: '0.8rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#fffdf8] rounded-2xl w-[440px] max-w-full overflow-hidden border border-[#e3ddcf] shadow-[0_22px_65px_rgba(38,55,57,.12)]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#263b42] font-bold tracking-tight',
    headerSubtitle: 'text-[#667671]',
    socialButtonsBlockButtonText: 'text-[#263b42] font-semibold',
    formFieldLabel: 'text-[#465b5b] font-semibold',
    footerActionLink: 'text-[#9b6d18] font-semibold',
    footerActionText: 'text-[#667671]',
    dividerText: 'text-[#75817b]',
    identityPreviewEditButton: 'text-[#9b6d18]',
    formFieldSuccessText: 'text-[#47775d]',
    alertText: 'text-[#9d493b]',
    logoBox: 'mb-1',
    logoImage: 'max-h-10',
    socialButtonsBlockButton: 'border-[#dcd6c8] bg-[#fbf9f3] hover:bg-[#f5f0e4]',
    formButtonPrimary: 'bg-[#243d43] hover:bg-[#34565b] text-[#fff9ea]',
    formFieldInput: 'border-[#dcd6c8] bg-[#fbf9f3] text-[#263b42]',
    footerAction: 'text-[#667671]',
    dividerLine: 'bg-[#e6dfd3]',
    alert: 'border-[#e8c5b9] bg-[#fff7f2]',
    otpCodeFieldInput: 'border-[#dcd6c8] bg-[#fbf9f3] text-[#263b42]',
    formFieldRow: 'text-[#263b42]',
    main: 'text-[#263b42]',
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const previousUser = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (previousUser.current !== undefined && previousUser.current !== userId) client.clear();
      previousUser.current = userId;
    });
    return unsubscribe;
  }, [addListener, client]);
  return null;
}

function HomeRedirect() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <LoadingState rows={2}/>;
  return isSignedIn ? <Redirect to="/dashboard"/> : <Landing/>;
}

function ProtectedPage({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <LoadingState rows={2}/>;
  return isSignedIn ? <AppShell>{children}</AppShell> : <Redirect to="/sign-in"/>;
}

function AuthFrame({ children, mode }: { children: ReactNode; mode: 'sign-in' | 'sign-up' }) {
  return <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#f5f1e8] px-4 py-12">
    <div className="app-grid pointer-events-none absolute inset-0 opacity-50"/>
    <div className="absolute -left-20 top-12 h-72 w-72 rounded-full bg-[#ebd391]/25 blur-3xl"/>
    <div className="relative z-10 grid w-full max-w-[1050px] items-center gap-10 lg:grid-cols-[.85fr_1fr]">
      <div className="hidden lg:block"><Wordmark/><div className="mt-12 max-w-md font-display text-5xl font-bold leading-[1.04] tracking-[-.06em] text-[#263b42]">{mode === 'sign-in' ? 'Your business, back in focus.' : 'Start with a clearer picture.'}</div><p className="mt-5 max-w-sm text-sm leading-6 text-[#687772]">Finance, pharmacy and inventory, together in one place. Angavu helps your day-to-day numbers make sense.</p><div className="mt-8 flex items-center gap-2 text-xs font-semibold text-[#567564]"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#e4ede2]">a</span> A bright view for the work you do.</div></div>
      <div className="flex justify-center">{children}</div>
      <div className="text-center text-[11px] text-[#73807a] lg:hidden"><Wordmark/><p className="mt-4">A bright view for the work you do.</p></div>
    </div>
  </main>;
}

function SignInPage() {
  return <AuthFrame mode="sign-in"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`}/></AuthFrame>;
}
function SignUpPage() {
  return <AuthFrame mode="sign-up"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`}/></AuthFrame>;
}

function NotFound() {
  return <main className="grid min-h-[100dvh] place-items-center bg-background px-5"><div className="max-w-md text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#f4e9cb] font-display text-2xl font-bold text-[#9c6b16]">?</div><div className="mt-6 font-data text-xs font-semibold tracking-[.18em] text-[#a47725]">404 · NOT IN VIEW</div><h1 className="mt-3 font-display text-3xl font-bold tracking-[-.05em]">This page is off the map.</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">The page you’re looking for may have moved. Let’s get you back to your business.</p><Link href="/" className="mt-6 inline-flex rounded-xl bg-[#243d43] px-5 py-3 text-sm font-semibold text-[#fff9ea]" data-testid="link-not-found-home">Back to Angavu</Link></div></main>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return <ClerkProvider
    publishableKey={clerkPubKey}
    proxyUrl={clerkProxyUrl}
    appearance={clerkAppearance}
    signInUrl={`${basePath}/sign-in`}
    signUpUrl={`${basePath}/sign-up`}
    localization={{
      signIn: { start: { title: 'Welcome back', subtitle: 'Sign in to see your business clearly.' } },
      signUp: { start: { title: 'Create your Angavu account', subtitle: 'A clearer view starts here.' } },
    }}
    routerPush={(to: string) => setLocation(stripBase(to))}
    routerReplace={(to: string) => setLocation(stripBase(to), { replace: true })}
  >
    <QueryClientProvider client={queryClient}>
      <ClerkQueryClientCacheInvalidator/>
      <TooltipProvider>
        <RoutedErrorBoundary>
          <Switch>
            <Route path="/" component={HomeRedirect}/>
            <Route path="/sign-in/*?" component={SignInPage}/>
            <Route path="/sign-up/*?" component={SignUpPage}/>
            <Route path="/dashboard"><ProtectedPage><Dashboard initialModule="analytics"/></ProtectedPage></Route>
            <Route path="/inventory"><ProtectedPage><Dashboard initialModule="inventory"/></ProtectedPage></Route>
            <Route path="/entry"><ProtectedPage><Entry/></ProtectedPage></Route>
            <Route path="/settings"><ProtectedPage><Settings/></ProtectedPage></Route>
            <Route component={NotFound}/>
          </Switch>
        </RoutedErrorBoundary>
        <Toaster/>
      </TooltipProvider>
    </QueryClientProvider>
  </ClerkProvider>;
}

function App() {
  return <WouterRouter base={basePath}><ClerkProviderWithRoutes/></WouterRouter>;
}

export default App;
