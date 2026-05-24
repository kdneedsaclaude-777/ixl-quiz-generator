import { redirect } from "next/navigation";

// Convenience URL: students intuitively try /student/login. Auth is shared
// across roles (the role-based router sends them to /child/home post-login).
export default function StudentLoginShortcut() {
  redirect("/auth/login");
}
