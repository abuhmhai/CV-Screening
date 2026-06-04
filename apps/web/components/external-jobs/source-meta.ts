import { ExternalJob } from "../../lib/types";

export interface SourceMeta {
  label: string;
  badgeClass: string;
}

/** Source badge colours per the spec: TopCV orange, VietnamWorks green, LinkedIn blue. */
export function sourceMeta(source: ExternalJob["source"]): SourceMeta {
  switch (source) {
    case "topcv":
      return { label: "TopCV", badgeClass: "bg-orange-100 text-orange-700 border-orange-200" };
    case "vietnamworks":
      return { label: "VietnamWorks", badgeClass: "bg-accent-green-glow text-positive border-hairline-strong" };
    case "linkedin":
      return { label: "LinkedIn", badgeClass: "bg-accent-blue-glow text-link border-hairline-strong" };
    default:
      return { label: source, badgeClass: "bg-slate-100 text-slate-700 border-slate-200" };
  }
}
