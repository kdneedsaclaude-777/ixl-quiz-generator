import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      orgId: string | null;
      emailVerified: string | null;
    };
  }

  interface User {
    role?: string;
    orgId?: string | null;
    emailVerified?: Date | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    orgId?: string | null;
    emailVerified?: string | null;
  }
}
