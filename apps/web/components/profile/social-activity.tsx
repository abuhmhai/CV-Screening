"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useAuth } from "../../lib/auth-context";
import { apiFetch } from "../../lib/api-client";
import { FeedPost } from "../../lib/types";
import { PostReactionType } from "../../lib/reactions";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { ReactionPicker } from "../feed/reaction-picker";
import { CommentThread } from "../feed/comment-thread";
import { formatDateTime } from "../../lib/format";

export function SocialActivity({ userId }: { userId: string }) {
  const { token, user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [busy, setBusy] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  async function load(append = false) {
    const cursor = append ? posts.at(-1)?.id : undefined;
    const res = await apiFetch<FeedPost[]>(`/feed?authorId=${encodeURIComponent(userId)}&limit=20${cursor ? `&cursor=${cursor}` : ""}`, { token });
    if (res.ok && res.data) { setPosts(prev => append ? [...prev, ...res.data!.filter(p => !prev.some(old => old.id === p.id))] : res.data!); setHasMore(res.data.length === 20); }
    else toast.error(res.error ?? "Không tải được bài viết");
  }

  useEffect(() => {
    setPosts([]);
    void load();
    if (!token) return;
    void apiFetch<{ following: boolean; followerCount: number }>(`/social/users/${userId}/follow`, { token }).then(res => { if (res.data) { setFollowing(res.data.following); setFollowers(res.data.followerCount); } });
  }, [userId, token]);

  async function toggleFollow() {
    if (!token || busy) return;
    setBusy(true);
    const res = await apiFetch<{ following: boolean; followerCount: number }>(`/social/users/${userId}/follow`, { method: following ? "DELETE" : "POST", token });
    setBusy(false);
    if (!res.ok || !res.data) return void toast.error(res.error ?? "Không cập nhật được theo dõi");
    setFollowing(res.data.following); setFollowers(res.data.followerCount);
  }

  async function react(post: FeedPost, reactionType: PostReactionType) {
    const res = await apiFetch<FeedPost>(`/social/posts/${post.id}/reactions`, { method: "POST", token, body: JSON.stringify({ reactionType }) });
    if (!res.ok || !res.data) return void toast.error(res.error ?? "Không gửi được cảm xúc");
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likeCount: res.data!.likeCount, userReaction: res.data!.userReaction } : p));
  }

  return <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold text-ink">Bài viết{token ? ` · ${followers} người theo dõi` : " công khai"}</h2>{!token ? <Link href="/auth/sign-in" className="text-link">Đăng nhập để theo dõi</Link> : user?.id !== userId ? <Button disabled={busy} variant={following ? "secondary" : "primary"} onClick={() => void toggleFollow()}>{following ? "Đang theo dõi · Bỏ theo dõi" : "Theo dõi"}</Button> : null}</div>
    {!posts.length ? <Card><p className="text-body">Chưa có bài viết bạn có thể xem.</p></Card> : null}
    {posts.map(post => <Card key={post.id} className="space-y-4"><p className="text-xs text-mute">{formatDateTime(post.createdAt)}</p><p className="whitespace-pre-wrap break-words text-ink">{post.content}</p>{post.mediaUrls?.map(url => <a key={url} href={url} target="_blank" rel="noreferrer" className="block text-link">{ /\.(png|jpe?g|webp|gif)(\?|$)/i.test(url) ? <img src={url} alt="Ảnh bài viết" className="max-h-96 rounded-xl object-contain" /> : "Mở tệp đính kèm" }</a>)}<p className="text-sm text-mute">{post.likeCount} cảm xúc · {post.commentCount} bình luận</p><ReactionPicker disabled={!token} activeReaction={post.userReaction} onReact={type => void react(post, type)} /><CommentThread post={post} token={token} onChange={comments => setPosts(prev => prev.map(p => p.id === post.id ? { ...p, comments, commentCount: comments.length } : p))} /></Card>)}
    {hasMore ? <Button variant="secondary" onClick={() => void load(true)}>Xem thêm bài viết</Button> : null}
  </section>;
}
