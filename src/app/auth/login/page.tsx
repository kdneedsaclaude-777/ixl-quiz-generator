import Link from "next/link";
import AuthCard from "../AuthCard";
import LoginForm from "./LoginForm";

export const metadata = { title: "Log in — QuizSpark" };

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back."
      subtitle="Log in to your account."
      footer={
        <span>
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="font-medium text-cm-blue hover:underline">Sign up</Link>
        </span>
      }
    >
      <LoginForm secretAdminTrigger />
    </AuthCard>
  );
}
