import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata = { title: "Not found — QuizSpark" };

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="mb-8 flex justify-center">
        <Logo size={36} tagline />
      </div>
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-10 shadow-card dark:border-slate-700 dark:bg-slate-800">
        <p className="font-mono text-5xl font-bold tracking-tight text-cm-blue dark:text-cm-blue-500">
          404
        </p>
        <h1 className="font-display mt-3 text-3xl leading-[1.05] tracking-tight text-slate-900 dark:text-slate-100">
          Page not found
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          We couldn&apos;t find what you&apos;re looking for. Check the URL, or head
          back to the home page.
        </p>
        <Link href="/" className="cm-btn primary mt-6">
          Go home
        </Link>
      </div>
    </main>
  );
}
