import type { JobLevel, JobWorkMode, UserRole } from '@/types';

const toMillion = (value: number) => {
  const million = value / 1_000_000;
  return Number.isInteger(million) ? String(million) : million.toFixed(1);
};

/** Format a VND salary range into a short Vietnamese label (e.g. "15 - 25 triệu"). */
export function formatSalary(min?: number, max?: number): string {
  if (!min && !max) return 'Thoả thuận';
  if (min && max) return `${toMillion(min)} - ${toMillion(max)} triệu`;
  if (min) return `Từ ${toMillion(min)} triệu`;
  return `Đến ${toMillion(max as number)} triệu`;
}

export const WORK_MODE_LABEL: Record<JobWorkMode, string> = {
  onsite: 'Tại văn phòng',
  remote: 'Từ xa',
  hybrid: 'Linh hoạt',
};

export const LEVEL_LABEL: Record<JobLevel, string> = {
  intern: 'Thực tập',
  junior: 'Junior',
  middle: 'Middle',
  senior: 'Senior',
};

export const ROLE_LABEL: Record<UserRole, string> = {
  candidate: 'Ứng viên',
  employer: 'Nhà tuyển dụng',
  admin: 'Quản trị viên',
};

/** Default landing route for each role after login / register. */
export const HOME_BY_ROLE: Record<UserRole, string> = {
  admin: '/admin/reports',
  employer: '/employer/dashboard',
  candidate: '/jobs',
};
