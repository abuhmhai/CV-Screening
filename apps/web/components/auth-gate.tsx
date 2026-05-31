"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import { LoadingBlock } from "./ui/states";
import { UserRole } from "../lib/types";

export function AuthGate({
  children,
  roles,
  fallbackHref = "/auth/sign-in"
}: {
  children: ReactNode;
  roles?: UserRole[];
  fallbackHref?: string;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(fallbackHref);
      return;
    }
    if (roles && !roles.includes(user.role)) {
      router.replace("/");
    }
  }, [user, loading, roles, router, fallbackHref]);

  if (loading) return <LoadingBlock />;
  if (!user) return <LoadingBlock label="Chuyển hướng..." />;
  if (roles && !roles.includes(user.role)) return <LoadingBlock label="Không có quyền truy cập..." />;

  return <>{children}</>;
}
