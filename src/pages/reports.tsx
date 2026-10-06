import * as React from 'react';
import { Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { type DateRange } from '@/components/ui/calendar';
import { BarChart, DonutChart } from '@/components/ui/charts';
import { DateRangePicker } from '@/components/ui/date-picker';
import { StatCard } from '@/components/ui/stat-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SOURCES, STAGES, STATUSES, fmtDateTime, inr, stageLabel, stageOf } from '@/data';
import { countBy, download, followUps, isGenuine, kpis, performance, pipelineValue, toCsv } from '@/stats';
import { useStore } from '@/store';
import { go } from '@/router';
import { PageHeader, SectionTitle } from './bits';

const short: Record<string, string> = { 'Pending Verification': 'Pending', 'Meeting Scheduled': 'Meeting', 'Proposal Sent': 'Proposal', 'Manual Entry': 'Manual' };

export default function Reports() {
  const { leads: all, can, user } = useStore();
  const [range, setRange] = React.useState<DateRange>();
  const leads = all.filter((l) => (!range?.from || +new Date(l.receivedAt) >= +range.from) && (!range?.to || +new Date(l.receivedAt) < +range.to + 86400e3));
  const k = kpis(leads);
  const fu = followUps(leads);
  const bySource = countBy(leads, (l) => l.source);
  const byStatus = countBy(leads, (l) => l.status);
  const notGenuine = leads.filter((l) => l.verification.result === 'Not Genuine').length;
  const unverified = leads.length - k.genuine - notGenuine;

  return (
    <>
      <PageHeader
        title="Reports"
        description={`${leads.length} leads${range?.from ? ' in selected range' : ' · all time'}`}
        actions={
          <>
            <DateRangePicker value={range} onChange={setRange} placeholder="All time" clearable className="h-8 w-60 text-[13px]" />
            <Button variant="outline" size="sm" onClick={() => download('report-leads.csv', toCsv(leads))}><Download /> Export CSV</Button>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Conversion rate" value={`${k.conversion}%`} hint="Won ÷ genuine leads" />
        <StatCard label="Open pipeline value" value={inr(pipelineValue(leads))} hint="Genuine, still open" />
        <StatCard label="Won value" value={inr(leads.filter((l) => l.status === 'Won').reduce((s, l) => s + l.value, 0))} hint={`${k.won} deals closed`} />
        <StatCard label="Genuine leads" value={`${k.genuine} / ${leads.length}`} hint={`${notGenuine} not genuine`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <SectionTitle>Leads by source</SectionTitle>
          <div className="px-5 pb-5"><BarChart height={170} data={SOURCES.map((s) => ({ label: short[s] ?? s, value: bySource[s] ?? 0 }))} /></div>
        </Card>
        <Card className="lg:col-span-2">
          <SectionTitle>Leads by status</SectionTitle>
          <div className="px-5 pb-5"><BarChart height={170} data={STATUSES.map((s) => ({ label: short[s] ?? s, value: byStatus[s] ?? 0 }))} /></div>
        </Card>

        <Card>
          <SectionTitle>Genuine vs non-genuine</SectionTitle>
          <div className="px-5 pb-5">
            <DonutChart
              size={130}
              centerLabel={<div><p className="text-xl font-semibold tabular-nums">{leads.length}</p><p className="text-[11px] text-muted-foreground">leads</p></div>}
              data={[{ label: 'Genuine', value: k.genuine, color: '#10b981' }, { label: 'Not genuine', value: notGenuine, color: '#f43f5e' }, { label: 'Unverified', value: Math.max(unverified, 0), color: '#94a3b8' }]}
            />
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <SectionTitle>Pipeline value by stage</SectionTitle>
          <Table>
            <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Stage</TableHead><TableHead className="text-right">Leads</TableHead><TableHead className="text-right">Value</TableHead></TableRow></TableHeader>
            <TableBody>
              {STAGES.map((s) => {
                const col = leads.filter((l) => stageOf(l.status) === s);
                return <TableRow key={s}><TableCell className="font-medium">{stageLabel(s)}</TableCell><TableCell className="text-right tabular-nums">{col.length}</TableCell><TableCell className="text-right tabular-nums">{inr(col.reduce((t, l) => t + l.value, 0))}</TableCell></TableRow>;
              })}
            </TableBody>
          </Table>
        </Card>

        <Card className="lg:col-span-3">
          <SectionTitle>Leads by salesperson</SectionTitle>
          <Table>
            <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Salesperson</TableHead>{['Assigned', 'Verified', 'Contacted', 'Meetings', 'Proposals', 'Won', 'Lost', 'Conversion'].map((h) => <TableHead key={h} className="text-right">{h}</TableHead>)}</TableRow></TableHeader>
            <TableBody>
              {performance(leads, can.seeAll ? undefined : [user!.name]).map((p) => (
                <TableRow key={p.name}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  {[p.assigned, p.verified, p.contacted, p.meetings, p.proposals, p.won, p.lost].map((n, i) => <TableCell key={i} className="text-right tabular-nums">{n}</TableCell>)}
                  <TableCell className="text-right"><Badge variant={p.conversion >= 20 ? 'success' : 'default'}>{p.conversion}%</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="lg:col-span-3">
          <SectionTitle action={<span className="text-xs text-muted-foreground">{fu.overdue} overdue · {fu.today} today · {fu.upcoming} upcoming</span>}>Follow-up report</SectionTitle>
          <Table>
            <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Due</TableHead><TableHead>Lead</TableHead><TableHead>Task</TableHead><TableHead>Owner</TableHead><TableHead>State</TableHead></TableRow></TableHeader>
            <TableBody>
              {fu.list.map((f) => (
                <TableRow key={f.id} className="cursor-pointer" onClick={() => go('lead', f.lead.id)}>
                  <TableCell className="whitespace-nowrap">{fmtDateTime(f.due!)}</TableCell>
                  <TableCell className="font-medium">{f.lead.name}</TableCell>
                  <TableCell className="max-w-72 truncate text-muted-foreground">{f.description}</TableCell>
                  <TableCell>{f.user}</TableCell>
                  <TableCell><Badge variant={f.bucket === 'overdue' ? 'danger' : f.bucket === 'today' ? 'info' : 'default'}>{f.bucket}</Badge></TableCell>
                </TableRow>
              ))}
              {fu.list.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No open follow-ups in this range.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>
      </div>
    </>
  );
}
