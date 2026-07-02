import { NextResponse } from "next/server";
import { resolveActiveStudent } from "@/lib/active-child";
import { assignedSignature } from "@/lib/gamification";

// Cheap poll target for the child home's near-real-time refresh. Returns a small
// signature of the student's assigned work; the client only does a full page
// refresh when it changes. Two indexed aggregate queries — deliberately light.
export async function GET(): Promise<Response> {
  try {
    const { student } = await resolveActiveStudent();
    const sig = await assignedSignature(student.id);
    return NextResponse.json({ sig });
  } catch {
    // No active student / not signed in — return an empty signature so the
    // client simply does nothing.
    return NextResponse.json({ sig: "" });
  }
}
