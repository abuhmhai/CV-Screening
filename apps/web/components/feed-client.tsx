"use client";

import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Avatar } from "./ui/avatar";
import { Heart, MessageCircle, Share2, Image as ImageIcon, Briefcase, Lightbulb, MoreHorizontal, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FeedPost {
  id: string;
  content: string;
  createdAt: string;
  author?: {
    profile?: { fullName?: string | null } | null;
    email: string;
  } | null;
}

interface FeedClientProps {
  posts: FeedPost[];
}

const composerOptions = [
  { id: "image", label: "Ảnh/Video", icon: <ImageIcon size={16} /> },
  { id: "hiring", label: "Tin tuyển dụng", icon: <Briefcase size={16} /> },
  { id: "tip", label: "Chia sẻ kinh nghiệm", icon: <Lightbulb size={16} /> },
];

export function FeedClient({ posts }: FeedClientProps) {
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [isComposing, setIsComposing] = useState(false);
  const [postContent, setPostContent] = useState("");

  const toggleLike = (postId: string) => {
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) newSet.delete(postId);
      else newSet.add(postId);
      return newSet;
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="space-y-6">
        <Card className="p-0 overflow-hidden">
          <div className="p-5 border-b border-ink/5">
            <div className="flex items-start gap-3">
              <Avatar initials="ME" size="lg" className="shrink-0" />
              <div className="flex-1">
                <textarea
                  placeholder="Bạn đang nghĩ gì? Chia sẻ cơ hội nghề nghiệp..."
                  className="w-full resize-none bg-transparent outline-none text-ink placeholder:text-mute text-[15px] min-h-[48px] transition-all"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  onFocus={() => setIsComposing(true)}
                  rows={isComposing ? 3 : 1}
                />
              </div>
            </div>
          </div>
          
          <div className="px-5 py-3 bg-canvas flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {composerOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setActiveChip(activeChip === opt.id ? null : opt.id)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    activeChip === opt.id 
                      ? "bg-primary-pale text-positive-deep" 
                      : "bg-canvas border border-ink/5 text-body hover:bg-canvas-soft"
                  }`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
            <Button 
              disabled={!postContent.trim()} 
              className="px-5 py-1.5 h-auto text-sm"
              rightIcon={<Send size={14} />}
            >
              Đăng bài
            </Button>
          </div>
        </Card>

        <div className="space-y-4 stagger-children">
          {posts.map((post, i) => {
            const authorName = post.author?.profile?.fullName ?? post.author?.email.split('@')[0] ?? "Unknown";
            const isLiked = likedPosts.has(post.id);

            return (
              <motion.div 
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <Card hover className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar initials={authorName} size="md" />
                      <div>
                        <p className="text-[15px] font-bold text-ink leading-tight hover:text-ink-deep cursor-pointer transition-colors">{authorName}</p>
                        <p className="text-xs text-mute mt-0.5">{new Date(post.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <button className="text-mute hover:text-ink p-1 rounded-full hover:bg-canvas-soft transition-colors">
                      <MoreHorizontal size={20} />
                    </button>
                  </div>
                  
                  <div className="mt-4 text-[15px] leading-relaxed text-ink whitespace-pre-wrap">
                    {post.content}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-ink/5 flex items-center justify-between">
                    <button
                      onClick={() => toggleLike(post.id)}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-colors ${
                        isLiked 
                          ? "text-red-500 bg-red-50" 
                          : "text-body hover:bg-canvas-soft hover:text-ink"
                      }`}
                    >
                      <motion.div
                        animate={isLiked ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Heart size={18} className={isLiked ? "fill-current" : ""} />
                      </motion.div>
                      Thích {isLiked && <span className="text-xs ml-1 font-bold">1</span>}
                    </button>
                    <button className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-body hover:bg-canvas-soft hover:text-ink transition-colors">
                      <MessageCircle size={18} />
                      Bình luận
                    </button>
                    <button className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-body hover:bg-canvas-soft hover:text-ink transition-colors">
                      <Share2 size={18} />
                      Chia sẻ
                    </button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      <aside className="space-y-6 hidden lg:block">
        <Card className="p-5">
          <h2 className="text-sm font-bold text-ink uppercase tracking-wider mb-4">Trending Skills</h2>
          <ul className="space-y-2">
            {[
              { name: "Python + FastAPI", score: 98 },
              { name: "TypeScript + Next.js", score: 92 },
              { name: "LLM Evaluation", score: 85 },
              { name: "PostgreSQL", score: 78 },
            ].map((skill, i) => (
              <li key={i} className="group cursor-pointer">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-semibold text-body group-hover:text-ink-deep transition-colors">{skill.name}</span>
                  <span className="text-xs font-bold text-mute">{skill.score}</span>
                </div>
                <div className="h-1.5 w-full bg-canvas-soft rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary/40 group-hover:bg-primary transition-colors" 
                    style={{ width: `${skill.score}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
        
        <Card className="p-5">
          <h2 className="text-sm font-bold text-ink uppercase tracking-wider mb-4">Gợi ý kết nối</h2>
          <div className="space-y-4">
            {[
              { name: "Anh Tran", role: "Senior Frontend Engineer", mutual: 12 },
              { name: "Minh Pham", role: "Technical Recruiter", mutual: 5 },
              { name: "Linh Bui", role: "AI Researcher", mutual: 8 }
            ].map((person, i) => (
              <div key={i} className="flex items-center gap-3">
                <Avatar initials={person.name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-ink truncate">{person.name}</p>
                  <p className="text-xs text-body truncate">{person.role}</p>
                  <p className="text-[10px] text-mute mt-0.5">{person.mutual} bạn chung</p>
                </div>
                <button className="shrink-0 rounded-full border border-primary text-ink-deep p-1.5 hover:bg-primary-pale transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
              </div>
            ))}
          </div>
          <Button variant="ghost" className="w-full mt-4 text-xs">Xem tất cả</Button>
        </Card>
      </aside>
    </div>
  );
}
