import Link from "next/link";
import AuthCard from "../AuthCard";
import SignupForm from "./SignupForm";

export const metadata = { title: "Sign up — QuizSpark" };

export default function SignupPage() {
  return (
    <AuthCard
      title="Create parent account"
      subtitle="One account per parent — add as many children as you like once you're in."
      footer={
        <span className="space-y-1">
          <span className="block">
            Are you a student with an invite code?{" "}
            <Link href="/auth/claim" className="font-medium text-cm-blue hover:underline">
              Join here
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
      <SignupForm />
    </AuthCard>
  );
}
