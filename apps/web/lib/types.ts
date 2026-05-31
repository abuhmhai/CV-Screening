export type UserRole = "CANDIDATE" | "RECRUITER" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface Company {
  id: string;
  name: string;
  slug?: string;
  logoUrl?: string | null;
  industry?: string | null;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  level: string;
  jobType: string;
  location?: string | null;
  status: string;
  minSalary?: number | null;
  maxSalary?: number | null;
  requiredSkills?: string[];
  company?: Company | null;
  _count?: { applications: number };
  expiresAt?: string | null;
}

export interface AiResult {
  overallScore: string | number;
  skillScore?: string | number;
  experienceScore?: string | number;
  educationScore?: string | number;
  otherScore?: string | number;
  grade?: string | null;
  matchedSkills?: string[];
  missingSkills?: string[];
  strengths?: string[];
  concerns?: string[];
  explanation?: string | null;
  processingTimeMs?: number | null;
}

export interface Application {
  id: string;
  status: string;
  coverLetter?: string | null;
  appliedAt: string;
  job?: Job | null;
  aiResult?: AiResult | null;
  candidate?: {
    id: string;
    email: string;
    profile?: { fullName?: string | null; headline?: string | null; avatarUrl?: string | null } | null;
  } | null;
  statusHistory?: Array<{
    id: string;
    fromStatus: string;
    toStatus: string;
    note?: string | null;
    changedAt: string;
  }>;
}

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  profile?: {
    fullName?: string | null;
    headline?: string | null;
    about?: string | null;
    avatarUrl?: string | null;
    coverUrl?: string | null;
    location?: string | null;
    profileCompleteness?: number | null;
  } | null;
  workExperiences?: Array<{
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate?: string | null;
    isCurrent: boolean;
    description?: string | null;
  }>;
  educations?: Array<{
    id: string;
    school: string;
    degree: string;
    major?: string | null;
    gpa?: string | null;
    startYear?: number | null;
    endYear?: number | null;
  }>;
  userSkills?: Array<{
    level?: string | null;
    skill: { id: string; name: string };
  }>;
  cvFiles?: Array<{
    id: string;
    fileName: string;
    isPrimary: boolean;
  }>;
}

export interface FeedPost {
  id: string;
  content: string;
  mediaUrls?: string[];
  likeCount: number;
  commentCount: number;
  feedScore?: number;
  createdAt: string;
  author?: {
    id: string;
    profile?: { fullName?: string | null; headline?: string | null; avatarUrl?: string | null } | null;
  } | null;
  comments?: Array<{
    id: string;
    content: string;
    createdAt: string;
    author?: {
      id: string;
      profile?: { fullName?: string | null; avatarUrl?: string | null } | null;
    } | null;
  }>;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  isRead: boolean;
  createdAt: string;
  payload?: Record<string, unknown> | null;
}

export interface ConversationParticipant {
  conversation: {
    id: string;
    type: string;
    participants: Array<{
      userId: string;
      user: {
        id: string;
        profile?: { fullName?: string | null; avatarUrl?: string | null } | null;
      };
    }>;
    messages: Array<{
      id: string;
      senderId: string;
      content: string;
      sentAt: string;
    }>;
  };
}

export interface ConnectionItem {
  id: string;
  status: string;
  requesterId: string;
  addresseeId: string;
  requester?: { id: string; profile?: { fullName?: string | null } | null };
  addressee?: { id: string; profile?: { fullName?: string | null } | null };
}

export interface SearchResult {
  people: UserProfile[];
  jobs: Job[];
  posts: FeedPost[];
  companies: Company[];
}

export interface OnboardingChecklist {
  completion: number;
  items: Array<{ key: string; label: string; done: boolean }>;
}

export interface PrivacySettings {
  profilePublic: boolean;
  showActivity: boolean;
  allowMessagesFromNonConnections: boolean;
  showOnlinePresence: boolean;
}
