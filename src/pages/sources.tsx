import type { ReactNode } from 'react';
import { Camera, Globe, Link2, Megaphone, MessageCircle, PenLine, Search, Share2, Users2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { SOURCES, ago, type Source } from '@/data';
import { countBy } from '@/stats';
import { useStore } from '@/store';
import { go } from '@/router';
import { PageHeader } from './bits';

const ICON: Record<Source, ReactNode> = { Website: <Globe />, 'Meta Ads': <Megaphone />, 'Google Ads': <Search />, Instagram: <Camera />, Facebook: <Share2 />, LinkedIn: <Link2 />, WhatsApp: <MessageCircle />, 'Manual Entry': <PenLine /> };
const NOTE: Record<Source, string> = {
  Website: 'Contact & landing-page forms', 'Meta Ads': 'Facebook + Instagram Lead Ads webhook', 'Google Ads': 'Lead form extension webhook', Instagram: 'Lead ads and DMs', Facebook: 'Lead Ads form sync', LinkedIn: 'Lead Gen forms', WhatsApp: 'Business API enquiries', 'Manual Entry': 'Added by the sales team',
};

/** Admin-only. Each source is a switch + a "simulate" button standing in for the real integration. */
export default function Sources() {
  const { leads, sources, toggleSource, simulate } = useStore();
  const counts = countBy(leads, (l) => l.source);
  return (
    <>
      <PageHeader title="Lead Sources" description="Channels feeding the Lead Inbox. Integrations are simulated in this prototype." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SOURCES.map((s) => {
          const on = sources[s] !== false;
          const last = leads.filter((l) => l.source === s).sort((a, b) => +new Date(b.receivedAt) - +new Date(a.receivedAt))[0];
          return (
            <Card key={s} className="grid gap-4 p-5">
              <div className="flex items-start justify-between">
                <span className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground [&_svg]:size-5">{ICON[s]}</span>
                <Switch checked={on} onCheckedChange={() => toggleSource(s)} aria-label={`Enable ${s}`} />
              </div>
              <div className="grid gap-0.5"><p className="font-semibold">{s}</p><p className="text-[13px] text-muted-foreground">{NOTE[s]}</p></div>
              <div className="flex items-center justify-between text-[13px]">
                <span><b className="text-lg font-semibold tabular-nums">{counts[s] ?? 0}</b> <span className="text-muted-foreground">leads</span></span>
                <Badge variant={on ? 'success' : 'default'} dot>{on ? 'Connected' : 'Paused'}</Badge>
              </div>
              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-xs text-muted-foreground">{last ? `Last lead ${ago(last.receivedAt)}` : 'No leads yet'}</span>
                <Button size="xs" variant="outline" disabled={!on} onClick={() => simulate(s)}><Users2 /> Simulate lead</Button>
              </div>
            </Card>
          );
        })}
      </div>

      <p className="mt-4 text-[13px] text-muted-foreground">Want leads to arrive automatically? Create a webhook under <button className="font-medium text-primary hover:underline" onClick={() => go('integrations')}>Integrations</button>.</p>
    </>
  );
}

