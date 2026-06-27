"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormSection, Field, Grid, Input, Select, Textarea, Toggle, COUNTRIES } from "@/components/forms/FormKit";

// New Employee form (teachers + administrative staff). Mirrors the client's
// Teachworks layout. Core fields (name, email, type→role) persist via
// /api/admin/employees; HR/scheduling fields render now, persist later.
export default function NewEmployeeForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avail, setAvail] = useState<{ day: string; from: string; to: string }[]>([]);
  const [f, set] = useState({
    status: "Active",
    employeeType: "Teacher",
    title: "",
    firstName: "",
    lastName: "",
    email: "",
    mobilePhone: "",
    homePhone: "",
    address: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    birthDate: "",
    bio: "",
    position: "",
    hireDate: "",
    lessonWageType: "Use Service List Wage",
    nonTeachingWageType: "Use Work List Wage",
    subjects: "",
    calendarDefaultView: "Month",
    calendarColorBy: "Teacher",
    calendarColor: "#E83F2C",
    enableLessonReminders: true,
    sendWelcomeEmail: false,
    enableUserAccount: true,
  });
  const u = (k: keyof typeof f) => (v: string | boolean) => set((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, availability: avail }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(data.error ?? "Failed to create employee."); return; }
    router.push("/admin/users");
  }

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-5 text-[color:var(--shell-text)]">
      <header>
        <div className="text-xs font-semibold tracking-wide text-[color:var(--shell-muted)]">PEOPLE</div>
        <h1 className="font-display mt-1 text-4xl leading-none text-white">New Employee</h1>
        <p className="mt-1.5 text-sm text-[color:var(--shell-muted)]">
          Add an employee (teachers and/or administrative staff). Adding multiple? Use the{" "}
          <a href="/admin/students/import" className="text-[#A5B4FC] hover:underline">import feature</a>.
        </p>
      </header>

      <FormSection title="Basics">
        <Grid>
          <Field label="Status"><Select value={f.status} onChange={(e) => u("status")(e.target.value)}><option>Active</option><option>Inactive</option></Select></Field>
          <Field label="Employee Type" required>
            <Select value={f.employeeType} onChange={(e) => u("employeeType")(e.target.value)}>
              <option value="Teacher">Teacher</option>
              <option value="Administrator">Administrator</option>
            </Select>
          </Field>
        </Grid>
        <Field label="Profile Photo" hint="Upload a square image (ie. 200x200) in .jpg or .png. Max 250kb.">
          <Input type="file" accept=".jpg,.jpeg,.png" />
        </Field>
        <Field label="Title"><Input value={f.title} onChange={(e) => u("title")(e.target.value)} placeholder="Mr., Mrs., Ms., etc." /></Field>
        <Grid>
          <Field label="First name" required><Input value={f.firstName} onChange={(e) => u("firstName")(e.target.value)} required /></Field>
          <Field label="Last name" required><Input value={f.lastName} onChange={(e) => u("lastName")(e.target.value)} required /></Field>
        </Grid>
        <Field label="Email" required><Input type="email" value={f.email} onChange={(e) => u("email")(e.target.value)} required /></Field>
        <Grid>
          <Field label="Mobile phone"><Input value={f.mobilePhone} onChange={(e) => u("mobilePhone")(e.target.value)} /></Field>
          <Field label="Home phone"><Input value={f.homePhone} onChange={(e) => u("homePhone")(e.target.value)} /></Field>
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
        <Field label="Birth date"><Input type="date" value={f.birthDate} onChange={(e) => u("birthDate")(e.target.value)} /></Field>
        <Field label="Bio" hint="Displayed on the employee profile and in some add-ons."><Textarea rows={3} value={f.bio} onChange={(e) => u("bio")(e.target.value)} /></Field>
      </FormSection>

      <FormSection title="Availability" hint="General availability. One-off unavailability is blocked off on the calendar.">
        {avail.map((row, i) => (
          <Grid cols={3} key={i}>
            <Select value={row.day} onChange={(e) => setAvail((a) => a.map((r, j) => j === i ? { ...r, day: e.target.value } : r))}>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <option key={d}>{d}</option>)}
            </Select>
            <Input type="time" value={row.from} onChange={(e) => setAvail((a) => a.map((r, j) => j === i ? { ...r, from: e.target.value } : r))} />
            <Input type="time" value={row.to} onChange={(e) => setAvail((a) => a.map((r, j) => j === i ? { ...r, to: e.target.value } : r))} />
          </Grid>
        ))}
        <button type="button" onClick={() => setAvail((a) => [...a, { day: "Mon", from: "09:00", to: "17:00" }])} className="rounded-full border border-[color:var(--shell-border)] bg-white/5 px-3.5 py-1.5 text-sm font-medium text-[color:var(--shell-text)] hover:bg-white/10">+ Add Row</button>
      </FormSection>

      <FormSection title="Employment Details">
        <Grid>
          <Field label="Position"><Input value={f.position} onChange={(e) => u("position")(e.target.value)} /></Field>
          <Field label="Hire date"><Input type="date" value={f.hireDate} onChange={(e) => u("hireDate")(e.target.value)} /></Field>
        </Grid>
        <Grid>
          <Field label="Lesson Wage Type"><Select value={f.lessonWageType} onChange={(e) => u("lessonWageType")(e.target.value)}><option>Use Service List Wage</option><option>Custom</option></Select></Field>
          <Field label="Non-Teaching Wage Type"><Select value={f.nonTeachingWageType} onChange={(e) => u("nonTeachingWageType")(e.target.value)}><option>Use Work List Wage</option><option>Custom</option></Select></Field>
        </Grid>
        <Field label="Subject(s)"><Input value={f.subjects} onChange={(e) => u("subjects")(e.target.value)} placeholder="Select subjects" /></Field>
      </FormSection>

      <FormSection title="Calendar Settings">
        <Grid cols={3}>
          <Field label="Default View"><Select value={f.calendarDefaultView} onChange={(e) => u("calendarDefaultView")(e.target.value)}><option>Month</option><option>Week</option><option>Day</option></Select></Field>
          <Field label="Color by"><Select value={f.calendarColorBy} onChange={(e) => u("calendarColorBy")(e.target.value)}><option>Teacher</option><option>Location</option><option>Student</option></Select></Field>
          <Field label="Calendar color"><input type="color" value={f.calendarColor} onChange={(e) => u("calendarColor")(e.target.value)} className="h-9 w-16 rounded border border-[color:var(--shell-border)] bg-white/5" /></Field>
        </Grid>
      </FormSection>

      <FormSection title="Lesson Notifications">
        <Toggle label="Enable Lesson Reminders" checked={f.enableLessonReminders} onChange={u("enableLessonReminders") as (v: boolean) => void} />
      </FormSection>

      <FormSection title="Welcome Notifications">
        <Toggle label="Send Welcome Email" checked={f.sendWelcomeEmail} onChange={u("sendWelcomeEmail") as (v: boolean) => void} />
      </FormSection>

      <FormSection title="User Account">
        <Toggle label="Enable User Account" hint="A user account allows the employee to log in with their email address." checked={f.enableUserAccount} onChange={u("enableUserAccount") as (v: boolean) => void} />
      </FormSection>

      {error && <p className="rounded-xl px-3 py-2 text-sm" style={{ background: "rgba(194,95,95,.15)", color: "#FCA5A5" }}>{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="rounded-full bg-[#6366F1] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#4F46E5] disabled:opacity-50">
          {busy ? "Saving…" : "Create Employee"}
        </button>
        <a href="/admin/users" className="rounded-full px-4 py-2.5 text-sm text-[color:var(--shell-muted)] hover:bg-white/5">Cancel</a>
      </div>
    </form>
  );
}
