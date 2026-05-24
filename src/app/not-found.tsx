import Link from "next/link";

export const metadata = { title: "Not found — IXL Quiz" };

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="text-7xl" aria-hidden>🧭</div>
      <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-slate-100">Page not found</h1>
      <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
        We couldn&apos;t find what you&apos;re looking for. Check the URL, or head back to the home page.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        Go home
      </Link>
    </main>
  );
}
