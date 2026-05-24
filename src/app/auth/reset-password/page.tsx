import Link from "next/link";
import AuthCard from "../AuthCard";
import ResetForm from "./ResetForm";

export const metadata = { title: "Set new password — IXL Quiz" };

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <AuthCard
      title="Set a new password"
      footer={
        <span>
          <Link href="/auth/login" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">Back to login</Link>
        </span>
      }
    >
      <ResetForm token={token ?? ""} />
    </AuthCard>
  );
}
