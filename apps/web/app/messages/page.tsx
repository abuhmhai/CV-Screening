"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../../lib/auth-context";
import { apiFetch, getApiBase } from "../../lib/api-client";
import { ConversationParticipant } from "../../lib/types";
import { formatDateTime } from "../../lib/format";
import { AuthGate } from "../../components/auth-gate";
import { PageHeader, Card } from "../../components/ui/card";
import { Avatar } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import { FieldLabel, Input } from "../../components/ui/input";
import { EmptyState, LoadingBlock } from "../../components/ui/states";

interface UiMessage {
  id: string;
  senderId: string;
  content: string;
  sentAt: string;
  isMine: boolean;
}

function MessagesContent() {
  const { token, user } = useAuth();
  const [conversations, setConversations] = useState<ConversationParticipant[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingByUser, setTypingByUser] = useState<Record<string, boolean>>({});
  const socketRef = useRef<Socket | null>(null);

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

    socket.on("connect", () => {
      if (activeId) {
        socket.emit("join_conversation", { conversationId: activeId });
      }
    });

    socket.on("new_message", (payload: { conversationId: string; senderId: string; content: string; sentAt: string; messageId: string }) => {
      if (payload.conversationId !== activeId) return;
      setMessages((prev) => [
        ...prev,
        {
          id: payload.messageId,
          senderId: payload.senderId,
          content: payload.content,
          sentAt: payload.sentAt,
          isMine: payload.senderId === user.id
        }
      ]);
    });

    socket.on("typing", (payload: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (!activeId || payload.conversationId !== activeId || payload.userId === user.id) return;
      setTypingByUser((prev) => ({ ...prev, [payload.userId]: payload.isTyping }));
    });

    return () => {
      socketRef.current = null;
      socket.disconnect();
    };
  }, [token, user, activeId]);

  useEffect(() => {
    if (!activeId || !user) return;
    if (token) {
      void apiFetch(`/messages/conversations/${activeId}/read`, {
        method: "PATCH",
        token
      });
    }
    const conv = conversations.find((c) => c.conversation.id === activeId);
    if (!conv) return;
    const sorted = [...conv.conversation.messages].reverse().map((m) => ({
      id: m.id,
      senderId: m.senderId,
      content: m.content,
      sentAt: m.sentAt,
      isMine: m.senderId === user.id
    }));
    setMessages(sorted);
  }, [activeId, conversations, user]);

  const activeConv = useMemo(
    () => conversations.find((c) => c.conversation.id === activeId),
    [conversations, activeId]
  );

  const peer = activeConv?.conversation.participants.find((p) => p.userId !== user?.id)?.user;

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!token || !activeId || !draft.trim()) return;
    setSending(true);
    const res = await apiFetch<{ id: string; senderId: string; content: string; sentAt: string }>(
      "/messages",
      {
        method: "POST",
        token,
        body: JSON.stringify({ conversationId: activeId, content: draft.trim() })
      }
    );
    setSending(false);
    if (res.ok && res.data && user) {
      setMessages((prev) => [
        ...prev,
        {
          id: res.data!.id,
          senderId: res.data!.senderId,
          content: res.data!.content,
          sentAt: res.data!.sentAt,
          isMine: true
        }
      ]);
      setDraft("");
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

  if (loading) return <LoadingBlock />;

  return (
    <div className="space-y-6">
      <PageHeader title="Tin nhắn" description="Trao đổi trực tiếp với recruiter hoặc ứng viên." />

      {conversations.length === 0 ? (
        <EmptyState title="Chưa có hội thoại" description="Bắt đầu kết nối từ trang Mạng lưới." actionHref="/network" actionLabel="Mạng lưới" />
      ) : (
        <div className="grid min-h-[520px] overflow-hidden rounded-xl border border-ink/10 bg-canvas lg:grid-cols-[320px_1fr]">
          <div className="max-h-72 overflow-y-auto border-b border-ink/10 lg:max-h-none lg:border-b-0 lg:border-r">
            {conversations.map((item) => {
              const other = item.conversation.participants.find((p) => p.userId !== user?.id)?.user;
              const last = item.conversation.messages[0];
              return (
                <button
                  key={item.conversation.id}
                  type="button"
                  onClick={() => setActiveId(item.conversation.id)}
                  className={`flex w-full items-center gap-3 border-b border-ink/5 px-4 py-4 text-left transition hover:bg-canvas-soft ${
                    activeId === item.conversation.id ? "bg-primary-pale" : ""
                  }`}
                >
                  <Avatar name={other?.profile?.fullName} src={other?.profile?.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{other?.profile?.fullName ?? "User"}</p>
                    <p className="truncate text-xs text-mute">{last?.content ?? "No messages"}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col">
            <div className="border-b border-ink/10 px-6 py-4">
              <div className="flex items-center gap-3">
                <Avatar name={peer?.profile?.fullName} src={peer?.profile?.avatarUrl} />
                <p className="font-semibold">{peer?.profile?.fullName ?? "Conversation"}</p>
                {Object.values(typingByUser).some(Boolean) ? (
                  <span className="text-xs text-mute">Typing...</span>
                ) : null}
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.isMine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] break-words rounded-xl px-4 py-3 text-sm sm:max-w-[75%] ${
                      msg.isMine ? "bg-primary text-ink" : "bg-canvas-soft text-ink"
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className="mt-1 text-[10px] opacity-70">{formatDateTime(msg.sentAt)}</p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSend} className="border-t border-ink/10 p-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  className="!mt-0"
                  placeholder="Nhập tin nhắn..."
                  value={draft}
                  onChange={(e) => handleTyping(e.target.value)}
                />
                <Button type="submit" disabled={sending || !draft.trim()} className="px-4 py-2 text-sm">
                  Gửi
                </Button>
              </div>
            </form>
          </div>
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
