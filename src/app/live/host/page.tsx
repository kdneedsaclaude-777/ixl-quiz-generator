import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import HostConsole from "./HostConsole";

export const metadata = { title: "Host a Live Quiz" };

export default async function LiveHostPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login?from=/live/host");
  return <HostConsole isSuperadmin={session.user.role === "superadmin"} />;
}
