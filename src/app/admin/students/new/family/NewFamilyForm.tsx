"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormSection, Field, Grid, Input, Select, Textarea, Toggle, COUNTRIES } from "@/components/forms/FormKit";

// New Family form — mirrors the client's Teachworks "New Family" layout.
// Core identity fields (names, email, phone) persist via /api/admin/families;
// the remaining fields render + capture but are wired in a later stage.
export default function NewFamilyForm() {
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
    additionalInfo: "",
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
    const res = await fetch("/api/admin/families", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(data.error ?? "Failed to create family."); return; }
    router.push("/admin/students");
  }

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-5 text-[color:var(--shell-text)]">
      <header>
        <div className="text-xs font-semibold tracking-wide text-[color:var(--shell-muted)]">ADD STUDENT</div>
        <h1 className="font-display mt-1 text-4xl leading-none text-white">New Family</h1>
        <p className="mt-1.5 text-sm text-[color:var(--shell-muted)]">
          Add a family. After adding a family you&apos;ll be able to add child students to it.
          Want to add multiple families at once? Use the{" "}
          <a href="/admin/students/import" className="text-[#A5B4FC] hover:underline">import feature</a>.
        </p>
      </header>

      <FormSection title="Contact Information">
        <Grid>
          <Field label="Status"><Select value={f.status} onChange={(e) => u("status")(e.target.value)}><option>Active</option><option>Inactive</option></Select></Field>
          <Field label="Title"><Input value={f.title} onChange={(e) => u("title")(e.target.value)} placeholder="Mr. & Mrs., Ms., etc." /></Field>
        </Grid>
        <Field label="First Name(s)" hint="Parent names (ex. 'John & Jane') or primary contact's name." required>
          <Input value={f.firstNames} onChange={(e) => u("firstNames")(e.target.value)} required />
        </Field>
        <Field label="Last name" required><Input value={f.lastName} onChange={(e) => u("lastName")(e.target.value)} required /></Field>
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
        <Field label="Additional Info"><Textarea rows={3} value={f.additionalInfo} onChange={(e) => u("additionalInfo")(e.target.value)} /></Field>
      </FormSection>

      <FormSection title="Additional Contacts" hint="Add an additional contact to this family (coming soon).">
        <button type="button" className="rounded-full border border-[color:var(--shell-border)] bg-white/5 px-3.5 py-1.5 text-sm font-medium text-[color:var(--shell-text)] hover:bg-white/10">+ Add Contact</button>
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
          {busy ? "Saving…" : "Create Family"}
        </button>
        <a href="/admin/students/new" className="rounded-full px-4 py-2.5 text-sm text-[color:var(--shell-muted)] hover:bg-white/5">Cancel</a>
      </div>
    </form>
  );
}
