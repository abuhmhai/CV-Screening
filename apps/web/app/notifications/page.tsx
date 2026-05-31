"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { apiFetch } from "../../lib/api-client";
import { NotificationItem } from "../../lib/types";
import { formatDateTime } from "../../lib/format";
import { AuthGate } from "../../components/auth-gate";
import { PageHeader, Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { EmptyState, LoadingBlock } from "../../components/ui/states";

function NotificationsContent() {
  const { token } = useAuth();
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

  if (loading) return <LoadingBlock />;

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
        items.map((item) => (
          <Card key={item.id} className={item.isRead ? "opacity-80" : ""}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-ink">{item.title}</h2>
                  {!item.isRead ? <Badge tone="primary">New</Badge> : null}
                </div>
                {item.body ? <p className="mt-2 text-sm text-body">{item.body}</p> : null}
                <p className="mt-2 text-xs text-mute">{formatDateTime(item.createdAt)} · {item.type}</p>
              </div>
              {!item.isRead ? (
                <Button variant="secondary" className="px-4 py-2 text-sm" onClick={() => markRead(item.id)}>
                  Đánh dấu đã đọc
                </Button>
              ) : null}
            </div>
          </Card>
        ))
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
