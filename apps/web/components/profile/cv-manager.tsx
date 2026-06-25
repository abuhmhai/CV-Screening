"use client";

import { useRef, useState } from "react";
import { FileText, Star, Trash2, Upload, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, getApiBase } from "../../lib/api-client";
import { useAuth } from "../../lib/auth-context";
import { UserProfile } from "../../lib/types";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { CvAutofillModal } from "./cv-autofill-modal";

type CvFile = NonNullable<UserProfile["cvFiles"]>[number];

/** Lists CVs with set-primary / delete / upload and an AI autofill entry point. */
export function CvManager({ profile, onChange }: { profile: UserProfile; onChange: () => void }) {
  const { token } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [autofillCv, setAutofillCv] = useState<CvFile | null>(null);
  const cvFiles = profile.cvFiles ?? [];

  const upload = async (file: File) => {
    if (!token) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const resp = await fetch(`${getApiBase()}/api/v1/users/me/cv`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });
      if (resp.ok) {
        toast.success("Đã tải CV lên");
        onChange();
      } else {
        toast.error("Tải CV thất bại");
      }
    } finally {
      setBusy(false);
    }
  };

  const setPrimary = async (id: string) => {
    if (!token) return;
    const res = await apiFetch(`/users/me/cv/${id}/primary`, { method: "PATCH", token });
    if (res.ok) {
      toast.success("Đã đặt làm CV chính");
      onChange();
    } else {
      toast.error(res.error ?? "Thất bại");
    }
  };

  const remove = async (id: string) => {
    if (!token) return;
    const res = await apiFetch(`/users/me/cv/${id}`, { method: "DELETE", token });
    if (res.ok) {
      toast.success("Đã xoá CV");
      onChange();
    } else {
      toast.error(res.error ?? "Không thể xoá CV");
    }
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-ink">CV của tôi</h2>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            e.target.value = "";
          }}
        />
        <Button
          variant="ghost"
          onClick={() => fileRef.current?.click()}
          isLoading={busy}
          leftIcon={<Upload size={16} />}
          className="min-h-9 px-3 py-1.5 text-body-sm"
        >
          Tải CV
        </Button>
      </div>

      {cvFiles.length === 0 ? (
        <p className="text-body-sm text-mute">Chưa có CV nào. Tải lên để dùng tự động điền hồ sơ.</p>
      ) : (
        <ul className="space-y-2">
          {cvFiles.map((cv) => (
            <li
              key={cv.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-hairline-strong bg-canvas-soft px-4 py-3"
            >
              <span className="flex min-w-0 items-center gap-2">
                <FileText size={16} className="shrink-0 text-mute" />
                <span className="truncate text-body-sm text-ink">{cv.fileName}</span>
                {cv.isPrimary ? <Badge tone="positive">Chính</Badge> : null}
              </span>
              <span className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setAutofillCv(cv)}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-body-sm text-primary transition hover:bg-surface-card"
                  title="Tự động điền hồ sơ từ CV"
                >
                  <Wand2 size={15} /> Autofill
                </button>
                {!cv.isPrimary ? (
                  <button
                    type="button"
                    onClick={() => setPrimary(cv.id)}
                    className="rounded-md p-1.5 text-mute transition hover:bg-surface-card hover:text-warning"
                    aria-label="Đặt làm CV chính"
                    title="Đặt làm CV chính"
                  >
                    <Star size={16} />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => remove(cv.id)}
                  className="rounded-md p-1.5 text-mute transition hover:bg-surface-card hover:text-negative"
                  aria-label="Xoá CV"
                  title="Xoá CV"
                >
                  <Trash2 size={16} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <CvAutofillModal cv={autofillCv} onClose={() => setAutofillCv(null)} onApplied={onChange} />
    </Card>
  );
}
