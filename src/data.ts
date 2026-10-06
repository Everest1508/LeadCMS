// Domain model + realistic dummy data for the CRM prototype.
// ponytail: users are identified by name (unique here); swap for ids when a backend exists.

export type Role = 'Administrator' | 'Sales Manager' | 'Salesperson';
export interface User { name: string; role: Role; email: string }

export const USERS: User[] = [
  { name: 'Neha Kulkarni', role: 'Administrator', email: 'neha@beforth.in' },
  { name: 'Vikram Joshi', role: 'Sales Manager', email: 'vikram@beforth.in' },
  { name: 'Amit Sharma', role: 'Salesperson', email: 'amit@beforth.in' },
  { name: 'Sneha Kapoor', role: 'Salesperson', email: 'sneha@beforth.in' },
  { name: 'Rohan Mehta', role: 'Salesperson', email: 'rohan@beforth.in' },
  { name: 'Pooja Iyer', role: 'Salesperson', email: 'pooja@beforth.in' },
];
export const SALESPEOPLE = USERS.filter((u) => u.role === 'Salesperson').map((u) => u.name);

export const SOURCES = ['Website', 'Meta Ads', 'Google Ads', 'Instagram', 'Facebook', 'LinkedIn', 'WhatsApp', 'Manual Entry'] as const;
export type Source = (typeof SOURCES)[number];

export const STATUSES = ['New', 'Pending Verification', 'Verified', 'Contacted', 'Qualified', 'Meeting Scheduled', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'] as const;
export type Status = (typeof STATUSES)[number];

/** Kanban columns. "Pending Verification" lives in the New column. */
export const STAGES: Status[] = STATUSES.filter((s) => s !== 'Pending Verification');
export const stageOf = (s: Status): Status => (s === 'Pending Verification' ? 'New' : s);
export const STAGE_LABEL: Partial<Record<Status, string>> = { 'Meeting Scheduled': 'Meeting', 'Proposal Sent': 'Proposal' };
export const stageLabel = (s: Status) => STAGE_LABEL[s] ?? s;

export const PRIORITIES = ['Hot', 'Warm', 'Cold'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const CHECKS = [
  ['phone', 'Phone verified'],
  ['email', 'Email verified'],
  ['company', 'Company verified'],
  ['requirement', 'Requirement verified'],
  ['duplicate', 'Duplicate checked'],
] as const;
export type CheckKey = (typeof CHECKS)[number][0];
export const RESULTS = ['Genuine', 'Not Genuine', 'Need More Information'] as const;
export type VerifyResult = (typeof RESULTS)[number];

export const ACTIVITY_TYPES = ['Call', 'Email', 'Meeting', 'WhatsApp', 'Note', 'Follow-up'] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number] | 'System';

export interface Activity {
  id: string;
  type: ActivityType;
  at: string; // ISO
  user: string;
  description: string;
  due?: string; // follow-up date/time, ISO
  done?: boolean;
}
export interface Verification {
  checks: Partial<Record<CheckKey, boolean>>;
  result?: VerifyResult;
  by?: string;
  at?: string;
  note?: string;
}
export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  location: string;
  requirement: string;
  source: Source;
  campaign?: string;
  receivedAt: string;
  assignedTo?: string;
  assignedBy?: string;
  assignedAt?: string;
  status: Status;
  priority: Priority;
  value: number;
  verification: Verification;
  activities: Activity[]; // newest first; doubles as the audit trail
}

/** Just enough of a lead to run duplicate checks against. */
export type Peer = Pick<Lead, 'id' | 'name' | 'status' | 'phone' | 'email' | 'company'>;

// ---------- qualification, scoring, duplicates ----------
const digits = (s: string) => s.replace(/\D/g, '').slice(-10);
const norm = (s: string) => s.trim().toLowerCase();

export function findDuplicates(l: Pick<Peer, 'id' | 'phone' | 'email' | 'company'>, all: Peer[]) {
  return all.filter(
    (o) =>
      o.id !== l.id &&
      ((digits(l.phone).length === 10 && digits(o.phone) === digits(l.phone)) ||
        (!!l.email && norm(o.email) === norm(l.email)) ||
        (!!l.company && norm(o.company) === norm(l.company))),
  );
}

export function qualify(l: Lead, all: Peer[]) {
  return [
    { label: 'Valid phone number', ok: digits(l.phone).length === 10 },
    { label: 'Valid email', ok: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(l.email) },
    { label: 'Company identified', ok: l.company.trim().length > 2 },
    { label: 'Requirement available', ok: l.requirement.trim().length > 2 },
    { label: 'No duplicate found', ok: findDuplicates(l, all).length === 0 },
    { label: 'Location available', ok: l.location.trim().length > 1 },
  ];
}
/** Lead score = share of qualification indicators that pass (prototype rule, configurable later). */
export const scoreOf = (l: Lead, all: Peer[]) => Math.round((qualify(l, all).filter((q) => q.ok).length / 6) * 100);

// ---------- formatting ----------
export const inr = (n: number) => (n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(1)} L` : `₹${n.toLocaleString('en-IN')}`);
export const inrFull = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const dt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });
const d = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
export const fmtDateTime = (s: string) => dt.format(new Date(s));
export const fmtDate = (s: string) => d.format(new Date(s));
export function ago(s: string) {
  const m = Math.round((Date.now() - +new Date(s)) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (m < 60 * 24) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)}d ago`;
}
export const isOpen = (l: Lead) => l.status !== 'Won' && l.status !== 'Lost';
export const sod = (t = Date.now()) => new Date(new Date(t).setHours(0, 0, 0, 0)).getTime();
export function fuBucket(a: Activity): 'overdue' | 'today' | 'upcoming' | null {
  if (a.type !== 'Follow-up' || a.done || !a.due) return null;
  const t = +new Date(a.due);
  if (t < Date.now()) return 'overdue';
  return t < sod() + 86400e3 ? 'today' : 'upcoming';
}
