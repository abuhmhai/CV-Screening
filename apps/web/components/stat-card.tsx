export function StatCard({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "positive" | "warning" }) {
  const toneClass =
    tone === "positive"
      ? "bg-primary-pale"
      : tone === "warning"
        ? "bg-warning/40"
        : "bg-canvas";

  return (
    <article className={`rounded-xl ${toneClass} p-5`}>
      <p className="text-sm text-body">{label}</p>
      <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
    </article>
  );
}
