import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/availability";
import { Wordmark } from "@/components/site/SiteHeader";
import { CheckIcon } from "@/components/icons";
import { formatDateLong, formatTime, formatPrice, formatDuration } from "@/lib/format";

export const metadata = { title: "Booking Confirmed" };

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const settings = await getSettings();
  const booking = id
    ? await prisma.booking.findUnique({
        where: { id },
        include: { service: true },
      })
    : null;

  return (
    <main className="plum-gradient flex min-h-screen flex-col text-paper">
      <div className="mx-auto w-full max-w-3xl px-5 py-7 sm:px-8">
        <div className="flex items-center justify-between">
          <Wordmark name={settings.businessName} dark />
          <Link href="/" className="text-sm text-paper/70 hover:text-paper">
            ← Home
          </Link>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-5 pb-20 sm:px-8">
        {!booking || booking.status === "CANCELLED" ? (
          <div className="animate-fade-up rounded-[var(--radius-card)] border border-white/10 bg-plum-800/70 p-8 text-center backdrop-blur">
            <h1 className="font-display text-2xl">We couldn&apos;t find that booking</h1>
            <p className="mt-2 text-paper/70">
              It may have been cancelled. Try booking again.
            </p>
            <Link
              href="/book"
              className="mt-6 inline-flex rounded-full bg-gold px-6 py-3 text-sm font-semibold text-plum transition hover:bg-gold-200"
            >
              Book an appointment
            </Link>
          </div>
        ) : (
          <div className="animate-fade-up rounded-[var(--radius-card)] border border-white/10 bg-plum-800/70 p-8 backdrop-blur">
            <div className="flex flex-col items-center text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold text-plum">
                <CheckIcon className="h-8 w-8" />
              </span>
              <p className="eyebrow mt-5 text-gold">You&apos;re booked</p>
              <h1 className="mt-2 font-display text-3xl">
                See you soon, {booking.customerName.split(" ")[0]}!
              </h1>
              <p className="mt-2 text-paper/70">
                A confirmation is on its way to {booking.customerEmail}.
              </p>
            </div>

            <dl className="mt-7 divide-y divide-white/10 rounded-xl border border-white/10 bg-white/[0.03] px-5">
              {[
                ["Service", booking.service.name],
                ["Date", formatDateLong(booking.startTime)],
                [
                  "Time",
                  `${formatTime(booking.startTime)} – ${formatTime(booking.endTime)}`,
                ],
                ["Duration", formatDuration(booking.service.durationMinutes)],
                ["Price", formatPrice(booking.service.priceCents)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-3 text-sm">
                  <dt className="text-paper/55">{k}</dt>
                  <dd className="text-right font-medium text-paper">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-7 flex justify-center gap-4">
              <Link
                href="/"
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-paper transition hover:bg-white/10"
              >
                Done
              </Link>
              <Link
                href="/book"
                className="rounded-full bg-gold px-6 py-3 text-sm font-semibold text-plum transition hover:bg-gold-200"
              >
                Book another
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
