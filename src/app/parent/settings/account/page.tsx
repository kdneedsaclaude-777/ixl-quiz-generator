import { prisma } from "@/lib/db";
import { requireParentSession } from "@/lib/auth/server";
import ProfileForm from "./ProfileForm";
import PasswordForm from "./PasswordForm";
import DeleteAccountForm from "./DeleteAccountForm";
import PhoneForm from "./PhoneForm";
import ProfileLock from "./ProfileLock";

export const metadata = { title: "Account settings" };

export default async function AccountPage() {
  const parent = await requireParentSession();
  const user = await prisma.user.findUnique({
    where: { id: parent.userId },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      phone: true,
      phoneVerified: true,
      profileLockPin: true,
    },
  });
  if (!user) return null;

  return (
    <main className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-end justify-between gap-3 pt-1">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-cm-blue">Settings</div>
          <h1 className="font-display text-4xl leading-tight tracking-tight text-slate-900 dark:text-slate-100">Account</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Manage your name, email, and password.
          </p>
        </div>
      </header>

      <ProfileForm initial={{ name: user.name, email: user.email, emailVerified: Boolean(user.emailVerified) }} />

      <PhoneForm
        initialPhone={user.phone}
        initialVerified={Boolean(user.phoneVerified)}
      />

      <PasswordForm />

      <ProfileLock locked={Boolean(user.profileLockPin)} />

      <DeleteAccountForm />
    </main>
  );
}
