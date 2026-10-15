import Link from "next/link";

export function Wordmark({ name, dark = false }: { name: string; dark?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center">
      <span
        className={`font-display text-2xl leading-tight sm:text-3xl ${
          dark ? "text-paper" : "text-brand"
        }`}
      >
        {name}
      </span>
    </Link>
  );
}

export function SiteHeader({
  businessName,
  dark = false,
}: {
  businessName: string;
  dark?: boolean;
}) {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Wordmark name={businessName} dark={dark} />
        <nav className="flex items-center gap-7">
          <Link
            href="/#services"
            className={`hidden text-sm font-medium tracking-wide transition hover:opacity-70 sm:block ${
              dark ? "text-paper/80" : "text-muted"
            }`}
          >
            Services
          </Link>
          <Link
            href="/book"
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            Book now
          </Link>
        </nav>
      </div>
    </header>
  );
}
