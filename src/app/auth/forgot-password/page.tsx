import Link from "next/link";
import AuthCard from "../AuthCard";
import ForgotForm from "./ForgotForm";

export const metadata = { title: "Forgot password — IXL Quiz" };

export default function ForgotPage() {
  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter the email on your account and we'll send you a link to set a new password."
      footer={
        <span>
          <Link href="/auth/login" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">Back to login</Link>
        </span>
      }
    >
      <ForgotForm />
    </AuthCard>
  );
}
