"use client";

import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BarChart3,
  Briefcase,
  ChevronDown,
  Filter,
  FileText,
  Image as ImageIcon,
  Lightbulb,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  RefreshCw,
  Send,
  Share2,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  X
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../lib/auth-context";
import { apiFetch, getApiBase } from "../../lib/api-client";
import { fileNameFromUrl, formatFileSize, isImageMedia } from "../../lib/media-utils";
import { FeedPost, UserProfile } from "../../lib/types";
import { formatDateTime } from "../../lib/format";
import { AuthGate } from "../../components/auth-gate";
import { PageHeader, Card } from "../../components/ui/card";
import { Avatar } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import { Input, Textarea } from "../../components/ui/input";
import { EmptyState, LoadingBlock } from "../../components/ui/states";
import { Badge } from "../../components/ui/badge";
import { ReactionPicker } from "../../components/feed/reaction-picker";
import { PostReactionType } from "../../lib/reactions";

const PAGE_SIZE = 10;
const POST_LIMIT = 1000;
const MAX_ATTACHMENTS = 4;

type PendingAttachment = {
  url: string;
  name: string;
  mimeType: string;
  size?: number;
};

type FeedFilter = "ALL" | "TRENDING" | "MINE" | "MEDIA";
type FeedSort = "RECOMMENDED" | "NEWEST";

const filterTabs: Array<{ id: FeedFilter; label: string; icon: ReactNode }> = [
  { id: "ALL", label: "Tất cả", icon: <Users size={15} /> },
  { id: "TRENDING", label: "Nổi bật", icon: <TrendingUp size={15} /> },
  { id: "MINE", label: "Bài của tôi", icon: <Sparkles size={15} /> },
  { id: "MEDIA", label: "Có media", icon: <ImageIcon size={15} /> }
];

const composerChips = [
  { id: "update", label: "Cập nhật nghề nghiệp", icon: <Sparkles size={15} /> },
  { id: "hiring", label: "Tin tuyển dụng", icon: <Briefcase size={15} /> },
  { id: "tip", label: "Kinh nghiệm", icon: <Lightbulb size={15} /> }
];

const trendingSkills = [
  { name: "TypeScript", score: 96 },
  { name: "NestJS", score: 90 },
  { name: "React", score: 88 },
  { name: "PostgreSQL", score: 82 },
  { name: "AI Screening", score: 78 }
];

function authorName(post: FeedPost) {
  return post.author?.profile?.fullName ?? "TalentFlow Member";
}

function engagementScore(post: FeedPost) {
  return (post.likeCount ?? 0) + (post.commentCount ?? 0) * 2;
}

function postMatchesFilter(post: FeedPost, filter: FeedFilter, userId?: string) {
  if (filter === "TRENDING") return (post.feedScore ?? 0) >= 25 || engagementScore(post) > 0;
  if (filter === "MINE") return post.author?.id === userId;
  if (filter === "MEDIA") return Boolean(post.mediaUrls?.length);
  return true;
}

