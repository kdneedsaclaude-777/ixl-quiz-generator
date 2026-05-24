import AutoRecover from "./AutoRecover";

export const metadata = { title: "Under maintenance" };

export default function MaintenancePage() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="text-7xl">🔧</div>
      <h1 className="mt-4 text-3xl font-bold text-slate-900 dark:text-slate-100">We&apos;ll be right back</h1>
      <p className="mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
        The IXL Quiz App is undergoing a quick maintenance update. Practice will resume shortly. Thanks for your patience!
      </p>
      <AutoRecover />
    </main>
  );
}
