import { redirect } from "next/navigation";
import { isOpsUnlocked, opsGateConfigured } from "@/lib/ops";
import OpsGateForm from "./OpsGateForm";

// Intentionally minimal + unindexed. Reachable directly, but useless without the
// access code — the code is the gate, not the URL.
export const metadata = { title: "Access", robots: { index: false, follow: false } };

export default async function OpsGatePage() {
  if (!opsGateConfigured()) redirect("/");
  if (await isOpsUnlocked()) redirect("/ops/panel");
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Restricted</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Enter your access code to continue.</p>
        <OpsGateForm />
      </div>
    </main>
  );
}
