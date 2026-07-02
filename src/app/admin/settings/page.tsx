import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import FeatureFlagsTable, { type FlagRow } from "./FeatureFlagsTable";
import AppSettingsForm from "./AppSettingsForm";

export const metadata = { title: "Admin settings" };

// Platform-wide totals for the stats card. Read-only — admins glance at this
// to see overall scale + recent activity at a glance.
async function loadPlatformStats() {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [parents, tutors, orgAdmins, superAdmins, students, quizzes, completed, quizzes24h, badges, orgs] =
    await Promise.all([
      prisma.user.count({ where: { role: "parent", deletedAt: null } }),
      prisma.user.count({ where: { role: "tutor", deletedAt: null } }),
      prisma.user.count({ where: { role: "orgadmin", deletedAt: null } }),
      prisma.user.count({ where: { role: "superadmin", deletedAt: null } }),
      prisma.student.count(),
      prisma.quiz.count(),
      prisma.quiz.count({ where: { status: "completed" } }),
      prisma.quiz.count({ where: { createdAt: { gte: since24h } } }),
      prisma.studentBadge.count(),
      prisma.organization.count(),
    ]);
  return { parents, tutors, orgAdmins, superAdmins, students, quizzes, completed, quizzes24h, badges, orgs };
}

export default async function AdminSettingsPage() {
  const _admin = await requireAdminSession();
  if (_admin.role !== "superadmin") redirect("/admin/dashboard");

  const [flags, stats] = await Promise.all([
    prisma.featureFlag.findMany({ orderBy: { key: "asc" } }),
    loadPlatformStats(),
  ]);
  const audits = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { actor: { select: { name: true, email: true } } },
  });

  const appName = flags.find((f) => f.key === "app_name");
  const appTagline = flags.find((f) => f.key === "app_tagline");
  const maintenance = flags.find((f) => f.key === "maintenance_mode");

  // Show all non-name/tagline/maintenance flags as toggle rows.
  const togglableFlags: FlagRow[] = flags
    .filter((f) => !["app_name", "app_tagline"].includes(f.key))
    .map((f) => ({ key: f.key, enabled: f.enabled, description: describeFlag(f.key) }));

  return (
    <main className="space-y-8">
      <header>
        <h1 className="font-display text-4xl leading-tight tracking-tight text-slate-900 dark:text-slate-100">System settings</h1>
      </header>

      <section className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <h2 className="font-semibold text-slate-100">Platform at a glance</h2>
        <p className="mt-1 text-sm text-slate-400">Live counts across the whole platform.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatTile label="Organizations" value={stats.orgs} />
          <StatTile label="Parents" value={stats.parents} />
          <StatTile label="Tutors" value={stats.tutors} />
          <StatTile label="Students" value={stats.students} />
          <StatTile label="Badges earned" value={stats.badges} />
          <StatTile label="Quizzes (total)" value={stats.quizzes} />
          <StatTile label="Completed" value={stats.completed} />
          <StatTile label="Last 24h" value={stats.quizzes24h} accent />
          <StatTile label="Org admins" value={stats.orgAdmins} />
          <StatTile label="Super admins" value={stats.superAdmins} />
        </div>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <h2 className="font-semibold text-slate-100">Application</h2>
        <p className="mt-1 text-sm text-slate-400">App name and tagline shown across the public surface.</p>
        <AppSettingsForm
          initial={{
            appName: appName?.value ?? "QuizSpark",
            appTagline: appTagline?.value ?? "",
          }}
        />
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <h2 className="font-semibold text-slate-100">Maintenance mode</h2>
        <p className="mt-1 text-sm text-slate-400">
          When ON, non-admin users see a maintenance page. Admin routes (<code className="font-mono text-slate-200">/admin/*</code>) remain accessible.
        </p>
        <FeatureFlagsTable
          rows={[{ key: "maintenance_mode", enabled: maintenance?.enabled ?? false, description: describeFlag("maintenance_mode") }]}
          danger
        />
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <h2 className="font-semibold text-slate-100">Feature flags</h2>
        <p className="mt-1 text-sm text-slate-400">Quick on/off switches for individual product features.</p>
        <FeatureFlagsTable rows={togglableFlags.filter((f) => f.key !== "maintenance_mode")} />
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <h2 className="font-semibold text-slate-100">Email (SMTP)</h2>
        <p className="mt-1 text-sm text-slate-400">SMTP credentials live in <code className="font-mono text-slate-200">.env</code> and aren't edited here.</p>
        <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <SmtpRow
            label="Provider"
            value={
              ["smtp", "gmail"].includes((process.env.EMAIL_PROVIDER ?? "").toLowerCase())
                ? process.env.SMTP_HOST
                  ? `SMTP · ${process.env.SMTP_HOST}`
                  : "SMTP (not configured)"
                : process.env.RESEND_API_KEY
                  ? "Resend"
                  : process.env.SMTP_HOST
                    ? `SMTP · ${process.env.SMTP_HOST}`
                    : "Ethereal (dev fallback)"
            }
          />
          <SmtpRow label="From" value={process.env.EMAIL_FROM ?? process.env.SMTP_USER ?? "(unset)"} />
          <SmtpRow label="NEXTAUTH_URL" value={process.env.NEXTAUTH_URL ?? "(unset)"} />
        </dl>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <h2 className="font-semibold text-slate-100">Database (scale check)</h2>
        <p className="mt-1 text-sm text-slate-400">
          For high concurrency the app must use Supabase&apos;s <strong>connection pooler</strong> (port 6543).
          No secrets are shown here — only the host and connection type.
        </p>
        <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <SmtpRow
            label="Connection"
            value={(() => {
              const raw = process.env.DATABASE_URL ?? "";
              if (!raw) return "(not set)";
              if (raw.startsWith("file:")) return "SQLite (local dev)";
              try {
                const u = new URL(raw);
                const pooled =
                  u.hostname.includes("pooler") || u.port === "6543" || raw.includes("pgbouncer=true");
                return `${pooled ? "Pooled ✓" : "DIRECT ⚠ — switch to the pooler"} · ${u.hostname}:${u.port || "5432"}`;
              } catch {
                return "(unparseable)";
              }
            })()}
          />
          <SmtpRow
            label="DIRECT_URL (migrations)"
            value={process.env.DIRECT_URL ? "set ✓" : "not set ⚠ — needed for deploy migrations"}
          />
        </dl>
      </section>

      <section className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <h2 className="font-semibold text-slate-100">Audit log</h2>
        <p className="mt-1 text-sm text-slate-400">Last 50 admin actions, newest first.</p>
        <ul className="mt-3 divide-y divide-slate-700 text-xs">
          {audits.length === 0 && <li className="py-2 text-slate-500">No admin actions yet.</li>}
          {audits.map((a) => (
            <li key={a.id} className="flex flex-col gap-1 py-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-slate-300">
                <span className="font-mono text-indigo-300">{a.action}</span>{" "}
                on <span className="font-mono text-slate-400">{a.targetType}#{a.targetId}</span>
              </span>
              <span className="text-slate-400">
                by {a.actor.name} <span className="text-slate-500">({a.actor.email})</span> · {a.createdAt.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function SmtpRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-700 px-3 py-2">
      <dt className="text-[11px] uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 font-mono text-xs text-slate-100">{value}</dd>
    </div>
  );
}

function describeFlag(key: string): string {
  const map: Record<string, string> = {
    gamification: "Award XP + badges on quiz submit",
    leaderboard: "Weekly XP leaderboard (family + tutor cohort)",
    timer: "Allow per-question countdown timer",
    dark_mode: "Allow users to toggle dark theme",
    diagnostic_quiz: "Show 3-question diagnostic in onboarding",
    maintenance_mode: "Show maintenance page to non-admins",
  };
  return map[key] ?? "—";
}

function StatTile({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div
      className={`rounded-lg border p-3 text-center ${
        accent
          ? "border-indigo-600/60 bg-indigo-950/40"
          : "border-slate-700 bg-slate-900/40"
      }`}
    >
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${accent ? "text-indigo-200" : "text-slate-100"}`}>
        {value}
      </div>
    </div>
  );
}
