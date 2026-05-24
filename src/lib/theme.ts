import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Returns "dark" for the <html> className when the logged-in user has
// User.darkMode === true. For anonymous users returns null and lets the
// ThemeBootstrap inline script fall back to localStorage / prefers-color-scheme.
export async function getServerThemeClass(): Promise<"dark" | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { darkMode: true },
  });
  return user?.darkMode ? "dark" : null;
}
