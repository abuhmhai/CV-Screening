export interface GoalMilestone {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  category: "SKILL" | "PROJECT" | "CV" | "INTERVIEW";
}

export interface SkillGapItem {
  skill: string;
  status: "ACQUIRED" | "LEARNING" | "MISSING";
  importance: "HIGH" | "MEDIUM" | "OPTIONAL";
  recommendedAction?: string;
}

export interface CareerGoal {
  id: string;
  title: string;
  targetRole: string;
  targetSalary: string;
  targetCompany?: string;
  deadline: string;
  status: "IN_PROGRESS" | "COMPLETED" | "PAUSED";
  progress: number;
  milestones: GoalMilestone[];
  skillGaps: SkillGapItem[];
  aiAdvice: string[];
  createdAt: string;
}

const GOALS_STORAGE_KEY = "cv_career_goals_data";

export const DEFAULT_SAMPLE_GOALS: CareerGoal[] = [
  {
    id: "goal-1",
    title: "Chinh phục vị trí Senior Fullstack Engineer",
    targetRole: "Senior Fullstack Engineer",
    targetSalary: "40,000,000 - 50,000,000 VND",
    targetCompany: "Công ty Công nghệ / Đa quốc gia",
    deadline: "2026-11-30",
    status: "IN_PROGRESS",
    progress: 60,
    milestones: [
      {
        id: "m-1",
        title: "Hoàn thiện kiến trúc Microservices & NestJS nâng cao",
        completed: true,
        dueDate: "2026-08-15",
        category: "SKILL"
      },
      {
        id: "m-2",
        title: "Triển khai dự án Monorepo Next.js 14 App Router + Tailwind",
        completed: true,
        dueDate: "2026-09-01",
        category: "PROJECT"
      },
      {
        id: "m-3",
        title: "Nâng điểm AI Screening của CV hiện tại lên trên 85 điểm",
        completed: true,
        dueDate: "2026-09-20",
        category: "CV"
      },
      {
        id: "m-4",
        title: "Luyện tập 30 bài System Design & Distributed Systems",
        completed: false,
        dueDate: "2026-10-15",
        category: "SKILL"
      },
      {
        id: "m-5",
        title: "Ứng tuyển và vượt qua vòng phỏng vấn kỹ thuật tại 3 công ty mục tiêu",
        completed: false,
        dueDate: "2026-11-15",
        category: "INTERVIEW"
      }
    ],
    skillGaps: [
      { skill: "TypeScript / Node.js", status: "ACQUIRED", importance: "HIGH", recommendedAction: "Đã vững kỹ năng cốt lõi" },
      { skill: "React / Next.js", status: "ACQUIRED", importance: "HIGH", recommendedAction: "Đã làm chủ App Router & SSR" },
      { skill: "PostgreSQL & Prisma", status: "ACQUIRED", importance: "HIGH", recommendedAction: "Tối ưu query và migration" },
      { skill: "Docker & CI/CD", status: "LEARNING", importance: "HIGH", recommendedAction: "Nên bổ sung pipeline GitHub Actions mẫu vào repo cá nhân" },
      { skill: "Redis & Message Queue (RabbitMQ/Kafka)", status: "MISSING", importance: "HIGH", recommendedAction: "Cần nắm cơ chế pub/sub, caching và xử lý queue bất đồng bộ" },
      { skill: "Kubernetes & Cloud AWS", status: "MISSING", importance: "MEDIUM", recommendedAction: "Học triển khai ECS/EKS cơ bản để tạo lợi thế phỏng vấn" }
    ],
    aiAdvice: [
      "Hồ sơ của bạn đã có thế mạnh lớn về TypeScript, Next.js và backend NestJS.",
      "Để đạt điểm tối đa khi ứng tuyển vị trí Senior, bạn nên bổ sung các số liệu định lượng (metrics) vào CV, ví dụ: 'Tối ưu tốc độ tải trang giảm 40%', 'Xử lý 10,000 RPM'.",
      "Kỹ năng còn thiếu trọng yếu nhất là Message Queue và Docker orchestration — hoàn thành mốc số 4 sẽ giúp điểm CV tăng ít nhất +15 điểm."
    ],
    createdAt: "2026-08-01"
  },
  {
    id: "goal-2",
    title: "Mở rộng chuyên môn sang AI / LLM Application Engineer",
    targetRole: "AI Application Engineer",
    targetSalary: "35,000,000 - 45,000,000 VND",
    targetCompany: "AI Startup / Tech Labs",
    deadline: "2026-12-31",
    status: "IN_PROGRESS",
    progress: 40,
    milestones: [
      {
        id: "m-201",
        title: "Nắm vững kỹ thuật Prompt Engineering & Function Calling (OpenAI / Claude)",
        completed: true,
        dueDate: "2026-09-10",
        category: "SKILL"
      },
      {
        id: "m-202",
        title: "Tích hợp dịch vụ AI FastAPI với pipeline Sentence-Transformers & Vector DB",
        completed: true,
        dueDate: "2026-10-01",
        category: "PROJECT"
      },
      {
        id: "m-203",
        title: "Xây dựng hệ thống RAG (Retrieval-Augmented Generation) hoàn chỉnh",
        completed: false,
        dueDate: "2026-11-01",
        category: "PROJECT"
      },
      {
        id: "m-204",
        title: "Đạt chứng chỉ Cloud AI hoặc xuất bản bài viết kỹ thuật trên blog / LinkedIn",
        completed: false,
        dueDate: "2026-12-15",
        category: "CV"
      }
    ],
    skillGaps: [
      { skill: "Python & FastAPI", status: "ACQUIRED", importance: "HIGH", recommendedAction: "Đã có nền tảng API tốt" },
      { skill: "Vector Embeddings & Cosine Similarity", status: "ACQUIRED", importance: "HIGH", recommendedAction: "Áp dụng tốt trong bài toán chấm điểm CV" },
      { skill: "LangChain / LlamaIndex", status: "LEARNING", importance: "HIGH", recommendedAction: "Thực hành xây dựng AI agent tự động" },
      { skill: "Fine-tuning mô hình ngôn ngữ", status: "MISSING", importance: "MEDIUM", recommendedAction: "Tìm hiểu kỹ thuật LoRA / QLoRA" }
    ],
    aiAdvice: [
      "Xu hướng tuyển dụng AI Engineer hiện nay chú trọng nhiều vào khả năng tích hợp ứng dụng thực tế (AI Engineering) hơn là nghiên cứu thuần túy.",
      "Dự án CV Screening này là một điểm nhấn xuất sắc trên CV của bạn để minh chứng năng lực triển khai AI vào thực tế sản xuất."
    ],
    createdAt: "2026-08-10"
  }
];

