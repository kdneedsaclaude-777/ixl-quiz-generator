import Link from "next/link";
import AuthCard from "../AuthCard";
import SignupForm from "./SignupForm";

export const metadata = { title: "Sign up — IXL Quiz" };

export default function SignupPage() {
  return (
    <AuthCard
      title="Create parent account"
      subtitle="One account per parent — add as many children as you like once you're in."
      footer={
        <span>
          Already have one?{" "}
          <Link href="/auth/login" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            Log in
          </Link>
        </span>
      }
    >
      <SignupForm />
    </AuthCard>
  );
}
