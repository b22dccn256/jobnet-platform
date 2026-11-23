export type UserRole = 'candidate' | 'employer' | 'admin';

export type JobWorkMode = 'onsite' | 'remote' | 'hybrid';
export type JobLevel = 'intern' | 'junior' | 'middle' | 'senior';
export type JobStatus = 'pending' | 'approved' | 'rejected' | 'closed';
export type ApplicationStatus = 'applied' | 'contacted' | 'interview' | 'hired' | 'rejected';

export interface User {
  _id: string;
  email: string;
  role: UserRole;
  fullName?: string;
  phone?: string;
  avatar?: string;
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
  category?: string | Category;
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

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
