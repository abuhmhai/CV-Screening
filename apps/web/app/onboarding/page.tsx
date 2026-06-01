"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { apiFetch } from "../../lib/api-client";
import { OnboardingChecklist } from "../../lib/types";
import { AuthGate } from "../../components/auth-gate";
import { PageHeader, Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { FieldLabel, Input, Textarea } from "../../components/ui/input";
import { LoadingBlock } from "../../components/ui/states";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

function AnimatedCounter({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 20;
    const stepTime = duration / steps;
    const increment = value / steps;
    
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return <span className="tabular-nums">{displayValue}</span>;
}

function OnboardingContent() {
  const { token, refreshUser } = useAuth();
  const [checklist, setChecklist] = useState<OnboardingChecklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasCelebrated, setHasCelebrated] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    headline: "",
    about: "",
    location: ""
  });

  async function loadChecklist() {
    if (!token) return;
    const result = await apiFetch<OnboardingChecklist>("/users/me/onboarding-checklist", { token });
    if (result.ok && result.data) {
      setChecklist(result.data);
      
      // Celebrate if 100% and haven't celebrated yet
      if (result.data.completion === 100 && !hasCelebrated) {
        setHasCelebrated(true);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#9fe870", "#163300", "#0e0f0c", "#ffeb69"]
        });
        toast.success("🎉 Hồ sơ hoàn chỉnh! Bạn đã sẵn sàng ứng tuyển.");
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    void loadChecklist();
  }, [token]);

  const pendingItems = useMemo(
    () => (checklist?.items ?? []).filter((item) => !item.done),
    [checklist]
  );

  async function saveProfile() {
    if (!token) return;
    setSaving(true);
    const result = await apiFetch("/users/me/profile", {
      method: "PATCH",
      token,
      body: JSON.stringify(form)
    });
    
    if (result.ok) {
      toast.success("Đã lưu thông tin hồ sơ");
      await refreshUser();
      await loadChecklist();
    } else {
      toast.error(result.error || "Không thể lưu hồ sơ");
    }
    setSaving(false);
  }

  if (loading) return <LoadingBlock />;

  const completion = checklist?.completion ?? 0;
  const isComplete = completion === 100;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <PageHeader
        title="Hoàn thiện hồ sơ"
        description="Hồ sơ đầy đủ giúp tăng matching score, hiển thị tốt hơn trong network và nhận được nhiều cơ hội việc làm phù hợp."
      />

      <Card variant="content" className={`relative overflow-hidden ${isComplete ? "ring-2 ring-primary" : ""}`}>
        {isComplete ? (
          <div className="absolute top-0 right-0 -z-10 h-32 w-32 rounded-bl-full bg-primary/20" />
        ) : null}

        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold text-ink">Tiến độ hoàn thành</h2>
            <p className="mt-1 text-body-sm text-body">
              {isComplete ? "Tuyệt vời! Hồ sơ của bạn đã hoàn thiện 100%." : "Hoàn thành các bước dưới đây để mở khóa toàn bộ tính năng."}
            </p>
          </div>
          <div className={`text-4xl font-black tabular-nums ${isComplete ? "text-positive-deep" : "text-ink"}`}>
            <AnimatedCounter value={completion} />%
          </div>
        </div>

        <div className="relative mb-8 h-4 overflow-hidden rounded-pill bg-canvas-soft">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completion}%` }}
            transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
            className="h-full rounded-pill bg-primary"
          />
        </div>
        
        <ul className="space-y-3 stagger-children">
          {(checklist?.items ?? []).map((item, i) => {
            const isNext = !item.done && i === (checklist?.items.findIndex(x => !x.done) ?? -1);
            
            return (
              <motion.li
                key={item.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className={`flex items-center justify-between rounded-xl px-5 py-4 transition-all ${
                  item.done
                    ? "border border-transparent bg-primary-pale/50"
                    : isNext
                      ? "border border-ink/10 border-l-4 border-l-primary bg-canvas shadow-sm"
                      : "border border-ink/10 bg-canvas"
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.done ? (
                    <div className="relative">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <CheckCircle2 className="text-positive-deep" size={24} />
                      </motion.div>
                    </div>
                  ) : (
                    <Circle className={isNext ? "text-ink-deep" : "text-mute"} size={24} />
                  )}
                  <span className={`font-medium ${item.done ? "text-body line-through" : isNext ? "font-bold text-ink" : "text-ink"}`}>
                    {item.label}
                  </span>
                </div>
                
                {isNext && (
                  <Button variant="ghost" className="h-8 px-3 text-body-sm text-ink-deep hover:bg-primary-pale" rightIcon={<ArrowRight size={14} />}>
                    Làm ngay
                  </Button>
                )}
              </motion.li>
            );
          })}
        </ul>
      </Card>

      {pendingItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card>
            <h2 className="text-xl font-semibold text-ink">Thiết lập hồ sơ nhanh</h2>
            <p className="mb-6 mt-1 text-body-sm text-body">
              Cập nhật nhanh các trường cơ bản để hoàn tất onboarding.
            </p>
            <div className="grid gap-5 md:grid-cols-2">
              <FieldLabel label="Họ tên">
                <Input
                  placeholder="Nhập họ và tên của bạn"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </FieldLabel>
              <FieldLabel label="Địa điểm">
                <Input
                  placeholder="VD: TP. Hồ Chí Minh"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </FieldLabel>
              <div className="md:col-span-2">
                <FieldLabel label="Headline">
                  <Input
                    placeholder="VD: Senior Frontend Engineer @ TechCorp"
                    value={form.headline}
                    onChange={(e) => setForm({ ...form, headline: e.target.value })}
                  />
                </FieldLabel>
              </div>
              <div className="md:col-span-2">
                <FieldLabel label="Giới thiệu bản thân">
                  <Textarea
                    placeholder="Viết một đoạn ngắn giới thiệu về kinh nghiệm và mục tiêu nghề nghiệp của bạn..."
                    rows={4}
                    value={form.about}
                    onChange={(e) => setForm({ ...form, about: e.target.value })}
                  />
                </FieldLabel>
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <Button 
                onClick={saveProfile} 
                isLoading={saving}
                className="px-8"
              >
                Lưu hồ sơ
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <AuthGate>
      <OnboardingContent />
    </AuthGate>
  );
}
