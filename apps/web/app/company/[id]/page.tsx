"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../lib/api-client";
import { useAuth } from "../../../lib/auth-context";
import { CompanyDetail } from "../../../lib/types";
import { JobCard } from "../../../components/job-card";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Avatar } from "../../../components/ui/avatar";
import { Badge } from "../../../components/ui/badge";
import { EmptyState, ErrorBlock, LoadingBlock } from "../../../components/ui/states";
import { Building2, Globe, MapPin, Users, Calendar, Briefcase } from "lucide-react";
import { formatDate } from "../../../lib/format";
import { motion } from "framer-motion";

export default function CompanyDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const { token, user } = useAuth();
  const [detail, setDetail] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  useEffect(() => {
    void apiFetch<CompanyDetail>(`/companies/${id}`).then((res) => {
      if (res.ok && res.data) {
        setDetail(res.data);
        setFollowerCount(res.data.followerCount);
      } else {
        setError(res.error ?? "Không tải được thông tin công ty");
      }
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!token || !detail) return;
    void apiFetch<{ following: boolean }>(`/companies/${detail.company.id}/following`, { token }).then(
      (res) => {
        if (res.ok && res.data) setFollowing(res.data.following);
      }
    );
  }, [token, detail]);

  const toggleFollow = async () => {
    if (!token || !detail) return;
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    setFollowerCount((c) => c + (wasFollowing ? -1 : 1));
    const res = await apiFetch(`/companies/${detail.company.id}/follow`, {
      method: wasFollowing ? "DELETE" : "POST",
      token
    });
    if (!res.ok) {
      setFollowing(wasFollowing);
      setFollowerCount((c) => c + (wasFollowing ? 1 : -1));
    }
  };

  if (loading) return <LoadingBlock />;
  if (error || !detail) return <ErrorBlock message={error ?? "Không tìm thấy công ty"} />;

  const { company, activeJobs, jobsCount, posts } = detail;

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-canvas">
        <div
          className="h-44 w-full bg-gradient-to-r from-emerald-400 to-blue-500"
          style={
            company.coverUrl
              ? { backgroundImage: `url(${company.coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
              : undefined
          }
        />
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="-mt-16 flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-canvas bg-canvas shadow">
              <Avatar initials={company.name} size="lg" className="h-20 w-20 text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-ink">{company.name}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-body">
                {company.industry && (
                  <span className="flex items-center gap-1">
                    <Building2 size={14} /> {company.industry}
                  </span>
                )}
                {company.sizeRange && (
                  <span className="flex items-center gap-1">
                    <Users size={14} /> {company.sizeRange} nhân sự
                  </span>
                )}
                {company.address && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} /> {company.address}
                  </span>
                )}
              </p>
            </div>
          </div>
          {user && (
            <Button variant={following ? "tertiary" : "primary"} onClick={toggleFollow}>
              {following ? "Đang theo dõi" : "Theo dõi"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card className="space-y-3">
            <h2 className="text-lg font-semibold text-ink">Giới thiệu</h2>
            <p className="whitespace-pre-line text-body-sm text-body">
              {company.description || "Công ty chưa cập nhật phần giới thiệu."}
            </p>
          </Card>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Briefcase size={20} className="text-ink-deep" />
              <h2 className="text-lg font-semibold text-ink">
                Vị trí đang tuyển ({activeJobs.length})
              </h2>
            </div>
            {activeJobs.length === 0 ? (
              <EmptyState title="Chưa có vị trí nào" description="Công ty hiện không có tin tuyển dụng đang mở." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {activeJobs.map((job, i) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: (i % 6) * 0.06 }}
                  >
                    <JobCard job={job} />
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {posts.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-ink">Văn hoá & hoạt động</h2>
              <div className="space-y-3">
                {posts.map((post) => (
                  <Card key={post.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Avatar initials={post.author?.profile?.fullName ?? post.author?.email ?? "TF"} size="sm" />
                      <div>
                        <p className="text-body-sm font-semibold text-ink">
                          {post.author?.profile?.fullName ?? post.author?.email ?? "TalentFlow"}
                        </p>
                        <p className="text-caption text-mute">{formatDate(post.createdAt)}</p>
                      </div>
                    </div>
                    <p className="whitespace-pre-line text-body-sm text-body">{post.content}</p>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-body-sm text-body">Người theo dõi</span>
              <span className="text-lg font-black text-ink">{followerCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body-sm text-body">Tổng tin tuyển</span>
              <span className="text-lg font-black text-ink">{jobsCount}</span>
            </div>
            {company.foundedYear && (
              <div className="flex items-center gap-2 text-body-sm text-body">
                <Calendar size={16} /> Thành lập {company.foundedYear}
              </div>
            )}
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-body-sm font-semibold text-positive-deep hover:underline"
              >
                <Globe size={16} /> {company.website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </Card>
          {!user && (
            <Card>
              <p className="text-body-sm text-body">
                <Badge>Đăng nhập</Badge> để theo dõi công ty và nhận thông báo việc làm mới.
              </p>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