export function getCareerGoals(): CareerGoal[] {
  if (typeof window === "undefined") return DEFAULT_SAMPLE_GOALS;
  try {
    const raw = localStorage.getItem(GOALS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(DEFAULT_SAMPLE_GOALS));
      return DEFAULT_SAMPLE_GOALS;
    }
    return JSON.parse(raw) as CareerGoal[];
  } catch {
    return DEFAULT_SAMPLE_GOALS;
  }
}

export function saveCareerGoals(goals: CareerGoal[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
}

export function toggleMilestone(goalId: string, milestoneId: string): CareerGoal[] {
  const goals = getCareerGoals();
  const updated = goals.map((goal) => {
    if (goal.id !== goalId) return goal;
    const nextMilestones = goal.milestones.map((m) =>
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );
    const completedCount = nextMilestones.filter((m) => m.completed).length;
    const progress = Math.round((completedCount / (nextMilestones.length || 1)) * 100);
    const status: CareerGoal["status"] =
      progress === 100 ? "COMPLETED" : "IN_PROGRESS";

    return {
      ...goal,
      milestones: nextMilestones,
      progress,
      status
    };
  });
  saveCareerGoals(updated);
  return updated;
}

export function addCareerGoal(newGoal: Omit<CareerGoal, "id" | "progress" | "status" | "createdAt">): CareerGoal[] {
  const goals = getCareerGoals();
  const completedCount = newGoal.milestones.filter((m) => m.completed).length;
  const progress = Math.round((completedCount / (newGoal.milestones.length || 1)) * 100);

  const goal: CareerGoal = {
    ...newGoal,
    id: `goal-${Date.now()}`,
    progress,
    status: progress === 100 ? "COMPLETED" : "IN_PROGRESS",
    createdAt: new Date().toISOString().split("T")[0]
  };

  const updated = [goal, ...goals];
  saveCareerGoals(updated);
  return updated;
}

export function deleteCareerGoal(goalId: string): CareerGoal[] {
  const goals = getCareerGoals();
  const updated = goals.filter((g) => g.id !== goalId);
  saveCareerGoals(updated);
  return updated;
}