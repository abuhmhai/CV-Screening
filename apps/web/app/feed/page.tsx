"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { apiFetch } from "../../lib/api-client";
import { ConnectionItem, FeedPost, UserProfile } from "../../lib/types";
import { formatDateTime } from "../../lib/format";
import { AuthGate } from "../../components/auth-gate";
import { PageHeader, Card } from "../../components/ui/card";
import { Avatar } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import { FieldLabel, Input, Textarea } from "../../components/ui/input";
import { EmptyState, LoadingBlock } from "../../components/ui/states";
import { Badge } from "../../components/ui/badge";

function FeedContent() {
  const { token } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [suggestions, setSuggestions] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [commentDraftByPost, setCommentDraftByPost] = useState<Record<string, string>>({});
  const [posting, setPosting] = useState(false);

  async function loadFeed() {
    if (!token) return;
    const [feedRes, suggestionRes] = await Promise.all([
      apiFetch<FeedPost[]>("/feed", { token }),
      apiFetch<UserProfile[]>("/social/connections/suggestions", { token })
    ]);
    if (feedRes.ok && feedRes.data) setPosts(feedRes.data);
    if (suggestionRes.ok && suggestionRes.data) setSuggestions(suggestionRes.data);
    setLoading(false);
  }

  useEffect(() => {
    void loadFeed();
  }, [token]);

  async function handlePost(e: FormEvent) {
    e.preventDefault();
    if (!token || !content.trim()) return;
    setPosting(true);
    const res = await apiFetch<FeedPost>("/social/posts", {
      method: "POST",
      token,
      body: JSON.stringify({ content: content.trim(), visibility: "PUBLIC" })
    });
    setPosting(false);
    if (res.ok && res.data) {
      setPosts((prev) => [res.data!, ...prev]);
      setContent("");
    }
  }

  async function reactToPost(postId: string) {
    if (!token) return;
    const res = await apiFetch<FeedPost>(`/social/posts/${postId}/reactions`, {
      method: "POST",
      token,
      body: JSON.stringify({ reactionType: "LIKE" })
    });
    if (res.ok) {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, likeCount: (post.likeCount ?? 0) + 1 } : post
        )
      );
    }
  }

  async function addComment(postId: string) {
    if (!token) return;
    const content = commentDraftByPost[postId]?.trim();
    if (!content) return;
    const result = await apiFetch<{ id: string; content: string; createdAt: string }>(
      `/social/posts/${postId}/comments`,
      {
        method: "POST",
        token,
        body: JSON.stringify({ content })
      }
    );
    if (!result.ok) return;
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              commentCount: (post.commentCount ?? 0) + 1,
              comments: [
                {
                  id: result.data!.id,
                  content: result.data!.content,
                  createdAt: result.data!.createdAt,
                  author: { id: "me" }
                },
                ...(post.comments ?? [])
              ]
            }
          : post
      )
    );
    setCommentDraftByPost((prev) => ({ ...prev, [postId]: "" }));
  }

  async function reportPost(postId: string) {
    if (!token) return;
    await apiFetch("/moderation/reports", {
      method: "POST",
      token,
      body: JSON.stringify({
        contentType: "POST",
        targetId: postId,
        reason: "Inappropriate content"
      })
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <div className="space-y-6">
        <PageHeader title="Bảng tin" description="Cập nhật từ mạng lưới và cộng đồng nghề nghiệp của bạn." />

        <Card>
          <form onSubmit={handlePost}>
            <FieldLabel label="Chia sẻ cập nhật">
              <Textarea
                rows={3}
                placeholder="Chia sẻ thành tựu, insight nghề nghiệp..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </FieldLabel>
            <div className="mt-4 flex justify-end">
              <Button type="submit" disabled={posting || !content.trim()} className="px-5 py-2 text-sm">
                {posting ? "Đang đăng..." : "Đăng bài"}
              </Button>
            </div>
          </form>
        </Card>

        {loading ? (
          <LoadingBlock />
        ) : posts.length === 0 ? (
          <EmptyState title="Feed trống" description="Kết nối thêm người hoặc đăng bài đầu tiên." />
        ) : (
          posts.map((post) => (
            <Card key={post.id}>
              <div className="flex gap-3">
                <Avatar
                  name={post.author?.profile?.fullName}
                  src={post.author?.profile?.avatarUrl}
                />
                <div className="flex-1">
                  <p className="font-semibold text-ink">
                    {post.author?.profile?.fullName ?? "Member"}
                  </p>
                  <p className="text-xs text-mute">{formatDateTime(post.createdAt)}</p>
                  <p className="mt-3 text-body-md text-body">{post.content}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge tone="primary">Score {post.feedScore?.toFixed(1) ?? "0"}</Badge>
                    <Badge tone="default">👍 {post.likeCount}</Badge>
                    <Badge tone="default">💬 {post.commentCount}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      className="px-3 py-1 text-xs"
                      variant="secondary"
                      onClick={() => reactToPost(post.id)}
                    >
                      Like
                    </Button>
                    <Button
                      className="px-3 py-1 text-xs"
                      variant="tertiary"
                      onClick={() => reportPost(post.id)}
                    >
                      Report
                    </Button>
                  </div>
                  <div className="mt-4 space-y-2 rounded-lg bg-canvas-soft p-3">
                    {(post.comments ?? []).slice(0, 3).map((comment) => (
                      <div key={comment.id} className="rounded-md bg-canvas px-3 py-2 text-sm">
                        <p>{comment.content}</p>
                        <p className="mt-1 text-[11px] text-mute">
                          {formatDateTime(comment.createdAt)}
                        </p>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        className="mt-0"
                        placeholder="Viết bình luận..."
                        value={commentDraftByPost[post.id] ?? ""}
                        onChange={(e) =>
                          setCommentDraftByPost((prev) => ({
                            ...prev,
                            [post.id]: e.target.value
                          }))
                        }
                      />
                      <Button className="px-3 py-2 text-xs" onClick={() => addComment(post.id)}>
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <aside className="space-y-4">
        <Card>
          <h2 className="font-semibold">Trending skills</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {["TypeScript", "NestJS", "React", "PostgreSQL", "FastAPI"].map((s) => (
              <span key={s} className="rounded-pill bg-canvas-soft px-3 py-1 text-xs font-semibold">
                {s}
              </span>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="font-semibold">Gợi ý kết nối</h2>
          <div className="mt-3 space-y-3">
            {suggestions.slice(0, 5).map((person) => (
              <div key={person.id} className="flex items-center justify-between gap-2 rounded-lg bg-canvas-soft p-3">
                <div className="flex items-center gap-2">
                  <Avatar
                    name={person.profile?.fullName}
                    email={person.email}
                    src={person.profile?.avatarUrl}
                    size="sm"
                  />
                  <div>
                    <p className="text-sm font-semibold">{person.profile?.fullName ?? person.email}</p>
                    <p className="text-xs text-mute">{person.profile?.headline ?? "Professional"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </aside>
    </div>
  );
}

export default function FeedPage() {
  return (
    <AuthGate>
      <FeedContent />
    </AuthGate>
  );
}
