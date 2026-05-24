import Link from "next/link";
import AuthCard from "../AuthCard";
import VerifyEmailRunner from "./VerifyEmailRunner";

export const metadata = { title: "Verify email — IXL Quiz" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <AuthCard
      title="Email verification"
      footer={
        <span>
          <Link href="/auth/login" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">Go to login</Link>
        </span>
      }
    >
      <VerifyEmailRunner token={token ?? ""} />
    </AuthCard>
  );
}
