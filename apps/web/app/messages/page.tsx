"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { MessageSquare } from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { apiFetch, getApiBase } from "../../lib/api-client";
import { ConversationParticipant } from "../../lib/types";
import { formatDateTime } from "../../lib/format";
import { AuthGate } from "../../components/auth-gate";
import { PageHeader } from "../../components/ui/card";
import { Avatar } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { EmptyState, LoadingBlock } from "../../components/ui/states";
import {
  deliveryStatusFromRead,
  MessageDeliveryStatus,
  MessageStatusBadge
} from "../../components/messages/message-status";

interface ApiMessage {
  id: string;
  senderId: string;
  content: string;
  sentAt: string;
  isRead: boolean;
}

interface UiMessage {
  id: string;
  senderId: string;
  content: string;
  sentAt: string;
  isMine: boolean;
  status: MessageDeliveryStatus;
}

function toUiMessage(
  m: ApiMessage,
  currentUserId: string,
  statusOverride?: MessageDeliveryStatus
): UiMessage {
  const isMine = m.senderId === currentUserId;
  return {
    id: m.id,
    senderId: m.senderId,
    content: m.content,
    sentAt: m.sentAt,
    isMine,
    status: statusOverride ?? deliveryStatusFromRead(isMine, m.isRead)
  };
}

function upsertMessage(prev: UiMessage[], next: UiMessage): UiMessage[] {
  const byId = prev.findIndex((m) => m.id === next.id);
  if (byId >= 0) {
    return prev.map((m, i) => (i === byId ? { ...m, ...next } : m));
  }
  const pendingIdx = prev.findIndex(
    (m) => m.id.startsWith("pending-") && m.isMine && m.content === next.content && m.status === "sending"
  );
  if (pendingIdx >= 0) {
    return prev.map((m, i) => (i === pendingIdx ? next : m));
  }
  if (prev.some((m) => m.id === next.id)) return prev;
  return [...prev, next];
}

function markMessagesSeen(prev: UiMessage[], messageIds: string[]): UiMessage[] {
  const idSet = new Set(messageIds);
  return prev.map((m) =>
    m.isMine && idSet.has(m.id) ? { ...m, status: "seen" as const } : m
  );
}

