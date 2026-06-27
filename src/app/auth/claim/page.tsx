import Link from "next/link";
import AuthCard from "../AuthCard";
import ClaimForm from "./ClaimForm";

export const metadata = { title: "Join with an invite code — QuizSpark" };

// Student self-registration. A student arrives with a code their parent
// generated, sets their own email + password, and gets linked to the child
// profile the parent already created. Access stays pending until a tutor/
// admin approves.
export default function ClaimPage() {
  return (
    <AuthCard
      title="Let's get you started!"
      subtitle="Ask your parent for your invite code, then set up your login below."
      footer={
        <span className="space-y-1">
          <span className="block">
            Are you a parent?{" "}
            <Link href="/auth/signup" className="font-medium text-cm-blue hover:underline">
              Create a parent account
            </Link>
          </span>
          <span className="block">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium text-cm-blue hover:underline">
              Log in
            </Link>
          </span>
        </span>
      }
    >
      <ClaimForm />
    </AuthCard>
  );
}
