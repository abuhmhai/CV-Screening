"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Send } from "lucide-react";

interface MessageItem {
  id: string;
  content: string;
  sentAt: string;
  sender: "self" | "other";
}

interface ConversationItem {
  id: string;
  title: string;
  online: boolean;
  messages: MessageItem[];
}

interface MessagesClientProps {
  initialConversations: ConversationItem[];
}

const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit"
});

export function MessagesClient({ initialConversations }: MessagesClientProps) {
  const [conversations, setConversations] = useState<ConversationItem[]>(initialConversations);
  const [selectedId, setSelectedId] = useState<string>(initialConversations[0]?.id ?? "");
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLUListElement>(null);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) ?? conversations[0],
    [conversations, selectedId]
  );

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedConversation?.messages]);

  const submitMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextContent = draft.trim();
    if (!nextContent || !selectedConversation) {
      return;
    }

    const nextMessage: MessageItem = {
      id: `${selectedConversation.id}-${Date.now()}`,
      content: nextContent,
      sentAt: new Date().toISOString(),
      sender: "self"
    };

    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.id === selectedConversation.id
          ? { ...conversation, messages: [...conversation.messages, nextMessage] }
          : conversation
      )
    );
    setDraft("");
  };

  return (
    <section className="grid gap-4 lg:grid-cols-[300px_1fr]" style={{ height: "calc(100vh - 8rem)", minHeight: "500px" }}>
      {/* Conversation List */}
      <aside className="flex flex-col rounded-xl bg-surface-card border border-hairline overflow-hidden">
        <div className="px-4 py-3 border-b border-hairline">
          <h2 className="text-sm font-bold text-ink">Tin nhắn</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map((conversation) => {
            const latest = conversation.messages[conversation.messages.length - 1];
            const active = conversation.id === selectedConversation?.id;

            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => setSelectedId(conversation.id)}
                className={`w-full rounded-xl px-3 py-3 text-left transition-all ${
                  active
                    ? "bg-accent-blue/10 border border-accent-blue/20"
                    : "hover:bg-surface-elevated border border-transparent"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative shrink-0">
                      <div className="h-9 w-9 rounded-full bg-surface-elevated flex items-center justify-center text-xs font-bold text-ink">
                        {conversation.title.slice(0, 2).toUpperCase()}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface-card ${
                          conversation.online ? "bg-positive" : "bg-mute"
                        }`}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{conversation.title}</p>
                      {latest ? (
                        <p className="mt-0.5 line-clamp-1 text-xs text-mute">{latest.content}</p>
                      ) : (
                        <p className="mt-0.5 text-xs text-mute italic">Chưa có tin nhắn</p>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Chat Window */}
      <article className="flex flex-col rounded-xl bg-surface-card border border-hairline overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-9 w-9 rounded-full bg-surface-elevated flex items-center justify-center text-xs font-bold text-ink">
                {(selectedConversation?.title ?? "?").slice(0, 2).toUpperCase()}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface-card ${
                  selectedConversation?.online ? "bg-positive" : "bg-mute"
                }`}
              />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink">{selectedConversation?.title ?? "Live Chat"}</h2>
              <p className="text-xs text-mute">
                {selectedConversation?.online ? "Đang hoạt động" : "Ngoại tuyến"}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ul
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
        >
          {selectedConversation?.messages.map((message) => (
            <li
              key={message.id}
              className={`flex ${message.sender === "self" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  message.sender === "self"
                    ? "bg-accent-blue text-white rounded-br-sm"
                    : "bg-surface-elevated text-ink rounded-bl-sm"
                }`}
              >
                <p className="leading-relaxed">{message.content}</p>
                <p className={`mt-1 text-[10px] ${message.sender === "self" ? "text-white/60" : "text-mute"}`}>
                  {timeFormatter.format(new Date(message.sentAt))}
                </p>
              </div>
            </li>
          ))}
          <div ref={messagesEndRef} />
        </ul>

        {/* Input */}
        <form onSubmit={submitMessage} className="border-t border-hairline p-3 flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (draft.trim()) {
                  const form = e.currentTarget.closest("form");
                  form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
                }
              }
            }}
            className="flex-1 rounded-xl border border-hairline bg-surface-elevated px-4 py-2.5 text-sm text-ink outline-none transition focus:border-accent-blue placeholder:text-mute"
            placeholder="Nhập tin nhắn... (Enter để gửi)"
          />
          <button
            type="submit"
            disabled={!selectedConversation || !draft.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-blue text-white transition hover:bg-accent-blue/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </form>
      </article>
    </section>
  );
}
