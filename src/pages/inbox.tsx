import * as React from 'react';
import { Download, Globe, Search, ShieldCheck, X } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { type DateRange } from '@/components/ui/calendar';
import { DateRangePicker } from '@/components/ui/date-picker';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Segmented } from '@/components/ui/segmented';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PRIORITIES, SALESPEOPLE, SOURCES, STATUSES, fmtDate, scoreOf, type Lead } from '@/data';
import { toCsv, download } from '@/stats';
import { useStore } from '@/store';
import { go } from '@/router';
import { NewLeadDialog } from './new-lead';
import { PageHeader, PriorityBadge, Score, StatusBadge } from './bits';

const PAGE = 10;
type Tab = 'all' | 'verify' | 'unassigned';
const SCORES = { any: 0, '80': 80, '50': 50 } as const;

function Filter({ value, onChange, label, options }: { value: string; onChange: (v: string) => void; label: string; options: readonly string[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-auto min-w-32 text-[13px]"><SelectValue placeholder={label} /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {label.toLowerCase()}</SelectItem>
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export default function InboxPage() {
  const { leads, peers, can, simulate } = useStore();
  const [q, setQ] = React.useState('');
  const [tab, setTab] = React.useState<Tab>('all');
  const [f, setF] = React.useState({ source: 'all', status: 'all', who: 'all', priority: 'all', score: 'any' });
  const [range, setRange] = React.useState<DateRange>();
  const [page, setPage] = React.useState(1);
  const search = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) { e.preventDefault(); search.current?.focus(); }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, []);

  const needsVerify = (l: Lead) => l.status === 'New' || l.status === 'Pending Verification';
  const rows = React.useMemo(() => {
    const term = q.trim().toLowerCase();
    const digits = term.replace(/\D/g, '');
    return leads.filter((l) =>
      (tab === 'all' || (tab === 'verify' ? needsVerify(l) : !l.assignedTo)) &&
      (!term || [l.name, l.company, l.email, l.id].some((v) => v.toLowerCase().includes(term)) || (digits.length > 2 && l.phone.replace(/\D/g, '').includes(digits))) &&
      (f.source === 'all' || l.source === f.source) &&
      (f.status === 'all' || l.status === f.status) &&
      (f.who === 'all' || (f.who === 'Unassigned' ? !l.assignedTo : l.assignedTo === f.who)) &&
      (f.priority === 'all' || l.priority === f.priority) &&
      scoreOf(l, peers) >= SCORES[f.score as keyof typeof SCORES] &&
      (!range?.from || +new Date(l.receivedAt) >= +range.from) &&
      (!range?.to || +new Date(l.receivedAt) < +range.to + 86400e3),
    ).sort((a, b) => +new Date(b.receivedAt) - +new Date(a.receivedAt));
  }, [leads, peers, q, tab, f, range]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const cur = Math.min(page, pages);
  const set = (k: keyof typeof f) => (v: string) => { setF({ ...f, [k]: v }); setPage(1); };
  const filtered = q || range || tab !== 'all' || Object.values(f).some((v) => v !== 'all' && v !== 'any');
  const reset = () => { setQ(''); setRange(undefined); setTab('all'); setF({ source: 'all', status: 'all', who: 'all', priority: 'all', score: 'any' }); setPage(1); };

  return (
    <>
      <PageHeader
        title="Lead Inbox"
        description={`${leads.length} leads from ${new Set(leads.map((l) => l.source)).size} sources, in one place.`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => download('lead-inbox.csv', toCsv(rows))}><Download /> Export CSV</Button>
            <Button variant="outline" size="sm" onClick={() => { simulate('Website'); setPage(1); }}><Globe /> Simulate website lead</Button>
            <NewLeadDialog />
          </>
        }
      />
      <Card>
        <div className="grid gap-3 border-b p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Segmented<Tab>
              value={tab}
              onValueChange={(v) => { setTab(v); setPage(1); }}
              options={[
                { value: 'all', label: `All ${leads.length}` },
                { value: 'verify', label: `Needs verification ${leads.filter(needsVerify).length}` },
                ...(can.seeAll ? [{ value: 'unassigned' as Tab, label: `Unassigned ${leads.filter((l) => !l.assignedTo).length}` }] : []),
              ]}
            />
            <div className="ml-auto w-full sm:w-72">
              <Input ref={search} leftIcon={<Search />} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search name, company, phone, email, ID  ( / )" className="h-8 text-[13px]" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter value={f.source} onChange={set('source')} label="Sources" options={SOURCES} />
            <Filter value={f.status} onChange={set('status')} label="Statuses" options={STATUSES} />
            {can.seeAll && <Filter value={f.who} onChange={set('who')} label="Salespeople" options={['Unassigned', ...SALESPEOPLE]} />}
            <Filter value={f.priority} onChange={set('priority')} label="Priorities" options={PRIORITIES} />
            <Select value={f.score} onValueChange={set('score')}>
              <SelectTrigger className="h-8 w-auto min-w-28 text-[13px]"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="any">Any score</SelectItem><SelectItem value="80">Score ≥ 80</SelectItem><SelectItem value="50">Score ≥ 50</SelectItem></SelectContent>
            </Select>
            <DateRangePicker value={range} onChange={(r) => { setRange(r); setPage(1); }} placeholder="Date received" clearable className="h-8 w-56 text-[13px]" />
            {filtered && <Button variant="ghost" size="xs" onClick={reset}><X /> Clear</Button>}
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="p-6"><EmptyState icon={<Search />} title="No leads match" description="Try removing a filter or searching by phone, email or lead ID." action={<Button variant="outline" size="sm" onClick={reset}>Clear filters</Button>} /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {['Lead ID', 'Name', 'Company', 'Source', 'Requirement', 'Date', 'Status', 'Priority', 'Assigned to', 'Score', ''].map((h) => <TableHead key={h}>{h}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.slice((cur - 1) * PAGE, cur * PAGE).map((l) => (
                <TableRow key={l.id} className="cursor-pointer" onClick={() => go('lead', l.id)}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{l.id}</TableCell>
                  <TableCell className="font-medium">{l.name}</TableCell>
                  <TableCell className="max-w-48 truncate text-muted-foreground">{l.company || '—'}</TableCell>
                  <TableCell>{l.source}</TableCell>
                  <TableCell className="max-w-44 truncate">{l.requirement}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDate(l.receivedAt)}</TableCell>
                  <TableCell><StatusBadge status={l.status} /></TableCell>
                  <TableCell><PriorityBadge priority={l.priority} /></TableCell>
                  <TableCell>{l.assignedTo ? <span className="flex items-center gap-2 whitespace-nowrap"><Avatar name={l.assignedTo} size="xs" />{l.assignedTo}</span> : <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                  <TableCell><Score value={scoreOf(l, peers)} /></TableCell>
                  <TableCell className="text-right">
                    {needsVerify(l) && <Button size="xs" variant="outline" onClick={(e) => { e.stopPropagation(); go('lead', l.id, 'verify'); }}><ShieldCheck /> Verify</Button>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3">
          <span className="text-xs text-muted-foreground">Showing {rows.length ? (cur - 1) * PAGE + 1 : 0}–{Math.min(cur * PAGE, rows.length)} of {rows.length}</span>
          <Pagination page={cur} pageCount={pages} onPageChange={setPage} />
        </div>
      </Card>
    </>
  );
}
