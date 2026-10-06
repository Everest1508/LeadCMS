import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { PageHeader as PH } from '@/components/ui/app-shell';
import { cn } from '@/lib/utils';
import type { Priority, Status } from '@/data';

export const PageHeader = PH;

const statusTone: Record<Status, React.ComponentProps<typeof Badge>['variant']> = {
  New: 'info', 'Pending Verification': 'warning', Verified: 'success', Contacted: 'default', Qualified: 'info',
  'Meeting Scheduled': 'default', 'Proposal Sent': 'default', Negotiation: 'warning', Won: 'success', Lost: 'danger',
};
export const StatusBadge = ({ status }: { status: Status }) => <Badge variant={statusTone[status]} dot>{status}</Badge>;

const prioTone = { Hot: 'danger', Warm: 'warning', Cold: 'info' } as const;
export const PriorityBadge = ({ priority }: { priority: Priority }) => <Badge variant={prioTone[priority]}>{priority}</Badge>;

export function Score({ value }: { value: number }) {
  const tone = value >= 80 ? 'bg-success' : value >= 50 ? 'bg-warning' : 'bg-destructive';
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-1.5 w-12 overflow-hidden rounded-full bg-secondary"><span className={cn('block h-full rounded-full', tone)} style={{ width: `${value}%` }} /></span>
      <span className="w-7 text-xs tabular-nums text-muted-foreground">{value}</span>
    </span>
  );
}

export const SectionTitle = ({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) => (
  <div className="flex items-center justify-between px-5 pt-4 pb-3"><h3 className="text-sm font-semibold tracking-tight">{children}</h3>{action}</div>
);

export const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-4 py-2 text-[13px]"><dt className="shrink-0 text-muted-foreground">{label}</dt><dd className="text-right font-medium">{children || '—'}</dd></div>
);
