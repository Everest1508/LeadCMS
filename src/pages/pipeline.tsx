import * as React from 'react';
import { ArrowRight, GripVertical, IndianRupee } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SALESPEOPLE, STAGES, inr, stageLabel, stageOf, type Status } from '@/data';
import { useStore } from '@/store';
import { go } from '@/router';
import { cn } from '@/lib/utils';
import { PageHeader, PriorityBadge } from './bits';

const dot: Partial<Record<Status, string>> = { Won: 'bg-success', Lost: 'bg-destructive' };

/** Kanban board. Drag a card, or use the arrow for keyboard/touch. Every move is written to the lead's audit trail. */
export default function Pipeline() {
  const { leads, setStatus, can } = useStore();
  const [who, setWho] = React.useState('all');
  const [drag, setDrag] = React.useState<string | null>(null);
  const [over, setOver] = React.useState<Status | null>(null);
  const shown = leads.filter((l) => who === 'all' || l.assignedTo === who);
  const openValue = shown.filter((l) => l.status !== 'Won' && l.status !== 'Lost').reduce((s, l) => s + l.value, 0);

  return (
    <>
      <PageHeader
        title="Sales Pipeline"
        description={`${shown.length} leads · ${inr(openValue)} open pipeline value`}
        actions={can.seeAll && (
          <Select value={who} onValueChange={setWho}>
            <SelectTrigger className="h-8 w-48 text-[13px]"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All salespeople</SelectItem>{SALESPEOPLE.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        )}
      />
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-3">
        {STAGES.map((stage, si) => {
          const col = shown.filter((l) => stageOf(l.status) === stage);
          return (
            <section
              key={stage}
              onDragOver={(e) => { e.preventDefault(); setOver(stage); }}
              onDragLeave={() => setOver((o) => (o === stage ? null : o))}
              onDrop={() => { const l = leads.find((x) => x.id === drag); if (l && stageOf(l.status) !== stage) setStatus(l.id, stage); setDrag(null); setOver(null); }}
              className={cn('flex max-h-[calc(100dvh-14rem)] w-72 shrink-0 flex-col rounded-xl border bg-secondary/60 p-2 transition-colors', over === stage && 'border-primary/50 bg-accent')}
            >
              <header className="flex items-center justify-between px-1.5 py-1.5">
                <span className="flex items-center gap-2 text-[13px] font-semibold"><span className={cn('size-2 rounded-full', dot[stage] ?? 'bg-primary')} />{stageLabel(stage)}<span className="rounded-full bg-background px-1.5 text-[11px] font-medium text-muted-foreground">{col.length}</span></span>
                <span className="text-xs text-muted-foreground">{inr(col.reduce((s, l) => s + l.value, 0))}</span>
              </header>
              <div className="grid gap-2 overflow-y-auto p-0.5">
                {col.map((l) => (
                  <Card
                    key={l.id}
                    hoverable
                    draggable
                    onDragStart={() => setDrag(l.id)}
                    onDragEnd={() => { setDrag(null); setOver(null); }}
                    onClick={() => go('lead', l.id)}
                    className={cn('cursor-grab p-3 active:cursor-grabbing', drag === l.id && 'opacity-40')}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0"><p className="truncate text-[13px] font-semibold leading-snug">{l.name}</p><p className="truncate text-xs text-muted-foreground">{l.company || 'No company'}</p></div>
                      <PriorityBadge priority={l.priority} />
                    </div>
                    <p className="mt-2 truncate text-xs">{l.requirement}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="flex items-center text-xs font-semibold tabular-nums"><IndianRupee className="size-3 text-muted-foreground" />{l.value ? inr(l.value).slice(1) : '—'}</span>
                      <div className="flex items-center gap-1.5">
                        {l.assignedTo ? <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Avatar name={l.assignedTo} size="xs" />{l.assignedTo.split(' ')[0]}</span> : <span className="text-xs text-muted-foreground">Unassigned</span>}
                        {si < STAGES.length - 2 && (
                          <Button variant="ghost" size="icon-sm" className="size-6" aria-label={`Move ${l.name} to ${stageLabel(STAGES[si + 1]!)}`} onClick={(e) => { e.stopPropagation(); setStatus(l.id, STAGES[si + 1]!); }}><ArrowRight className="size-3.5" /></Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
                {col.length === 0 && <p className="grid h-20 place-items-center rounded-lg border border-dashed text-xs text-muted-foreground"><GripVertical className="size-4" />Drop leads here</p>}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
