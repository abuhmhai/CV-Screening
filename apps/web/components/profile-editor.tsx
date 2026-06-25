"use client";

import { useRef, useState } from "react";
import { apiFetch, getApiBase } from "../lib/api-client";
import { useAuth } from "../lib/auth-context";
import { UserProfile } from "../lib/types";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { FieldLabel, Input, Select, Textarea } from "./ui/input";
import { Award, Camera, FolderGit2, Globe, ImagePlus, Languages, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function ProfileEditor({
  profile,
  onChange
}: {
  profile: UserProfile;
  onChange: () => void;
}) {
  const { token } = useAuth();
  const p = profile.profile;
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const [info, setInfo] = useState({
    fullName: p?.fullName ?? "",
    headline: p?.headline ?? "",
    about: p?.about ?? "",
    location: p?.location ?? ""
  });
  const [exp, setExp] = useState({ position: "", company: "", startDate: "", endDate: "", description: "" });
  const [edu, setEdu] = useState({ school: "", degree: "", major: "", startYear: "", endYear: "" });
  const [skill, setSkill] = useState({ name: "", level: "INTERMEDIATE" });
  const [project, setProject] = useState({ title: "", description: "", url: "", skills: "" });
  const [cert, setCert] = useState({ name: "", issuer: "", issueDate: "", credentialUrl: "" });
  const [lang, setLang] = useState({ name: "", proficiency: "" });
  const [links, setLinks] = useState({
    github: p?.socialLinks?.github ?? "",
    linkedin: p?.socialLinks?.linkedin ?? "",
    website: p?.socialLinks?.website ?? "",
    portfolio: p?.socialLinks?.portfolio ?? "",
    twitter: p?.socialLinks?.twitter ?? ""
  });
  const languages = profile.profile?.languages ?? [];

  const saveInfo = async () => {
    if (!token) return;
    const res = await apiFetch("/users/me/profile", {
      method: "PATCH",
      token,
      body: JSON.stringify(info)
    });
    if (res.ok) {
      toast.success("Đã cập nhật hồ sơ");
      onChange();
    } else {
      toast.error(res.error ?? "Cập nhật thất bại");
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!token) return;
    const form = new FormData();
    form.append("file", file);
    const resp = await fetch(`${getApiBase()}/api/v1/users/me/avatar`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form
    });
    if (resp.ok) {
      toast.success("Đã cập nhật ảnh đại diện");
      onChange();
    } else {
      toast.error("Tải ảnh thất bại");
    }
  };

  const uploadCover = async (file: File) => {
    if (!token) return;
    const form = new FormData();
    form.append("file", file);
    const resp = await fetch(`${getApiBase()}/api/v1/users/me/cover`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form
    });
    if (resp.ok) {
      toast.success("Đã cập nhật ảnh bìa");
      onChange();
    } else {
      toast.error("Tải ảnh bìa thất bại");
    }
  };

  const saveLinks = async () => {
    if (!token) return;
    const socialLinks: Record<string, string> = {};
    for (const [key, value] of Object.entries(links)) {
      if (value.trim()) socialLinks[key] = value.trim();
    }
    const res = await apiFetch("/users/me/profile", {
      method: "PATCH",
      token,
      body: JSON.stringify({ socialLinks })
    });
    if (res.ok) {
      toast.success("Đã lưu liên kết");
      onChange();
    } else {
      toast.error(res.error ?? "Lưu thất bại");
    }
  };

  const saveLanguages = async (next: Array<{ name: string; proficiency?: string }>) => {
    if (!token) return;
    const res = await apiFetch("/users/me/profile", {
      method: "PATCH",
      token,
      body: JSON.stringify({ languages: next })
    });
    if (res.ok) onChange();
    else toast.error(res.error ?? "Lưu thất bại");
  };

  const addLanguage = async () => {
    if (!lang.name.trim()) {
      toast.error("Nhập tên ngôn ngữ");
      return;
    }
    const next = [
      ...languages.map((l) => ({ name: l.name, proficiency: l.proficiency ?? undefined })),
      { name: lang.name.trim(), proficiency: lang.proficiency.trim() || undefined }
    ];
    setLang({ name: "", proficiency: "" });
    await saveLanguages(next);
  };

  const removeLanguage = async (name: string) => {
    const next = languages
      .filter((l) => l.name !== name)
      .map((l) => ({ name: l.name, proficiency: l.proficiency ?? undefined }));
    await saveLanguages(next);
  };

  const addProject = async () => {
    if (!token) return;
    if (!project.title.trim()) {
      toast.error("Nhập tên dự án");
      return;
    }
    const res = await apiFetch("/users/me/projects", {
      method: "POST",
      token,
      body: JSON.stringify({
        title: project.title.trim(),
        description: project.description.trim() || undefined,
        url: project.url.trim() || undefined,
        skills: project.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      })
    });
    if (res.ok) {
      setProject({ title: "", description: "", url: "", skills: "" });
      onChange();
    } else {
      toast.error(res.error ?? "Không thêm được");
    }
  };

  const deleteProject = async (id: string) => {
    if (!token) return;
    const res = await apiFetch(`/users/me/projects/${id}`, { method: "DELETE", token });
    if (res.ok) onChange();
  };

  const addCertification = async () => {
    if (!token) return;
    if (!cert.name.trim() || !cert.issuer.trim()) {
      toast.error("Nhập tên và đơn vị cấp chứng chỉ");
      return;
    }
    const res = await apiFetch("/users/me/certifications", {
      method: "POST",
      token,
      body: JSON.stringify({
        name: cert.name.trim(),
        issuer: cert.issuer.trim(),
        issueDate: cert.issueDate ? new Date(cert.issueDate).toISOString() : undefined,
        credentialUrl: cert.credentialUrl.trim() || undefined
      })
    });
    if (res.ok) {
      setCert({ name: "", issuer: "", issueDate: "", credentialUrl: "" });
      onChange();
    } else {
      toast.error(res.error ?? "Không thêm được");
    }
  };

  const deleteCertification = async (id: string) => {
    if (!token) return;
    const res = await apiFetch(`/users/me/certifications/${id}`, { method: "DELETE", token });
    if (res.ok) onChange();
  };

  const addExperience = async () => {
    if (!token) return;
    if (!exp.position || !exp.company || !exp.startDate) {
      toast.error("Nhập vị trí, công ty và ngày bắt đầu");
      return;
    }
    const res = await apiFetch("/users/me/experiences", {
      method: "POST",
      token,
      body: JSON.stringify({
        position: exp.position,
        company: exp.company,
        startDate: new Date(exp.startDate).toISOString(),
        endDate: exp.endDate ? new Date(exp.endDate).toISOString() : undefined,
        isCurrent: !exp.endDate,
        description: exp.description || undefined
      })
    });
    if (res.ok) {
      setExp({ position: "", company: "", startDate: "", endDate: "", description: "" });
      onChange();
    } else {
      toast.error(res.error ?? "Không thêm được");
    }
  };

  const deleteExperience = async (id: string) => {
    if (!token) return;
    const res = await apiFetch(`/users/me/experiences/${id}`, { method: "DELETE", token });
    if (res.ok) onChange();
  };

  const addEducation = async () => {
    if (!token) return;
    if (!edu.school || !edu.degree || !edu.startYear) {
      toast.error("Nhập trường, bằng cấp và năm bắt đầu");
      return;
    }
    const res = await apiFetch("/users/me/educations", {
      method: "POST",
      token,
      body: JSON.stringify({
        school: edu.school,
        degree: edu.degree,
        major: edu.major || undefined,
        startYear: Number(edu.startYear),
        endYear: edu.endYear ? Number(edu.endYear) : undefined
      })
    });
    if (res.ok) {
      setEdu({ school: "", degree: "", major: "", startYear: "", endYear: "" });
      onChange();
    } else {
      toast.error(res.error ?? "Không thêm được");
    }
  };

  const deleteEducation = async (id: string) => {
    if (!token) return;
    const res = await apiFetch(`/users/me/educations/${id}`, { method: "DELETE", token });
    if (res.ok) onChange();
  };

  const addSkill = async () => {
    if (!token) return;
    if (!skill.name) {
      toast.error("Nhập tên kỹ năng");
      return;
    }
    const res = await apiFetch("/users/me/skills", {
      method: "POST",
      token,
      body: JSON.stringify({ name: skill.name, level: skill.level })
    });
    if (res.ok) {
      setSkill({ name: "", level: "INTERMEDIATE" });
      onChange();
    } else {
      toast.error(res.error ?? "Không thêm được");
    }
  };

  const deleteSkill = async (skillId: string) => {
    if (!token) return;
    const res = await apiFetch(`/users/me/skills/${skillId}`, { method: "DELETE", token });
    if (res.ok) onChange();
  };

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-ink">Thông tin cơ bản</h2>
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadAvatar(f);
                e.target.value = "";
              }}
            />
            <input
              ref={coverRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadCover(f);
                e.target.value = "";
              }}
            />
            <Button variant="ghost" onClick={() => fileRef.current?.click()} leftIcon={<Camera size={16} />} className="min-h-9 px-3 py-1.5 text-body-sm">
              Đổi ảnh
            </Button>
            <Button variant="ghost" onClick={() => coverRef.current?.click()} leftIcon={<ImagePlus size={16} />} className="min-h-9 px-3 py-1.5 text-body-sm">
              Ảnh bìa
            </Button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldLabel label="Họ tên">
            <Input value={info.fullName} onChange={(e) => setInfo({ ...info, fullName: e.target.value })} />
          </FieldLabel>
          <FieldLabel label="Chức danh">
            <Input value={info.headline} onChange={(e) => setInfo({ ...info, headline: e.target.value })} />
          </FieldLabel>
          <FieldLabel label="Địa điểm">
            <Input value={info.location} onChange={(e) => setInfo({ ...info, location: e.target.value })} />
          </FieldLabel>
        </div>
        <FieldLabel label="Giới thiệu">
          <Textarea value={info.about} onChange={(e) => setInfo({ ...info, about: e.target.value })} />
        </FieldLabel>
        <Button variant="primary" onClick={saveInfo} className="min-h-10 px-5 py-2">
          Lưu thông tin
        </Button>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold text-ink">Kinh nghiệm</h2>
        <div className="space-y-2">
          {(profile.workExperiences ?? []).map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-lg bg-canvas-soft px-4 py-3">
              <span className="text-body-sm">
                <strong>{e.position}</strong> · {e.company}
              </span>
              <button type="button" onClick={() => deleteExperience(e.id)} className="text-negative" aria-label="Xoá">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Vị trí" value={exp.position} onChange={(e) => setExp({ ...exp, position: e.target.value })} />
          <Input placeholder="Công ty" value={exp.company} onChange={(e) => setExp({ ...exp, company: e.target.value })} />
          <Input type="date" value={exp.startDate} onChange={(e) => setExp({ ...exp, startDate: e.target.value })} />
          <Input type="date" value={exp.endDate} onChange={(e) => setExp({ ...exp, endDate: e.target.value })} />
        </div>
        <Textarea placeholder="Mô tả (tuỳ chọn)" value={exp.description} onChange={(e) => setExp({ ...exp, description: e.target.value })} />
        <Button variant="ghost" onClick={addExperience} leftIcon={<Plus size={16} />} className="min-h-10 px-4 py-2">
          Thêm kinh nghiệm
        </Button>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold text-ink">Học vấn</h2>
        <div className="space-y-2">
          {(profile.educations ?? []).map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-lg bg-canvas-soft px-4 py-3">
              <span className="text-body-sm">
                <strong>{e.degree}</strong> · {e.school}
              </span>
              <button type="button" onClick={() => deleteEducation(e.id)} className="text-negative" aria-label="Xoá">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Trường" value={edu.school} onChange={(e) => setEdu({ ...edu, school: e.target.value })} />
          <Input placeholder="Bằng cấp" value={edu.degree} onChange={(e) => setEdu({ ...edu, degree: e.target.value })} />
          <Input placeholder="Chuyên ngành" value={edu.major} onChange={(e) => setEdu({ ...edu, major: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Năm bắt đầu" value={edu.startYear} onChange={(e) => setEdu({ ...edu, startYear: e.target.value })} />
            <Input placeholder="Năm kết thúc" value={edu.endYear} onChange={(e) => setEdu({ ...edu, endYear: e.target.value })} />
          </div>
        </div>
        <Button variant="ghost" onClick={addEducation} leftIcon={<Plus size={16} />} className="min-h-10 px-4 py-2">
          Thêm học vấn
        </Button>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-semibold text-ink">Kỹ năng</h2>
        <div className="flex flex-wrap gap-2">
          {(profile.userSkills ?? []).map((s) => (
            <span key={s.skill.id} className="flex items-center gap-1 rounded-pill bg-primary-pale px-3 py-1 text-body-sm text-positive-deep">
              {s.skill.name}
              {s.level ? ` · ${s.level}` : ""}
              <button type="button" onClick={() => deleteSkill(s.skill.id)} aria-label="Xoá kỹ năng">
                <Trash2 size={12} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input placeholder="Kỹ năng" value={skill.name} onChange={(e) => setSkill({ ...skill, name: e.target.value })} className="max-w-xs" />
          <Select value={skill.level} onChange={(e) => setSkill({ ...skill, level: e.target.value })} className="w-44">
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
            <option value="EXPERT">Expert</option>
          </Select>
          <Button variant="ghost" onClick={addSkill} leftIcon={<Plus size={16} />} className="min-h-10 px-4 py-2">
            Thêm
          </Button>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
          <FolderGit2 size={18} className="text-primary" /> Dự án
        </h2>
        <div className="space-y-2">
          {(profile.projects ?? []).map((pr) => (
            <div key={pr.id} className="flex items-center justify-between rounded-lg bg-canvas-soft px-4 py-3">
              <span className="min-w-0 text-body-sm">
                <strong>{pr.title}</strong>
                {pr.skills && pr.skills.length > 0 ? <span className="text-mute"> · {pr.skills.join(", ")}</span> : null}
              </span>
              <button type="button" onClick={() => deleteProject(pr.id)} className="text-negative" aria-label="Xoá">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Tên dự án" value={project.title} onChange={(e) => setProject({ ...project, title: e.target.value })} />
          <Input placeholder="Liên kết (tuỳ chọn)" value={project.url} onChange={(e) => setProject({ ...project, url: e.target.value })} />
        </div>
        <Input placeholder="Kỹ năng (phân tách bởi dấu phẩy)" value={project.skills} onChange={(e) => setProject({ ...project, skills: e.target.value })} />
        <Textarea placeholder="Mô tả (tuỳ chọn)" value={project.description} onChange={(e) => setProject({ ...project, description: e.target.value })} />
        <Button variant="ghost" onClick={addProject} leftIcon={<Plus size={16} />} className="min-h-10 px-4 py-2">
          Thêm dự án
        </Button>
      </Card>

      <Card className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
          <Award size={18} className="text-primary" /> Chứng chỉ
        </h2>
        <div className="space-y-2">
          {(profile.certifications ?? []).map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg bg-canvas-soft px-4 py-3">
              <span className="min-w-0 text-body-sm">
                <strong>{c.name}</strong> · {c.issuer}
              </span>
              <button type="button" onClick={() => deleteCertification(c.id)} className="text-negative" aria-label="Xoá">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Tên chứng chỉ" value={cert.name} onChange={(e) => setCert({ ...cert, name: e.target.value })} />
          <Input placeholder="Đơn vị cấp" value={cert.issuer} onChange={(e) => setCert({ ...cert, issuer: e.target.value })} />
          <Input type="date" value={cert.issueDate} onChange={(e) => setCert({ ...cert, issueDate: e.target.value })} />
          <Input placeholder="Liên kết xác thực (tuỳ chọn)" value={cert.credentialUrl} onChange={(e) => setCert({ ...cert, credentialUrl: e.target.value })} />
        </div>
        <Button variant="ghost" onClick={addCertification} leftIcon={<Plus size={16} />} className="min-h-10 px-4 py-2">
          Thêm chứng chỉ
        </Button>
      </Card>

      <Card className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
          <Languages size={18} className="text-primary" /> Ngôn ngữ
        </h2>
        <div className="flex flex-wrap gap-2">
          {languages.map((l) => (
            <span key={l.name} className="flex items-center gap-1 rounded-pill bg-primary-pale px-3 py-1 text-body-sm text-positive-deep">
              {l.name}
              {l.proficiency ? ` · ${l.proficiency}` : ""}
              <button type="button" onClick={() => removeLanguage(l.name)} aria-label="Xoá ngôn ngữ">
                <Trash2 size={12} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input placeholder="Ngôn ngữ" value={lang.name} onChange={(e) => setLang({ ...lang, name: e.target.value })} className="max-w-xs" />
          <Select value={lang.proficiency} onChange={(e) => setLang({ ...lang, proficiency: e.target.value })} className="w-44">
            <option value="">Trình độ</option>
            <option value="Cơ bản">Cơ bản</option>
            <option value="Trung cấp">Trung cấp</option>
            <option value="Thành thạo">Thành thạo</option>
            <option value="Bản ngữ">Bản ngữ</option>
          </Select>
          <Button variant="ghost" onClick={addLanguage} leftIcon={<Plus size={16} />} className="min-h-10 px-4 py-2">
            Thêm
          </Button>
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
          <Globe size={18} className="text-primary" /> Liên kết
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldLabel label="GitHub">
            <Input placeholder="https://github.com/..." value={links.github} onChange={(e) => setLinks({ ...links, github: e.target.value })} />
          </FieldLabel>
          <FieldLabel label="LinkedIn">
            <Input placeholder="https://linkedin.com/in/..." value={links.linkedin} onChange={(e) => setLinks({ ...links, linkedin: e.target.value })} />
          </FieldLabel>
          <FieldLabel label="Website">
            <Input placeholder="https://..." value={links.website} onChange={(e) => setLinks({ ...links, website: e.target.value })} />
          </FieldLabel>
          <FieldLabel label="Portfolio">
            <Input placeholder="https://..." value={links.portfolio} onChange={(e) => setLinks({ ...links, portfolio: e.target.value })} />
          </FieldLabel>
          <FieldLabel label="Twitter / X">
            <Input placeholder="https://x.com/..." value={links.twitter} onChange={(e) => setLinks({ ...links, twitter: e.target.value })} />
          </FieldLabel>
        </div>
        <Button variant="primary" onClick={saveLinks} className="min-h-10 px-5 py-2">
          Lưu liên kết
        </Button>
      </Card>
    </div>
  );
}
