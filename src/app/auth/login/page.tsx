import Link from "next/link";
import AuthCard from "../AuthCard";
import LoginForm from "./LoginForm";
import RoleTabs from "./RoleTabs";
import CMIcon from "@/components/CMIcon";

export const metadata = { title: "Log in — QuizSpark" };

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back."
      subtitle="Sign in to your learning space."
      footer={
        <span>
          New family?{" "}
          <Link href="/auth/signup" className="font-medium text-cm-blue hover:underline">Create an account</Link>
          {" · "}
          <Link href="/auth/forgot-password" className="font-medium text-cm-blue hover:underline">Forgot?</Link>
        </span>
      }
    >
      <RoleTabs />
      <LoginForm />

      {/* Kid-friendly alt — for parents practising with a child on a shared
          device. Sends them to the "Who's playing?" avatar picker. */}
      <Link
        href="/child/select"
        className="mt-4 flex items-center gap-3 rounded-2xl bg-cm-blue-50 p-3.5 transition-colors hover:bg-cm-blue-100"
      >
        <span className="grid h-10 w-10 place-items-center rounded-xl text-xl" style={{ background: "var(--cm-coral)" }}>
          👦
        </span>
        <span className="flex-1 text-[13px] leading-tight">
          <span className="block font-bold text-slate-900">Are you a student?</span>
          <span className="block text-slate-500">Pick your avatar to start practising</span>
        </span>
        <CMIcon name="chevron" size={18} color="var(--cm-blue)" />
      </Link>
    </AuthCard>
  );
}
