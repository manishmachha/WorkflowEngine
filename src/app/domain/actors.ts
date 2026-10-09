export interface User {
  id: string;
  displayName: string;
  email: string;
  roles: string[];
  departmentId?: string;
  zone?: string;
  district?: string;
  reportingManagerId?: string;
  active: boolean;
}

export interface Role {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  parentId?: string;
}

export interface Delegation {
  id: string;
  fromUserId: string;
  toUserId: string;
  from: string;
  to: string;
  reason?: string;
  active: boolean;
}

export interface EscalationPolicy {
  id: string;
  name: string;
  levels: EscalationLevel[];
}

export interface EscalationLevel {
  afterMinutes: number;
  target: 'reportingManager' | 'departmentHead' | 'fixedRole' | 'fixedUser';
  role?: string;
  userId?: string;
  notify?: ('email' | 'sms' | 'push' | 'inApp')[];
}

export interface HolidayCalendar {
  id: string;
  name: string;
  timezone: string;
  holidays: { date: string; label: string }[];
  workingDays: number[]; // 0=Sunday..6=Saturday
}
