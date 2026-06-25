import { UserRole } from "./types";

export function dashboardHref(role?: UserRole | null): string {
  if (role === "RECRUITER" || role === "ADMIN") return "/recruiter/dashboard";
  if (role === "CANDIDATE") return "/profile";
  return "/auth/sign-in";
}

export function dashboardLabel(role?: UserRole | null): string {
  if (role === "RECRUITER" || role === "ADMIN") return "Vào Dashboard";
  if (role === "CANDIDATE") return "Vào Hồ sơ";
  return "Đăng nhập";
}
