"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "../ui/button";

const POPULAR_KEYWORDS = [
  "React",
  "Node.js",
  "Frontend",
  "Backend",
  "Fullstack",
  "AI / Machine Learning",
  "DevOps",
  "Python",
  "Golang",
  "Java"
];

export function HeroQuickSearch() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("keyword", keyword.trim());
    if (location.trim()) params.set("location", location.trim());
    router.push(`/external-jobs?${params.toString()}`);
  };

  const handleTagClick = (tag: string) => {
    const cleanTag = tag.split("/")[0].trim();
    router.push(`/external-jobs?keyword=${encodeURIComponent(cleanTag)}`);
  };

  return (
    <div className="w-full max-w-3xl">
      {/* Search Input Box */}
      <form
        onSubmit={handleSearch}
        className="flex flex-col sm:flex-row items-stretch gap-2 rounded-2xl border border-hairline-strong bg-surface-card/95 p-2.5 shadow-2xl backdrop-blur-md transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
      >
        {/* Keyword field */}
        <div className="relative flex-1 flex items-center">
          <Search size={19} className="absolute left-3.5 text-mute" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Vị trí, kỹ năng: React, Node.js, AI, DevOps..."
            className="w-full rounded-xl bg-transparent py-3 pl-10 pr-3 text-body-sm text-ink placeholder:text-mute focus:outline-none"
          />
        </div>

        {/* Location selector */}
        <div className="relative sm:w-52 flex items-center border-t sm:border-t-0 sm:border-l border-hairline-strong pt-2 sm:pt-0 sm:pl-2">
          <MapPin size={18} className="absolute left-3 text-mute" />
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full cursor-pointer appearance-none rounded-xl bg-transparent py-3 pl-9 pr-8 text-body-sm text-ink focus:outline-none"
          >
            <option value="">Tất cả địa điểm</option>
            <option value="Hồ Chí Minh">Hồ Chí Minh</option>
            <option value="Hà Nội">Hà Nội</option>
            <option value="Đà Nẵng">Đà Nẵng</option>
            <option value="Remote">Remote / Làm từ xa</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          variant="primary"
          className="h-12 px-6 rounded-xl font-bold shrink-0 shadow-sm"
          rightIcon={<ArrowRight size={17} />}
        >
          Tìm 780+ việc làm
        </Button>
      </form>

      {/* Popular trending keywords */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-caption">
        <span className="flex items-center gap-1 font-semibold text-mute">
          <Sparkles size={13} className="text-primary" /> Từ khóa hot:
        </span>
        {POPULAR_KEYWORDS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => handleTagClick(tag)}
            className="rounded-pill border border-hairline-strong bg-surface-elevated/80 px-2.5 py-1 text-body transition hover:border-primary/50 hover:bg-surface-card hover:text-ink"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
