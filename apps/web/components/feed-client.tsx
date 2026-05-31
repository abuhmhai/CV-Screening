"use client";

import { useState } from "react";

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

const composerChips = ["Add image", "Hiring update", "Career tip"];

export function FeedClient({ posts }: FeedClientProps) {
  const [activeChip, setActiveChip] = useState<string>(composerChips[0]);
  const [engagedPostId, setEngagedPostId] = useState<string | null>(null);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
      <section className="space-y-4">
        <header className="rounded-xl bg-canvas p-6">
          <h1 className="text-display-sm font-semibold">Professional Feed</h1>
          <p className="mt-2 text-sm text-body">Cập nhật từ network của bạn: bài chia sẻ nghề nghiệp, tuyển dụng, và AI tips.</p>
        </header>

        <article className="rounded-xl bg-canvas p-6">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-full bg-primary-pale" />
            <button
              type="button"
              className="flex-1 rounded-lg bg-canvas-soft px-4 py-3 text-left text-sm text-mute transition hover:bg-primary-pale/70"
            >
              Share a post to your network...
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {composerChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setActiveChip(chip)}
                className={`rounded-pill px-4 py-2 text-xs font-semibold transition ${
                  activeChip === chip ? "bg-primary text-ink" : "bg-canvas-soft text-ink hover:bg-primary-pale"
                }`}
              >
                {chip}
              </button>
            ))}
            <button className="rounded-pill bg-primary px-4 py-2 text-xs font-semibold text-ink transition hover:bg-primary-active">
              Post
            </button>
          </div>
        </article>

        {posts.map((post) => {
          const authorName = post.author?.profile?.fullName ?? post.author?.email ?? "Unknown";
          const engaged = engagedPostId === post.id;

          return (
            <article key={post.id} className="rounded-xl bg-canvas p-6 transition hover:-translate-y-0.5 hover:shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-ink">{authorName}</p>
                  <p className="text-xs text-mute">{new Date(post.createdAt).toLocaleString()}</p>
                </div>
                <span className="rounded-pill bg-canvas-soft px-3 py-1 text-xs font-semibold text-ink">Public</span>
              </div>
              <p className="mt-4 text-sm leading-6 text-body">{post.content}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Like", "Comment", "Share"].map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => setEngagedPostId(post.id)}
                    className={`rounded-pill px-4 py-2 text-xs font-semibold transition ${
                      engaged ? "bg-primary-pale text-ink-deep" : "bg-canvas-soft text-ink hover:bg-primary-pale"
                    }`}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </article>
          );
        })}
      </section>

      <aside className="space-y-4">
        <article className="rounded-xl bg-canvas p-6">
          <h2 className="text-base font-semibold text-ink">Trending Skills</h2>
          <ul className="mt-4 space-y-2 text-sm text-body">
            <li className="rounded-lg bg-canvas-soft px-3 py-2 transition hover:bg-primary-pale">Python + FastAPI</li>
            <li className="rounded-lg bg-canvas-soft px-3 py-2 transition hover:bg-primary-pale">TypeScript + Next.js</li>
            <li className="rounded-lg bg-canvas-soft px-3 py-2 transition hover:bg-primary-pale">LLM Evaluation</li>
            <li className="rounded-lg bg-canvas-soft px-3 py-2 transition hover:bg-primary-pale">PostgreSQL Optimization</li>
          </ul>
        </article>
        <article className="rounded-xl bg-canvas p-6">
          <h2 className="text-base font-semibold text-ink">People You May Know</h2>
          <div className="mt-4 space-y-3">
            {["Anh Tran", "Minh Pham", "Linh Bui"].map((name) => (
              <div
                key={name}
                className="flex items-center justify-between rounded-lg bg-canvas-soft px-3 py-2 transition hover:bg-primary-pale"
              >
                <span className="text-sm text-ink">{name}</span>
                <button className="rounded-pill bg-primary px-3 py-1 text-xs font-semibold text-ink transition hover:bg-primary-active">
                  Connect
                </button>
              </div>
            ))}
          </div>
        </article>
      </aside>
    </div>
  );
}
