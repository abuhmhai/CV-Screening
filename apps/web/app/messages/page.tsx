"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
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
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const stickToBottom = useRef(true);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<UiMessage[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [reportMessage, setReportMessage] = useState<UiMessage | null>(null);
  const [reportReason, setReportReason] = useState("");

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const scrollToBottom = useCallback(() => {
    const el = messagesContainerRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
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
      transports: ["polling", "websocket"]
    });
    socketRef.current = socket;
    socket.on("connect", () => {
      if (activeIdRef.current) socket.emit("join_conversation", { conversationId: activeIdRef.current });
    });

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
        setConversations(prev => prev.map(item => item.conversation.id === payload.conversationId ? {
          ...item, conversation: { ...item.conversation, messages: [{ id: payload.messageId, senderId: payload.senderId, content: payload.content, sentAt: payload.sentAt }] }
        } : item).sort((a, b) => new Date(b.conversation.messages[0]?.sentAt ?? 0).getTime() - new Date(a.conversation.messages[0]?.sentAt ?? 0).getTime()));
        if (payload.conversationId !== activeIdRef.current) return;
        if (payload.senderId !== user.id) void apiFetch(`/messages/conversations/${payload.conversationId}/read`, { method: "PATCH", token });
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
    let cancelled = false;
    stickToBottom.current = true;
    setMessages([]); setSearch(""); setSearchResults([]); setTypingByUser({});
    setLoadingMessages(true);
    void apiFetch<{ messageIds?: string[] }>(`/messages/conversations/${activeId}/read`, {
      method: "PATCH",
      token
    });

    void apiFetch<ApiMessage[]>(`/messages/conversations/${activeId}`, { token }).then((res) => {
      if (cancelled) return;
      if (res.ok && res.data) {
        setMessages(res.data.map((m) => toUiMessage(m, user.id)));
        setHasOlder(res.data.length === 100);
      } else {
        setMessages([]);
      }
      setLoadingMessages(false);
    });
    return () => { cancelled = true; };
  }, [activeId, user, token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loadingMessages, scrollToBottom]);

  // Polling also supports deployments without a persistent WebSocket server.
  useEffect(() => {
    if (!activeId || !user || !token) return;
    let cancelled = false;
    const timer = setInterval(async () => {
      const convRes = await apiFetch<ConversationParticipant[]>("/messages/conversations", { token });
      if (!cancelled && convRes.data) setConversations(convRes.data);
      const res = await apiFetch<ApiMessage[]>(`/messages/conversations/${activeId}`, { token });
      if (cancelled || !res.ok || !res.data) return;
      setMessages(prev => res.data!.reduce((items, m) => upsertMessage(items, toUiMessage(m, user.id)), prev));
      if (res.data.some(m => !m.isRead && m.senderId !== user.id)) void apiFetch(`/messages/conversations/${activeId}/read`, { method: "PATCH", token });
    }, 3000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [activeId, token, user]);

  useEffect(() => {
    if (!activeId || !token || !user || !search.trim()) { setSearchResults([]); return; }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      const res = await apiFetch<ApiMessage[]>(`/messages/conversations/${activeId}?q=${encodeURIComponent(search.trim())}`, { token });
      if (cancelled) return;
      setSearchResults((res.data ?? []).map(m => toUiMessage(m, user.id))); setSearching(false);
      if (!res.ok) toast.error(res.error ?? "Không tìm được tin nhắn");
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [search, activeId, token, user]);

  async function loadOlder() {
    if (!activeId || !token || !user || !messages[0] || loadingOlder) return;
    const conversationId = activeId;
    setLoadingOlder(true);
    const el = messagesContainerRef.current;
    const oldHeight = el?.scrollHeight ?? 0;
    const res = await apiFetch<ApiMessage[]>(`/messages/conversations/${activeId}?before=${messages[0].id}`, { token });
    setLoadingOlder(false);
    if (conversationId !== activeIdRef.current) return;
    if (!res.ok || !res.data) return void toast.error(res.error ?? "Không tải được tin nhắn cũ");
    stickToBottom.current = false;
    setHasOlder(res.data.length === 100);
    setMessages(prev => [...res.data!.map(m => toUiMessage(m, user.id)).filter(m => !prev.some(p => p.id === m.id)), ...prev]);
    requestAnimationFrame(() => { if (el) el.scrollTop += el.scrollHeight - oldHeight; });
  }

  async function submitReport() {
    if (!reportMessage || !reportReason.trim() || !token) return;
    const res = await apiFetch("/moderation/reports", { method: "POST", token, body: JSON.stringify({ contentType: "MESSAGE", targetId: reportMessage.id, reason: reportReason.trim() }) });
    if (!res.ok) return void toast.error(res.error ?? "Không gửi được báo cáo");
    setReportMessage(null); setReportReason(""); toast.success("Đã gửi báo cáo đến quản trị viên");
  }

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
    const sendingConversationId = activeId;
    stickToBottom.current = true;
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
    if (activeIdRef.current !== sendingConversationId) return;

    if (res.ok && res.data) {
      setMessages((prev) =>
        upsertMessage(prev, toUiMessage(res.data!, user.id, "sent"))
      );
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setDraft(content);
      toast.error(res.error ?? "Gửi tin nhắn thất bại");
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
        <div className="grid h-[min(76dvh,760px)] min-h-[500px] grid-rows-[120px_minmax(0,1fr)] overflow-hidden rounded-xl border border-hairline-strong bg-surface-card lg:grid-cols-[minmax(260px,320px)_1fr] lg:grid-rows-1">
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

          <section className="flex min-h-0 min-w-0 flex-col">
            <header className="flex items-center gap-3 border-b border-hairline px-4 py-3 sm:px-6">
              <Avatar name={peer?.profile?.fullName} src={peer?.profile?.avatarUrl} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{peer?.profile?.fullName ?? "Hội thoại"}</p>
                {isTyping ? <p className="text-xs text-mute">Đang nhập...</p> : null}
              </div>
            </header>

            <div className="shrink-0 border-b border-hairline px-4 py-2"><Input aria-label="Tìm trong cuộc trò chuyện" placeholder="Tìm tin nhắn cũ..." value={search} onChange={e => setSearch(e.target.value)} className="!mt-0" /></div>
            <div ref={messagesContainerRef} onScroll={e => { const el = e.currentTarget; stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; }} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
              {!search.trim() && hasOlder ? <Button variant="ghost" disabled={loadingOlder} onClick={() => void loadOlder()}>Tải tin nhắn cũ hơn</Button> : null}
              {search.trim() ? <p className="text-xs text-mute">{searching ? "Đang tìm..." : `${searchResults.length} kết quả`}</p> : null}
              {loadingMessages ? (
                <LoadingBlock label="Đang tải tin nhắn..." />
              ) : messages.length === 0 ? (
                <p className="py-8 text-center text-sm text-mute">Chưa có tin nhắn. Hãy gửi lời chào đầu tiên.</p>
              ) : (
                (search.trim() ? searchResults : messages).map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isMine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] break-words rounded-2xl px-4 py-2.5 text-sm shadow-sm sm:max-w-[70%] ${
                        msg.isMine
                          ? "bg-[#2563eb] text-white"
                          : "border border-hairline bg-surface-elevated text-body"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <div
                        className={`mt-1 flex items-center justify-end gap-2 ${
                          msg.isMine ? "text-white/90" : "text-mute"
                        }`}
                      >
                        <span className="text-[10px]">{formatDateTime(msg.sentAt)}</span>
                        {msg.isMine ? <MessageStatusBadge status={msg.status} /> : null}
                        {!msg.id.startsWith("pending-") ? <button type="button" aria-label="Báo cáo tin nhắn" className="text-[10px] underline" onClick={() => { setReportMessage(msg); setReportReason(""); }}>Báo cáo</button> : null}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="shrink-0 border-t border-hairline p-4">
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
      {reportMessage ? <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"><div role="dialog" aria-modal="true" aria-label="Báo cáo tin nhắn" className="w-full max-w-md space-y-4 rounded-xl bg-surface-card p-6"><h2 className="font-bold text-ink">Báo cáo tin nhắn</h2><p className="max-h-32 overflow-auto break-words text-sm text-body">{reportMessage.content}</p><Input aria-label="Lý do báo cáo" placeholder="Lý do báo cáo..." maxLength={300} value={reportReason} onChange={e => setReportReason(e.target.value)} /><div className="flex gap-2"><Button disabled={!reportReason.trim()} onClick={() => void submitReport()}>Gửi báo cáo</Button><Button variant="secondary" onClick={() => setReportMessage(null)}>Hủy</Button></div></div></div> : null}
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
