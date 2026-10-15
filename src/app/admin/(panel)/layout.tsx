import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getSettings } from "@/lib/availability";
import { Wordmark } from "@/components/site/SiteHeader";
import { AdminNav } from "@/components/admin/AdminNav";
import { logoutAction } from "@/app/admin/login/actions";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  const settings = await getSettings();

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-4">
            <Wordmark name={settings.businessName} />
            <form action={logoutAction} className="lg:hidden">
              <button className="text-sm text-muted hover:text-brand">
                Log out
              </button>
            </form>
          </div>
          <div className="flex items-center gap-4">
            <AdminNav />
            <div className="hidden items-center gap-3 lg:flex">
              <span className="text-xs text-muted">{session.email}</span>
              <form action={logoutAction}>
                <button className="rounded-full border border-border px-4 py-2 text-sm text-muted transition hover:border-brand hover:text-brand">
                  Log out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">{children}</main>
    </div>
  );
}
