export function StatCard({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "positive" | "warning" }) {
  const toneClass =
    tone === "positive"
      ? "bg-primary-pale"
      : tone === "warning"
        ? "bg-warning/40"
        : "bg-canvas";

  return (
    <article className={`rounded-xl ${toneClass} p-5 shadow-[0_1px_0_rgba(14,15,12,0.04)]`}>
      <p className="text-sm font-semibold text-body">{label}</p>
      <p className="mt-2 break-words text-2xl font-black text-ink">{value}</p>
    </article>
  );
}
