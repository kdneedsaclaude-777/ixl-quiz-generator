import { requireAdminSession } from "@/lib/auth/admin";
import NewFamilyForm from "./NewFamilyForm";

export const metadata = { title: "New Family — QuizSpark" };

export default async function NewFamilyPage() {
  await requireAdminSession();
  return <NewFamilyForm />;
}
