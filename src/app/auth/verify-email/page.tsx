import Link from "next/link";
import AuthCard from "../AuthCard";
import VerifyEmailRunner from "./VerifyEmailRunner";

export const metadata = { title: "Verify email — QuizSpark" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;
  return (
    <AuthCard
      title="Email verification"
      footer={
        <span>
          <Link href="/auth/login" className="font-medium text-cm-blue hover:underline">Go to login</Link>
        </span>
      }
    >
      <VerifyEmailRunner token={token ?? ""} initialEmail={email ?? ""} />
    </AuthCard>
  );
}