function FeedContent() {
  const { token, user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [suggestions, setSuggestions] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [content, setContent] = useState("");
  const [activeComposerChip, setActiveComposerChip] = useState("update");
  const [commentDraftByPost, setCommentDraftByPost] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [userReactions, setUserReactions] = useState<Record<string, PostReactionType>>({});
  const [reportedPostIds, setReportedPostIds] = useState<Set<string>>(new Set());
  const [reportConfirmPostId, setReportConfirmPostId] = useState<string | null>(null);
  const [connectingIds, setConnectingIds] = useState<Set<string>>(new Set());
  const [requestedConnectionIds, setRequestedConnectionIds] = useState<Set<string>>(new Set());
  const [posting, setPosting] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<FeedFilter>("ALL");
  const [sort, setSort] = useState<FeedSort>("RECOMMENDED");

  async function loadFeed(options?: { append?: boolean }) {
    if (!token) return;
    const append = options?.append ?? false;
    append ? setLoadingMore(true) : setLoading(true);

    const cursor = append ? posts[posts.length - 1]?.id : undefined;
    const [feedRes, suggestionRes] = await Promise.all([
      apiFetch<FeedPost[]>(`/feed?limit=${PAGE_SIZE}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`, { token }),
      append ? Promise.resolve(null) : apiFetch<UserProfile[]>("/social/connections/suggestions", { token })
    ]);

    if (feedRes.ok && feedRes.data) {
      setPosts((prev) => {
        if (!append) return feedRes.data!;
        const seen = new Set(prev.map((post) => post.id));
        const nextPage = feedRes.data!.filter((post) => !seen.has(post.id));
        return [...prev, ...nextPage];
      });
      setHasMore(feedRes.data.length === PAGE_SIZE);
    } else if (!append) {
      setPosts([]);
      setHasMore(false);
    }

    if (suggestionRes && suggestionRes.ok && suggestionRes.data) {
      setSuggestions(suggestionRes.data);
    }

    setLoading(false);
    setLoadingMore(false);
  }

  useEffect(() => {
    void loadFeed();
  }, [token]);

  const visiblePosts = useMemo(() => {
    const filtered = posts.filter((post) => postMatchesFilter(post, filter, user?.id));
    return [...filtered].sort((a, b) => {
      if (sort === "NEWEST") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return (b.feedScore ?? 0) - (a.feedScore ?? 0);
    });
  }, [filter, posts, sort, user?.id]);

  const feedStats = useMemo(() => {
    const totalComments = posts.reduce((sum, post) => sum + (post.commentCount ?? 0), 0);
    const totalLikes = posts.reduce((sum, post) => sum + (post.likeCount ?? 0), 0);
    const mediaPosts = posts.filter((post) => post.mediaUrls?.length).length;
    return { totalComments, totalLikes, mediaPosts };
  }, [posts]);

  async function uploadAttachment(file: File) {
    if (!token) return null;
    const form = new FormData();
    form.append("file", file);
    const resp = await fetch(`${getApiBase()}/api/v1/uploads/media`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form
    });
    if (!resp.ok) {
      let message = "Không tải được file";
      try {
        const body = (await resp.json()) as { message?: string | string[] };
        if (Array.isArray(body.message)) message = body.message.join(", ");
        else if (body.message) message = body.message;
      } catch {
        /* ignore */
      }
      toast.error(message);
      return null;
    }
    const data = (await resp.json()) as {
      url: string;
      name?: string;
      mimeType?: string;
      size?: number;
    };
    return {
      url: data.url,
      name: data.name ?? file.name,
      mimeType: data.mimeType ?? file.type,
      size: data.size ?? file.size
    } satisfies PendingAttachment;
  }

  async function handleFileSelect(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length || !token) return;

    const remaining = MAX_ATTACHMENTS - attachments.length;
    if (remaining <= 0) {
      toast.error(`Tối đa ${MAX_ATTACHMENTS} file mỗi bài`);
      return;
    }
    const batch = files.slice(0, remaining);
    if (files.length > remaining) {
      toast.message(`Chỉ thêm được ${remaining} file nữa`);
    }

    setUploadingMedia(true);
    const uploaded: PendingAttachment[] = [];
    for (const file of batch) {
      const item = await uploadAttachment(file);
      if (item) uploaded.push(item);
    }
    if (uploaded.length) {
      setAttachments((prev) => [...prev, ...uploaded]);
      toast.success(`Đã thêm ${uploaded.length} file`);
    }
    setUploadingMedia(false);
  }

  function removeAttachment(url: string) {
    setAttachments((prev) => prev.filter((item) => item.url !== url));
  }

  async function handlePost(e: FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!token || (!trimmed && attachments.length === 0)) return;

    setPosting(true);
    const prefix =
      activeComposerChip === "hiring"
        ? "[Tin tuyển dụng] "
        : activeComposerChip === "tip"
          ? "[Chia sẻ kinh nghiệm] "
          : "";
    const body =
      trimmed ||
      (attachments.length
        ? attachments.every((item) => isImageMedia(item.url, item.mimeType))
          ? "📷 "
          : "📎 "
        : "");
    const res = await apiFetch<FeedPost>("/social/posts", {
      method: "POST",
      token,
      body: JSON.stringify({
        content: `${prefix}${body}`.trim(),
        visibility: "PUBLIC",
        mediaUrls: attachments.map((item) => item.url)
      })
    });
    setPosting(false);

    if (res.ok && res.data) {
      setPosts((prev) => [{ ...res.data!, comments: res.data!.comments ?? [], feedScore: 50 }, ...prev]);
      setContent("");
      setAttachments([]);
      toast.success("Đã đăng bài lên bảng tin.");
    } else {
      toast.error(res.error ?? "Không đăng được bài viết.");
    }
  }

  async function reactToPost(postId: string, reactionType: PostReactionType) {
    if (!token) return;

    const previous = userReactions[postId];
    const isTogglingOff = previous === reactionType;

    if (isTogglingOff) {
      // Optimistically remove reaction
      setUserReactions((prev) => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, likeCount: Math.max(0, (post.likeCount ?? 1) - 1) } : post
        )
      );

      const res = await apiFetch<FeedPost & { removed?: boolean }>(`/social/posts/${postId}/reactions`, {
        method: "POST",
        token,
        body: JSON.stringify({ reactionType })
      });

      if (res.ok && res.data) {
        setPosts((prev) =>
          prev.map((post) => (post.id === postId ? { ...post, likeCount: res.data!.likeCount } : post))
        );
        return;
      }

      // Revert if failed
      setUserReactions((prev) => ({ ...prev, [postId]: previous }));
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, likeCount: (post.likeCount ?? 0) + 1 } : post
        )
      );
      toast.error(res.error ?? "Không thể gỡ cảm xúc.");
      return;
    }

    const isNew = !previous;
    setUserReactions((prev) => ({ ...prev, [postId]: reactionType }));
    if (isNew) {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, likeCount: (post.likeCount ?? 0) + 1 } : post
        )
      );
    }

    const res = await apiFetch<FeedPost>(`/social/posts/${postId}/reactions`, {
      method: "POST",
      token,
      body: JSON.stringify({ reactionType })
    });

    if (res.ok && res.data) {
      setPosts((prev) =>
        prev.map((post) => (post.id === postId ? { ...post, likeCount: res.data!.likeCount } : post))
      );
      return;
    }

    setUserReactions((prev) => {
      const next = { ...prev };
      if (previous) next[postId] = previous;
      else delete next[postId];
      return next;
    });
    if (isNew) {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, likeCount: Math.max(0, (post.likeCount ?? 1) - 1) } : post
        )
      );
    }
    toast.error(res.error ?? "Không thể gửi cảm xúc.");
  }

  async function addComment(postId: string) {
    if (!token) return;
    const draft = commentDraftByPost[postId]?.trim();
    if (!draft) return;

    setCommentDraftByPost((prev) => ({ ...prev, [postId]: "" }));
    setExpandedComments((prev) => ({ ...prev, [postId]: true }));

    const result = await apiFetch<NonNullable<FeedPost["comments"]>[number]>(`/social/posts/${postId}/comments`, {
      method: "POST",
      token,
      body: JSON.stringify({ content: draft })
    });

    if (!result.ok || !result.data) {
      setCommentDraftByPost((prev) => ({ ...prev, [postId]: draft }));
      toast.error(result.error ?? "Không gửi được bình luận.");
      return;
    }

    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              commentCount: (post.commentCount ?? 0) + 1,
              comments: [result.data!, ...(post.comments ?? [])]
            }
          : post
      )
    );
  }

  async function reportPost(postId: string) {
    if (!token) return;
    const result = await apiFetch("/moderation/reports", {
      method: "POST",
      token,
      body: JSON.stringify({
        contentType: "POST",
        targetId: postId,
        reason: "Inappropriate content"
      })
    });
    setReportConfirmPostId(null);

    if (!result.ok) {
      toast.error(result.error ?? "Không thể gửi báo cáo.");
      return;
    }

    setReportedPostIds((prev) => new Set(prev).add(postId));
    toast.success("Đã gửi báo cáo cho đội ngũ kiểm duyệt.");
  }

  async function connectWith(addresseeId: string) {
    if (!token || connectingIds.has(addresseeId) || requestedConnectionIds.has(addresseeId)) return;
    setConnectingIds((prev) => new Set(prev).add(addresseeId));

    const result = await apiFetch("/social/connections", {
      method: "POST",
      token,
      body: JSON.stringify({ addresseeId })
    });

    setConnectingIds((prev) => {
      const next = new Set(prev);
      next.delete(addresseeId);
      return next;
    });

    if (!result.ok) {
      toast.error(result.error ?? "Không gửi được lời mời kết nối.");
      return;
    }

    setRequestedConnectionIds((prev) => new Set(prev).add(addresseeId));
    toast.success("Đã gửi lời mời kết nối.");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bảng tin"
        description="Theo dõi mạng lưới nghề nghiệp, chia sẻ kinh nghiệm và tìm tín hiệu tuyển dụng mới."
        actions={
          <Button
            variant="secondary"
            leftIcon={<RefreshCw size={16} />}
            onClick={() => void loadFeed()}
            disabled={loading}
          >
            Làm mới
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <main className="space-y-5">
          <Card className="overflow-hidden p-0">
            <form onSubmit={handlePost}>
              <div className="border-b border-hairline-strong p-5">
                <div className="flex gap-3">
                  <Avatar initials={user?.email?.slice(0, 2).toUpperCase()} size="lg" online />
                  <div className="min-w-0 flex-1">
                    <Textarea
                      rows={content ? 4 : 3}
                      maxLength={POST_LIMIT}
                      placeholder="Chia sẻ thành tựu, insight nghề nghiệp, cơ hội tuyển dụng..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="min-h-[96px]"
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      {composerChips.map((chip) => (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => setActiveComposerChip(chip.id)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                            activeComposerChip === chip.id
                              ? "border-primary bg-primary text-primary-on"
                              : "border-hairline-strong bg-surface-elevated text-body hover:text-ink"
                          }`}
                        >
                          {chip.icon}
                          {chip.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        disabled={uploadingMedia || attachments.length >= MAX_ATTACHMENTS}
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-full border border-hairline-strong bg-surface-elevated px-3 py-1.5 text-xs font-semibold text-body transition hover:bg-surface-card hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Paperclip size={15} />
                        {uploadingMedia ? "Đang tải..." : "Đính kèm"}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        multiple
                        accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,.pdf,.doc,.docx,.txt,text/plain"
                        onChange={(e) => void handleFileSelect(e)}
                      />
                    </div>
                    {attachments.length ? (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {attachments.map((item) =>
                          isImageMedia(item.url, item.mimeType) ? (
                            <div
                              key={item.url}
                              className="group relative overflow-hidden rounded-xl border border-hairline-strong bg-canvas-soft"
                            >
                              <img
                                src={item.url}
                                alt={item.name}
                                className="h-32 w-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeAttachment(item.url)}
                                className="absolute right-2 top-2 rounded-full bg-canvas/80 p-1 text-ink transition hover:bg-negative hover:text-white"
                                aria-label="Xoá ảnh"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div
                              key={item.url}
                              className="flex items-center justify-between gap-2 rounded-xl border border-hairline-strong bg-surface-elevated px-3 py-2"
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                <FileText size={16} className="shrink-0 text-accent-blue" />
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-semibold text-ink">{item.name}</p>
                                  <p className="text-[11px] text-mute">{formatFileSize(item.size)}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeAttachment(item.url)}
                                className="rounded-full p-1 text-mute transition hover:bg-surface-card hover:text-negative"
                                aria-label="Xoá file"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 bg-canvas-soft px-5 py-3">
                <p className={`text-xs font-semibold ${content.length > POST_LIMIT * 0.9 ? "text-warning" : "text-mute"}`}>
                  {content.length}/{POST_LIMIT} ký tự
                  {attachments.length ? ` · ${attachments.length} file` : ""}
                </p>
                <Button
                  type="submit"
                  isLoading={posting || uploadingMedia}
                  disabled={!content.trim() && attachments.length === 0}
                  rightIcon={<Send size={15} />}
                >
                  Đăng bài
                </Button>
              </div>
            </form>
          </Card>

          <Card className="p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilter(tab.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition ${
                      filter === tab.id
                        ? "bg-primary text-primary-on"
                        : "bg-surface-elevated text-body hover:bg-surface-card hover:text-ink"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-mute" />
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as FeedSort)}
                  className="rounded-md border border-hairline-strong bg-surface-card px-3 py-2 text-sm font-semibold text-ink outline-none"
                >
                  <option value="RECOMMENDED">Recommended</option>
                  <option value="NEWEST">Newest</option>
                </select>
              </div>
            </div>
          </Card>

          {loading ? (
            <LoadingBlock label="Đang tải bảng tin..." />
          ) : visiblePosts.length === 0 ? (
            <EmptyState title="Chưa có bài phù hợp" description="Thử đổi bộ lọc hoặc đăng bài đầu tiên của bạn." />
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {visiblePosts.map((post, index) => {
                  const comments = post.comments ?? [];
                  const isExpanded = expandedComments[post.id] ?? false;
                  const shownComments = isExpanded ? comments : comments.slice(0, 2);
                  const userReaction = userReactions[post.id];
                  const isReported = reportedPostIds.has(post.id);

                  return (
                    <motion.article
                      key={post.id}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ delay: index * 0.03, duration: 0.28 }}
                    >
                      <Card hover className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 gap-3">
                            <Avatar
                              name={post.author?.profile?.fullName}
                              src={post.author?.profile?.avatarUrl}
                              size="md"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-ink">{authorName(post)}</p>
                              <p className="truncate text-xs text-body">
                                {post.author?.profile?.headline ?? "Professional community member"}
                              </p>
                              <p className="mt-0.5 text-xs text-mute">{formatDateTime(post.createdAt)}</p>
                            </div>
                          </div>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setReportConfirmPostId((current) => (current === post.id ? null : post.id))}
                              className="rounded-full p-1.5 text-mute transition hover:bg-surface-elevated hover:text-ink"
                              aria-label="Mở menu bài viết"
                            >
                              <MoreHorizontal size={19} />
                            </button>
                            {reportConfirmPostId === post.id ? (
                              <div className="absolute right-0 z-10 mt-2 w-56 rounded-xl border border-hairline-strong bg-surface-card p-2 shadow-lg">
                                <p className="px-2 py-1 text-xs font-semibold text-ink">Báo cáo nội dung?</p>
                                <Button
                                  variant="danger"
                                  className="mt-2 w-full text-xs"
                                  leftIcon={<AlertTriangle size={14} />}
                                  disabled={isReported}
                                  onClick={() => void reportPost(post.id)}
                                >
                                  {isReported ? "Đã báo cáo" : "Gửi báo cáo"}
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">{post.content}</p>

                        {post.mediaUrls?.length ? (
                          <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            {post.mediaUrls.slice(0, 4).map((url) =>
                              isImageMedia(url) ? (
                                <a
                                  key={url}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="group overflow-hidden rounded-xl border border-hairline-strong bg-canvas-soft"
                                >
                                  <img
                                    src={url}
                                    alt="Post media"
                                    className="h-44 w-full object-cover transition group-hover:scale-105"
                                  />
                                </a>
                              ) : (
                                <a
                                  key={url}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-3 rounded-xl border border-hairline-strong bg-surface-elevated px-4 py-3 transition hover:bg-surface-card"
                                >
                                  <FileText size={20} className="shrink-0 text-accent-blue" />
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-ink">
                                      {fileNameFromUrl(url)}
                                    </p>
                                    <p className="text-xs text-mute">Mở tệp đính kèm</p>
                                  </div>
                                </a>
                              )
                            )}
                          </div>
                        ) : null}

                        <div className="mt-4 flex flex-wrap items-center gap-2 border-b border-hairline-strong pb-3">
                          <Badge tone="primary">Score {(post.feedScore ?? 0).toFixed(1)}</Badge>
                          <Badge tone="default">{post.likeCount ?? 0} likes</Badge>
                          <Badge tone="default">{post.commentCount ?? 0} bình luận</Badge>
                          {post.mediaUrls?.length ? <Badge tone="positive">Media</Badge> : null}
                        </div>

                        <div className="grid grid-cols-3 gap-2 py-2">
                          <ReactionPicker
                            activeReaction={userReaction}
                            onReact={(type) => void reactToPost(post.id, type)}
                          />
                          <button
                            type="button"
                            onClick={() => setExpandedComments((prev) => ({ ...prev, [post.id]: !isExpanded }))}
                            className="inline-flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-body transition hover:bg-surface-elevated hover:text-ink"
                          >
                            <MessageCircle size={17} />
                            Bình luận
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              void navigator.clipboard?.writeText(window.location.href);
                              toast.success("Đã copy link bảng tin.");
                            }}
                            className="inline-flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-body transition hover:bg-surface-elevated hover:text-ink"
                          >
                            <Share2 size={17} />
                            Chia sẻ
                          </button>
                        </div>

                        <div className="rounded-xl bg-canvas-soft p-3">
                          {comments.length ? (
                            <div className="mb-3 space-y-2">
                              {shownComments.map((comment) => (
                                <div key={comment.id} className="flex gap-2 rounded-lg bg-surface-card p-3">
                                  <Avatar
                                    name={comment.author?.profile?.fullName}
                                    src={comment.author?.profile?.avatarUrl}
                                    size="sm"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-ink">
                                      {comment.author?.profile?.fullName ?? "Member"}
                                    </p>
                                    <p className="mt-1 text-sm text-body">{comment.content}</p>
                                    <p className="mt-1 text-[11px] text-mute">{formatDateTime(comment.createdAt)}</p>
                                  </div>
                                </div>
                              ))}
                              {comments.length > 2 ? (
                                <button
                                  type="button"
                                  onClick={() => setExpandedComments((prev) => ({ ...prev, [post.id]: !isExpanded }))}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-link hover:underline"
                                >
                                  <ChevronDown size={14} className={isExpanded ? "rotate-180 transition" : "transition"} />
                                  {isExpanded ? "Thu gọn bình luận" : `Xem thêm ${comments.length - 2} bình luận`}
                                </button>
                              ) : null}
                            </div>
                          ) : null}

                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Input
                              className="!mt-0"
                              placeholder="Viết bình luận chuyên nghiệp..."
                              value={commentDraftByPost[post.id] ?? ""}
                              onChange={(e) =>
                                setCommentDraftByPost((prev) => ({
                                  ...prev,
                                  [post.id]: e.target.value
                                }))
                              }
                            />
                            <Button
                              className="px-3 py-2 text-xs"
                              rightIcon={<Send size={13} />}
                              onClick={() => void addComment(post.id)}
                              disabled={!commentDraftByPost[post.id]?.trim()}
                            >
                              Gửi
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.article>
                  );
                })}
              </AnimatePresence>

              {hasMore ? (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="secondary"
                    isLoading={loadingMore}
                    onClick={() => void loadFeed({ append: true })}
                  >
                    Tải thêm bài viết
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </main>

        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-mute">Feed overview</p>
                <h2 className="mt-1 text-lg font-bold text-ink">Hoạt động mạng lưới</h2>
              </div>
              <BarChart3 size={20} className="text-link" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-canvas-soft p-3 text-center">
                <p className="text-xl font-black text-ink">{posts.length}</p>
                <p className="text-[11px] text-mute">Bài viết</p>
              </div>
              <div className="rounded-xl bg-canvas-soft p-3 text-center">
                <p className="text-xl font-black text-ink">{feedStats.totalLikes}</p>
                <p className="text-[11px] text-mute">Likes</p>
              </div>
              <div className="rounded-xl bg-canvas-soft p-3 text-center">
                <p className="text-xl font-black text-ink">{feedStats.totalComments}</p>
                <p className="text-[11px] text-mute">Comments</p>
              </div>
            </div>
            <p className="mt-3 rounded-lg bg-accent-blue-glow p-3 text-xs font-medium text-link">
              {feedStats.mediaPosts} bài có media trong feed hiện tại.
            </p>
          </Card>

          <Card>
            <h2 className="flex items-center gap-2 text-base font-bold text-ink">
              <TrendingUp size={18} /> Trending skills
            </h2>
            <div className="mt-4 space-y-3">
              {trendingSkills.map((skill) => (
                <div key={skill.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-semibold text-body">{skill.name}</span>
                    <span className="font-bold text-ink">{skill.score}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-elevated">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${skill.score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="flex items-center gap-2 text-base font-bold text-ink">
              <UserPlus size={18} /> Gợi ý kết nối
            </h2>
            <div className="mt-4 space-y-3">
              {suggestions.length ? (
                suggestions.slice(0, 5).map((person) => {
                  const requested = requestedConnectionIds.has(person.id);
                  return (
                    <div key={person.id} className="rounded-xl bg-canvas-soft p-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={person.profile?.fullName}
                          email={person.email}
                          src={person.profile?.avatarUrl}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-ink">{person.profile?.fullName ?? person.email}</p>
                          <p className="truncate text-xs text-body">{person.profile?.headline ?? "Professional"}</p>
                        </div>
                      </div>
                      <Button
                        fullWidth
                        variant={requested ? "ghost" : "secondary"}
                        className="mt-3 text-xs"
                        isLoading={connectingIds.has(person.id)}
                        disabled={requested}
                        leftIcon={<UserPlus size={14} />}
                        onClick={() => void connectWith(person.id)}
                      >
                        {requested ? "Đã gửi lời mời" : "Kết nối"}
                      </Button>
                    </div>
                  );
                })
              ) : (
                <p className="rounded-lg bg-canvas-soft p-3 text-sm text-body">Chưa có gợi ý mới.</p>
              )}
            </div>
          </Card>
        </aside>
      </div>
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
