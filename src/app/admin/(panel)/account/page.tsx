import { getAdminUser } from "@/lib/admin";
import { AccountForms } from "@/components/admin/AccountForms";

export const metadata = { title: "Account · Admin" };

export default async function AccountPage() {
  const admin = await getAdminUser();

  return (
    <div>
      <h1 className="font-display text-3xl text-ink">Account</h1>
      <p className="mt-1 text-muted">Change your login email and password.</p>
      <div className="mt-6">
        <AccountForms currentEmail={admin.email} />
      </div>
    </div>
  );
}
