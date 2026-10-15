import { prisma } from "@/lib/db";
import {
  createServiceAction,
  updateServiceAction,
  deleteServiceAction,
  toggleServiceAction,
} from "@/app/admin/actions";
import { formatPrice, formatDuration } from "@/lib/format";

export const metadata = { title: "Services · Admin" };

const field =
  "w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink outline-none transition focus:border-brand";
const label = "text-xs font-medium text-muted";

function ServiceFields({
  service,
}: {
  service?: {
    name: string;
    description: string;
    priceCents: number;
    durationMinutes: number;
    sortOrder: number;
    active: boolean;
  };
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="sm:col-span-2">
        <span className={label}>Name</span>
        <input name="name" required defaultValue={service?.name} className={field} />
      </label>
      <label className="sm:col-span-2">
        <span className={label}>Description</span>
        <input
          name="description"
          defaultValue={service?.description}
          className={field}
        />
      </label>
      <label>
        <span className={label}>Price (USD)</span>
        <input
          name="price"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={service ? service.priceCents / 100 : ""}
          className={field}
        />
      </label>
      <label>
        <span className={label}>Duration (minutes)</span>
        <input
          name="durationMinutes"
          type="number"
          min="5"
          step="5"
          required
          defaultValue={service?.durationMinutes}
          className={field}
        />
      </label>
      <label>
        <span className={label}>Sort order</span>
        <input
          name="sortOrder"
          type="number"
          min="0"
          defaultValue={service?.sortOrder ?? 0}
          className={field}
        />
      </label>
      <label className="flex items-end gap-2 pb-2">
        <input
          name="active"
          type="checkbox"
          defaultChecked={service?.active ?? true}
          className="h-4 w-4 accent-[var(--color-brand)]"
        />
        <span className="text-sm text-ink">Bookable</span>
      </label>
    </div>
  );
}

export default async function ServicesPage() {
  const services = await prisma.service.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl text-ink">Services</h1>
      </div>

      {/* Add new */}
      <details className="group mt-6 rounded-[var(--radius-card)] border border-border bg-card p-5">
        <summary className="cursor-pointer list-none font-medium text-brand">
          + Add a service
        </summary>
        <form action={createServiceAction} className="mt-4">
          <ServiceFields />
          <button className="mt-4 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700">
            Add service
          </button>
        </form>
      </details>

      {/* List */}
      <div className="mt-6 space-y-3">
        {services.map((s) => (
          <details
            key={s.id}
            className="rounded-[var(--radius-card)] border border-border bg-card p-5"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
              <div>
                <p className="font-medium text-ink">
                  {s.name}
                  {!s.active && (
                    <span className="ml-2 rounded-full bg-lilac-soft px-2 py-0.5 text-[11px] font-semibold text-brand">
                      Hidden
                    </span>
                  )}
                </p>
                <p className="text-sm text-muted">
                  {formatDuration(s.durationMinutes)} · {formatPrice(s.priceCents)}
                </p>
              </div>
              <span className="text-sm text-muted group-open:hidden">Edit</span>
            </summary>

            <form action={updateServiceAction} className="mt-4">
              <input type="hidden" name="id" value={s.id} />
              <ServiceFields service={s} />
              <button className="mt-4 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700">
                Save changes
              </button>
            </form>

            <div className="mt-4 flex gap-3 border-t border-border pt-4">
              <form action={toggleServiceAction}>
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="active" value={(!s.active).toString()} />
                <button className="rounded-full border border-border px-4 py-1.5 text-sm text-muted transition hover:border-brand hover:text-brand">
                  {s.active ? "Hide from booking" : "Make bookable"}
                </button>
              </form>
              <form action={deleteServiceAction}>
                <input type="hidden" name="id" value={s.id} />
                <button className="rounded-full border border-red-200 px-4 py-1.5 text-sm text-red-600 transition hover:bg-red-600 hover:text-white">
                  Delete
                </button>
              </form>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
