import { Logo } from "@/components/Logo";
import AutoRecover from "./AutoRecover";

export const metadata = { title: "Under maintenance" };

export default function MaintenancePage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="mb-8 flex justify-center">
        <Logo size={36} tagline />
      </div>
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-10 shadow-card dark:border-slate-700 dark:bg-slate-800">
        <div className="flex justify-center">
          <span className="cm-pill amber">Maintenance</span>
        </div>
        <h1 className="font-display mt-4 text-4xl leading-[1.05] tracking-tight text-slate-900 dark:text-slate-100">
          We&apos;ll be right back
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          QuizSpark is undergoing a quick maintenance update. Practice will
          resume shortly — thanks for your patience.
        </p>
        <AutoRecover />
      </div>
    </main>
  );
}
