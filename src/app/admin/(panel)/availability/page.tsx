import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/availability";
import {
  saveDayHoursAction,
  addTimeOffAction,
  deleteTimeOffAction,
  updateSettingsAction,
} from "@/app/admin/actions";
import { DAY_NAMES, formatDateLong, formatTime } from "@/lib/format";

export const metadata = { title: "Availability · Admin" };

function minutesToHHMM(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
}

const field =
  "rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-brand";
const label = "text-xs font-medium text-muted";

export default async function AvailabilityPage() {
  const now = new Date();
  const [settings, rules, timeOff] = await Promise.all([
    getSettings(),
    prisma.availabilityRule.findMany(),
    prisma.timeOff.findMany({
      where: { end: { gte: now } },
      orderBy: { start: "asc" },
    }),
  ]);

  const ruleByDay = new Map(rules.map((r) => [r.dayOfWeek, r]));

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl text-ink">Availability</h1>

      {/* Weekly hours */}
      <section className="rounded-[var(--radius-card)] border border-border bg-card p-6">
        <h2 className="font-display text-xl text-ink">Weekly hours</h2>
        <p className="mt-1 text-sm text-muted">
          Set the hours you take appointments each day.
        </p>
        <div className="mt-5 space-y-2">
          {DAY_NAMES.map((name, day) => {
            const rule = ruleByDay.get(day);
            const open = Boolean(rule);
            return (
              <form
                key={day}
                action={saveDayHoursAction}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-4 py-3"
              >
                <input type="hidden" name="dayOfWeek" value={day} />
                <span className="w-24 font-medium text-ink">{name}</span>
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    name="open"
                    defaultChecked={open}
                    className="h-4 w-4 accent-[var(--color-brand)]"
                  />
                  Open
                </label>
                <label className="flex items-center gap-1.5 text-sm text-muted">
                  <span className={label}>From</span>
                  <input
                    type="time"
                    name="start"
                    step={900}
                    defaultValue={
                      rule ? minutesToHHMM(rule.startMinutes) : "09:00"
                    }
                    className={field}
                  />
                </label>
                <label className="flex items-center gap-1.5 text-sm text-muted">
                  <span className={label}>To</span>
                  <input
                    type="time"
                    name="end"
                    step={900}
                    defaultValue={rule ? minutesToHHMM(rule.endMinutes) : "17:00"}
                    className={field}
                  />
                </label>
                <button className="ml-auto rounded-full border border-brand/30 px-4 py-1.5 text-sm font-medium text-brand transition hover:bg-brand hover:text-white">
                  Save
                </button>
              </form>
            );
          })}
        </div>
      </section>

      {/* Time off */}
      <section className="rounded-[var(--radius-card)] border border-border bg-card p-6">
        <h2 className="font-display text-xl text-ink">Time off</h2>
        <p className="mt-1 text-sm text-muted">
          Block vacations, breaks, or personal time. These never show as open.
        </p>

        <form
          action={addTimeOffAction}
          className="mt-5 flex flex-wrap items-end gap-3"
        >
          <label className="flex flex-col gap-1">
            <span className={label}>Start</span>
            <input type="datetime-local" name="start" required className={field} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={label}>End</span>
            <input type="datetime-local" name="end" required className={field} />
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className={label}>Reason (optional)</span>
            <input name="reason" placeholder="Vacation" className={field} />
          </label>
          <button className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700">
            Add
          </button>
        </form>

        <ul className="mt-5 divide-y divide-border">
          {timeOff.length === 0 ? (
            <li className="py-4 text-sm text-muted">No upcoming time off.</li>
          ) : (
            timeOff.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div className="text-sm">
                  <p className="font-medium text-ink">
                    {formatDateLong(t.start)} · {formatTime(t.start)} –{" "}
                    {formatTime(t.end)}
                  </p>
                  {t.reason && <p className="text-muted">{t.reason}</p>}
                </div>
                <form action={deleteTimeOffAction}>
                  <input type="hidden" name="id" value={t.id} />
                  <button className="rounded-full border border-red-200 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-600 hover:text-white">
                    Remove
                  </button>
                </form>
              </li>
            ))
          )}
        </ul>
      </section>

      {/* Booking settings */}
      <section className="rounded-[var(--radius-card)] border border-border bg-card p-6">
        <h2 className="font-display text-xl text-ink">Booking settings</h2>
        <form
          action={updateSettingsAction}
          className="mt-5 grid gap-4 sm:grid-cols-2"
        >
          <label className="sm:col-span-2 flex flex-col gap-1">
            <span className={label}>Business name</span>
            <input
              name="businessName"
              required
              defaultValue={settings.businessName}
              className={field}
            />
          </label>
          <label className="sm:col-span-2 flex flex-col gap-1">
            <span className={label}>Tagline</span>
            <input
              name="tagline"
              defaultValue={settings.tagline}
              className={field}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={label}>Slot interval (minutes)</span>
            <input
              name="slotIntervalMins"
              type="number"
              min="5"
              max="120"
              step="5"
              defaultValue={settings.slotIntervalMins}
              className={field}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={label}>Lead time (minutes)</span>
            <input
              name="leadTimeMins"
              type="number"
              min="0"
              defaultValue={settings.leadTimeMins}
              className={field}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={label}>How far ahead bookable (days)</span>
            <input
              name="maxDaysOut"
              type="number"
              min="1"
              max="365"
              defaultValue={settings.maxDaysOut}
              className={field}
            />
          </label>
          <div className="sm:col-span-2">
            <button className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700">
              Save settings
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
