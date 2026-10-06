import * as React from 'react';
import { ArrowLeft, ArrowRight, CalendarClock, Check, CircleCheck, CircleX, Mail, MessageCircle, Phone, ShieldCheck, StickyNote, UserRoundCheck, Users, Workflow } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/label';
import { Input, Textarea } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stepper } from '@/components/ui/stepper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Timeline } from '@/components/ui/timeline';
import { toast } from '@/components/ui/toast';
import { ACTIVITY_TYPES, CHECKS, PRIORITIES, RESULTS, SALESPEOPLE, STAGES, STATUSES, ago, findDuplicates, fmtDateTime, inrFull, qualify, scoreOf, stageLabel, stageOf, type ActivityType, type CheckKey, type Priority, type Status, type VerifyResult } from '@/data';
import { useStore } from '@/store';
import { go, useRoute } from '@/router';
import { PriorityBadge, Row, Score, SectionTitle, StatusBadge } from './bits';

const ICONS: Record<ActivityType, React.ReactNode> = {
  Call: <Phone />, Email: <Mail />, Meeting: <Users />, WhatsApp: <MessageCircle />, Note: <StickyNote />, 'Follow-up': <CalendarClock />, System: <Workflow />,
};
const TONES: Partial<Record<ActivityType, 'info' | 'success' | 'warning'>> = { System: 'info', Call: 'success', Meeting: 'success', 'Follow-up': 'warning' };
/** `datetime-local` value for "tomorrow 10:00". */
const tomorrow = () => { const d = new Date(Date.now() + 86400e3); d.setHours(10, 0, 0, 0); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16); };

