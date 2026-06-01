import React from "react";

type AvatarSize = "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  src?: string | null;
  initials?: string;
  name?: string | null;
  email?: string;
  size?: AvatarSize | "sm" | "md" | "lg";
  online?: boolean;
  className?: string;
}

const sizeClasses: Record<string, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-16 w-16 text-lg"
};

const onlineIndicatorClasses: Record<string, string> = {
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
  xl: "h-3.5 w-3.5"
};

function getBgColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 45%, 88%)`;
}

function getTextColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 50%, 22%)`;
}

export function Avatar({
  src,
  initials,
  name,
  email,
  size = "md",
  online,
  className = ""
}: AvatarProps) {
  let displayInitials = initials;
  if (!displayInitials) {
    if (name) {
      displayInitials = name.substring(0, 2).toUpperCase();
    } else if (email) {
      displayInitials = email.substring(0, 2).toUpperCase();
    } else {
      displayInitials = "?";
    }
  }

  const bgColor = getBgColor(displayInitials);
  const textColor = getTextColor(displayInitials);

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className={`flex items-center justify-center overflow-hidden rounded-full ring-2 ring-primary-pale ${sizeClasses[size]}`}
        style={
          !src
            ? { backgroundColor: bgColor, color: textColor, fontWeight: 600 }
            : undefined
        }
      >
        {src ? (
          <img src={src} alt={displayInitials} className="h-full w-full object-cover" />
        ) : (
          displayInitials
        )}
      </div>
      {online ? (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-2 border-canvas bg-positive ${onlineIndicatorClasses[size]}`}
        />
      ) : null}
    </div>
  );
}
