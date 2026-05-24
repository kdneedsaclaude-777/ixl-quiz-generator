import { prisma } from "@/lib/db";
import { requireParentSession } from "@/lib/auth/server";
import ProfileForm from "./ProfileForm";
import PasswordForm from "./PasswordForm";
import DeleteAccountForm from "./DeleteAccountForm";
import PhoneForm from "./PhoneForm";

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
    },
  });
  if (!user) return null;

  return (
    <main className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Account</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Manage your name, email, and password.
        </p>
      </header>

      <section>
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">Profile</h2>
        <ProfileForm initial={{ name: user.name, email: user.email, emailVerified: Boolean(user.emailVerified) }} />
      </section>

      <section>
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">Phone (optional)</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Add a verified phone number as a second contact channel.
        </p>
        <PhoneForm
          initialPhone={user.phone}
          initialVerified={Boolean(user.phoneVerified)}
        />
      </section>

      <section>
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">Password</h2>
        <PasswordForm />
      </section>

      <section>
        <h2 className="font-semibold text-rose-700 dark:text-rose-400">Danger zone</h2>
        <DeleteAccountForm />
      </section>
    </main>
  );
}
