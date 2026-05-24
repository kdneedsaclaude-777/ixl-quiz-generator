import { redirect } from "next/navigation";

// /live/ABCDEF is the obvious shape a user types or shares, so accept it and
// hand them to the proper join page with the code pre-filled.
export default async function LiveCodeShortcut({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  redirect(`/live/join?code=${encodeURIComponent(code.toUpperCase())}`);
}
