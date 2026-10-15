import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/availability";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { serviceIcon, ClockIcon, CalendarIcon, CheckIcon } from "@/components/icons";
import { formatPrice, formatDuration } from "@/lib/format";

// Always render fresh so service/menu edits in the admin show immediately.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [settings, services] = await Promise.all([
    getSettings(),
    prisma.service.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
    <main className="relative overflow-hidden">
      <SiteHeader businessName={settings.businessName} />

      {/* ───────────── Hero ───────────── */}
      <section className="relative min-h-[88vh] bg-paper">
        {/* Angular accents */}
        <div className="pointer-events-none absolute right-0 top-0 h-[60%] w-[42%] bg-lilac-soft [clip-path:polygon(28%_0,100%_0,100%_100%)]" />
        <div className="pointer-events-none absolute right-0 top-0 hidden h-[46%] w-[30%] bg-brand/10 [clip-path:polygon(55%_0,100%_0,100%_100%)] md:block" />

        <div className="relative mx-auto flex max-w-6xl flex-col px-5 pb-20 pt-36 sm:px-8 md:pt-44">
          {/* vertical flourish */}
          <span className="vertical-word absolute left-5 top-40 hidden font-serif text-5xl uppercase tracking-[0.3em] text-brand/10 lg:block">
            Salon
          </span>

          <div className="max-w-2xl animate-fade-up">
            <p className="eyebrow text-gold">Hairstylist · By appointment</p>
            <div className="gold-rule mt-5" />
            <h1 className="mt-4 pb-2 font-display text-6xl leading-[1.15] text-brand sm:text-7xl md:text-8xl">
              {settings.businessName}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              {settings.tagline}. Browse the services, find a time that works for
              you, and book in under a minute — no phone tag required.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/book"
                className="rounded-full bg-brand px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-700"
              >
                Book an appointment
              </Link>
              <Link
                href="#services"
                className="text-sm font-semibold text-ink underline decoration-gold decoration-2 underline-offset-8 transition hover:text-brand"
              >
                View services
              </Link>
            </div>
          </div>

          <div className="mt-16 grid max-w-xl grid-cols-3 gap-6 animate-fade-up">
            {[
              { icon: CalendarIcon, label: "Real-time openings" },
              { icon: ClockIcon, label: "Book in 60 seconds" },
              { icon: CheckIcon, label: "Instant confirmation" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-start gap-2">
                <Icon className="h-6 w-6 text-brand" />
                <span className="text-sm text-muted">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── Services ───────────── */}
      <section id="services" className="bg-paper py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="mb-14 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow text-gold">The Menu</p>
              <h2 className="mt-3 font-display text-4xl text-ink sm:text-5xl">
                Services &amp; Pricing
              </h2>
            </div>
            <p className="max-w-sm text-muted">
              Every appointment includes a consultation so your look is tailored
              to you. Prices are starting points.
            </p>
          </div>

          {services.length === 0 ? (
            <p className="text-muted">Services are being updated — check back soon.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service, i) => {
                const Icon = serviceIcon(i);
                return (
                  <div
                    key={service.id}
                    className="group flex flex-col rounded-[var(--radius-card)] border border-border bg-card p-7 transition hover:-translate-y-1 hover:border-lilac hover:shadow-xl hover:shadow-brand/5"
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-lilac-soft text-brand transition group-hover:bg-lilac/40">
                      <Icon className="h-7 w-7" />
                    </span>
                    <h3 className="mt-5 font-display text-2xl text-brand">
                      {service.name}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                      {service.description}
                    </p>
                    <div className="gold-rule my-5" />
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                        <ClockIcon className="h-4 w-4" />
                        {formatDuration(service.durationMinutes)}
                      </span>
                      <span className="font-serif text-xl font-semibold text-ink">
                        {formatPrice(service.priceCents)}
                      </span>
                    </div>
                    <Link
                      href={`/book?service=${service.id}`}
                      className="mt-5 inline-flex justify-center rounded-full border border-brand/20 py-2.5 text-sm font-semibold text-brand transition group-hover:bg-brand group-hover:text-white"
                    >
                      Book this
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ───────────── How it works ───────────── */}
      <section className="plum-gradient relative overflow-hidden py-20 text-paper sm:py-28">
        <div className="pointer-events-none absolute -left-10 top-10 h-40 w-40 rotate-45 bg-gold/10" />
        <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
          <p className="eyebrow text-gold">Simple by design</p>
          <h2 className="mt-3 max-w-xl font-display text-4xl sm:text-5xl">
            Booking, the easy way
          </h2>
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {[
              {
                n: "01",
                t: "Choose your service",
                d: "Pick from the menu — each shows the time it takes and the price.",
              },
              {
                n: "02",
                t: "Pick an open time",
                d: "See real openings on your chosen day and tap the one you want.",
              },
              {
                n: "03",
                t: "You're booked",
                d: "Add a few details and you'll get an instant confirmation.",
              },
            ].map((step) => (
              <div key={step.n}>
                <span className="font-serif text-5xl font-bold text-gold/70">
                  {step.n}
                </span>
                <h3 className="mt-4 font-display text-2xl">{step.t}</h3>
                <p className="mt-2 text-paper/70">{step.d}</p>
              </div>
            ))}
          </div>
          <Link
            href="/book"
            className="mt-14 inline-flex rounded-full bg-gold px-8 py-4 text-sm font-semibold text-plum transition hover:bg-gold-200"
          >
            Start booking
          </Link>
        </div>
      </section>

      <SiteFooter businessName={settings.businessName} />
    </main>
  );
}