function MessagesContent() {
  const { token, user } = useAuth();
  const [conversations, setConversations] = useState<ConversationParticipant[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [typingByUser, setTypingByUser] = useState<Record<string, boolean>>({});
  const socketRef = useRef<Socket | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!token) return;
    void apiFetch<ConversationParticipant[]>("/messages/conversations", { token }).then((res) => {
      if (res.ok && res.data) {
        setConversations(res.data);
        if (res.data[0]) setActiveId(res.data[0].conversation.id);
      }
      setLoading(false);
    });
  }, [token]);

  useEffect(() => {
    if (!token || !user) return;

    const socket: Socket = io(`${getApiBase()}/messages`, {
      auth: { token: `Bearer ${token}` },
      transports: ["websocket"]
    });
    socketRef.current = socket;

    socket.on(
      "new_message",
      (payload: {
        conversationId: string;
        senderId: string;
        content: string;
        sentAt: string;
        messageId: string;
        isRead?: boolean;
      }) => {
        if (payload.conversationId !== activeIdRef.current) return;
        setMessages((prev) =>
          upsertMessage(
            prev,
            toUiMessage(
              {
                id: payload.messageId,
                senderId: payload.senderId,
                content: payload.content,
                sentAt: payload.sentAt,
                isRead: payload.isRead ?? false
              },
              user.id
            )
          )
        );
      }
    );

    socket.on(
      "messages_read",
      (payload: { conversationId: string; messageIds: string[] }) => {
        if (payload.conversationId !== activeIdRef.current) return;
        setMessages((prev) => markMessagesSeen(prev, payload.messageIds));
      }
    );

    socket.on("typing", (payload: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (payload.conversationId !== activeIdRef.current || payload.userId === user.id) return;
      setTypingByUser((prev) => ({ ...prev, [payload.userId]: payload.isTyping }));
    });

    return () => {
      socketRef.current = null;
      socket.disconnect();
    };
  }, [token, user]);

  useEffect(() => {
    if (!activeId || !socketRef.current) return;
    socketRef.current.emit("join_conversation", { conversationId: activeId });
  }, [activeId]);

  useEffect(() => {
    if (!activeId || !user || !token) return;

    setLoadingMessages(true);
    void apiFetch<{ messageIds?: string[] }>(`/messages/conversations/${activeId}/read`, {
      method: "PATCH",
      token
    });

    void apiFetch<ApiMessage[]>(`/messages/conversations/${activeId}`, { token }).then((res) => {
      if (res.ok && res.data) {
        setMessages(res.data.map((m) => toUiMessage(m, user.id)));
      } else {
        setMessages([]);
      }
      setLoadingMessages(false);
    });
  }, [activeId, user, token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loadingMessages, scrollToBottom]);

  const activeConv = useMemo(
    () => conversations.find((c) => c.conversation.id === activeId),
    [conversations, activeId]
  );

  const peer = activeConv?.conversation.participants.find((p) => p.userId !== user?.id)?.user;
  const isTyping = Object.values(typingByUser).some(Boolean);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!token || !activeId || !draft.trim() || sending || !user) return;

    const content = draft.trim();
    const tempId = `pending-${Date.now()}`;
    const optimistic: UiMessage = {
      id: tempId,
      senderId: user.id,
      content,
      sentAt: new Date().toISOString(),
      isMine: true,
      status: "sending"
    };

    setMessages((prev) => [...prev, optimistic]);
    setDraft("");
    setSending(true);
    socketRef.current?.emit("typing", { conversationId: activeId, isTyping: false });

    const res = await apiFetch<ApiMessage>("/messages", {
      method: "POST",
      token,
      body: JSON.stringify({ conversationId: activeId, content })
    });

    setSending(false);

    if (res.ok && res.data) {
      setMessages((prev) =>
        upsertMessage(prev, toUiMessage(res.data!, user.id, "sent"))
      );
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  }

  function handleTyping(nextValue: string) {
    setDraft(nextValue);
    if (!activeId || !socketRef.current) return;
    socketRef.current.emit("typing", {
      conversationId: activeId,
      isTyping: nextValue.length > 0
    });
  }

  if (loading) return <LoadingBlock label="Đang tải hội thoại..." />;

  return (
    <div className="space-y-6">
      <PageHeader title="Tin nhắn" description="Trao đổi trực tiếp với recruiter hoặc ứng viên." />

      {conversations.length === 0 ? (
        <EmptyState
          title="Chưa có hội thoại"
          description="Kết nối với recruiter hoặc ứng viên từ trang Mạng lưới để bắt đầu trò chuyện."
          actionHref="/network"
          actionLabel="Đến Mạng lưới"
          icon={<MessageSquare size={28} strokeWidth={1.5} className="text-body" />}
        />
      ) : (
        <div className="grid min-h-[min(72vh,680px)] overflow-hidden rounded-xl border border-hairline-strong bg-surface-card lg:grid-cols-[minmax(260px,320px)_1fr]">
          <aside className="max-h-80 overflow-y-auto border-b border-hairline lg:max-h-none lg:border-b-0 lg:border-r">
            {conversations.map((item) => {
              const other = item.conversation.participants.find((p) => p.userId !== user?.id)?.user;
              const last = item.conversation.messages[0];
              const isActive = activeId === item.conversation.id;
              return (
                <button
                  key={item.conversation.id}
                  type="button"
                  onClick={() => setActiveId(item.conversation.id)}
                  className={`flex w-full items-center gap-3 border-b border-hairline px-4 py-3.5 text-left transition ${
                    isActive
                      ? "bg-accent-blue-glow border-l-2 border-l-accent-blue"
                      : "hover:bg-surface-elevated"
                  }`}
                >
                  <Avatar name={other?.profile?.fullName} src={other?.profile?.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {other?.profile?.fullName ?? "Người dùng"}
                    </p>
                    <p className="truncate text-xs text-mute">{last?.content ?? "Chưa có tin nhắn"}</p>
                  </div>
                </button>
              );
            })}
          </aside>

          <section className="flex min-h-[420px] flex-col">
            <header className="flex items-center gap-3 border-b border-hairline px-4 py-3 sm:px-6">
              <Avatar name={peer?.profile?.fullName} src={peer?.profile?.avatarUrl} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{peer?.profile?.fullName ?? "Hội thoại"}</p>
                {isTyping ? <p className="text-xs text-mute">Đang nhập...</p> : null}
              </div>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-6">
              {loadingMessages ? (
                <LoadingBlock label="Đang tải tin nhắn..." />
              ) : messages.length === 0 ? (
                <p className="py-8 text-center text-sm text-mute">Chưa có tin nhắn. Hãy gửi lời chào đầu tiên.</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isMine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] break-words rounded-2xl px-4 py-2.5 text-sm shadow-sm sm:max-w-[70%] ${
                        msg.isMine
                          ? "bg-accent-blue text-ink"
                          : "border border-hairline bg-surface-elevated text-body"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <div
                        className={`mt-1 flex items-center justify-end gap-2 ${
                          msg.isMine ? "text-ink/70" : "text-mute"
                        }`}
                      >
                        <span className="text-[10px]">{formatDateTime(msg.sentAt)}</span>
                        {msg.isMine ? <MessageStatusBadge status={msg.status} /> : null}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="border-t border-hairline p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  className="!mt-0 flex-1"
                  placeholder="Nhập tin nhắn..."
                  value={draft}
                  maxLength={5000}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSend(e);
                    }
                  }}
                />
                <Button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  className="shrink-0 px-5 py-2.5 text-sm"
                >
                  Gửi
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <AuthGate>
      <MessagesContent />
    </AuthGate>
  );
}
