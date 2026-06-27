import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import RoleNav from "@/components/layouts/RoleNav";
import StudentTabBar from "@/components/child/StudentTabBar";
import { exitChildMode } from "./actions";
import { isMaintenanceModeOn } from "@/lib/maintenance";
import { loadImpersonatedUser } from "@/lib/impersonation";

// Child panel keeps a fixed light, colorful theme (dark mode intentionally
// excluded for children). Nav adapts to who's viewing:
//  - a student logged into their own account → just "Log out"
//  - a parent who picked a child → "Switch profile" + "Back to parent"
export default async function ChildLayout({ children }: { children: React.ReactNode }) {
  const impersonated = await loadImpersonatedUser();
  if (!impersonated && (await isMaintenanceModeOn())) {
    redirect("/maintenance");
  }
  const session = await getServerSession(authOptions);
  const isStudent = session?.user?.role === "student";

  // Students get the clean design: content + the floating bottom tab bar, no
  // top chrome (Log out lives on the "Me" tab). A parent who picked a child
  // keeps a slim top bar to switch profile / return to the parent app — that
  // is a context exit, not in-app back navigation.
  return (
    <section>
      {!isStudent && (
        <RoleNav
          tone="warm"
          items={[
            { href: "/child/home", label: "🏠 Home" },
            { href: "/child/select", label: "🧑‍🎓 Switch profile" },
          ]}
          trailing={
            <form action={exitChildMode}>
              <button
                type="submit"
                className="rounded-md px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100"
              >
                ← Back to parent
              </button>
            </form>
          }
        />
      )}
      <div className="pb-28">{children}</div>
      <StudentTabBar />
    </section>
  );
}
