export type MessageDeliveryStatus = "sending" | "sent" | "seen";

export function deliveryStatusFromRead(isMine: boolean, isRead: boolean): MessageDeliveryStatus {
  if (!isMine) return "sent";
  return isRead ? "seen" : "sent";
}

export function deliveryStatusLabel(status: MessageDeliveryStatus): string {
  switch (status) {
    case "sending":
      return "Đang gửi";
    case "sent":
      return "Đã gửi";
    case "seen":
      return "Đã xem";
  }
}

export function MessageStatusBadge({ status }: { status: MessageDeliveryStatus }) {
  const tone =
    status === "seen"
      ? "text-accent-green"
      : status === "sending"
        ? "text-ink/60 italic"
        : "text-ink/50";

  return (
    <span className={`text-[10px] font-medium ${tone}`}>{deliveryStatusLabel(status)}</span>
  );
}
