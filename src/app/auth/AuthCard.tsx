// Visual shell shared by all /auth/* pages: centered card with title and
// optional subtitle. Kept a server-friendly plain component (no client logic).

export default function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && (
        <div className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">{footer}</div>
      )}
    </main>
  );
}
