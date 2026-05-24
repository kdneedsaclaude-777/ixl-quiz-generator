import Link from "next/link";
import AuthCard from "../AuthCard";
import LoginForm from "./LoginForm";

export const metadata = { title: "Log in — IXL Quiz" };

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to your parent or admin account."
      footer={
        <span>
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">Sign up</Link>
          {" · "}
          <Link href="/auth/forgot-password" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">Forgot password?</Link>
        </span>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}
