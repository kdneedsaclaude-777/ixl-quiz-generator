import Link from "next/link";
import { redirect } from "next/navigation";
import RoleNav from "@/components/layouts/RoleNav";
import { loadImpersonatedUser } from "@/lib/impersonation";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import { isMaintenanceModeOn } from "@/lib/maintenance";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  // Admins viewing /parent/* via impersonation still come through here; we
  // want them to keep working during maintenance, so let impersonated
  // sessions bypass the gate.
  const impersonated = await loadImpersonatedUser();
  if (!impersonated && (await isMaintenanceModeOn())) {
    redirect("/maintenance");
  }
  return (
    <section>
      {impersonated && <ImpersonationBanner targetName={impersonated.name} />}
      <RoleNav
        tone="light"
        items={[
          { href: "/parent/dashboard", label: "Dashboard" },
          { href: "/parent/children", label: "Children" },
          { href: "/parent/settings/notifications", label: "Notifications" },
          { href: "/parent/settings/account", label: "Account" },
        ]}
        trailing={
          <Link
            href="/auth/logout"
            className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Log out
          </Link>
        }
      />
      {children}
    </section>
  );
}
