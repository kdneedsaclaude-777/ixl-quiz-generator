import LogoutRunner from "./LogoutRunner";

export const metadata = { title: "Logging out…" };
export const dynamic = "force-dynamic";

export default function LogoutPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="text-sm text-slate-600 dark:text-slate-400">Signing you out…</p>
      <LogoutRunner />
    </main>
  );
}
