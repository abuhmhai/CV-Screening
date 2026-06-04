"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bell, CalendarClock, CheckCircle2, Sparkles, XCircle } from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { apiFetch } from "../../lib/api-client";
import { NotificationItem } from "../../lib/types";
import { formatDateTime } from "../../lib/format";
import { AuthGate } from "../../components/auth-gate";
import { PageHeader, Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { EmptyState, SkeletonList } from "../../components/ui/states";

type NotificationVisual = {
  icon: React.ReactNode;
  ring: string;
};

function notificationVisual(item: NotificationItem): NotificationVisual {
  const payload = item.data ?? item.payload ?? {};
  const status = typeof payload.toStatus === "string" ? payload.toStatus : "";

  if (item.type === "AI_SCREENING_DONE") {
    return { icon: <Sparkles size={18} />, ring: "bg-primary-pale text-ink-deep" };
  }
  if (status === "INTERVIEW") {
    return { icon: <CalendarClock size={18} />, ring: "bg-primary-pale text-ink-deep" };
  }
  if (status === "OFFER" || status === "HIRED") {
    return { icon: <CheckCircle2 size={18} />, ring: "bg-primary-pale text-positive-deep" };
  }
  if (status === "REJECTED") {
    return { icon: <XCircle size={18} />, ring: "bg-negative-bg/10 text-negative-deep" };
  }
  return { icon: <Bell size={18} />, ring: "bg-canvas-soft text-body" };
}

function NotificationsContent() {
  const { token, user } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!token) return;
    const res = await apiFetch<NotificationItem[]>("/notifications", { token });
    if (res.ok && res.data) setItems(res.data);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [token]);

  async function markRead(id: string) {
    if (!token) return;
    await apiFetch(`/notifications/${id}/read`, { method: "PATCH", token });
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Thông báo"
          description="Cập nhật trạng thái ứng tuyển, AI screening và hoạt động mạng lưới."
        />
        <SkeletonList count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thông báo"
        description="Cập nhật trạng thái ứng tuyển, AI screening và hoạt động mạng lưới."
        actions={
          <Button
            variant="secondary"
            className="px-4 py-2 text-sm"
            onClick={async () => {
              if (!token) return;
              await apiFetch("/notifications/read-all", { method: "PATCH", token });
              setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
            }}
          >
            Mark all as read
          </Button>
        }
      />

      {items.length === 0 ? (
        <EmptyState title="Không có thông báo" description="Thông báo mới sẽ xuất hiện tại đây." />
      ) : (
        items.map((item, idx) => {
          const payload = item.data ?? item.payload ?? {};
          const applicationId = typeof payload.applicationId === "string" ? payload.applicationId : null;
          const href = applicationId
            ? user?.role === "CANDIDATE"
              ? `/applications/${applicationId}`
              : `/ai-score/${applicationId}`
            : null;
          const visual = notificationVisual(item);

          return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.3) }}
          >
          <Card className={`transition ${item.isRead ? "opacity-75" : "ring-1 ring-primary/20"}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 gap-3">
                <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${visual.ring}`}>
                  {visual.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-ink">{item.title}</h2>
                    {!item.isRead ? <Badge tone="primary">Mới</Badge> : null}
                  </div>
                  {item.body ? <p className="mt-1.5 text-sm text-body">{item.body}</p> : null}
                  <p className="mt-2 text-xs text-mute">{formatDateTime(item.createdAt)}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {href ? (
                  <Link href={href} onClick={() => void markRead(item.id)}>
                    <Button variant="primary" className="px-4 py-2 text-sm">Xem hồ sơ</Button>
                  </Link>
                ) : null}
                {!item.isRead ? (
                  <Button variant="secondary" className="px-4 py-2 text-sm" onClick={() => markRead(item.id)}>
                    Đánh dấu đã đọc
                  </Button>
                ) : null}
              </div>
            </div>
          </Card>
          </motion.div>
          );
        })
      )}
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <AuthGate>
      <NotificationsContent />
    </AuthGate>
  );
}
