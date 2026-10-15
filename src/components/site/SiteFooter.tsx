import Link from "next/link";

export function SiteFooter({ businessName }: { businessName: string }) {
  return (
    <footer className="plum-gradient relative overflow-hidden text-paper">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rotate-45 bg-brand/20" />
      <div className="relative mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-10 md:flex-row">
          <div className="max-w-sm">
            <p className="eyebrow text-gold">{businessName}</p>
            <p className="mt-4 font-display text-3xl leading-tight">
              Ready for your next look?
            </p>
            <Link
              href="/book"
              className="mt-6 inline-flex rounded-full bg-gold px-6 py-3 text-sm font-semibold text-plum transition hover:bg-gold-200"
            >
              Book an appointment
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-10 text-sm">
            <div>
              <p className="mb-3 font-semibold text-gold-200">Explore</p>
              <ul className="space-y-2 text-paper/75">
                <li>
                  <Link href="/" className="hover:text-paper">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/#services" className="hover:text-paper">
                    Services
                  </Link>
                </li>
                <li>
                  <Link href="/book" className="hover:text-paper">
                    Book
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-3 font-semibold text-gold-200">Hours</p>
              <ul className="space-y-2 text-paper/75">
                <li>Tue – Fri · 9am – 7pm</li>
                <li>Saturday · 9am – 4pm</li>
                <li>Sun – Mon · Closed</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-white/10 pt-6 text-xs text-paper/50">
          © {new Date().getFullYear()} {businessName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
