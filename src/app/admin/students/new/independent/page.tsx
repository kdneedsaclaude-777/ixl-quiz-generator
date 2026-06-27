import { requireAdminSession } from "@/lib/auth/admin";
import NewIndependentForm from "./NewIndependentForm";

export const metadata = { title: "New Independent Student — QuizSpark" };

export default async function NewIndependentPage() {
  await requireAdminSession();
  return <NewIndependentForm />;
}
