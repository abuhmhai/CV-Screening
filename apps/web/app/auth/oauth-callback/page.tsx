"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "../../../lib/api-client";
import { LoadingBlock } from "../../../components/ui/states";

function OAuthCallbackInner() {
  const params = useSearchParams();

  useEffect(() => {
    const accessToken = params.get("accessToken");
    if (!accessToken) {
      window.location.assign("/auth/sign-in");
      return;
    }
    void apiFetch<{ user: unknown }>("/auth/me", { token: accessToken }).then((res) => {
      if (res.ok && res.data?.user) {
        localStorage.setItem("cv_access_token", accessToken);
        localStorage.setItem("cv_user", JSON.stringify(res.data.user));
        window.location.assign("/");
      } else {
        window.location.assign("/auth/sign-in");
      }
    });
  }, [params]);

  return <LoadingBlock label="Đang hoàn tất đăng nhập..." />;
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Đang hoàn tất đăng nhập..." />}>
      <OAuthCallbackInner />
    </Suspense>
  );
}
