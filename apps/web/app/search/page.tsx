"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import { apiFetch } from "../../lib/api-client";
import { SearchResult } from "../../lib/types";
import { AuthGate } from "../../components/auth-gate";
import { PageHeader, Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Avatar } from "../../components/ui/avatar";
import { JobCard } from "../../components/job-card";
import { EmptyState } from "../../components/ui/states";

function SearchContent() {
  const { token, user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (user?.role === "RECRUITER" || user?.role === "ADMIN")) {
      router.replace("/recruiter/dashboard");
    }
  }, [user, authLoading, router]);

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!token || !query.trim()) return;
    setLoading(true);
    const res = await apiFetch<SearchResult>(
      `/search?query=${encodeURIComponent(query)}&type=all&limit=8`,
      { token }
    );
    if (res.ok && res.data) {
      setResult(res.data);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tìm kiếm"
        description="Tìm người, bài viết, công ty và việc làm trong một giao diện."
      />

      <Card>
        <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
          <Input
            className="!mt-0"
            placeholder="Tìm người, việc làm, công ty, bài viết..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Đang tìm..." : "Tìm kiếm"}
          </Button>
        </form>
      </Card>

      {!result ? (
        <EmptyState title="Nhập từ khóa để bắt đầu" description="Ví dụ: React, recruiter, fintech..." />
      ) : (
        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold">Mọi người ({result.people.length})</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {result.people.map((person) => (
                <div key={person.id} className="flex items-center gap-3 rounded-lg bg-canvas-soft p-3">
                  <Avatar
                    name={person.profile?.fullName}
                    email={person.email}
                    src={person.profile?.avatarUrl}
                  />
                  <div>
                    <p className="text-sm font-semibold">{person.profile?.fullName ?? person.email}</p>
                    <p className="text-xs text-mute">{person.profile?.headline ?? "Member"}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Việc làm ({result.jobs.length})</h2>
            {result.jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>

          <Card>
            <h2 className="text-lg font-semibold">Bài viết ({result.posts.length})</h2>
            <div className="mt-4 space-y-3">
              {result.posts.map((post) => (
                <div key={post.id} className="rounded-lg bg-canvas-soft p-4">
                  <p className="text-sm font-semibold">
                    {post.author?.profile?.fullName ?? "Member"}
                  </p>
                  <p className="mt-2 text-sm text-body">{post.content}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold">Công ty ({result.companies.length})</h2>
            <div className="mt-4 space-y-3">
              {result.companies.map((company) => (
                <div key={company.id} className="rounded-lg bg-canvas-soft p-4">
                  <p className="font-semibold">{company.name}</p>
                  <p className="text-sm text-body">{company.industry ?? "General"}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <AuthGate>
      <SearchContent />
    </AuthGate>
  );
}
