import Link from "next/link";
import { redirect } from "next/navigation";
import RoleNav from "@/components/layouts/RoleNav";
import { isMaintenanceModeOn } from "@/lib/maintenance";

export default async function TutorLayout({ children }: { children: React.ReactNode }) {
  if (await isMaintenanceModeOn()) redirect("/maintenance");
  return (
    <section>
      <RoleNav
        tone="light"
        items={[
          { href: "/tutor/dashboard", label: "Dashboard" },
          { href: "/tutor/students", label: "My students" },
          { href: "/live/host", label: "🎮 Live quiz" },
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