export default function LeadPage({ id }: { id: string }) {
  const { leads, peers, can, setStatus, assign, verify, addActivity, completeFollowUp } = useStore();
  const [, , tabParam] = useRoute();
  const tab = tabParam ?? 'activity';
  const lead = leads.find((l) => l.id === id);

  const [checks, setChecks] = React.useState<Partial<Record<CheckKey, boolean>>>(lead?.verification.checks ?? {});
  const [result, setResult] = React.useState<VerifyResult | undefined>(lead?.verification.result);
  const [note, setNote] = React.useState(lead?.verification.note ?? '');
  const [who, setWho] = React.useState(lead?.assignedTo ?? '');
  const [prio, setPrio] = React.useState<Priority>(lead?.priority ?? 'Warm');
  const [type, setType] = React.useState<ActivityType>('Call');
  const [text, setText] = React.useState('');
  const [due, setDue] = React.useState('');

  if (!lead) return <EmptyState icon={<Users />} title="Lead not found" description="It may not be assigned to you." action={<Button variant="outline" size="sm" onClick={() => go('inbox')}>Back to inbox</Button>} />;

  const dups = findDuplicates(lead, peers);
  const quality = qualify(lead, peers);
  const genuine = lead.verification.result === 'Genuine';
  const stageIdx = STAGES.indexOf(stageOf(lead.status));
  const next = STAGES[stageIdx + 1];
  const openFollowUps = lead.activities.filter((a) => a.type === 'Follow-up' && !a.done && a.due).sort((a, b) => +new Date(a.due!) - +new Date(b.due!));
  const allChecked = CHECKS.every(([k]) => checks[k]);
  const canVerify = !!result && (result !== 'Genuine' || allChecked);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="icon-sm" aria-label="Back to inbox" onClick={() => go('inbox')}><ArrowLeft /></Button>
          <div className="grid gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{lead.name}</h1>
              <span className="font-mono text-xs text-muted-foreground">{lead.id}</span>
              <StatusBadge status={lead.status} /><PriorityBadge priority={lead.priority} />
            </div>
            <p className="text-[13px] text-muted-foreground">{lead.company || 'No company'} · {lead.requirement || 'No requirement'} · received {ago(lead.receivedAt)} via {lead.source}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={lead.status} onValueChange={(v) => setStatus(lead.id, v as Status)}>
            <SelectTrigger className="h-8 w-52 text-[13px]"><span className="text-muted-foreground">Status:</span><SelectValue /></SelectTrigger>
            <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          {next && lead.status !== 'Lost' && <Button size="sm" onClick={() => setStatus(lead.id, next)}>Move to {stageLabel(next)} <ArrowRight /></Button>}
        </div>
      </div>

      {dups.length > 0 && (
        <Alert variant="warning" title="Possible duplicate lead found">
          Phone, email or company matches{' '}
          {dups.map((d) => <button key={d.id} className="mr-2 font-medium text-primary hover:underline" onClick={() => go('lead', d.id)}>{d.id} · {d.name} ({d.status})</button>)}
        </Alert>
      )}
      {lead.status === 'Lost' && <Alert variant="danger" title="This lead is marked Lost">{lead.verification.result === 'Not Genuine' ? 'Verified as not genuine. Retained for reporting.' : 'It stays in reports and can be re-opened by changing the status.'}</Alert>}

      <Card className="px-6 py-5">
        <Stepper current={lead.status === 'Lost' ? -1 : stageIdx} steps={STAGES.filter((s) => s !== 'Lost').map((s) => ({ title: stageLabel(s) }))} />
      </Card>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <Tabs value={tab} onValueChange={(t) => go('lead', lead.id, t)}>
            <TabsList>
              <TabsTrigger value="activity">Activity timeline</TabsTrigger>
              <TabsTrigger value="verify">Verification {genuine && <CircleCheck className="size-3.5 text-success" />}</TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="grid gap-5">
              <form
                className="grid gap-3 rounded-lg border bg-muted/40 p-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (type === 'Follow-up' && !due) return toast.error('Pick a follow-up date and time');
                  addActivity(lead.id, type, text.trim() || `${type} recorded`, due ? new Date(due).toISOString() : undefined);
                  setText(''); setDue('');
                }}
              >
                <div className="flex flex-wrap gap-1.5">
                  {ACTIVITY_TYPES.map((t) => (
                    <Button key={t} type="button" size="xs" variant={type === t ? 'primary' : 'outline'} onClick={() => { setType(t); if (t === 'Follow-up' && !due) setDue(tomorrow()); }}>{ICONS[t]} {t}</Button>
                  ))}
                </div>
                <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={type === 'Call' ? 'What was discussed on the call?' : type === 'Follow-up' ? 'What needs to happen?' : `Add a ${type.toLowerCase()} note…`} className="min-h-16 bg-background" />
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <Field label={type === 'Follow-up' ? 'Follow-up date & time' : 'Follow-up date & time (optional)'} className="w-60">
                    <Input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} className="h-8 text-[13px]" />
                  </Field>
                  <Button type="submit" size="sm">Add {type === 'Follow-up' ? 'follow-up' : 'activity'}</Button>
                </div>
              </form>

              {openFollowUps.length > 0 && (
                <div className="grid gap-2">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Open follow-ups</p>
                  {openFollowUps.map((a) => {
                    const late = +new Date(a.due!) < Date.now();
                    return (
                      <div key={a.id} className="flex items-center gap-3 rounded-lg border p-3">
                        <CalendarClock className={late ? 'size-4 text-destructive' : 'size-4 text-primary'} />
                        <div className="grid flex-1 text-[13px]"><span className="font-medium">{a.description}</span><span className="text-xs text-muted-foreground">{fmtDateTime(a.due!)} · {a.user}</span></div>
                        {late && <Badge variant="danger">Overdue</Badge>}
                        <Button size="xs" variant="outline" onClick={() => completeFollowUp(lead.id, a.id)}><Check /> Done</Button>
                      </div>
                    );
                  })}
                </div>
              )}

              <Timeline
                items={lead.activities.map((a) => ({
                  title: a.description,
                  description: `${a.type === 'System' ? 'Audit' : a.type} · ${a.user}${a.due ? ` · follow-up ${fmtDateTime(a.due)}${a.done ? ' (done)' : ''}` : ''}`,
                  time: `${fmtDateTime(a.at)}`,
                  icon: ICONS[a.type],
                  tone: TONES[a.type],
                }))}
              />
            </TabsContent>

            <TabsContent value="verify" className="grid gap-5">
              <div className="grid gap-1">
                <h3 className="text-sm font-semibold">Verification checklist</h3>
                <p className="text-[13px] text-muted-foreground">Confirm each item, then record the outcome. Genuine requires every check.</p>
              </div>
              <ul className="divide-y rounded-lg border">
                {CHECKS.map(([key, label]) => {
                  const hint = { phone: quality[0], email: quality[1], company: quality[2], requirement: quality[3], duplicate: quality[4] }[key]!;
                  return (
                    <li key={key} className="flex items-center gap-3 p-3">
                      <Checkbox id={key} checked={!!checks[key]} onCheckedChange={(c) => setChecks({ ...checks, [key]: c === true })} />
                      <label htmlFor={key} className="flex-1 cursor-pointer text-[13px] font-medium">{label}</label>
                      <span className={`flex items-center gap-1 text-xs ${hint.ok ? 'text-success' : 'text-warning'}`}>{hint.ok ? <CircleCheck className="size-3.5" /> : <CircleX className="size-3.5" />}{hint.ok ? hint.label : `Check: ${hint.label.toLowerCase()}`}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="grid gap-2">
                <p className="text-[13px] font-medium">Result</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {RESULTS.map((r) => (
                    <button
                      key={r} type="button" onClick={() => setResult(r)}
                      className={`rounded-lg border p-3 text-left text-[13px] font-medium transition-colors ${result === r ? (r === 'Genuine' ? 'border-success bg-success/5 text-success' : r === 'Not Genuine' ? 'border-destructive bg-destructive/5 text-destructive' : 'border-warning bg-warning/5 text-warning') : 'hover:bg-muted'}`}
                    >
                      {r}
                      <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{r === 'Genuine' ? 'Moves to Verified' : r === 'Not Genuine' ? 'Retained, moved to Lost' : 'Stays Pending Verification'}</span>
                    </button>
                  ))}
                </div>
              </div>
              <Field label="Note"><Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Confirmed on call with the owner" /></Field>
              {result === 'Genuine' && !allChecked && <Alert variant="warning" title="Tick every check to mark this lead Genuine." />}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{lead.verification.by ? `Last verified by ${lead.verification.by} · ${ago(lead.verification.at!)}` : 'Not verified yet'}</span>
                <Button disabled={!canVerify} onClick={() => result && verify(lead.id, checks, result, note)}><ShieldCheck /> Save verification</Button>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="grid gap-4">
          <Card>
            <SectionTitle>Contact information</SectionTitle>
            <dl className="divide-y px-5 pb-3">
              <Row label="Name">{lead.name}</Row><Row label="Company">{lead.company}</Row>
              <Row label="Phone">{lead.phone}</Row><Row label="Email">{lead.email}</Row><Row label="Location">{lead.location}</Row>
            </dl>
          </Card>
          <Card>
            <SectionTitle>Lead information</SectionTitle>
            <dl className="divide-y px-5 pb-3">
              <Row label="Requirement">{lead.requirement}</Row><Row label="Source">{lead.source}</Row><Row label="Campaign">{lead.campaign}</Row>
              <Row label="Est. value">{lead.value ? inrFull(lead.value) : ''}</Row><Row label="Received">{fmtDateTime(lead.receivedAt)}</Row>
              <Row label="Lead score"><Score value={scoreOf(lead, peers)} /></Row>
            </dl>
          </Card>
          <Card>
            <SectionTitle>Qualification indicators</SectionTitle>
            <ul className="grid gap-2 px-5 pb-5">
              {quality.map((q) => (
                <li key={q.label} className="flex items-center gap-2 text-[13px]">
                  {q.ok ? <CircleCheck className="size-4 text-success" /> : <CircleX className="size-4 text-destructive" />}
                  <span className={q.ok ? '' : 'text-muted-foreground'}>{q.label}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <SectionTitle>Assignment</SectionTitle>
            <div className="grid gap-3 px-5 pb-5">
              {lead.assignedTo && (
                <div className="flex items-center gap-3 rounded-lg bg-muted/60 p-3">
                  <Avatar name={lead.assignedTo} size="sm" />
                  <div className="grid text-[13px] leading-tight"><span className="font-medium">{lead.assignedTo}</span><span className="text-xs text-muted-foreground">by {lead.assignedBy} · {ago(lead.assignedAt!)}</span></div>
                </div>
              )}
              {can.assign ? (
                <>
                  {!genuine && <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><UserRoundCheck className="size-3.5" />Verify the lead as Genuine before assigning.</p>}
                  <Field label="Salesperson">
                    <Select value={who} onValueChange={setWho} disabled={!genuine}>
                      <SelectTrigger><SelectValue placeholder="Choose salesperson" /></SelectTrigger>
                      <SelectContent>{SALESPEOPLE.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Priority">
                    <Select value={prio} onValueChange={(v) => setPrio(v as Priority)} disabled={!genuine}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PRIORITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Button disabled={!genuine || !who || (who === lead.assignedTo && prio === lead.priority)} onClick={() => assign(lead.id, who, prio)}>{lead.assignedTo ? 'Reassign lead' : 'Assign lead'}</Button>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">Only managers and admins can assign leads.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
