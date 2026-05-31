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

export function formatSalary(min?: number | null, max?: number | null): string {
  if (!min && !max) return "Thương lượng";
  if (min && max) return `$${min.toLocaleString()} – $${max.toLocaleString()}`;
  return min ? `From $${min.toLocaleString()}` : `Up to $${max?.toLocaleString()}`;
}

export function formatScore(value?: string | number | null): string {
  if (value === null || value === undefined) return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  return Number.isNaN(num) ? "—" : num.toFixed(1);
}

export function statusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

export function initials(name?: string | null, email?: string): string {
  const source = name?.trim() || email || "?";
  const parts = source.split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}
