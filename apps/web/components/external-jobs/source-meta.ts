import { ExternalJob } from "../../lib/types";

export interface SourceMeta {
  label: string;
  badgeClass: string;
}

/** Source badge colours per the spec: TopCV orange, VietnamWorks green, LinkedIn blue. */
export function sourceMeta(source: ExternalJob["source"]): SourceMeta {
  switch (source) {
    case "itviec":
      return { label: "ITviec", badgeClass: "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50" };
    case "careerviet":
      return { label: "CareerViet", badgeClass: "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/50" };
    case "topcv":
      return { label: "TopCV", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50" };
    case "vietnamworks":
      return { label: "VietnamWorks", badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50" };
    case "linkedin":
      return { label: "LinkedIn", badgeClass: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900/50" };
    default:
      return { label: source || "Việc làm", badgeClass: "bg-slate-100 text-slate-700 border-slate-200" };
  }
}
