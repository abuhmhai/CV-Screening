"use client";

import { useState } from "react";
import { MapPin, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { FieldLabel, Input, Select } from "../ui/input";

export interface ExternalJobFilters {
  source: string;
  keyword: string;
  location: string;
  level: string;
}

export const emptyExternalJobFilters: ExternalJobFilters = {
  source: "",
  keyword: "",
  location: "",
  level: ""
};

export function JobFilters({
  value,
  onChange,
  onReset
}: {
  value: ExternalJobFilters;
  onChange: <K extends keyof ExternalJobFilters>(key: K, next: ExternalJobFilters[K]) => void;
  onReset: () => void;
}) {
  const [draftKeyword, setDraftKeyword] = useState(value.keyword);

  const submitKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    onChange("keyword", draftKeyword.trim());
  };

  return (
    <Card className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-ink">
          <SlidersHorizontal size={18} /> Bộ lọc
        </div>
        <button
          type="button"
          onClick={() => {
            setDraftKeyword("");
            onReset();
          }}
          className="flex items-center gap-1 text-caption text-mute transition hover:text-ink"
        >
          <RotateCcw size={14} /> Đặt lại
        </button>
      </div>

      <form onSubmit={submitKeyword}>
        <FieldLabel label="Từ khoá">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-mute z-10" size={18} />
            <Input
              className="pl-10"
              placeholder="React, Node.js, Data..."
              value={draftKeyword}
              onChange={(e) => setDraftKeyword(e.target.value)}
            />
          </div>
        </FieldLabel>
      </form>

      <FieldLabel label="Nguồn">
        <Select value={value.source} onChange={(e) => onChange("source", e.target.value)}>
          <option value="">Tất cả</option>
          <option value="topcv">TopCV</option>
          <option value="vietnamworks">VietnamWorks</option>
        </Select>
      </FieldLabel>

      <FieldLabel label="Địa điểm">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-mute z-10" size={18} />
          <Input
            className="pl-10"
            placeholder="Hà Nội, HCM..."
            value={value.location}
            onChange={(e) => onChange("location", e.target.value)}
          />
        </div>
      </FieldLabel>

      <FieldLabel label="Cấp bậc">
        <Select value={value.level} onChange={(e) => onChange("level", e.target.value)}>
          <option value="">Tất cả</option>
          <option value="Intern">Intern</option>
          <option value="Junior">Junior</option>
          <option value="Senior">Senior</option>
          <option value="Lead">Lead</option>
          <option value="Manager">Manager</option>
        </Select>
      </FieldLabel>

      <Button type="button" variant="primary" className="w-full" onClick={() => onChange("keyword", draftKeyword.trim())}>
        Áp dụng
      </Button>
    </Card>
  );
}
