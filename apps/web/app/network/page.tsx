"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { apiFetch } from "../../lib/api-client";
import { ConnectionItem, UserProfile } from "../../lib/types";
import { AuthGate } from "../../components/auth-gate";
import { PageHeader, Card } from "../../components/ui/card";
import { Avatar } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { EmptyState, LoadingBlock } from "../../components/ui/states";
import { Button } from "../../components/ui/button";

function NetworkContent() {
  const { token, user } = useAuth();
  const [connections, setConnections] = useState<ConnectionItem[]>([]);
  const [suggestions, setSuggestions] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    if (!token) return;
    const [connRes, suggestionRes] = await Promise.all([
      apiFetch<ConnectionItem[]>("/social/connections", { token }),
      apiFetch<UserProfile[]>("/social/connections/suggestions", { token })
    ]);
    if (connRes.ok && connRes.data) setConnections(connRes.data);
    if (suggestionRes.ok && suggestionRes.data) setSuggestions(suggestionRes.data);
    setLoading(false);
  }

  useEffect(() => {
    void loadAll();
  }, [token]);

  async function updateConnection(connectionId: string, status: "ACCEPTED" | "BLOCKED") {
    if (!token) return;
    await apiFetch(`/social/connections/${connectionId}/status`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ status })
    });
    await loadAll();
  }

  async function connect(addresseeId: string) {
    if (!token) return;
    await apiFetch("/social/connections", {
      method: "POST",
      token,
      body: JSON.stringify({ addresseeId })
    });
    await loadAll();
  }

  if (loading) return <LoadingBlock />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mạng lưới"
        description="Quản lý kết nối nghề nghiệp và mở rộng network của bạn."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Gợi ý kết nối</h2>
          <div className="mt-4 space-y-3">
            {suggestions.slice(0, 8).map((person) => (
              <div
                key={person.id}
                className="flex flex-col gap-3 rounded-lg bg-canvas-soft p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar
                    name={person.profile?.fullName}
                    email={person.email}
                    src={person.profile?.avatarUrl}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{person.profile?.fullName ?? person.email}</p>
                    <p className="text-xs text-mute">{person.profile?.headline ?? "Professional"}</p>
                  </div>
                </div>
                <Button className="px-3 py-1 text-xs" onClick={() => connect(person.id)}>
                  Connect
                </Button>
              </div>
            ))}
            {suggestions.length === 0 ? (
              <p className="text-sm text-body">Chưa có gợi ý mới.</p>
            ) : null}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Kết nối của tôi</h2>
          {connections.length === 0 ? (
            <EmptyState
              title="Chưa có kết nối"
              description="Kết nối sẽ hiển thị khi bạn gửi hoặc nhận lời mời."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {connections.map((conn) => {
                const isRequester = conn.requesterId === user?.id;
                const person = isRequester ? conn.addressee : conn.requester;
                return (
                  <Card key={conn.id} className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <Avatar name={person?.profile?.fullName} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{person?.profile?.fullName ?? "Member"}</p>
                      <Badge tone={conn.status === "ACCEPTED" ? "positive" : "warning"}>{conn.status}</Badge>
                    </div>
                    {!isRequester && conn.status === "PENDING" ? (
                      <div className="flex gap-1">
                        <Button
                          className="px-3 py-1 text-xs"
                          onClick={() => updateConnection(conn.id, "ACCEPTED")}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="tertiary"
                          className="px-3 py-1 text-xs"
                          onClick={() => updateConnection(conn.id, "BLOCKED")}
                        >
                          Block
                        </Button>
                      </div>
                    ) : null}
                  </Card>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function NetworkPage() {
  return (
    <AuthGate>
      <NetworkContent />
    </AuthGate>
  );
}
