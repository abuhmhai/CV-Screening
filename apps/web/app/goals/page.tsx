"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Target,
  CheckCircle2,
  Circle,
  Calendar,
  DollarSign,
  TrendingUp,
  Sparkles,
  Plus,
  Trash2,
  Briefcase,
  Award,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import {
  CareerGoal,
  getCareerGoals,
  toggleMilestone,
  addCareerGoal,
  deleteCareerGoal
} from "../../lib/goals-service";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";

export default function GoalsPage() {
  const [goals, setGoals] = useState<CareerGoal[]>([]);
  const [filter, setFilter] = useState<"ALL" | "IN_PROGRESS" | "COMPLETED">("ALL");
  const [activeTab, setActiveTab] = useState<Record<string, "milestones" | "skills" | "advice">>({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Goal Form State
  const [newTitle, setNewTitle] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newSalary, setNewSalary] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [newMilestonesText, setNewMilestonesText] = useState("");

  useEffect(() => {
    setGoals(getCareerGoals());
  }, []);

  const handleToggle = (goalId: string, milestoneId: string) => {
    const updated = toggleMilestone(goalId, milestoneId);
    setGoals(updated);
    toast.success("Đã cập nhật tiến độ mốc mục tiêu");
  };

  const handleDelete = (goalId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa mục tiêu này?")) {
      const updated = deleteCareerGoal(goalId);
      setGoals(updated);
      toast.success("Đã xóa mục tiêu");
    }
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newRole.trim()) {
      toast.error("Vui lòng nhập tên mục tiêu và vị trí mong muốn");
      return;
    }

    const lines = newMilestonesText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const milestones = lines.length > 0
      ? lines.map((line, idx) => ({
          id: `m-custom-${Date.now()}-${idx}`,
          title: line,
          completed: false,
          category: "SKILL" as const
        }))
      : [
          { id: `m-def-1`, title: `Hoàn thiện hồ sơ CV cho vị trí ${newRole}`, completed: false, category: "CV" as const },
          { id: `m-def-2`, title: `Trau dồi kỹ năng chuyên môn cốt lõi`, completed: false, category: "SKILL" as const },
          { id: `m-def-3`, title: `Nộp đơn ứng tuyển tại các công ty mục tiêu`, completed: false, category: "INTERVIEW" as const }
        ];

    const updated = addCareerGoal({
      title: newTitle.trim(),
      targetRole: newRole.trim(),
      targetSalary: newSalary.trim() || "Thỏa thuận",
      targetCompany: newCompany.trim() || "Các công ty công nghệ hàng đầu",
      deadline: newDeadline || "2026-12-31",
      milestones,
      skillGaps: [
        { skill: "Kỹ năng chuyên môn chính", status: "LEARNING", importance: "HIGH", recommendedAction: "Học tập qua dự án thực chiến" },
        { skill: "Kinh nghiệm thực tế", status: "LEARNING", importance: "HIGH", recommendedAction: "Tạo portfolio showcase trên GitHub" }
      ],
      aiAdvice: [
        `Hệ thống AI đề xuất bạn nên cập nhật CV thường xuyên để thuật toán gợi ý các việc làm ${newRole} mới nhất.`,
        "Hãy chia nhỏ các đầu việc cần làm thành từng tuần để duy trì động lực tốt nhất."
      ]
    });

    setGoals(updated);
    setIsModalOpen(false);
    setNewTitle("");
    setNewRole("");
    setNewSalary("");
    setNewCompany("");
    setNewDeadline("");
    setNewMilestonesText("");
    toast.success("Đã tạo mục tiêu nghề nghiệp thành công!");
  };

  const filteredGoals = goals.filter((g) => {
    if (filter === "ALL") return true;
    return g.status === filter;
  });

  const totalMilestones = goals.reduce((acc, g) => acc + g.milestones.length, 0);
  const completedMilestones = goals.reduce(
    (acc, g) => acc + g.milestones.filter((m) => m.completed).length,
    0
  );
  const avgProgress = goals.length
    ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / goals.length)
    : 0;

  return (
    <div className="space-y-8 max-w-container mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-hairline pb-6">
        <div>
          <div className="flex items-center gap-2 text-accent-blue text-sm font-medium mb-1">
            <Target className="h-4 w-4" />
            <span>Lộ trình nghề nghiệp cá nhân</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight">
            Quản lý Mục tiêu & Kế hoạch Phát triển
          </h1>
          <p className="mt-1 text-sm text-mute max-w-2xl">
            Thiết lập vị trí mơ ước, theo dõi từng mốc hành động và nhận phân tích AI về khoảng cách kỹ năng (Skill Gap) từ hồ sơ CV của bạn.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 shrink-0 self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Tạo mục tiêu mới</span>
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-hairline bg-surface-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-mute text-xs font-medium">
            <span>Tổng mục tiêu</span>
            <Target className="h-4 w-4 text-accent-blue" />
          </div>
          <div className="mt-2 text-2xl font-bold text-ink">{goals.length}</div>
          <div className="text-xs text-mute mt-1">Đang theo đuổi</div>
        </div>

        <div className="p-4 rounded-xl border border-hairline bg-surface-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-mute text-xs font-medium">
            <span>Mốc hoàn thành</span>
            <CheckCircle2 className="h-4 w-4 text-accent-green" />
          </div>
          <div className="mt-2 text-2xl font-bold text-ink">
            {completedMilestones} <span className="text-xs font-normal text-mute">/ {totalMilestones}</span>
          </div>
          <div className="text-xs text-mute mt-1">Hành động cụ thể</div>
        </div>

        <div className="p-4 rounded-xl border border-hairline bg-surface-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-mute text-xs font-medium">
            <span>Tiến độ trung bình</span>
            <TrendingUp className="h-4 w-4 text-accent-yellow" />
          </div>
          <div className="mt-2 text-2xl font-bold text-ink">{avgProgress}%</div>
          <div className="w-full bg-surface-elevated h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${avgProgress}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-hairline bg-surface-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-mute text-xs font-medium">
            <span>Tối ưu bởi AI</span>
            <Sparkles className="h-4 w-4 text-accent-orange" />
          </div>
          <div className="mt-2 text-2xl font-bold text-ink">CV Gap</div>
          <div className="text-xs text-mute mt-1">Gợi ý kỹ năng tự động</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 rounded-lg border border-hairline bg-surface-card">
          {(["ALL", "IN_PROGRESS", "COMPLETED"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                filter === f
                  ? "bg-surface-elevated text-ink shadow-sm border border-hairline-strong font-semibold"
                  : "text-mute hover:text-ink"
              }`}
            >
              {f === "ALL" && "Tất cả"}
              {f === "IN_PROGRESS" && "Đang thực hiện"}
              {f === "COMPLETED" && "Đã hoàn thành"}
            </button>
          ))}
        </div>

        <span className="text-xs text-mute">
          Hiển thị {filteredGoals.length} mục tiêu
        </span>
      </div>

      {/* Goal Cards List */}
      <div className="space-y-6">
        {filteredGoals.map((goal) => {
          const tab = activeTab[goal.id] || "milestones";

          return (
            <div
              key={goal.id}
              className="rounded-xl border border-hairline bg-surface-card overflow-hidden shadow-sm transition-all hover:border-hairline-strong"
            >
              {/* Card Header */}
              <div className="p-5 sm:p-6 border-b border-hairline">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-bold text-ink">
                        {goal.title}
                      </h2>
                      <Badge
                        tone={goal.status === "COMPLETED" ? "positive" : "default"}
                        className="text-xs"
                      >
                        {goal.status === "COMPLETED" ? "Đã đạt được" : "Đang tiến hành"}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-mute pt-1">
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-accent-blue" />
                        <span className="text-body font-medium">{goal.targetRole}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-accent-green" />
                        <span>{goal.targetSalary}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-accent-yellow" />
                        <span>Hạn mục tiêu: {goal.deadline}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-start">
                    <div className="text-right">
                      <span className="text-lg font-bold text-ink">{goal.progress}%</span>
                      <span className="block text-[11px] text-mute">Hoàn thành</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(goal.id)}
                      className="p-2 rounded-md text-mute hover:text-accent-red hover:bg-surface-elevated transition-colors"
                      title="Xóa mục tiêu"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-surface-elevated h-2 rounded-full mt-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      goal.progress === 100 ? "bg-accent-green" : "bg-primary"
                    }`}
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
              </div>

              {/* Sub-nav Tabs */}
              <div className="flex items-center gap-4 px-5 sm:px-6 pt-3 border-b border-hairline bg-surface-elevated/30 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setActiveTab({ ...activeTab, [goal.id]: "milestones" })}
                  className={`pb-2.5 transition-colors relative ${
                    tab === "milestones"
                      ? "text-ink font-semibold border-b-2 border-primary -mb-px"
                      : "text-mute hover:text-ink"
                  }`}
                >
                  Các mốc thực hiện ({goal.milestones.filter((m) => m.completed).length}/{goal.milestones.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab({ ...activeTab, [goal.id]: "skills" })}
                  className={`pb-2.5 transition-colors relative flex items-center gap-1.5 ${
                    tab === "skills"
                      ? "text-ink font-semibold border-b-2 border-primary -mb-px"
                      : "text-mute hover:text-ink"
                  }`}
                >
                  <Sparkles className="h-3 w-3 text-accent-blue" />
                  <span>AI Phân tích kỹ năng (Skill Gap)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab({ ...activeTab, [goal.id]: "advice" })}
                  className={`pb-2.5 transition-colors relative ${
                    tab === "advice"
                      ? "text-ink font-semibold border-b-2 border-primary -mb-px"
                      : "text-mute hover:text-ink"
                  }`}
                >
                  Lời khuyên chiến lược
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-5 sm:p-6">
                {tab === "milestones" && (
                  <div className="space-y-2.5">
                    {goal.milestones.map((milestone) => (
                      <div
                        key={milestone.id}
                        onClick={() => handleToggle(goal.id, milestone.id)}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                          milestone.completed
                            ? "border-hairline bg-surface-elevated/40 text-mute opacity-80"
                            : "border-hairline bg-surface-card hover:bg-surface-elevated hover:border-hairline-strong text-ink"
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {milestone.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-accent-green" />
                          ) : (
                            <Circle className="h-5 w-5 text-mute" />
                          )}
                        </div>

                        <div className="flex-1">
                          <p
                            className={`text-sm font-medium ${
                              milestone.completed ? "line-through text-mute" : "text-ink"
                            }`}
                          >
                            {milestone.title}
                          </p>
                          {milestone.dueDate && (
                            <p className="text-xs text-mute mt-0.5">
                              Hạn hoàn thành: {milestone.dueDate}
                            </p>
                          )}
                        </div>

                        <Badge tone="default" className="text-[10px] uppercase">
                          {milestone.category}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {tab === "skills" && (
                  <div className="space-y-4">
                    <p className="text-xs text-mute">
                      Thuật toán AI đối chiếu kỹ năng hiện tại trong hồ sơ với tiêu chuẩn của vị trí{" "}
                      <span className="text-ink font-medium">{goal.targetRole}</span>:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {goal.skillGaps.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-lg border border-hairline bg-surface-elevated flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-sm text-ink">{item.skill}</span>
                            <Badge
                              tone={
                                item.status === "ACQUIRED"
                                  ? "positive"
                                  : item.status === "LEARNING"
                                  ? "warning"
                                  : "negative"
                              }
                              className="text-[10px]"
                            >
                              {item.status === "ACQUIRED" && "Đã làm chủ"}
                              {item.status === "LEARNING" && "Đang học"}
                              {item.status === "MISSING" && "Cần bổ sung"}
                            </Badge>
                          </div>
                          {item.recommendedAction && (
                            <p className="text-xs text-body mt-2 border-t border-hairline pt-2">
                              👉 {item.recommendedAction}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="p-3.5 rounded-lg border border-accent-blue/20 bg-accent-blue/5 flex items-start gap-3 mt-4">
                      <Sparkles className="h-5 w-5 text-accent-blue shrink-0 mt-0.5" />
                      <div className="text-xs text-body space-y-1">
                        <p className="font-semibold text-ink">Gợi ý việc làm phù hợp với mục tiêu này</p>
                        <p>
                          Hệ thống đã tìm thấy các vị trí đang tuyển dụng sát với mục tiêu của bạn.
                        </p>
                        <Link
                          href={`/search?q=${encodeURIComponent(goal.targetRole)}`}
                          className="inline-flex items-center gap-1 font-medium text-accent-blue hover:underline pt-1"
                        >
                          Xem các việc làm {goal.targetRole} ngay <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {tab === "advice" && (
                  <div className="space-y-3">
                    {goal.aiAdvice.map((advice, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-lg border border-hairline bg-surface-elevated flex items-start gap-3"
                      >
                        <Award className="h-5 w-5 text-accent-yellow shrink-0 mt-0.5" />
                        <p className="text-sm text-body leading-relaxed">{advice}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredGoals.length === 0 && (
          <div className="text-center py-16 rounded-xl border border-hairline bg-surface-card p-8">
            <Target className="h-12 w-12 text-mute mx-auto mb-3 opacity-60" />
            <h3 className="font-bold text-lg text-ink">Chưa có mục tiêu nào</h3>
            <p className="text-sm text-mute mt-1 max-w-md mx-auto">
              Hãy bắt đầu bằng việc đặt ra vị trí công việc mà bạn muốn chinh phục trong năm nay!
            </p>
            <Button onClick={() => setIsModalOpen(true)} className="mt-4">
              Tạo mục tiêu ngay
            </Button>
          </div>
        )}
      </div>

      {/* Modal Tạo mục tiêu mới */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-xl border border-hairline bg-surface-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-ink">Tạo Mục Tiêu Nghề Nghiệp Mới</h2>
            <p className="text-xs text-mute mt-1">
              Thiết lập mục tiêu rõ ràng giúp bạn gia tăng 70% cơ hội trúng tuyển.
            </p>

            <form onSubmit={handleCreateGoal} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Tiêu đề mục tiêu *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Chinh phục vị trí Senior Backend Engineer"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-md border border-hairline bg-surface-elevated px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Vị trí mong muốn *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Senior NestJS Developer"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full rounded-md border border-hairline bg-surface-elevated px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Mức lương kỳ vọng
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 35,000,000 VND"
                    value={newSalary}
                    onChange={(e) => setNewSalary(e.target.value)}
                    className="w-full rounded-md border border-hairline bg-surface-elevated px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Công ty mục tiêu (tùy chọn)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: VNG, Tiki, Viettel"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    className="w-full rounded-md border border-hairline bg-surface-elevated px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Hạn hoàn thành
                  </label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full rounded-md border border-hairline bg-surface-elevated px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Các mốc hành động cụ thể (Mỗi mốc 1 dòng)
                </label>
                <textarea
                  rows={4}
                  placeholder={"VD:\nHoàn thành chứng chỉ AWS Developer\nXây dựng 1 ứng dụng fullstack mở rộng\nTối ưu CV đạt trên 85 điểm AI"}
                  value={newMilestonesText}
                  onChange={(e) => setNewMilestonesText(e.target.value)}
                  className="w-full rounded-md border border-hairline bg-surface-elevated p-3 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-[11px] text-mute mt-1">
                  Nếu để trống, hệ thống sẽ tự động tạo bộ mốc lộ trình tiêu chuẩn cho bạn.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-mute hover:text-ink transition-colors"
                >
                  Hủy
                </button>
                <Button type="submit">
                  Lưu mục tiêu
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}