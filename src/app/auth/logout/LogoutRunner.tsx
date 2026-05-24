"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

export default function LogoutRunner() {
  useEffect(() => {
    signOut({ callbackUrl: "/" }).catch(() => {
      window.location.href = "/";
    });
  }, []);
  return null;
}
