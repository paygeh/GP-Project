import Link from "next/link";
import { prisma } from "@/lib/db";
import { updateBookingStatusAction } from "@/app/admin/actions";
import { formatTime, formatDateShort, formatPrice } from "@/lib/format";
import { CalendarIcon, ClockIcon } from "@/components/icons";

export const metadata = { title: "Dashboard · Admin" };

export default async function AdminDashboard() {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  const weekEnd = new Date(todayStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const [pending, todays, upcoming, weekCount] = await Promise.all([
    prisma.booking.findMany({
      where: { status: "PENDING" },
      orderBy: { startTime: "asc" },
      take: 10,
      include: { service: true },
    }),
    prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        startTime: { gte: todayStart, lt: todayEnd },
      },
      orderBy: { startTime: "asc" },
      include: { service: true },
    }),
    prisma.booking.findMany({
      where: { status: "CONFIRMED", startTime: { gte: now } },
      orderBy: { startTime: "asc" },
      take: 6,
      include: { service: true },
    }),
    prisma.booking.count({
      where: {
        status: "CONFIRMED",
        startTime: { gte: todayStart, lt: weekEnd },
      },
    }),
  ]);

  const stats = [
    { label: "New requests", value: pending.length, accent: pending.length > 0 },
    { label: "Confirmed today", value: todays.length, accent: false },
    { label: "Confirmed next 7 days", value: weekCount, accent: false },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Dashboard</h1>
      <p className="mt-1 text-muted">Review requests and manage your schedule.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`rounded-[var(--radius-card)] border p-6 ${
              s.accent ? "border-gold bg-gold-soft" : "border-border bg-card"
            }`}
          >
            <p className="font-serif text-4xl font-bold text-brand">{s.value}</p>
            <p className="mt-1 text-sm text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pending requests — the action queue */}
      <section className="mt-8 rounded-[var(--radius-card)] border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">New requests</h2>
          <Link
            href="/admin/appointments?filter=requests"
            className="text-sm font-medium text-brand hover:underline"
          >
            View all →
          </Link>
        </div>
        {pending.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">
            No pending requests. You&apos;re all caught up.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {pending.map((b) => (
              <li
                key={b.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-ink">{b.customerName}</p>
                  <p className="text-sm text-muted">
                    {b.service.name} · {formatDateShort(b.startTime)} at{" "}
                    {formatTime(b.startTime)}
                  </p>
                  <p className="text-sm text-muted">
                    {b.customerEmail} · {b.customerPhone}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={updateBookingStatusAction}>
                    <input type="hidden" name="id" value={b.id} />
                    <input type="hidden" name="status" value="CONFIRMED" />
                    <button className="rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-white transition hover:bg-brand-700">
                      Approve
                    </button>
                  </form>
                  <form action={updateBookingStatusAction}>
                    <input type="hidden" name="id" value={b.id} />
                    <input type="hidden" name="status" value="DECLINED" />
                    <button className="rounded-full border border-red-200 px-4 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-600 hover:text-white">
                      Decline
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-[var(--radius-card)] border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2 text-brand">
            <CalendarIcon className="h-5 w-5" />
            <h2 className="font-display text-xl text-ink">Today&apos;s schedule</h2>
          </div>
          {todays.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              Nothing confirmed today.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {todays.map((b) => (
                <li key={b.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-ink">{b.customerName}</p>
                    <p className="text-sm text-muted">{b.service.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="inline-flex items-center gap-1 font-medium text-brand">
                      <ClockIcon className="h-4 w-4" />
                      {formatTime(b.startTime)}
                    </p>
                    <p className="text-xs text-muted">
                      {formatPrice(b.service.priceCents)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-[var(--radius-card)] border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl text-ink">Coming up</h2>
            <Link
              href="/admin/appointments?filter=upcoming"
              className="text-sm font-medium text-brand hover:underline"
            >
              View all →
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              No confirmed appointments yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.map((b) => (
                <li key={b.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-ink">{b.customerName}</p>
                    <p className="text-sm text-muted">{b.service.name}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium text-ink">
                      {formatDateShort(b.startTime)}
                    </p>
                    <p className="text-muted">{formatTime(b.startTime)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
