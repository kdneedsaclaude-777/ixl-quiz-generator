// Visual shell shared by all /auth/* pages, styled to the QuizSpark
// design bundle: centered logo, Instrument Serif title, soft card on warm
// paper. Server-friendly plain component (no client logic).
import { Logo } from "@/components/Logo";

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
      <div className="mb-6 flex justify-center">
        <Logo size={36} tagline />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-card dark:border-slate-700 dark:bg-slate-800">
        <h1 className="font-display text-4xl leading-[1.05] tracking-tight text-slate-900 dark:text-slate-100">
          {title}
        </h1>
        {subtitle && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && (
        <div className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">{footer}</div>
      )}
    </main>
  );
}
