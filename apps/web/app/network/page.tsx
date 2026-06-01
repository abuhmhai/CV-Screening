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
import { Users, UserPlus, Check, X, Clock, MessageSquare, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "../../components/ui/input";

function NetworkContent() {
  const { token, user } = useAuth();
  const [connections, setConnections] = useState<ConnectionItem[]>([]);
  const [suggestions, setSuggestions] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredConnections = connections.filter(conn => {
    if (!searchQuery) return true;
    const isRequester = conn.requesterId === user?.id;
    const person = isRequester ? conn.addressee : conn.requester;
    const name = person?.profile?.fullName || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Mạng lưới"
        description="Quản lý kết nối nghề nghiệp và mở rộng network của bạn."
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="text-ink-deep" size={20} />
            <h2 className="text-xl font-bold text-ink">Gợi ý kết nối</h2>
          </div>
          
          <Card className="p-0 overflow-hidden">
            <div className="divide-y divide-ink/5">
              {suggestions.slice(0, 8).map((person, i) => {
                const isPending = connections.some(c => 
                  (c.addresseeId === person.id && c.requesterId === user?.id) ||
                  (c.requesterId === person.id && c.addresseeId === user?.id)
                );
                
                return (
                  <motion.div
                    key={person.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-canvas"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar
                        initials={person.profile?.fullName || person.email}
                        src={person.profile?.avatarUrl}
                        size="lg"
                      />
                      <div className="min-w-0">
                        <p className="text-[15px] font-bold text-ink truncate">{person.profile?.fullName ?? person.email.split('@')[0]}</p>
                        <p className="text-xs font-medium text-body truncate">{person.profile?.headline ?? "Professional"}</p>
                      </div>
                    </div>
                    {isPending ? (
                      <Button variant="secondary" className="px-4 py-1.5 text-xs w-full sm:w-auto" disabled leftIcon={<Clock size={14} />}>
                        Đã gửi
                      </Button>
                    ) : (
                      <Button variant="secondary" className="w-full px-4 py-1.5 text-body-sm sm:w-auto" onClick={() => connect(person.id)}>
                        Kết nối
                      </Button>
                    )}
                  </motion.div>
                );
              })}
              {suggestions.length === 0 ? (
                <div className="p-8 text-center text-body text-sm">
                  Chưa có gợi ý mới.
                </div>
              ) : null}
            </div>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-2">
              <Users className="text-ink-deep" size={20} />
              <h2 className="text-xl font-bold text-ink">Kết nối của tôi</h2>
              <span className="bg-canvas-soft text-body text-xs font-bold px-2 py-0.5 rounded-full">
                {connections.length}
              </span>
            </div>
            
            {connections.length > 0 && (
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" size={16} />
                <Input 
                  placeholder="Tìm kiếm kết nối..." 
                  className="pl-9 py-1.5 text-sm h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}
          </div>

          {connections.length === 0 ? (
            <EmptyState
              title="Chưa có kết nối"
              description="Kết nối sẽ hiển thị khi bạn gửi hoặc nhận lời mời."
              icon={<Users size={32} strokeWidth={1.5} />}
            />
          ) : filteredConnections.length === 0 ? (
            <div className="rounded-xl border border-dashed border-ink/10 bg-canvas p-8 text-center">
              <p className="text-body">Không tìm thấy kết nối nào phù hợp với "{searchQuery}"</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 stagger-children">
              {filteredConnections.map((conn, i) => {
                const isRequester = conn.requesterId === user?.id;
                const person = isRequester ? conn.addressee : conn.requester;
                const isPending = conn.status === "PENDING";
                const isAccepted = conn.status === "ACCEPTED";
                
                return (
                  <motion.div
                    key={conn.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                  >
                    <Card hover className={`h-full flex flex-col ${isPending && !isRequester ? 'border-primary/30 bg-primary-pale/10' : ''}`}>
                      <div className="flex items-start gap-3 mb-4">
                        <Avatar 
                          initials={person?.profile?.fullName || "Member"} 
                          size="lg" 
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[15px] truncate">{person?.profile?.fullName ?? "Member"}</p>
                          <p className="text-xs text-body truncate mt-0.5">Professional</p>
                          <div className="mt-2">
                            {isAccepted ? (
                              <Badge variant="accepted" className="flex w-fit items-center gap-1">
                                <Check size={12} /> Đã kết nối
                              </Badge>
                            ) : isPending ? (
                              <Badge variant="pending" className="flex w-fit items-center gap-1">
                                <span className="relative flex h-1.5 w-1.5 mr-0.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                                </span>
                                Đang chờ
                              </Badge>
                            ) : (
                              <Badge variant="rejected">Đã chặn</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-auto pt-4 border-t border-ink/5 flex gap-2">
                        {!isRequester && isPending ? (
                          <>
                            <Button
                              variant="primary"
                              className="flex-1 py-1.5 text-xs h-auto"
                              onClick={() => updateConnection(conn.id, "ACCEPTED")}
                            >
                              Chấp nhận
                            </Button>
                            <Button
                              variant="secondary"
                              className="flex-1 py-1.5 text-xs h-auto"
                              onClick={() => updateConnection(conn.id, "BLOCKED")}
                            >
                              Từ chối
                            </Button>
                          </>
                        ) : isAccepted ? (
                          <Button variant="secondary" className="w-full py-1.5 text-xs h-auto" leftIcon={<MessageSquare size={14} />}>
                            Nhắn tin
                          </Button>
                        ) : isRequester && isPending ? (
                          <Button variant="ghost" className="w-full py-1.5 text-xs h-auto" disabled leftIcon={<Clock size={14} />}>
                            Đã gửi lời mời
                          </Button>
                        ) : null}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
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
