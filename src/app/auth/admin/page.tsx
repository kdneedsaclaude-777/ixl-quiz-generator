import type { Metadata } from "next";
import AuthCard from "../AuthCard";
import LoginForm from "../login/LoginForm";

// Hidden admin / super-admin sign-in. Not linked anywhere and kept out of
// search engines — reached only via the access code on the main login (typing
// "ADMIN-01" in the email field) or by direct URL. It still uses the normal
// credentials auth, so only valid admin accounts get in.
export const metadata: Metadata = {
  title: "Admin sign-in — QuizSpark",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <AuthCard
      title="Admin Console"
      subtitle="Sign in — administrators & super administrators."
      footer={<span className="text-xs text-slate-400">Authorized personnel only.</span>}
    >
      <LoginForm />
    </AuthCard>
  );
}
