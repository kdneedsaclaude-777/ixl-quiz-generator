import Link from "next/link";
import { redirect } from "next/navigation";
import SidebarShell, { type ShellNavItem } from "@/components/layouts/SidebarShell";
import { isMaintenanceModeOn } from "@/lib/maintenance";

const items: ShellNavItem[] = [
  { href: "/tutor/dashboard", icon: "home", label: "Dashboard" },
  { href: "/tutor/students", icon: "users", label: "My students" },
  { href: "/live/host", icon: "play", label: "Live quiz" },
];

export default async function TutorLayout({ children }: { children: React.ReactNode }) {
  if (await isMaintenanceModeOn()) redirect("/maintenance");
  return (
    <SidebarShell
      tone="light"
      accent="mint"
      eyebrow="TUTOR"
      items={items}
      trailing={
        <Link
          href="/auth/logout"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
        >
          Log out
        </Link>
      }
    >
      {children}
    </SidebarShell>
  );
}
