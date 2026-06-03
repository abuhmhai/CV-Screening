"use client";

import { useEffect, useState } from "react";
import { apiFetch, getApiBase } from "../../lib/api-client";
import { useAuth } from "../../lib/auth-context";
import {
  CvEducationEntry,
  CvExperienceEntry,
  CvSkillEntry,
  GeneratedCv,
  GeneratedCvData
} from "../../lib/types";
import { AuthGate } from "../../components/auth-gate";
import { Card, PageHeader } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { FieldLabel, Input, Select, Textarea } from "../../components/ui/input";
import { LoadingBlock } from "../../components/ui/states";
import { CvPreview } from "../../components/cv-preview";
import { Download, FileText, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

const TEMPLATES = [
  { id: "classic", label: "Classic" },
  { id: "modern", label: "Modern" }
];

const emptyData: GeneratedCvData = {
  fullName: "",
  headline: "",
  email: "",
  phone: "",
  location: "",
  summary: "",
  experiences: [],
  educations: [],
  skills: []
};

function CvBuilderContent() {
  const { token, user } = useAuth();
  const [list, setList] = useState<GeneratedCv[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState("CV của tôi");
  const [templateId, setTemplateId] = useState("classic");
  const [data, setData] = useState<GeneratedCvData>(emptyData);
  const [saving, setSaving] = useState(false);

  const loadList = () => {
    if (!token) return;
    void apiFetch<GeneratedCv[]>("/users/me/generated-cv", { token }).then((res) => {
      if (res.ok && res.data) setList(res.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadList();
    // Prefill from profile for a fresh CV
    if (user) {
      void apiFetch<{
        email: string;
        profile?: { fullName?: string; headline?: string; about?: string; location?: string };
        workExperiences?: CvExperienceEntry[];
        educations?: Array<{ school: string; degree: string; major?: string; startYear?: number; endYear?: number }>;
        userSkills?: Array<{ level?: string; skill: { name: string } }>;
      }>(`/users/${user.id}/profile`, { token }).then((res) => {
        if (res.ok && res.data) {
          const d = res.data;
          setData((prev) =>
            prev.fullName
              ? prev
              : {
                  fullName: d.profile?.fullName ?? "",
                  headline: d.profile?.headline ?? "",
                  email: d.email,
                  phone: "",
                  location: d.profile?.location ?? "",
                  summary: d.profile?.about ?? "",
                  experiences: (d.workExperiences ?? []).map((e) => ({
                    company: e.company,
                    position: e.position,
                    startDate: e.startDate?.slice(0, 10),
                    endDate: e.endDate?.slice(0, 10),
                    description: e.description
                  })),
                  educations: (d.educations ?? []).map((e) => ({
                    school: e.school,
                    degree: e.degree,
                    major: e.major,
                    startYear: e.startYear,
                    endYear: e.endYear
                  })),
                  skills: (d.userSkills ?? []).map((s) => ({ name: s.skill.name, level: s.level ?? undefined }))
                }
          );
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadCv = (cv: GeneratedCv) => {
    setActiveId(cv.id);
    setTitle(cv.title);
    setTemplateId(cv.templateId);
    setData({ ...emptyData, ...cv.data });
  };

  const newCv = () => {
    setActiveId(null);
    setTitle("CV của tôi");
    setTemplateId("classic");
    setData(emptyData);
  };

  const setField = <K extends keyof GeneratedCvData>(key: K, value: GeneratedCvData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const save = async (): Promise<string | null> => {
    if (!token) return null;
    setSaving(true);
    const body = JSON.stringify({ title, templateId, data });
    const res = activeId
      ? await apiFetch<GeneratedCv>(`/users/me/generated-cv/${activeId}`, {
          method: "PATCH",
          token,
          body
        })
      : await apiFetch<GeneratedCv>("/users/me/generated-cv", { method: "POST", token, body });
    setSaving(false);
    if (res.ok && res.data) {
      toast.success("Đã lưu CV");
      setActiveId(res.data.id);
      loadList();
      return res.data.id;
    }
    toast.error(res.error ?? "Lưu thất bại");
    return null;
  };

  const exportPdf = async () => {
    let id = activeId;
    if (!id) {
      id = await save();
      if (!id) return;
    } else {
      await save();
    }
    const resp = await fetch(`${getApiBase()}/api/v1/users/me/generated-cv/${id}/export`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!resp.ok) {
      toast.error("Không xuất được PDF");
      return;
    }
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "-")}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const removeCv = async (id: string) => {
    if (!token) return;
    const res = await apiFetch(`/users/me/generated-cv/${id}`, { method: "DELETE", token });
    if (res.ok) {
      toast.success("Đã xoá CV");
      if (activeId === id) newCv();
      loadList();
    }
  };

  // Array helpers
  const addExperience = () =>
    setField("experiences", [...(data.experiences ?? []), { position: "", company: "" }]);
  const updateExperience = (idx: number, patch: Partial<CvExperienceEntry>) =>
    setField(
      "experiences",
      (data.experiences ?? []).map((e, i) => (i === idx ? { ...e, ...patch } : e))
    );
  const removeExperience = (idx: number) =>
    setField("experiences", (data.experiences ?? []).filter((_, i) => i !== idx));

  const addEducation = () =>
    setField("educations", [...(data.educations ?? []), { school: "", degree: "" }]);
  const updateEducation = (idx: number, patch: Partial<CvEducationEntry>) =>
    setField(
      "educations",
      (data.educations ?? []).map((e, i) => (i === idx ? { ...e, ...patch } : e))
    );
  const removeEducation = (idx: number) =>
    setField("educations", (data.educations ?? []).filter((_, i) => i !== idx));

  const addSkill = () => setField("skills", [...(data.skills ?? []), { name: "", level: "INTERMEDIATE" }]);
  const updateSkill = (idx: number, patch: Partial<CvSkillEntry>) =>
    setField(
      "skills",
      (data.skills ?? []).map((s, i) => (i === idx ? { ...s, ...patch } : s))
    );
  const removeSkill = (idx: number) =>
    setField("skills", (data.skills ?? []).filter((_, i) => i !== idx));

  if (loading) return <LoadingBlock />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trình tạo CV"
        description="Tạo CV chuyên nghiệp từ hồ sơ của bạn, xem trước trực tiếp và xuất file PDF."
      />

      {list.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {list.map((cv) => (
            <button
              key={cv.id}
              type="button"
              onClick={() => loadCv(cv)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-body-sm transition ${
                activeId === cv.id
                  ? "border-positive-deep bg-primary-pale text-positive-deep"
                  : "border-ink/15 hover:bg-canvas-soft"
              }`}
            >
              <FileText size={14} /> {cv.title}
              {cv.isPrimary ? " ★" : ""}
            </button>
          ))}
          <Button variant="ghost" onClick={newCv} leftIcon={<Plus size={16} />} className="min-h-10 px-4 py-2">
            CV mới
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <Card className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldLabel label="Tên CV">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </FieldLabel>
              <FieldLabel label="Mẫu">
                <Select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                  {TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </FieldLabel>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldLabel label="Họ tên">
                <Input value={data.fullName ?? ""} onChange={(e) => setField("fullName", e.target.value)} />
              </FieldLabel>
              <FieldLabel label="Chức danh">
                <Input value={data.headline ?? ""} onChange={(e) => setField("headline", e.target.value)} />
              </FieldLabel>
              <FieldLabel label="Email">
                <Input value={data.email ?? ""} onChange={(e) => setField("email", e.target.value)} />
              </FieldLabel>
              <FieldLabel label="Số điện thoại">
                <Input value={data.phone ?? ""} onChange={(e) => setField("phone", e.target.value)} />
              </FieldLabel>
              <FieldLabel label="Địa điểm">
                <Input value={data.location ?? ""} onChange={(e) => setField("location", e.target.value)} />
              </FieldLabel>
            </div>
            <FieldLabel label="Giới thiệu">
              <Textarea value={data.summary ?? ""} onChange={(e) => setField("summary", e.target.value)} />
            </FieldLabel>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-ink">Kinh nghiệm</h3>
              <Button variant="ghost" onClick={addExperience} leftIcon={<Plus size={14} />} className="min-h-9 px-3 py-1.5 text-body-sm">
                Thêm
              </Button>
            </div>
            {(data.experiences ?? []).map((exp, idx) => (
              <div key={idx} className="space-y-3 rounded-xl border border-ink/10 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input placeholder="Vị trí" value={exp.position ?? ""} onChange={(e) => updateExperience(idx, { position: e.target.value })} />
                  <Input placeholder="Công ty" value={exp.company ?? ""} onChange={(e) => updateExperience(idx, { company: e.target.value })} />
                  <Input type="date" value={exp.startDate ?? ""} onChange={(e) => updateExperience(idx, { startDate: e.target.value })} />
                  <Input type="date" value={exp.endDate ?? ""} onChange={(e) => updateExperience(idx, { endDate: e.target.value })} />
                </div>
                <Textarea placeholder="Mô tả công việc" value={exp.description ?? ""} onChange={(e) => updateExperience(idx, { description: e.target.value })} />
                <button type="button" onClick={() => removeExperience(idx)} className="flex items-center gap-1 text-caption text-negative hover:underline">
                  <Trash2 size={14} /> Xoá
                </button>
              </div>
            ))}
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-ink">Học vấn</h3>
              <Button variant="ghost" onClick={addEducation} leftIcon={<Plus size={14} />} className="min-h-9 px-3 py-1.5 text-body-sm">
                Thêm
              </Button>
            </div>
            {(data.educations ?? []).map((edu, idx) => (
              <div key={idx} className="space-y-3 rounded-xl border border-ink/10 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input placeholder="Trường" value={edu.school ?? ""} onChange={(e) => updateEducation(idx, { school: e.target.value })} />
                  <Input placeholder="Bằng cấp" value={edu.degree ?? ""} onChange={(e) => updateEducation(idx, { degree: e.target.value })} />
                  <Input placeholder="Chuyên ngành" value={edu.major ?? ""} onChange={(e) => updateEducation(idx, { major: e.target.value })} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Từ" value={String(edu.startYear ?? "")} onChange={(e) => updateEducation(idx, { startYear: e.target.value })} />
                    <Input placeholder="Đến" value={String(edu.endYear ?? "")} onChange={(e) => updateEducation(idx, { endYear: e.target.value })} />
                  </div>
                </div>
                <button type="button" onClick={() => removeEducation(idx)} className="flex items-center gap-1 text-caption text-negative hover:underline">
                  <Trash2 size={14} /> Xoá
                </button>
              </div>
            ))}
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-ink">Kỹ năng</h3>
              <Button variant="ghost" onClick={addSkill} leftIcon={<Plus size={14} />} className="min-h-9 px-3 py-1.5 text-body-sm">
                Thêm
              </Button>
            </div>
            {(data.skills ?? []).map((skill, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input placeholder="Kỹ năng" value={skill.name ?? ""} onChange={(e) => updateSkill(idx, { name: e.target.value })} />
                <Select value={skill.level ?? "INTERMEDIATE"} onChange={(e) => updateSkill(idx, { level: e.target.value })} className="w-44">
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                  <option value="EXPERT">Expert</option>
                </Select>
                <button type="button" onClick={() => removeSkill(idx)} className="rounded-lg p-2 text-negative hover:bg-negative-bg/10" aria-label="Xoá kỹ năng">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </Card>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" onClick={save} isLoading={saving} leftIcon={<Save size={16} />}>
              Lưu CV
            </Button>
            <Button variant="tertiary" onClick={exportPdf} leftIcon={<Download size={16} />}>
              Xuất PDF
            </Button>
            {activeId && (
              <button
                type="button"
                onClick={() => removeCv(activeId)}
                className="flex items-center gap-1 text-body-sm text-negative hover:underline"
              >
                <Trash2 size={16} /> Xoá CV này
              </button>
            )}
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <CvPreview data={data} templateId={templateId} />
        </div>
      </div>
    </div>
  );
}

export default function CvBuilderPage() {
  return (
    <AuthGate roles={["CANDIDATE", "RECRUITER", "ADMIN"]}>
      <CvBuilderContent />
    </AuthGate>
  );
}
