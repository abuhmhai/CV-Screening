export function formatDate(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/** Formats salary in Vietnamese Dong (VND) by default. */
export function formatSalary(
  min?: number | null,
  max?: number | null,
  currency: string = "VND"
): string {
  if (!min && !max) return "Thương lượng";
  const fmt = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0
    }).format(amount);
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `Từ ${fmt(min)}`;
  return `Đến ${fmt(max!)}`;
}

export function formatScore(value?: string | number | null): string {
  if (value === null || value === undefined) return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  return Number.isNaN(num) ? "—" : num.toFixed(1);
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    APPLIED: "Đã ứng tuyển",
    AI_SCREENING: "AI đang chấm",
    HR_REVIEW: "HR đang xem",
    INTERVIEW: "Phỏng vấn",
    OFFER: "Đề nghị nhận việc",
    HIRED: "Đã tuyển",
    REJECTED: "Từ chối"
  };
  return labels[status] ?? status.replace(/_/g, " ");
}

export function offerStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "Chờ phản hồi",
    ACCEPTED: "Đã chấp nhận",
    DECLINED: "Đã từ chối",
    WITHDRAWN: "Đã thu hồi"
  };
  return labels[status] ?? status;
}

/** Formats a single salary amount (no range) in the given currency. */
export function formatAmount(amount?: number | null, currency: string = "VND"): string {
  if (amount === null || amount === undefined) return "Thương lượng";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}

export function initials(name?: string | null, email?: string): string {
  const source = name?.trim() || email || "?";
  const parts = source.split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}
