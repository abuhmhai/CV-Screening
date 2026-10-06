"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { FeedPost } from "../../lib/types";
import { apiFetch } from "../../lib/api-client";
import { PostReactionType } from "../../lib/reactions";
import { Avatar } from "../ui/avatar";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { ReactionPicker } from "./reaction-picker";
import { formatDateTime } from "../../lib/format";

type Comment = NonNullable<FeedPost["comments"]>[number];

export function CommentThread({ post, token, onChange, expanded: expandedProp }: { post: FeedPost; token: string | null; expanded?: boolean; onChange: (comments: Comment[]) => void }) {
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => { if (expandedProp !== undefined) setExpanded(expandedProp); }, [expandedProp]);
  const comments = post.comments ?? [];
  const roots = comments.filter(c => !c.parentId || !comments.some(p => p.id === c.parentId));

  async function send() {
    if (!token || !draft.trim() || busy) return;
    setBusy(true);
    const res = await apiFetch<Comment>(`/social/posts/${post.id}/comments`, { method: "POST", token, body: JSON.stringify({ content: draft.trim(), parentId: replyTo?.id }) });
    setBusy(false);
    if (!res.ok || !res.data) return void toast.error(res.error ?? "Không gửi được bình luận");
    onChange([...comments, res.data]);
    setDraft(""); setReplyTo(null); setExpanded(true);
  }

  async function react(comment: Comment, reactionType: PostReactionType) {
    const res = await apiFetch<{ userReaction: PostReactionType | null }>(`/social/comments/${comment.id}/reactions`, { method: "POST", token, body: JSON.stringify({ reactionType }) });
    if (!res.ok || !res.data) return void toast.error(res.error ?? "Không gửi được cảm xúc");
    onChange(comments.map(c => c.id === comment.id ? { ...c, userReaction: res.data!.userReaction } : c));
  }

  function renderComment(comment: Comment, depth = 0): React.ReactNode {
    return <div key={comment.id} className={depth ? "ml-4 border-l border-hairline-strong pl-3" : ""}>
      <div className="flex gap-2 rounded-lg bg-surface-card p-3">
        <Link href={`/u/${comment.author?.id}`}><Avatar name={comment.author?.profile?.fullName} src={comment.author?.profile?.avatarUrl} size="sm" /></Link>
        <div className="min-w-0 flex-1">
          <Link href={`/u/${comment.author?.id}`} className="text-xs font-bold text-ink hover:underline">{comment.author?.profile?.fullName ?? "Thành viên"}</Link>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-body">{comment.content}</p>
          <p className="mt-1 text-xs text-mute">{formatDateTime(comment.createdAt)}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <ReactionPicker activeReaction={comment.userReaction} disabled={!token} onReact={type => void react(comment, type)} />
            <button type="button" className="text-xs font-semibold text-link" onClick={() => setReplyTo(comment)}>Trả lời</button>
          </div>
        </div>
      </div>
      {depth < 10 ? comments.filter(c => c.parentId === comment.id).map(c => renderComment(c, depth + 1)) : null}
    </div>;
  }

  return <div className="rounded-xl bg-canvas-soft p-3">
    <div className="space-y-2">{(expanded ? roots : roots.slice(0, 2)).map(c => renderComment(c))}</div>
    {roots.length > 2 ? <button type="button" className="my-2 text-xs font-semibold text-link" onClick={() => setExpanded(v => !v)}>{expanded ? "Thu gọn" : `Xem thêm ${roots.length - 2} bình luận`}</button> : null}
    {replyTo ? <div className="mt-3 flex justify-between text-xs text-body">Đang trả lời {replyTo.author?.profile?.fullName}<button type="button" onClick={() => setReplyTo(null)} className="text-link">Hủy</button></div> : null}
    <form className="mt-3 flex gap-2" onSubmit={e => { e.preventDefault(); void send(); }}>
      <Input aria-label={replyTo ? "Nội dung trả lời" : "Nội dung bình luận"} placeholder={replyTo ? "Viết trả lời..." : "Viết bình luận..."} maxLength={1200} value={draft} onChange={e => setDraft(e.target.value)} className="!mt-0" />
      <Button type="submit" disabled={!draft.trim() || busy || !token}>Gửi</Button>
    </form>
  </div>;
}
