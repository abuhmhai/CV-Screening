"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, MapPin, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import { ExternalJobFilters } from "./job-filters";
import { Button } from "../ui/button";
import { FieldLabel, Input, Select } from "../ui/input";

export function MobileFilterDrawer({
  value,
  onChange,
  onReset,
  isLoggedIn = false,
  savedCount = 0
}: {
  value: ExternalJobFilters;
  onChange: <K extends keyof ExternalJobFilters>(key: K, next: ExternalJobFilters[K]) => void;
  onReset: () => void;
  isLoggedIn?: boolean;
  savedCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ExternalJobFilters>(value);

  useEffect(() => {
    setDraft(value);
  }, [value, open]);

  // Count active filters (excluding defaults)
  const activeCount = [
    Boolean(value.keyword),
    Boolean(value.location),
    Boolean(value.source),
    Boolean(value.level),
    Boolean(value.savedOnly)
  ].filter(Boolean).length;

  const handleApply = () => {
    onChange("keyword", draft.keyword);
    onChange("location", draft.location);
    onChange("source", draft.source);
    onChange("level", draft.level);
    onChange("savedOnly", draft.savedOnly);
    setOpen(false);
  };

  const handleReset = () => {
    onReset();
    setOpen(false);
  };

  return (
    <div className="lg:hidden">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" size={16} />
          <input
            type="text"
            readOnly
            onClick={() => setOpen(true)}
            placeholder={value.keyword || value.location ? `${value.keyword || "Mọi từ khoá"} · ${value.location || "Toàn quốc"}` : "Tìm kiếm việc làm..."}
            className="w-full cursor-pointer rounded-lg border border-hairline-strong bg-surface-card py-2.5 pl-9 pr-3 text-body-sm text-ink placeholder:text-mute focus:outline-none"
          />
        </div>
        <Button
          type="button"
          variant={activeCount > 0 ? "primary" : "secondary"}
          onClick={() => setOpen(true)}
          leftIcon={<SlidersHorizontal size={15} />}
          className="min-h-10 px-3 text-body-sm shrink-0"
        >
          Bộ lọc{activeCount > 0 ? ` (${activeCount})` : ""}
        </Button>
      </div>

      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-canvas shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-hairline-strong p-4">
                <div className="flex items-center gap-2 font-semibold text-ink">
                  <SlidersHorizontal size={18} />
                  <span>Bộ lọc việc làm</span>
                  {activeCount > 0 ? (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-caption font-bold text-ink">
                      {activeCount}
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md p-1.5 text-mute hover:bg-canvas-soft hover:text-ink"
                  aria-label="Đóng bộ lọc"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {isLoggedIn ? (
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, savedOnly: !draft.savedOnly })}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-body-sm font-medium transition-all ${
                      draft.savedOnly
                        ? "border-positive bg-primary-pale text-positive-deep"
                        : "border-hairline-strong bg-surface-card text-ink hover:border-hairline"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Bookmark size={16} className={draft.savedOnly ? "fill-positive text-positive" : "text-mute"} />
                      <span>Việc làm đã lưu</span>
                    </span>
                    <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-caption font-bold text-ink">
                      {savedCount}
                    </span>
                  </button>
                ) : null}

                <FieldLabel label="Từ khoá">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-mute z-10" size={16} />
                    <Input
                      className="pl-9"
                      placeholder="React, Node.js, AI..."
                      value={draft.keyword}
                      onChange={(e) => setDraft({ ...draft, keyword: e.target.value })}
                    />
                  </div>
                </FieldLabel>

                <FieldLabel label="Địa điểm">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-mute z-10" size={16} />
                    <Input
                      className="pl-9"
                      placeholder="Hà Nội, TP.HCM, Remote..."
                      value={draft.location}
                      onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                    />
                  </div>
                </FieldLabel>

                <FieldLabel label="Nguồn tuyển dụng">
                  <Select value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value })}>
                    <option value="">Tất cả nguồn</option>
                    <option value="itviec">ITviec (Chuyên sâu IT)</option>
                    <option value="careerviet">CareerViet</option>
                    <option value="topcv">TopCV</option>
                    <option value="vietnamworks">VietnamWorks</option>
                  </Select>
                </FieldLabel>

                <FieldLabel label="Cấp bậc">
                  <Select value={draft.level} onChange={(e) => setDraft({ ...draft, level: e.target.value })}>
                    <option value="">Tất cả cấp bậc</option>
                    <option value="Intern">Intern / Thực tập sinh</option>
                    <option value="Junior">Junior</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead">Lead</option>
                    <option value="Manager">Manager / Quản lý</option>
                  </Select>
                </FieldLabel>
              </div>

              <div className="flex items-center gap-2 border-t border-hairline-strong p-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleReset}
                  leftIcon={<RotateCcw size={15} />}
                  className="flex-1"
                >
                  Đặt lại
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleApply}
                  className="flex-1"
                >
                  Áp dụng
                </Button>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
