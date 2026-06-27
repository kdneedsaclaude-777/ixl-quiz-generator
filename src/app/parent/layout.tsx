import Link from "next/link";
import { redirect } from "next/navigation";
import SidebarShell from "@/components/layouts/SidebarShell";
import { loadImpersonatedUser } from "@/lib/impersonation";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import { isMaintenanceModeOn } from "@/lib/maintenance";
import { billingEnabled } from "@/lib/plan";
import CMIcon from "@/components/CMIcon";

// Parent app — left-sidebar shell from the design bundle (parent.jsx):
// white sidebar, steel-blue active pills, Logout pinned at the foot.
export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const impersonated = await loadImpersonatedUser();
  if (!impersonated && (await isMaintenanceModeOn())) {
    redirect("/maintenance");
  }
  return (
    <>
      {impersonated && <ImpersonationBanner targetName={impersonated.name} />}
      <SidebarShell
        tone="light"
        items={[
          { href: "/parent/dashboard", icon: "home", label: "Dashboard" },
          { href: "/parent/children", icon: "users", label: "Children" },
          // Upgrade entry hidden while billing is off (free build).
          ...(billingEnabled() ? [{ href: "/parent/upgrade", icon: "spark", label: "QuizSpark Plus" }] : []),
          { href: "/parent/notifications", icon: "bell", label: "Notifications" },
          { href: "/parent/settings/account", icon: "settings", label: "Account" },
        ]}
        topActions={
          <Link
            href="/parent/notifications"
            aria-label="Notifications"
            className="grid h-9 w-9 place-items-center rounded-full text-slate-600 transition-colors hover:bg-slate-100"
          >
            <CMIcon name="bell" size={18} color="currentColor" />
          </Link>
        }
        trailing={
          <Link
            href="/auth/logout"
            className="block rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Log out
          </Link>
        }
      >
        {children}
      </SidebarShell>
    </>
  );
}
