import { initials } from "../../lib/format";

export function Avatar({
  name,
  email,
  src,
  size = "md"
}: {
  name?: string | null;
  email?: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-16 w-16 text-lg" };

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? "Avatar"}
        className={`${sizes[size]} rounded-full object-cover ring-2 ring-primary-pale`}
      />
    );
  }

  return (
    <div
      aria-label={name ?? email ?? "Avatar"}
      className={`${sizes[size]} flex items-center justify-center rounded-full bg-primary font-semibold text-ink ring-2 ring-primary-pale`}
    >
      {initials(name, email)}
    </div>
  );
}
