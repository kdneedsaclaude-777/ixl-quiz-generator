import { prisma } from "@/lib/db";
import { requireParentSession } from "@/lib/auth/server";
import NotificationsForm from "./NotificationsForm";

export const metadata = { title: "Notification settings" };

export default async function NotificationsPage() {
  const parent = await requireParentSession();
  const settings = await prisma.notificationSettings.upsert({
    where: { userId: parent.userId },
    update: {},
    create: { userId: parent.userId },
  });

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Notifications</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Control what we email you about each child's practice.
        </p>
      </header>
      <NotificationsForm
        initial={{
          emailEveryQuiz: settings.emailEveryQuiz,
          weeklyDigest: settings.weeklyDigest,
          alertBelowScorePct: settings.alertBelowScorePct ?? 60,
          alertNoPracticeDays: settings.alertNoPracticeDays ?? 7,
        }}
      />
    </main>
  );
}
