// Single source of truth for the student app's four root tabs. Both the
// floating StudentTabBar and the "is this a root screen?" check import from
// here so navigation and the back-control rule can never drift apart.
//
// Rule: a back/exit affordance renders ONLY on non-root child screens (the
// quiz/test runners and results). Root tabs rely on the bottom tab bar for
// lateral navigation — they must never show a back chevron.

export type ChildTab = { href: string; icon: string; label: string };

export const CHILD_TABS: ChildTab[] = [
  { href: "/child/home", icon: "home", label: "Home" },
  { href: "/child/progress", icon: "chart", label: "Progress" },
  { href: "/child/badges", icon: "trophy", label: "Badges" },
  { href: "/child/account", icon: "user", label: "Me" },
];

export const CHILD_ROOT_PATHS: ReadonlySet<string> = new Set(CHILD_TABS.map((t) => t.href));

export function isChildRoot(pathname: string): boolean {
  return CHILD_ROOT_PATHS.has(pathname);
}

// Screens that should suppress the floating tab bar entirely (focused task
// flows where lateral navigation would let a kid wander mid-quiz).
export function hidesChildTabBar(pathname: string): boolean {
  return (
    pathname.startsWith("/child/quiz/") ||
    pathname.startsWith("/child/test/") ||
    pathname === "/child/select"
  );
}
