import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/availability";
import { Wordmark } from "@/components/site/SiteHeader";
import { BookingWizard } from "@/components/booking/BookingWizard";

export const metadata = { title: "Book an Appointment" };

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const { service: preselect } = await searchParams;

  const [settings, services, rules] = await Promise.all([
    getSettings(),
    prisma.service.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        durationMinutes: true,
        priceCents: true,
      },
    }),
    prisma.availabilityRule.findMany({
      where: { active: true },
      select: { dayOfWeek: true },
    }),
  ]);

  const openWeekdays = Array.from(new Set(rules.map((r) => r.dayOfWeek)));

  return (
    <main className="plum-gradient min-h-screen text-paper">
      <div className="mx-auto max-w-3xl px-5 py-7 sm:px-8">
        <div className="flex items-center justify-between">
          <Wordmark name={settings.businessName} dark />
          <Link
            href="/"
            className="text-sm text-paper/70 transition hover:text-paper"
          >
            ← Home
          </Link>
        </div>

        <div className="mt-8 animate-fade-up">
          <BookingWizard
            services={services}
            openWeekdays={openWeekdays}
            maxDaysOut={settings.maxDaysOut}
            preselectServiceId={preselect ?? null}
          />
        </div>
      </div>
    </main>
  );
}
