import { redirect } from "next/navigation";

// Belt-and-suspenders: any stale link or bookmark targeting /parent/notifications
// lands on the real settings page instead of a 404.
export default function NotificationsRedirect() {
  redirect("/parent/settings/notifications");
}
