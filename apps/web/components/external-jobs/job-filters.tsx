"use client";

import { useEffect, useState } from "react";
import { Bookmark, MapPin, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { FieldLabel, Input, Select } from "../ui/input";

export interface ExternalJobFilters {
  source: string;
  keyword: string;
  location: string;
  level: string;
  savedOnly?: boolean;
}

export const emptyExternalJobFilters: ExternalJobFilters = {
  source: "",
  keyword: "",
  location: "",
  level: "",
  savedOnly: false
};

export function JobFilters({
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
  const [draftKeyword, setDraftKeyword] = useState(value.keyword);
  const [draftLocation, setDraftLocation] = useState(value.location);

  // Sync draft states when value changes from external (e.g. URL or Reset)
  useEffect(() => {
    setDraftKeyword(value.keyword);
  }, [value.keyword]);

  useEffect(() => {
    setDraftLocation(value.location);
  }, [value.location]);

  // Debounced auto-apply for keyword
  useEffect(() => {
    const timer = setTimeout(() => {
      if (draftKeyword !== value.keyword) {
        onChange("keyword", draftKeyword.trim());
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [draftKeyword, value.keyword, onChange]);

  // Debounced auto-apply for location
  useEffect(() => {
    const timer = setTimeout(() => {
      if (draftLocation !== value.location) {
        onChange("location", draftLocation.trim());
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [draftLocation, value.location, onChange]);

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    onChange("keyword", draftKeyword.trim());
    onChange("location", draftLocation.trim());
  };

  const handleReset = () => {
    setDraftKeyword("");
    setDraftLocation("");
    onReset();
  };

  return (
    <Card className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-ink">
          <SlidersHorizontal size={18} /> Bộ lọc
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1 text-caption text-mute transition hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
        >
          <RotateCcw size={14} /> Đặt lại
        </button>
      </div>

      {isLoggedIn ? (
        <button
          type="button"
          onClick={() => onChange("savedOnly", !value.savedOnly)}
          className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-body-sm font-medium transition-all ${
            value.savedOnly
              ? "border-positive bg-primary-pale text-positive-deep"
              : "border-hairline-strong bg-surface-card text-ink hover:border-hairline"
          }`}
        >
          <span className="flex items-center gap-2">
            <Bookmark size={16} className={value.savedOnly ? "fill-positive text-positive" : "text-mute"} />
            <span>Việc làm đã lưu</span>
          </span>
          <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-caption font-bold text-ink">
            {savedCount}
          </span>
        </button>
      ) : null}

      <form onSubmit={submitForm} className="space-y-4">
        <FieldLabel label="Từ khoá">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-mute z-10" size={18} />
            <Input
              className="pl-10"
              placeholder="React, Node.js, AI..."
              value={draftKeyword}
              onChange={(e) => setDraftKeyword(e.target.value)}
            />
          </div>
        </FieldLabel>

        <FieldLabel label="Địa điểm">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-mute z-10" size={18} />
            <Input
              className="pl-10"
              placeholder="Hà Nội, TP.HCM, Remote..."
              value={draftLocation}
              onChange={(e) => setDraftLocation(e.target.value)}
            />
          </div>
        </FieldLabel>

        <FieldLabel label="Nguồn">
          <Select value={value.source} onChange={(e) => onChange("source", e.target.value)}>
            <option value="">Tất cả nguồn</option>
            <option value="itviec">ITviec (Chuyên sâu IT)</option>
            <option value="careerviet">CareerViet</option>
            <option value="topcv">TopCV</option>
            <option value="vietnamworks">VietnamWorks</option>
          </Select>
        </FieldLabel>

        <FieldLabel label="Cấp bậc">
          <Select value={value.level} onChange={(e) => onChange("level", e.target.value)}>
            <option value="">Tất cả cấp bậc</option>
            <option value="Intern">Intern / Thực tập sinh</option>
            <option value="Junior">Junior</option>
            <option value="Senior">Senior</option>
            <option value="Lead">Lead</option>
            <option value="Manager">Manager / Quản lý</option>
          </Select>
        </FieldLabel>

        <Button type="submit" variant="primary" className="w-full">
          Tìm kiếm
        </Button>
      </form>
    </Card>
  );
}

