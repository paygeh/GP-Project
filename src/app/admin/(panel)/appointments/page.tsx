import Link from "next/link";
import { prisma } from "@/lib/db";
import { updateBookingStatusAction } from "@/app/admin/actions";
import { formatDateLong, formatTime, formatPrice } from "@/lib/format";

export const metadata = { title: "Appointments · Admin" };

type Filter = "upcoming" | "past" | "cancelled" | "all";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "cancelled", label: "Cancelled" },
  { key: "all", label: "All" },
];

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: raw } = await searchParams;
  const filter: Filter = (
    ["upcoming", "past", "cancelled", "all"].includes(raw ?? "")
      ? raw
      : "upcoming"
  ) as Filter;

  const now = new Date();
  const where =
    filter === "upcoming"
      ? { status: { not: "CANCELLED" }, startTime: { gte: now } }
      : filter === "past"
        ? { status: { not: "CANCELLED" }, startTime: { lt: now } }
        : filter === "cancelled"
          ? { status: "CANCELLED" }
          : {};

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { startTime: filter === "past" ? "desc" : "asc" },
    include: { service: true },
    take: 200,
  });

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Appointments</h1>

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/appointments?filter=${f.key}`}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              filter === f.key
                ? "bg-brand text-white"
                : "border border-border text-muted hover:border-brand hover:text-brand"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-[var(--radius-card)] border border-border bg-card">
        {bookings.length === 0 ? (
          <p className="p-10 text-center text-muted">No appointments here.</p>
        ) : (
          <ul className="divide-y divide-border">
            {bookings.map((b) => {
              const cancelled = b.status === "CANCELLED";
              return (
                <li
                  key={b.id}
                  className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-ink">{b.customerName}</p>
                      {cancelled && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                          Cancelled
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted">
                      {b.service.name} · {formatPrice(b.service.priceCents)}
                    </p>
                    <p className="mt-0.5 text-sm text-muted">
                      {b.customerEmail} · {b.customerPhone}
                    </p>
                    {b.notes && (
                      <p className="mt-1 text-sm italic text-muted">
                        &ldquo;{b.notes}&rdquo;
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                    <div className="text-right">
                      <p className="font-medium text-ink">
                        {formatDateLong(b.startTime)}
                      </p>
                      <p className="text-sm text-brand">
                        {formatTime(b.startTime)} – {formatTime(b.endTime)}
                      </p>
                    </div>
                    <form action={updateBookingStatusAction}>
                      <input type="hidden" name="id" value={b.id} />
                      <input
                        type="hidden"
                        name="status"
                        value={cancelled ? "CONFIRMED" : "CANCELLED"}
                      />
                      <button
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                          cancelled
                            ? "border border-brand/30 text-brand hover:bg-brand hover:text-white"
                            : "border border-red-200 text-red-600 hover:bg-red-600 hover:text-white"
                        }`}
                      >
                        {cancelled ? "Reinstate" : "Cancel"}
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
