export type UserRole = 'candidate' | 'employer' | 'admin';

export type JobWorkMode = 'onsite' | 'remote' | 'hybrid';
export type JobLevel = 'intern' | 'junior' | 'middle' | 'senior';
export type JobStatus = 'pending' | 'approved' | 'rejected' | 'closed';
export type ApplicationStatus = 'applied' | 'contacted' | 'interview' | 'hired' | 'rejected';
export type CvTemplateType = 'modern' | 'classic' | 'minimal';

export interface User {
  _id: string;
  email: string;
  role: UserRole;
  fullName?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  skills?: string[];
  desiredTitle?: string;
  desiredLevel?: JobLevel;
  desiredSalaryMin?: number;
  desiredLocation?: string;
  cvUrl?: string;
  cvTemplate?: CvTemplateType;
  isCvPublic?: boolean;
  cvShareToken?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Company {
  _id: string;
  user: string | Pick<User, '_id' | 'email' | 'fullName'>;
  name: string;
  logo?: string;
  description?: string;
  address?: string;
  website?: string;
  size?: string;
  industry?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Job {
  _id: string;
  company: string | Company;
  companyName?: string;
  companyLogo?: string;
  category?: string | Category;
  categoryName?: string;
  title: string;
  description?: string;
  benefits?: string;
  requirements?: string;
  skills: string[];
  location?: string;
  workMode: JobWorkMode;
  level: JobLevel;
  education?: string;
  salaryMin?: number;
  salaryMax?: number;
  deadline?: string;
  status: JobStatus;
  rejectReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Application {
  _id: string;
  job: string | Job;
  user: string | User;
  cvUrl?: string;
  coverLetter?: string;
  status: ApplicationStatus;
  appliedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PremiumPackage {
  _id: string;
  name: string;
  price: number;
  durationDays: number;
  postLimit: number;
  features: string[];
}

export interface RecruiterPremium {
  _id: string;
  company: string | Company;
  package: string | PremiumPackage;
  startAt?: string;
  endAt?: string;
  remainingPosts?: number;
  paymentRef: string;
  paymentStatus: 'pending' | 'success' | 'failed';
  createdAt?: string;
}

export interface ScoreBreakdown {
  skills: number;
  experience: number;
  level: number;
  projects: number;
  title: number;
  salary: number;
  location: number;
  education: number;
  profileQuality: number;
}

export interface CandidateRecommendationItem {
  candidate: User;
  totalScore: number;
  maxScore: number;
  percent: number;
  rank: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'WEAK';
  breakdown: ScoreBreakdown;
}

export interface JobRecommendationItem {
  job: Job;
  totalScore: number;
  maxScore: number;
  percent: number;
  rank: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'WEAK';
  breakdown: ScoreBreakdown;
}

export interface CandidateCvData {
  profile: User & { cvTemplate: CvTemplateType; isCvPublic: boolean };
  educations: Array<{ _id?: string; school?: string; major?: string; degree?: string; startDate?: string; endDate?: string }>;
  workExperiences: Array<{ _id?: string; position?: string; company?: string; startDate?: string; endDate?: string; description?: string }>;
  projects: Array<{ _id?: string; name?: string; description?: string; technologies?: string[]; url?: string }>;
  courses: Array<{ _id?: string; name?: string; organization?: string; date?: string }>;
  languages: Array<{ _id?: string; name?: string; level?: string }>;
  health: Array<{ _id?: string; height?: number; weight?: number; note?: string }>;
  otherInfo: Array<{ _id?: string; content?: string }>;
  completeness: number;
  shareUrl: string | null;
}

export interface SalaryByCategoryRow {
  _id: string;
  avgMin: number;
  avgMax: number;
  medianMin: number;
  medianMax: number;
  count: number;
}

export interface MarketOverview {
  source: string;
  period: string;
  salaryByCategory: SalaryByCategoryRow[];
  hotSkills: Array<{ _id: string; count: number }>;
  demandTrend: Array<{ _id: string; count: number }>;
}

export interface AdminReport {
  revenue: number;
  premiumOrders: number;
  users: {
    total: number;
    active: number;
    candidates: number;
    employers: number;
    admins: number;
  };
  companies: number;
  jobs: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    closed: number;
  };
  applications: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
