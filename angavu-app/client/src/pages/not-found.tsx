import { Link } from "wouter";

export default function NotFound() {
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-background px-5">
      <div className="max-w-md text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#f4e9cb] font-display text-2xl font-bold text-[#9c6b16]">
          ?
        </div>
        <div className="mt-6 font-data text-xs font-semibold tracking-[.18em] text-[#a47725]">
          404 · NOT IN VIEW
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-[-.05em]">
          This page is off the map.
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          The page you’re looking for may have moved. Let’s get you back to your
          business.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-[#243d43] px-5 py-3 text-sm font-semibold text-[#fff9ea]"
          data-testid="link-not-found-home"
        >
          Back to Angavu
        </Link>
      </div>
    </main>
  );
}
