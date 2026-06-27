import { requireAdminSession } from "@/lib/auth/admin";
import NewEmployeeForm from "./NewEmployeeForm";

export const metadata = { title: "New Employee — QuizSpark" };

export default async function NewEmployeePage() {
  await requireAdminSession();
  return <NewEmployeeForm />;
}
