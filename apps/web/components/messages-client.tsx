"use client";

import { FormEvent, useMemo, useState } from "react";

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

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) ?? conversations[0],
    [conversations, selectedId]
  );

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
    <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-xl bg-canvas p-4">
        <h2 className="px-2 text-sm font-semibold text-ink">Conversations</h2>
        <div className="mt-3 space-y-2">
          {conversations.map((conversation) => {
            const latest = conversation.messages[conversation.messages.length - 1];
            const active = conversation.id === selectedConversation?.id;

            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => setSelectedId(conversation.id)}
                className={`w-full rounded-xl px-3 py-3 text-left transition ${
                  active ? "bg-primary-pale" : "bg-canvas-soft hover:bg-primary-pale"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">{conversation.title}</p>
                  <span className={`h-2.5 w-2.5 rounded-full ${conversation.online ? "bg-positive" : "bg-mute"}`} />
                </div>
                {latest ? <p className="mt-1 line-clamp-1 text-xs text-body">{latest.content}</p> : null}
              </button>
            );
          })}
        </div>
      </aside>

      <article className="rounded-xl bg-canvas p-6">
        <div className="flex items-center justify-between border-b border-ink/10 pb-4">
          <div>
            <h2 className="text-sm font-semibold text-ink">{selectedConversation?.title ?? "Live Chat"}</h2>
            <p className="mt-1 text-xs text-body">
              {selectedConversation?.online ? "Online now" : "Offline"} • Mock realtime thread
            </p>
          </div>
          <span className={`h-3 w-3 rounded-full ${selectedConversation?.online ? "bg-positive" : "bg-mute"}`} />
        </div>

        <ul className="mt-4 space-y-3">
          {selectedConversation?.messages.map((message) => (
            <li
              key={message.id}
              className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
                message.sender === "self" ? "ml-auto bg-primary text-ink" : "bg-canvas-soft text-body"
              }`}
            >
              <p>{message.content}</p>
              <p className="mt-1 text-[10px] text-mute">{timeFormatter.format(new Date(message.sentAt))}</p>
            </li>
          ))}
        </ul>

        <form onSubmit={submitMessage} className="mt-6 flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="flex-1 rounded-xl border border-ink/20 px-4 py-3 text-sm outline-none transition focus:border-ink"
            placeholder="Type your message..."
          />
          <button
            type="submit"
            disabled={!selectedConversation || !draft.trim()}
            className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-ink transition hover:bg-primary-active disabled:cursor-not-allowed disabled:bg-primary-neutral"
          >
            Send
          </button>
        </form>
      </article>
    </section>
  );
}
