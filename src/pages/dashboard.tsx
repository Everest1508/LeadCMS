import * as React from 'react';
import { CalendarClock, CheckCircle2, CircleDollarSign, Clock, Download, Globe, Inbox, ShieldCheck, ShieldQuestion, Target, Trophy, UserRoundCheck, XCircle } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BarChart, Sparkline } from '@/components/ui/charts';
import { Progress } from '@/components/ui/progress';
import { StatCard } from '@/components/ui/stat-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Timeline } from '@/components/ui/timeline';
import { SOURCES, STAGES, ago, fmtDateTime, inr, stageLabel, stageOf, type Activity, type Lead } from '@/data';
import { followUps, isGenuine, kpis, performance, pipelineValue, countBy, trend, toCsv, download } from '@/stats';
import { useStore } from '@/store';
import { go } from '@/router';
import { NewLeadDialog } from './new-lead';
import { PageHeader, SectionTitle } from './bits';

const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

export default function Dashboard() {
  const { leads, user, can, simulate } = useStore();
  const k = kpis(leads);
  const fu = followUps(leads);
  const bySource = countBy(leads, (l) => l.source);
  const byStage = countBy(leads, (l) => stageOf(l.status));
  const recent = leads.flatMap((l) => l.activities.map((a) => ({ ...a, lead: l }))).sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 7);
  const open = leads.filter((l) => l.status !== 'Won' && l.status !== 'Lost').length;
  const people = can.seeAll ? undefined : [user!.name];

  const cards: { label: string; value: React.ReactNode; icon: React.ReactNode; hint: string; pred?: (l: Lead) => boolean; tone?: string }[] = [
    { label: 'Total Leads', value: k.total, icon: <Target />, hint: `${open} still open` },
    { label: 'New Leads', value: k.fresh, icon: <Inbox />, hint: 'Waiting for review', pred: (l) => l.status === 'New' },
    { label: 'Pending Verification', value: k.pending, icon: <ShieldQuestion />, hint: 'Need more information', pred: (l) => l.status === 'Pending Verification', tone: 'text-warning' },
    { label: 'Genuine Leads', value: k.genuine, icon: <ShieldCheck />, hint: 'Verified by sales team', pred: isGenuine, tone: 'text-success' },
    { label: 'Qualified Leads', value: k.qualified, icon: <UserRoundCheck />, hint: 'Ready for meeting', pred: (l) => l.status === 'Qualified' },
    { label: 'Won Leads', value: k.won, icon: <Trophy />, hint: 'Closed deals', pred: (l) => l.status === 'Won', tone: 'text-success' },
    { label: 'Lost Leads', value: k.lost, icon: <XCircle />, hint: 'Incl. not genuine', pred: (l) => l.status === 'Lost', tone: 'text-destructive' },
    { label: 'Conversion Rate', value: `${k.conversion}%`, icon: <CircleDollarSign />, hint: 'Won ÷ genuine leads' },
  ];

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${user!.name.split(' ')[0]} — here is the pipeline today.`}
        description={`${open} open leads · ${inr(pipelineValue(leads))} in pipeline · ${fu.overdue + fu.today} follow-ups need attention`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => download('leads.csv', toCsv(leads))}><Download /> Export CSV</Button>
            <Button variant="outline" size="sm" onClick={() => simulate('Website')}><Globe /> Simulate website lead</Button>
            <NewLeadDialog />
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <StatCard
            key={c.label}
            label={c.label}
            value={c.value}
            icon={c.icon}
            chart={c.pred || c.label === 'Total Leads' ? <Sparkline data={trend(leads, c.pred)} className={c.tone} /> : undefined}
            hint={c.hint}
          />
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle action={<span className="text-xs text-muted-foreground">{k.total} leads</span>}>Leads by source</SectionTitle>
          <div className="px-5 pb-5">
            <BarChart data={SOURCES.map((s) => ({ label: s === 'Manual Entry' ? 'Manual' : s, value: bySource[s] ?? 0 }))} height={190} />
          </div>
        </Card>

        <Card>
          <SectionTitle action={<Button variant="link" size="xs" onClick={() => go('reports')}>Follow-up report</Button>}>Follow-ups</SectionTitle>
          <div className="grid grid-cols-3 gap-2 px-5">
            {[['Today', fu.today, 'text-primary'], ['Overdue', fu.overdue, 'text-destructive'], ['Upcoming', fu.upcoming, 'text-foreground']].map(([l, n, c]) => (
              <div key={l as string} className="rounded-lg border bg-muted/50 p-3 text-center">
                <p className={`text-xl font-semibold tabular-nums ${c}`}>{n}</p><p className="text-[11px] text-muted-foreground">{l}</p>
              </div>
            ))}
          </div>
          <ul className="mt-3 divide-y px-5 pb-2">
            {fu.list.slice(0, 4).map((f) => (
              <li key={f.id}>
                <button onClick={() => go('lead', f.lead.id)} className="flex w-full items-start gap-2.5 py-2.5 text-left">
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${f.bucket === 'overdue' ? 'bg-destructive' : f.bucket === 'today' ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                  <span className="grid min-w-0"><span className="truncate text-[13px] font-medium">{f.lead.name} · {f.description}</span><span className="text-[11px] text-muted-foreground">{fmtDateTime(f.due!)}{f.bucket === 'overdue' && ' · overdue'}</span></span>
                </button>
              </li>
            ))}
            {fu.list.length === 0 && <li className="flex items-center gap-2 py-6 text-[13px] text-muted-foreground"><CheckCircle2 className="size-4 text-success" />Nothing scheduled.</li>}
          </ul>
        </Card>

        <Card>
          <SectionTitle action={<Button variant="link" size="xs" onClick={() => go('pipeline')}>Open pipeline</Button>}>Pipeline summary</SectionTitle>
          <ul className="grid gap-3 px-5 pb-5">
            {STAGES.map((s) => {
              const n = byStage[s] ?? 0;
              const value = leads.filter((l) => stageOf(l.status) === s).reduce((t, l) => t + l.value, 0);
              return (
                <li key={s} className="grid gap-1.5">
                  <div className="flex justify-between text-[13px]"><span>{stageLabel(s)}</span><span className="text-muted-foreground"><b className="font-medium text-foreground tabular-nums">{n}</b> · {inr(value)}</span></div>
                  <Progress value={k.total ? (n / k.total) * 100 : 0} tone={s === 'Won' ? 'success' : s === 'Lost' ? 'danger' : 'primary'} />
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="lg:col-span-2">
          <SectionTitle>{can.seeAll ? 'Salesperson performance' : 'My performance'}</SectionTitle>
          <Table>
            <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Salesperson</TableHead>{['Assigned', 'Verified', 'Contacted', 'Meetings', 'Proposals', 'Won', 'Lost', 'Conv.'].map((h) => <TableHead key={h} className="text-right">{h}</TableHead>)}</TableRow></TableHeader>
            <TableBody>
              {performance(leads, people).map((p) => (
                <TableRow key={p.name}>
                  <TableCell><span className="flex items-center gap-2 font-medium"><Avatar name={p.name} size="xs" />{p.name}</span></TableCell>
                  {[p.assigned, p.verified, p.contacted, p.meetings, p.proposals, p.won, p.lost].map((n, i) => <TableCell key={i} className="text-right tabular-nums">{n}</TableCell>)}
                  <TableCell className="text-right"><Badge variant={p.conversion >= 20 ? 'success' : 'default'}>{p.conversion}%</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card className="lg:col-span-3">
          <SectionTitle>Recent activity</SectionTitle>
          <div className="px-5 pb-5">
            <Timeline
              items={recent.map((a: Activity & { lead: Lead }) => ({
                title: `${a.lead.name} · ${a.description}`,
                description: `${a.user} · ${a.lead.id}`,
                time: ago(a.at),
                tone: a.type === 'System' ? 'info' : a.type === 'Follow-up' ? 'warning' : 'default',
                icon: a.type === 'Follow-up' ? <CalendarClock /> : <Clock />,
              }))}
            />
          </div>
        </Card>
      </div>
    </>
  );
}
