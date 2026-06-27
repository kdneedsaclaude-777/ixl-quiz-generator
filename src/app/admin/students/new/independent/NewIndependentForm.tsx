"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormSection, Field, Grid, Input, Select, Textarea, Toggle, COUNTRIES } from "@/components/forms/FormKit";

// New Independent Student — adult / self-billed student. Mirrors the client's
// Teachworks layout. Core fields (name, grade, email) persist via
// /api/admin/independent-students; advanced billing/calendar fields render now
// and persist in a later stage.
export default function NewIndependentForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [f, set] = useState({
    status: "Active",
    title: "",
    firstNames: "",
    lastName: "",
    email: "",
    additionalEmail: "",
    mobilePhone: "",
    homePhone: "",
    workPhone: "",
    address: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    birthDate: "",
    startDate: "",
    school: "",
    grade: "1",
    subjects: "",
    additionalInfo: "",
    billingMethod: "Use Service List Price",
    discountPct: "",
    calendarColor: "#ADAA94",
    enableLessonReminders: true,
    receiveLessonNotes: true,
    sendWelcomeEmail: false,
    enableUserAccount: true,
  });
  const u = (k: keyof typeof f) => (v: string | boolean) => set((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/independent-students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(data.error ?? "Failed to create student."); return; }
    router.push("/admin/students");
  }

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-5 text-[color:var(--shell-text)]">
      <header>
        <div className="text-xs font-semibold tracking-wide text-[color:var(--shell-muted)]">ADD STUDENT</div>
        <h1 className="font-display mt-1 text-4xl leading-none text-white">New Independent Student</h1>
        <p className="mt-1.5 text-sm text-[color:var(--shell-muted)]">
          Add an independent student (a student billed directly — often adult students). Want to import multiple students at once? Use the{" "}
          <a href="/admin/students/import" className="text-[#A5B4FC] hover:underline">import feature</a>.
        </p>
      </header>

      <FormSection title="Contact Information">
        <Grid>
          <Field label="Status"><Select value={f.status} onChange={(e) => u("status")(e.target.value)}><option>Active</option><option>Inactive</option></Select></Field>
          <Field label="Title"><Input value={f.title} onChange={(e) => u("title")(e.target.value)} placeholder="Mr., Mrs., Ms., etc." /></Field>
        </Grid>
        <Grid>
          <Field label="First Name(s)" required><Input value={f.firstNames} onChange={(e) => u("firstNames")(e.target.value)} required /></Field>
          <Field label="Last name" required><Input value={f.lastName} onChange={(e) => u("lastName")(e.target.value)} required /></Field>
        </Grid>
        <Grid>
          <Field label="Email" required><Input type="email" value={f.email} onChange={(e) => u("email")(e.target.value)} required /></Field>
          <Field label="Additional Email"><Input type="email" value={f.additionalEmail} onChange={(e) => u("additionalEmail")(e.target.value)} /></Field>
        </Grid>
        <Grid cols={3}>
          <Field label="Mobile phone"><Input value={f.mobilePhone} onChange={(e) => u("mobilePhone")(e.target.value)} /></Field>
          <Field label="Home phone"><Input value={f.homePhone} onChange={(e) => u("homePhone")(e.target.value)} /></Field>
          <Field label="Work phone"><Input value={f.workPhone} onChange={(e) => u("workPhone")(e.target.value)} /></Field>
        </Grid>
        <Field label="Address"><Input value={f.address} onChange={(e) => u("address")(e.target.value)} /></Field>
        <Field label="Address 2"><Input value={f.address2} onChange={(e) => u("address2")(e.target.value)} /></Field>
        <Grid cols={3}>
          <Field label="City"><Input value={f.city} onChange={(e) => u("city")(e.target.value)} /></Field>
          <Field label="State"><Input value={f.state} onChange={(e) => u("state")(e.target.value)} /></Field>
          <Field label="Zip/Postal Code"><Input value={f.zip} onChange={(e) => u("zip")(e.target.value)} /></Field>
        </Grid>
        <Field label="Country">
          <Select value={f.country} onChange={(e) => u("country")(e.target.value)}>
            <option value="">Select country...</option>
            {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
          </Select>
        </Field>
      </FormSection>

      <FormSection title="Student Details">
        <Grid>
          <Field label="Birth date"><Input type="date" value={f.birthDate} onChange={(e) => u("birthDate")(e.target.value)} /></Field>
          <Field label="Start date"><Input type="date" value={f.startDate} onChange={(e) => u("startDate")(e.target.value)} /></Field>
        </Grid>
        <Grid>
          <Field label="School"><Input value={f.school} onChange={(e) => u("school")(e.target.value)} /></Field>
          <Field label="Grade" required>
            <Select value={f.grade} onChange={(e) => u("grade")(e.target.value)}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => <option key={g} value={g}>Grade {g}</option>)}
            </Select>
          </Field>
        </Grid>
        <Field label="Subject(s)"><Input value={f.subjects} onChange={(e) => u("subjects")(e.target.value)} placeholder="Select subjects" /></Field>
        <Field label="Additional Info"><Textarea rows={3} value={f.additionalInfo} onChange={(e) => u("additionalInfo")(e.target.value)} /></Field>
      </FormSection>

      <FormSection title="Billing Details">
        <Field label="Billing method">
          <Select value={f.billingMethod} onChange={(e) => u("billingMethod")(e.target.value)}>
            <option>Use Service List Price</option>
            <option>Custom</option>
          </Select>
        </Field>
        <Field label="Student Discount %" hint="If your discount rate repeats, include at least 4 decimal places.">
          <Input value={f.discountPct} onChange={(e) => u("discountPct")(e.target.value)} />
        </Field>
        <Field label="Calendar color">
          <input type="color" value={f.calendarColor} onChange={(e) => u("calendarColor")(e.target.value)} className="h-9 w-16 rounded border border-[color:var(--shell-border)] bg-white/5" />
        </Field>
      </FormSection>

      <FormSection title="Lesson Notifications">
        <Toggle label="Enable Lesson Reminders" checked={f.enableLessonReminders} onChange={u("enableLessonReminders") as (v: boolean) => void} />
        <Toggle label="Receive Lesson Notes Emails" checked={f.receiveLessonNotes} onChange={u("receiveLessonNotes") as (v: boolean) => void} />
      </FormSection>

      <FormSection title="Welcome Notifications">
        <Toggle label="Send Welcome Email" checked={f.sendWelcomeEmail} onChange={u("sendWelcomeEmail") as (v: boolean) => void} />
      </FormSection>

      <FormSection title="User Account">
        <Toggle label="Enable User Account" hint="A user account allows the customer to use their email address to log in to their personal account." checked={f.enableUserAccount} onChange={u("enableUserAccount") as (v: boolean) => void} />
      </FormSection>

      {error && <p className="rounded-xl px-3 py-2 text-sm" style={{ background: "rgba(194,95,95,.15)", color: "#FCA5A5" }}>{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="rounded-full bg-[#6366F1] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#4F46E5] disabled:opacity-50">
          {busy ? "Saving…" : "Create Student"}
        </button>
        <a href="/admin/students/new" className="rounded-full px-4 py-2.5 text-sm text-[color:var(--shell-muted)] hover:bg-white/5">Cancel</a>
      </div>
    </form>
  );
}
