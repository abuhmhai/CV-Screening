"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../../../lib/auth-context";
import { apiFetch } from "../../../lib/api-client";
import { AuthGate } from "../../../components/auth-gate";
import { Card, PageHeader } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { formatDateTime } from "../../../lib/format";

interface Report { id: string; targetType: string; reason: string; details?: string; status: string; createdAt: string; reporter?: { email: string }; target?: { content: string; mediaUrls?: string[] } | null }
interface Recovery { id: string; email?: string; phone?: string; status: string; createdAt: string }

function ModerationContent() {
  const { user, token } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [requests, setRequests] = useState<Recovery[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [tab, setTab] = useState<"reports" | "recovery">("reports");
  async function load() {
    if (!token || user?.role !== "ADMIN") return;
    const [r, p] = await Promise.all([apiFetch<Report[]>("/moderation/reports", { token }), apiFetch<Recovery[]>("/moderation/recovery-requests", { token })]);
    if (r.data) setReports(r.data); else toast.error(r.error ?? "Không tải được báo cáo");
    if (p.data) setRequests(p.data); else toast.error(p.error ?? "Không tải được yêu cầu khôi phục");
  }
  useEffect(() => { void load(); }, [token, user?.role]);
  async function resolve(id: string, action?: "KEEP" | "DELETE") {
    setBusy(id);
    const res = await apiFetch(action ? `/moderation/reports/${id}` : `/moderation/recovery-requests/${id}`, { method: "PATCH", token, ...(action ? { body: JSON.stringify({ action }) } : {}) });
    setBusy(null);
    if (!res.ok) return void toast.error(res.error ?? "Không xử lý được yêu cầu");
    toast.success("Đã cập nhật"); await load();
  }
  if (user?.role !== "ADMIN") return <Card><p className="text-body">Trang này dành cho quản trị viên.</p></Card>;
  return <div className="space-y-5"><PageHeader title="Quản trị nội dung" description="Duyệt báo cáo và hỗ trợ khôi phục tài khoản." /><div className="flex flex-wrap gap-3"><Button variant={tab === "reports" ? "primary" : "secondary"} onClick={() => setTab("reports")}>Báo cáo ({reports.filter(r => r.status === "PENDING").length})</Button><Button variant={tab === "recovery" ? "primary" : "secondary"} onClick={() => setTab("recovery")}>Quên mật khẩu ({requests.filter(r => r.status === "PENDING").length})</Button><Button variant="ghost" onClick={() => void load()}>Làm mới</Button></div>
    {tab === "reports" ? reports.length ? reports.map(r => <Card key={r.id} className="space-y-3"><div className="flex flex-wrap justify-between gap-2"><p className="font-bold text-ink">{r.targetType === "MESSAGE" ? "Tin nhắn" : r.targetType === "POST" ? "Bài viết" : r.targetType === "COMMENT" ? "Bình luận" : "Hồ sơ"} · {r.status === "PENDING" ? "Chờ duyệt" : r.status === "REMOVED" ? "Đã ẩn" : "Giữ nội dung"}</p><p className="text-xs text-mute">{formatDateTime(r.createdAt)}</p></div><p className="text-sm text-body">Người báo cáo: {r.reporter?.email}</p><p className="text-body">Lý do: {r.reason}</p>{r.details ? <p className="text-body">{r.details}</p> : null}<blockquote className="whitespace-pre-wrap break-words rounded-lg bg-surface-elevated p-4 text-ink">{r.target?.content ?? "Nội dung không còn tồn tại"}</blockquote>{r.target?.mediaUrls?.map(url => <a key={url} href={url} target="_blank" rel="noreferrer" className="block text-sm text-link">Xem tệp đính kèm</a>)}{r.status === "PENDING" ? <div className="flex gap-3"><Button disabled={busy === r.id} onClick={() => void resolve(r.id, "KEEP")}>Giữ nội dung</Button>{r.targetType !== "PROFILE" ? <Button variant="danger" disabled={busy === r.id} onClick={() => void resolve(r.id, "DELETE")}>Ẩn nội dung vi phạm</Button> : null}</div> : null}</Card>) : <Card>Chưa có báo cáo.</Card> : requests.length ? requests.map(r => <Card key={r.id} className="space-y-2"><p className="font-bold text-ink">{r.email ?? "Không có email"}</p><p className="text-body">Số điện thoại: {r.phone ?? "Không cung cấp"}</p><p className="text-xs text-mute">{formatDateTime(r.createdAt)} · {r.status === "PENDING" ? "Chờ hỗ trợ" : "Đã xử lý"}</p>{r.status === "PENDING" ? <Button disabled={busy === r.id} onClick={() => void resolve(r.id)}>Đánh dấu đã hỗ trợ</Button> : null}</Card>) : <Card>Chưa có yêu cầu khôi phục.</Card>}
  </div>;
}
export default function ModerationPage() { return <AuthGate><ModerationContent /></AuthGate>; }
