import { redirect } from "next/navigation";
import { isOpsUnlocked } from "@/lib/ops";
import { HOLIDAYS } from "@/lib/domain/holidays";
import { getAllOwnerSettings, holidayOverrideFrom, resolveActiveHoliday } from "@/lib/owner-settings";
import OpsPanelClient, { type HolidayRow } from "./OpsPanelClient";

export const metadata = { title: "Console", robots: { index: false, follow: false } };

export default async function OpsPanelPage() {
  if (!(await isOpsUnlocked())) redirect("/ops");

  const settings = await getAllOwnerSettings();
  const active = await resolveActiveHoliday();
  const rows: HolidayRow[] = HOLIDAYS.map((h) => ({
    id: h.id,
    name: h.name,
    currency: `${h.currency.icon} ${h.currency.name}`,
    override: holidayOverrideFrom(settings, h.id),
  }));

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <header className="mb-5">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Console</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Global switches. Not visible to any account — access is by code only.
        </p>
      </header>
      <OpsPanelClient rows={rows} activeHolidayId={active?.id ?? null} />
    </main>
  );
}
