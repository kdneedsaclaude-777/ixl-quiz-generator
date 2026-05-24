import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

// NextAuth v4 config. JWT sessions (not DB sessions) — pairs well with the
// Credentials provider and avoids an extra Session row per login.
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim().toLowerCase();
        const password = credentials?.password?.toString() ?? "";
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;
        if (user.deletedAt) throw new Error("Account is deleted.");
        if (user.suspendedAt) throw new Error("Your account has been suspended.");

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        // Track last login (best-effort, don't block auth on failure).
        prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).catch(() => {});

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          orgId: user.orgId,
          emailVerified: user.emailVerified,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: string }).role ?? "parent";
        token.orgId = (user as { orgId?: string | null }).orgId ?? null;
        const emailVerified = (user as { emailVerified?: Date | null }).emailVerified;
        token.emailVerified = emailVerified ? new Date(emailVerified).toISOString() : null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "parent";
        session.user.orgId = (token.orgId as string | null) ?? null;
        session.user.emailVerified = (token.emailVerified as string | null) ?? null;
      }
      return session;
    },
  },
};
