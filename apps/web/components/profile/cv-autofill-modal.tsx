"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Wand2, Check } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "../../lib/api-client";
import { useAuth } from "../../lib/auth-context";
import { parseCv } from "../../lib/cv-parse";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

interface AutofillTarget {
  fileName: string;
  extractedText?: string | null;
}

/**
 * Parses an uploaded CV's extracted text client-side (via parseCv) and lets the
 * user push detected skills, languages and certifications into their profile
 * through the existing CRUD endpoints. Fully additive — nothing is overwritten.
 */
export function CvAutofillModal({
  cv,
  onClose,
  onApplied
}: {
  cv: AutofillTarget | null;
  onClose: () => void;
  onApplied: () => void;
}) {
  const { token } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const open = Boolean(cv);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const parsed = useMemo(() => parseCv(cv?.extractedText), [cv?.extractedText]);
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [selectedLangs, setSelectedLangs] = useState<Set<string>>(new Set());
  const [selectedCerts, setSelectedCerts] = useState<Set<string>>(new Set());

  // Reset selections whenever a different CV is opened.
  const cvKey = cv?.fileName ?? "";
  const [lastKey, setLastKey] = useState("");
  if (cvKey !== lastKey) {
    setLastKey(cvKey);
    setSelectedSkills(new Set(parsed.skills));
    setSelectedLangs(new Set(parsed.languages));
    setSelectedCerts(new Set());
  }

  const toggle = (set: Set<string>, value: string, update: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    update(next);
  };

  const apply = async () => {
    if (!token) return;
    setApplying(true);
    try {
      const tasks: Promise<unknown>[] = [];
      for (const name of selectedSkills) {
        tasks.push(
          apiFetch("/users/me/skills", {
            method: "POST",
            token,
            body: JSON.stringify({ name, level: "INTERMEDIATE" })
          })
        );
      }
      for (const cert of selectedCerts) {
        tasks.push(
          apiFetch("/users/me/certifications", {
            method: "POST",
            token,
            body: JSON.stringify({ name: cert.slice(0, 160), issuer: "—" })
          })
        );
      }
      if (selectedLangs.size > 0) {
        tasks.push(
          apiFetch("/users/me/profile", {
            method: "PATCH",
            token,
            body: JSON.stringify({
              languages: Array.from(selectedLangs).map((name) => ({ name }))
            })
          })
        );
      }
      await Promise.all(tasks);
      toast.success("Đã áp dụng thông tin từ CV");
      onApplied();
      onClose();
    } catch {
      toast.error("Áp dụng thất bại");
    } finally {
      setApplying(false);
    }
  };

  const nothingDetected =
    parsed.skills.length === 0 && parsed.languages.length === 0 && parsed.certifications.length === 0;

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative my-auto max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-hairline-strong bg-surface-card p-6 shadow-[0_24px_64px_rgba(0,0,0,0.65)]"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Wand2 size={18} className="text-primary" />
                <h2 className="text-lg font-semibold text-ink">Tự động điền từ CV</h2>
              </div>
              <button type="button" onClick={onClose} aria-label="Đóng" className="text-mute hover:text-ink">
                <X size={20} />
              </button>
            </div>
            <p className="mt-1 text-body-sm text-mute">{cv?.fileName}</p>

            {!parsed.hasText ? (
              <p className="mt-6 text-body-sm text-body">
                CV này chưa có văn bản trích xuất. Hãy tải lên lại file PDF/DOCX để dùng tính năng này.
              </p>
            ) : nothingDetected ? (
              <p className="mt-6 text-body-sm text-body">Không phát hiện kỹ năng/ngôn ngữ/chứng chỉ nào từ CV.</p>
            ) : (
              <div className="mt-5 space-y-5">
                {parsed.skills.length > 0 ? (
                  <Section title="Kỹ năng phát hiện">
                    {parsed.skills.map((s) => (
                      <Chip key={s} active={selectedSkills.has(s)} onClick={() => toggle(selectedSkills, s, setSelectedSkills)}>
                        {s}
                      </Chip>
                    ))}
                  </Section>
                ) : null}

                {parsed.languages.length > 0 ? (
                  <Section title="Ngôn ngữ">
                    {parsed.languages.map((s) => (
                      <Chip key={s} active={selectedLangs.has(s)} onClick={() => toggle(selectedLangs, s, setSelectedLangs)}>
                        {s}
                      </Chip>
                    ))}
                  </Section>
                ) : null}

                {parsed.certifications.length > 0 ? (
                  <Section title="Chứng chỉ (dòng phát hiện)">
                    {parsed.certifications.map((s) => (
                      <Chip key={s} active={selectedCerts.has(s)} onClick={() => toggle(selectedCerts, s, setSelectedCerts)}>
                        {s.length > 48 ? `${s.slice(0, 45)}…` : s}
                      </Chip>
                    ))}
                  </Section>
                ) : null}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose} className="min-h-10 px-4 py-2">
                Huỷ
              </Button>
              <Button
                variant="primary"
                onClick={apply}
                isLoading={applying}
                disabled={!parsed.hasText || (selectedSkills.size === 0 && selectedLangs.size === 0 && selectedCerts.size === 0)}
                leftIcon={<Check size={16} />}
                className="min-h-10 px-5 py-2"
              >
                Áp dụng
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-body-sm font-semibold text-ink">{title}</h3>
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}>
      <Badge tone={active ? "primary" : "default"}>{children}</Badge>
    </button>
  );
}
