import { HandHeart, Lightbulb, PartyPopper, ThumbsUp } from "lucide-react";
import { createElement, type ReactNode } from "react";

export type PostReactionType = "LIKE" | "CELEBRATE" | "SUPPORT" | "INSIGHTFUL";

export const POST_REACTIONS: Array<{
  type: PostReactionType;
  label: string;
  hoverLabel: string;
  bg: string;
  ring: string;
  icon: ReactNode;
}> = [
  {
    type: "LIKE",
    label: "Thích",
    hoverLabel: "Thích",
    bg: "bg-accent-blue",
    ring: "ring-accent-blue-glow",
    icon: createElement(ThumbsUp, { size: 20, strokeWidth: 2.4 })
  },
  {
    type: "CELEBRATE",
    label: "Chúc mừng",
    hoverLabel: "Chúc mừng",
    bg: "bg-accent-yellow",
    ring: "ring-accent-orange-glow",
    icon: createElement(PartyPopper, { size: 20, strokeWidth: 2.4 })
  },
  {
    type: "SUPPORT",
    label: "Ủng hộ",
    hoverLabel: "Ủng hộ",
    bg: "bg-accent-green",
    ring: "ring-accent-green-glow",
    icon: createElement(HandHeart, { size: 20, strokeWidth: 2.4 })
  },
  {
    type: "INSIGHTFUL",
    label: "Hay ho",
    hoverLabel: "Sâu sắc",
    bg: "bg-accent-orange",
    ring: "ring-accent-orange-glow",
    icon: createElement(Lightbulb, { size: 20, strokeWidth: 2.4 })
  }
];

export function reactionMeta(type?: PostReactionType | null) {
  return POST_REACTIONS.find((item) => item.type === type) ?? POST_REACTIONS[0];
}
