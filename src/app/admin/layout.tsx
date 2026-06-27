import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SidebarShell, { type ShellNavItem } from "@/components/layouts/SidebarShell";
import { billingEnabled } from "@/lib/plan";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Content / Analytics / Settings are super-admin only — hide them from
  // org-admins so the nav doesn't promise pages they'll just get bounced from.
  const session = await getServerSession(authOptions);
  const isSuperadmin = session?.user?.role === "superadmin";

  const items: ShellNavItem[] = [
    { href: "/admin/dashboard", icon: "home", label: "Dashboard" },
    { href: "/admin/users", icon: "users", label: "Users" },
    { href: "/admin/students", icon: "user", label: "Students" },
    { href: "/admin/quizzes", icon: "file", label: "Quizzes" },
    ...(isSuperadmin
      ? [
          { href: "/admin/content", icon: "layers", label: "Content" },
          { href: "/admin/import", icon: "download", label: "Import" },
          // Billing hidden while billing is off (free build).
          ...(billingEnabled() ? [{ href: "/admin/billing", icon: "card", label: "Billing" }] : []),
          { href: "/admin/analytics", icon: "chart", label: "Analytics" },
          { href: "/admin/settings", icon: "settings", label: "Settings" },
        ]
      : []),
    { href: "/live/host", icon: "play", label: "Live quiz" },
  ];

  return (
    <SidebarShell
      tone="dark"
      eyebrow={isSuperadmin ? "SUPER ADMIN" : "ADMIN"}
      items={items}
      trailing={
        <Link
          href="/auth/logout"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 hover:text-white"
        >
          Log out
        </Link>
      }
    >
      {children}
    </SidebarShell>
  );
}
