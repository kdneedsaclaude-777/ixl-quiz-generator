import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import RoleNav from "@/components/layouts/RoleNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Content / Analytics / Settings are super-admin only — hide them from
  // org-admins so the nav doesn't promise pages they'll just get bounced from.
  const session = await getServerSession(authOptions);
  const isSuperadmin = session?.user?.role === "superadmin";

  const items = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/students", label: "Students" },
    ...(isSuperadmin
      ? [
          { href: "/admin/content", label: "Content" },
          { href: "/admin/analytics", label: "Analytics" },
          { href: "/admin/settings", label: "Settings" },
        ]
      : []),
    { href: "/live/host", label: "🎮 Live quiz" },
  ];

  return (
    <section>
      <RoleNav
        tone="dark"
        items={items}
        trailing={
          <Link
            href="/auth/logout"
            className="rounded-md px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Log out
          </Link>
        }
      />
      {children}
    </section>
  );
}
