import Link from "next/link";
import { prisma } from "@/lib/db";
import { updateBookingStatusAction } from "@/app/admin/actions";
import { formatDateLong, formatTime, formatPrice } from "@/lib/format";

export const metadata = { title: "Requests · Admin" };

type Filter = "requests" | "upcoming" | "past" | "archived" | "all";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "requests", label: "Requests" },
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "archived", label: "Declined / Cancelled" },
  { key: "all", label: "All" },
];

const VALID: Filter[] = ["requests", "upcoming", "past", "archived", "all"];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING: { label: "Requested", cls: "bg-gold-soft text-brand" },
    CONFIRMED: { label: "Confirmed", cls: "bg-green-100 text-green-700" },
    DECLINED: { label: "Declined", cls: "bg-red-100 text-red-700" },
    CANCELLED: { label: "Cancelled", cls: "bg-lilac-soft text-muted" },
  };
  const s = map[status] ?? { label: status, cls: "bg-lilac-soft text-muted" };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
}

function StatusButton({
  id,
  status,
  children,
  variant,
}: {
  id: string;
  status: string;
  children: React.ReactNode;
  variant: "approve" | "decline" | "cancel" | "reinstate";
}) {
  const cls = {
    approve: "bg-brand text-white hover:bg-brand-700",
    decline: "border border-red-200 text-red-600 hover:bg-red-600 hover:text-white",
    cancel: "border border-red-200 text-red-600 hover:bg-red-600 hover:text-white",
    reinstate: "border border-brand/30 text-brand hover:bg-brand hover:text-white",
  }[variant];
  return (
    <form action={updateBookingStatusAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${cls}`}>
        {children}
      </button>
    </form>
  );
}

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: raw } = await searchParams;
  const filter: Filter = VALID.includes(raw as Filter)
    ? (raw as Filter)
    : "requests";

  const now = new Date();
  const where =
    filter === "requests"
      ? { status: "PENDING" }
      : filter === "upcoming"
        ? { status: "CONFIRMED", startTime: { gte: now } }
        : filter === "past"
          ? { status: "CONFIRMED", startTime: { lt: now } }
          : filter === "archived"
            ? { status: { in: ["DECLINED", "CANCELLED"] } }
            : {};

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { startTime: filter === "past" || filter === "archived" ? "desc" : "asc" },
    include: { service: true },
    take: 200,
  });

  const pendingCount = await prisma.booking.count({ where: { status: "PENDING" } });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl text-ink">Requests &amp; Appointments</h1>
        {pendingCount > 0 && (
          <span className="rounded-full bg-gold px-3 py-1 text-sm font-semibold text-plum">
            {pendingCount} awaiting review
          </span>
        )}
      </div>

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
          <p className="p-10 text-center text-muted">
            {filter === "requests"
              ? "No pending requests right now."
              : "Nothing here."}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {bookings.map((b) => (
              <li
                key={b.id}
                className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-ink">{b.customerName}</p>
                    <StatusBadge status={b.status} />
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
                    <p className="font-medium text-ink">{formatDateLong(b.startTime)}</p>
                    <p className="text-sm text-brand">
                      {formatTime(b.startTime)} – {formatTime(b.endTime)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {b.status === "PENDING" && (
                      <>
                        <StatusButton id={b.id} status="CONFIRMED" variant="approve">
                          Approve
                        </StatusButton>
                        <StatusButton id={b.id} status="DECLINED" variant="decline">
                          Decline
                        </StatusButton>
                      </>
                    )}
                    {b.status === "CONFIRMED" && (
                      <StatusButton id={b.id} status="CANCELLED" variant="cancel">
                        Cancel
                      </StatusButton>
                    )}
                    {(b.status === "DECLINED" || b.status === "CANCELLED") && (
                      <StatusButton id={b.id} status="CONFIRMED" variant="reinstate">
                        Reinstate
                      </StatusButton>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
