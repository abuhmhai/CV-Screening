export type UserRole = "CANDIDATE" | "RECRUITER" | "ADMIN";
export type ApplicationStatus =
  | "APPLIED"
  | "AI_SCREENING"
  | "HR_REVIEW"
  | "INTERVIEW"
  | "OFFER"
  | "HIRED"
  | "REJECTED"
  | "WITHDRAWN";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  isVerified?: boolean;
  createdAt?: string;
}

export interface NotificationPrefs {
  emailApplications: boolean;
  emailMessages: boolean;
  emailJobAlerts: boolean;
  emailDigest: boolean;
  pushMessages: boolean;
  pushApplications: boolean;
  marketingEmails: boolean;
}

export interface AppearancePrefs {
  fontSize: "default" | "large";
  compactMode: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
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
  coverUrl?: string | null;
  website?: string | null;
  industry?: string | null;
  sizeRange?: string | null;
  foundedYear?: number | null;
  address?: string | null;
  description?: string | null;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  level: string;
  jobType: string;
  experienceLevel?: string | null;
  category?: string | null;
  isRemote?: boolean;
  location?: string | null;
  status: string;
  minSalary?: number | null;
  maxSalary?: number | null;
  salaryCurrency?: string | null;
  slug?: string | null;
  viewsCount?: number;
  publishedAt?: string | null;
  requiredSkills?: string[];
  company?: Company | null;
  _count?: { applications: number };
  expiresAt?: string | null;
}

export interface ExternalJob {
  id: string;
  source: "topcv" | "vietnamworks" | "linkedin";
  title: string;
  company: string;
  salary?: string | null;
  location?: string | null;
  url: string;
  jd?: string | null;
  skills: string[];
  isActive: boolean;
  crawledAt: string;
}

export interface ExternalJobSummary {
  id: string;
  source: ExternalJob["source"];
  title: string;
  company: string;
  location?: string | null;
  salary?: string | null;
  url: string;
  skills: string[];
  description?: string | null;
  requirements?: string | null;
  highlights: string[];
  hasDetail: boolean;
}

export interface CvScreeningReport {
  score: number;
  verdict: string;
  strengths: string[];
  gaps: string[];
  suggestion: string;
  keywords_matched: string[];
  keywords_missing: string[];
}

export interface Paginated<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface JobFacets {
  jobTypes: { value: string; count: number }[];
  levels: { value: string; count: number }[];
  categories: { value: string; count: number }[];
}

export interface SavedJob {
  jobId: string;
  createdAt: string;
  job: Job;
}

export interface CompanyPost {
  id: string;
  content: string;
  createdAt: string;
  author?: {
    email: string;
    profile?: { fullName?: string | null; avatarUrl?: string | null } | null;
  } | null;
}

export interface CompanyDetail {
  company: Company;
  activeJobs: Job[];
  followerCount: number;
  jobsCount: number;
  posts: CompanyPost[];
}

