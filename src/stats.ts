import { SALESPEOPLE, STATUSES, fuBucket, isOpen, type Lead, type Activity } from './data';

export const isGenuine = (l: Lead) => l.verification.result === 'Genuine';
/** Furthest status index a lead reached (lost leads got as far as Contacted). */
export const reached = (l: Lead) => (l.status === 'Lost' ? 3 : STATUSES.indexOf(l.status));
const R = (s: (typeof STATUSES)[number]) => STATUSES.indexOf(s);

export const countBy = <T,>(items: T[], key: (t: T) => string) =>
  items.reduce<Record<string, number>>((m, t) => ((m[key(t)] = (m[key(t)] ?? 0) + 1), m), {});

export function kpis(leads: Lead[]) {
  const won = leads.filter((l) => l.status === 'Won').length;
  const genuine = leads.filter(isGenuine).length;
  return {
    total: leads.length,
    fresh: leads.filter((l) => l.status === 'New').length,
    pending: leads.filter((l) => l.status === 'Pending Verification').length,
    genuine,
    qualified: leads.filter((l) => l.status === 'Qualified').length,
    won,
    lost: leads.filter((l) => l.status === 'Lost').length,
    conversion: genuine ? Math.round((won / genuine) * 100) : 0,
  };
}

/** Leads received per 4-day bucket over the last 32 days, for sparklines. */
export function trend(leads: Lead[], pred: (l: Lead) => boolean = () => true) {
  const out = Array<number>(8).fill(0);
  for (const l of leads) {
    if (!pred(l)) continue;
    const b = 7 - Math.floor((Date.now() - +new Date(l.receivedAt)) / (4 * 86400e3));
    if (b >= 0 && b < 8) out[b]!++;
  }
  return out;
}

export function performance(leads: Lead[], people = SALESPEOPLE) {
  return people.map((name) => {
    const mine = leads.filter((l) => l.assignedTo === name);
    const assigned = mine.length;
    const won = mine.filter((l) => l.status === 'Won').length;
    return {
      name, assigned, won,
      verified: mine.filter(isGenuine).length,
      contacted: mine.filter((l) => reached(l) >= R('Contacted')).length,
      meetings: mine.filter((l) => reached(l) >= R('Meeting Scheduled')).length,
      proposals: mine.filter((l) => reached(l) >= R('Proposal Sent')).length,
      lost: mine.filter((l) => l.status === 'Lost').length,
      conversion: assigned ? Math.round((won / assigned) * 100) : 0,
    };
  });
}

export interface FollowUp extends Activity { lead: Lead; bucket: 'overdue' | 'today' | 'upcoming' }
export function followUps(leads: Lead[]) {
  const list: FollowUp[] = [];
  for (const lead of leads) for (const a of lead.activities) { const bucket = fuBucket(a); if (bucket) list.push({ ...a, lead, bucket }); }
  list.sort((a, b) => +new Date(a.due!) - +new Date(b.due!));
  return {
    list,
    overdue: list.filter((f) => f.bucket === 'overdue').length,
    today: list.filter((f) => f.bucket === 'today').length,
    upcoming: list.filter((f) => f.bucket === 'upcoming').length,
  };
}

export const pipelineValue = (leads: Lead[]) => leads.filter(isOpen).filter(isGenuine).reduce((s, l) => s + l.value, 0);

export function toCsv(leads: Lead[]) {
  const head = ['Lead ID', 'Name', 'Company', 'Email', 'Phone', 'Location', 'Requirement', 'Source', 'Received', 'Status', 'Priority', 'Assigned To', 'Value'];
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [head, ...leads.map((l) => [l.id, l.name, l.company, l.email, l.phone, l.location, l.requirement, l.source, l.receivedAt, l.status, l.priority, l.assignedTo, l.value])].map((r) => r.map(esc).join(',')).join('\n');
}
export function download(name: string, text: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
