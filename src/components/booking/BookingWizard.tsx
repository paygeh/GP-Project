"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { getSlotsAction, createBookingAction } from "@/app/book/actions";
import {
  formatPrice,
  formatDuration,
  formatDateLong,
  formatTime,
  toDateKey,
  DAY_NAMES,
} from "@/lib/format";
import { serviceIcon, ClockIcon, CheckIcon } from "@/components/icons";

type Service = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
};

type Props = {
  services: Service[];
  openWeekdays: number[];
  maxDaysOut: number;
  preselectServiceId: string | null;
};

const STEPS = ["Service", "Date", "Time", "Details", "Confirm"] as const;

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function BookingWizard({
  services,
  openWeekdays,
  maxDaysOut,
  preselectServiceId,
}: Props) {
  const router = useRouter();
  const preselected =
    services.find((s) => s.id === preselectServiceId) ?? null;

  const [step, setStep] = useState(preselected ? 1 : 0);
  const [service, setService] = useState<Service | null>(preselected);
  const [date, setDate] = useState<Date | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [details, setDetails] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    notes: "",
  });

  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Load slots whenever a service + date are chosen.
  useEffect(() => {
    if (!service || !date) return;
    let cancelled = false;
    setLoadingSlots(true);
    setSlots([]);
    getSlotsAction(service.id, toDateKey(date))
      .then((res) => {
        if (!cancelled) setSlots(res.slots);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [service, date]);

  function goTo(n: number) {
    setError(null);
    setStep(n);
  }

  function chooseService(s: Service) {
    setService(s);
    setSlot(null);
    setDate(null);
    goTo(1);
  }

  function chooseDate(d: Date) {
    setDate(d);
    setSlot(null);
    goTo(2);
  }

  function chooseSlot(iso: string) {
    setSlot(iso);
    goTo(3);
  }

  function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    if (
      !details.customerName.trim() ||
      !details.customerEmail.trim() ||
      !details.customerPhone.trim()
    ) {
      setError("Please fill in your name, email, and phone.");
      return;
    }
    goTo(4);
  }

  function confirm() {
    if (!service || !slot) return;
    setError(null);
    startTransition(async () => {
      const res = await createBookingAction({
        serviceId: service.id,
        startTime: slot,
        ...details,
      });
      if (res.ok) {
        router.push(`/book/confirmation?id=${res.id}`);
      } else {
        setError(res.error);
        // If the slot was taken, send them back to re-pick a time.
        if (/booked|taken|available/i.test(res.error)) {
          setSlot(null);
          setStep(2);
        }
      }
    });
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-white/10 bg-plum-800/70 p-6 shadow-2xl backdrop-blur sm:p-8">
      <Stepper step={step} />

      {error && (
        <div className="mt-6 rounded-lg border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      <div className="mt-7">
        {step === 0 && (
          <ServiceStep services={services} onChoose={chooseService} />
        )}

        {step === 1 && (
          <DateStep
            openWeekdays={openWeekdays}
            maxDaysOut={maxDaysOut}
            selected={date}
            onChoose={chooseDate}
            onBack={() => goTo(0)}
          />
        )}

        {step === 2 && (
          <TimeStep
            date={date}
            slots={slots}
            loading={loadingSlots}
            onChoose={chooseSlot}
            onBack={() => goTo(1)}
          />
        )}

        {step === 3 && (
          <DetailsStep
            details={details}
            setDetails={setDetails}
            onSubmit={submitDetails}
            onBack={() => goTo(2)}
          />
        )}

        {step === 4 && service && date && slot && (
          <ReviewStep
            service={service}
            slot={slot}
            details={details}
            pending={isPending}
            onConfirm={confirm}
            onBack={() => goTo(3)}
          />
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── Stepper ───────────────────────── */
function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-1.5">
      {STEPS.map((label, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <li key={label} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full items-center">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition ${
                  active
                    ? "bg-gold text-plum"
                    : done
                      ? "bg-gold/30 text-gold"
                      : "bg-white/10 text-paper/50"
                }`}
              >
                {done ? <CheckIcon className="h-3.5 w-3.5" /> : i + 1}
              </span>
              {i < STEPS.length - 1 && (
                <span
                  className={`h-px flex-1 ${done ? "bg-gold/40" : "bg-white/10"}`}
                />
              )}
            </div>
            <span
              className={`hidden text-[11px] tracking-wide sm:block ${
                active ? "text-gold" : "text-paper/50"
              }`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function StepHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-6">
      <p className="eyebrow text-gold">{eyebrow}</p>
      <h2 className="mt-2 font-display text-2xl text-paper sm:text-3xl">
        {title}
      </h2>
    </div>
  );
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="text-sm text-paper/60 transition hover:text-paper"
    >
      ← Back
    </button>
  );
}

/* ───────────────────────── Step 0: Service ───────────────────────── */
function ServiceStep({
  services,
  onChoose,
}: {
  services: Service[];
  onChoose: (s: Service) => void;
}) {
  return (
    <div className="animate-fade-in">
      <StepHeader eyebrow="Step 1" title="Choose a service" />
      <div className="grid gap-3">
        {services.map((s, i) => {
          const Icon = serviceIcon(i);
          return (
            <button
              key={s.id}
              onClick={() => onChoose(s)}
              className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-gold/60 hover:bg-white/[0.06]"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-lilac/15 text-lilac transition group-hover:bg-gold/20 group-hover:text-gold">
                <Icon className="h-6 w-6" />
              </span>
              <span className="flex-1">
                <span className="block font-display text-lg text-paper">
                  {s.name}
                </span>
                <span className="mt-0.5 flex items-center gap-2 text-xs text-paper/60">
                  <ClockIcon className="h-3.5 w-3.5" />
                  {formatDuration(s.durationMinutes)}
                </span>
              </span>
              <span className="font-serif text-lg font-semibold text-gold">
                {formatPrice(s.priceCents)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────── Step 1: Date ───────────────────────── */
function DateStep({
  openWeekdays,
  maxDaysOut,
  selected,
  onChoose,
  onBack,
}: {
  openWeekdays: number[];
  maxDaysOut: number;
  selected: Date | null;
  onChoose: (d: Date) => void;
  onBack: () => void;
}) {
  const today = startOfToday();
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + maxDaysOut);

  const [view, setView] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const canPrev =
    new Date(year, month, 1) > new Date(today.getFullYear(), today.getMonth(), 1);
  const canNext = new Date(year, month + 1, 1) <= maxDate;

  function isDisabled(d: Date) {
    return d < today || d > maxDate || !openWeekdays.includes(d.getDay());
  }

  return (
    <div className="animate-fade-in">
      <StepHeader eyebrow="Step 2" title="Pick a date" />
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            disabled={!canPrev}
            onClick={() => setView(new Date(year, month - 1, 1))}
            className="rounded-full px-3 py-1 text-paper/70 transition enabled:hover:bg-white/10 disabled:opacity-30"
          >
            ←
          </button>
          <span className="font-display text-lg text-paper">
            {view.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </span>
          <button
            type="button"
            disabled={!canNext}
            onClick={() => setView(new Date(year, month + 1, 1))}
            className="rounded-full px-3 py-1 text-paper/70 transition enabled:hover:bg-white/10 disabled:opacity-30"
          >
            →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-paper/40">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <span key={i} className="py-1">
              {d}
            </span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <span key={i} />;
            const disabled = isDisabled(d);
            const isSelected =
              selected && toDateKey(selected) === toDateKey(d);
            return (
              <button
                key={i}
                type="button"
                disabled={disabled}
                onClick={() => onChoose(d)}
                className={`aspect-square rounded-lg text-sm transition ${
                  isSelected
                    ? "bg-gold font-semibold text-plum"
                    : disabled
                      ? "text-paper/20"
                      : "text-paper hover:bg-white/10"
                }`}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-paper/40">
        Open: {openWeekdays.map((d) => DAY_NAMES[d].slice(0, 3)).join(" · ")}
      </p>
      <div className="mt-6">
        <BackButton onBack={onBack} />
      </div>
    </div>
  );
}

/* ───────────────────────── Step 2: Time ───────────────────────── */
function TimeStep({
  date,
  slots,
  loading,
  onChoose,
  onBack,
}: {
  date: Date | null;
  slots: string[];
  loading: boolean;
  onChoose: (iso: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="animate-fade-in">
      <StepHeader
        eyebrow="Step 3"
        title={date ? formatDateLong(date) : "Pick a time"}
      />
      {loading ? (
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-11 animate-pulse rounded-full bg-white/10"
            />
          ))}
        </div>
      ) : slots.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center text-paper/60">
          No openings on this day. Try another date.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
          {slots.map((iso) => (
            <button
              key={iso}
              type="button"
              onClick={() => onChoose(iso)}
              className="rounded-full border border-white/15 bg-white/[0.04] py-2.5 text-sm text-paper transition hover:border-gold hover:bg-gold hover:text-plum"
            >
              {formatTime(new Date(iso))}
            </button>
          ))}
        </div>
      )}
      <div className="mt-6">
        <BackButton onBack={onBack} />
      </div>
    </div>
  );
}

/* ───────────────────────── Step 3: Details ───────────────────────── */
function DetailsStep({
  details,
  setDetails,
  onSubmit,
  onBack,
}: {
  details: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    notes: string;
  };
  setDetails: React.Dispatch<React.SetStateAction<typeof details>>;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}) {
  const field =
    "w-full rounded-lg border border-white/15 bg-white/[0.04] px-4 py-3 text-paper placeholder:text-paper/40 outline-none transition focus:border-gold";
  return (
    <form onSubmit={onSubmit} className="animate-fade-in">
      <StepHeader eyebrow="Step 4" title="Your details" />
      <div className="grid gap-3">
        <input
          className={field}
          placeholder="Full name"
          value={details.customerName}
          onChange={(e) =>
            setDetails((d) => ({ ...d, customerName: e.target.value }))
          }
        />
        <input
          className={field}
          type="email"
          placeholder="Email address"
          value={details.customerEmail}
          onChange={(e) =>
            setDetails((d) => ({ ...d, customerEmail: e.target.value }))
          }
        />
        <input
          className={field}
          type="tel"
          placeholder="Phone number"
          value={details.customerPhone}
          onChange={(e) =>
            setDetails((d) => ({ ...d, customerPhone: e.target.value }))
          }
        />
        <textarea
          className={`${field} resize-none`}
          rows={3}
          placeholder="Anything we should know? (optional)"
          value={details.notes}
          onChange={(e) =>
            setDetails((d) => ({ ...d, notes: e.target.value }))
          }
        />
      </div>
      <div className="mt-6 flex items-center justify-between">
        <BackButton onBack={onBack} />
        <button
          type="submit"
          className="rounded-full bg-gold px-7 py-3 text-sm font-semibold text-plum transition hover:bg-gold-200"
        >
          Review booking
        </button>
      </div>
    </form>
  );
}

/* ───────────────────────── Step 4: Review ───────────────────────── */
function ReviewStep({
  service,
  slot,
  details,
  pending,
  onConfirm,
  onBack,
}: {
  service: Service;
  slot: string;
  details: { customerName: string; customerEmail: string; customerPhone: string; notes: string };
  pending: boolean;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const start = new Date(slot);
  const rows = [
    ["Service", service.name],
    ["Date", formatDateLong(start)],
    ["Time", formatTime(start)],
    ["Duration", formatDuration(service.durationMinutes)],
    ["Price", formatPrice(service.priceCents)],
    ["Name", details.customerName],
    ["Email", details.customerEmail],
    ["Phone", details.customerPhone],
  ];
  return (
    <div className="animate-fade-in">
      <StepHeader eyebrow="Step 5" title="Review & confirm" />
      <dl className="divide-y divide-white/10 rounded-xl border border-white/10 bg-white/[0.03] px-5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 py-3 text-sm">
            <dt className="text-paper/55">{k}</dt>
            <dd className="text-right font-medium text-paper">{v}</dd>
          </div>
        ))}
        {details.notes && (
          <div className="py-3 text-sm">
            <dt className="text-paper/55">Notes</dt>
            <dd className="mt-1 text-paper/90">{details.notes}</dd>
          </div>
        )}
      </dl>
      <div className="mt-6 flex items-center justify-between">
        <BackButton onBack={onBack} />
        <button
          type="button"
          disabled={pending}
          onClick={onConfirm}
          className="rounded-full bg-gold px-8 py-3.5 text-sm font-semibold text-plum transition hover:bg-gold-200 disabled:opacity-60"
        >
          {pending ? "Booking…" : "Confirm booking"}
        </button>
      </div>
    </div>
  );
}