export interface CvExperienceEntry {
  company?: string;
  position?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface CvEducationEntry {
  school?: string;
  degree?: string;
  major?: string;
  startYear?: string | number;
  endYear?: string | number;
}

export interface CvSkillEntry {
  name?: string;
  level?: string;
}

export interface GeneratedCvData {
  fullName?: string;
  headline?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  experiences?: CvExperienceEntry[];
  educations?: CvEducationEntry[];
  skills?: CvSkillEntry[];
}

export interface GeneratedCv {
  id: string;
  title: string;
  templateId: string;
  data: GeneratedCvData;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JobAlert {
  id: string;
  keyword?: string | null;
  filters?: Record<string, unknown> | null;
  frequency: "DAILY" | "WEEKLY" | "INSTANT";
  isActive: boolean;
  lastSentAt?: string | null;
  createdAt: string;
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

export type OfferStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "WITHDRAWN";

export interface Offer {
  id: string;
  applicationId: string;
  salaryAmount?: number | null;
  salaryCurrency: string;
  startDate?: string | null;
  responseDeadline?: string | null;
  note?: string | null;
  offerLetterUrl?: string | null;
  status: OfferStatus;
  declineReason?: string | null;
  createdBy: string;
  respondedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  status: ApplicationStatus;
  coverLetter?: string | null;
  appliedAt: string;
  job?: Job | null;
  aiResult?: AiResult | null;
  offer?: Offer | null;
  cvFile?: {
    id: string;
    fileUrl: string;
    fileName: string;
    fileSize?: number | string;
    isPrimary?: boolean;
    extractedText?: string | null;
  } | null;
  candidate?: {
    id: string;
    email: string;
    profile?: {
      fullName?: string | null;
      headline?: string | null;
      about?: string | null;
      avatarUrl?: string | null;
      location?: string | null;
    } | null;
    userSkills?: Array<{
      level?: string | null;
      yearsExp?: string | number | null;
      skill: { id: string; name: string };
    }>;
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
      gpa?: string | number | null;
      startYear?: number | null;
      endYear?: number | null;
    }>;
  } | null;
  statusHistory?: Array<{
    fromStatus?: ApplicationStatus | null;
    toStatus: ApplicationStatus;
    note?: string | null;
    changedAt: string;
  }>;
}

export interface SocialLinks {
  github?: string | null;
  linkedin?: string | null;
  website?: string | null;
  portfolio?: string | null;
  twitter?: string | null;
}

export interface LanguageEntry {
  name: string;
  proficiency?: string | null;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate?: string | null;
  credentialUrl?: string | null;
}

export interface Project {
  id: string;
  title: string;
  description?: string | null;
  url?: string | null;
  skills?: string[];
  startDate?: string | null;
  endDate?: string | null;
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
    socialLinks?: SocialLinks | null;
    languages?: LanguageEntry[] | null;
    publicSlug?: string | null;
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
  certifications?: Certification[];
  projects?: Project[];
  cvFiles?: Array<{
    id: string;
    fileName: string;
    fileUrl?: string;
    fileSize?: number | string;
    isPrimary: boolean;
    extractedText?: string | null;
  }>;
}

export interface ProfileInsights {
  readiness: number;
  completeness: number;
  skillCoverage: number;
  matchedSkills: string[];
  missingSkills: Array<{ skill: string; demand: number }>;
  recommendedJobs: Array<{
    id: string;
    title: string;
    company?: string | null;
    location?: string | null;
    recommendationScore: number;
    matchedSkillCount: number;
  }>;
  tips: string[];
}

export interface ProfileDashboard {
  totalApplications: number;
  applicationsByStatus: Record<string, number>;
  savedJobs: number;
  recentApplications: Array<{
    id: string;
    status: string;
    appliedAt: string;
    jobTitle: string;
    company?: string | null;
  }>;
}

export interface PublicProfile {
  slug: string;
  fullName: string;
  headline?: string | null;
  about?: string | null;
  location?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  socialLinks?: SocialLinks | null;
  languages?: LanguageEntry[] | null;
  skills: Array<{ name: string; level?: string | null }>;
  experiences: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate?: string | null;
    isCurrent: boolean;
    description?: string | null;
  }>;
  educations: Array<{
    school: string;
    degree: string;
    major?: string | null;
    startYear?: number | null;
    endYear?: number | null;
  }>;
  projects: Array<{
    title: string;
    description?: string | null;
    url?: string | null;
    skills?: string[];
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    issueDate?: string | null;
    credentialUrl?: string | null;
  }>;
  activity?: { applications: number } | null;
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
  data?: Record<string, unknown> | null;
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
  items: Array<{ key: string; label: string; section?: string; done: boolean }>;
}

export interface PrivacySettings {
  profilePublic: boolean;
  showActivity: boolean;
  allowMessagesFromNonConnections: boolean;
  showOnlinePresence: boolean;
}
