import * as React from 'react';
import { BookOpen, Copy, Eye, EyeOff, Globe, Megaphone, Plus, RefreshCw, Search, Send, Trash2, Webhook as WebhookIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ago, fmtDateTime } from '@/data';
import { useStore, type HookKind, type Webhook } from '@/store';
import { CodeBlock, Guide, copy } from './guide';
import { PageHeader } from './bits';
import { AdPlatforms } from './platforms';
import { toast } from '@/components/ui/toast';

const KIND: Record<HookKind, { label: string; icon: React.ReactNode; hint: string }> = {
  website: { label: 'Website form', icon: <Globe />, hint: 'Enquiry forms on your website' },
  meta: { label: 'Meta Ads', icon: <Megaphone />, hint: 'Facebook and Instagram lead ads' },
  google: { label: 'Google Ads', icon: <Search />, hint: 'Google lead forms' },
};
const BASE_KEY = 'beforth-crm-base-url';
const readBase = () => { try { return localStorage.getItem(BASE_KEY) || location.origin; } catch { return location.origin; } };

/** Two-click button: first click arms it, second one confirms. */
function Confirm({ label, onConfirm, icon, danger }: { label: string; onConfirm: () => void; icon: React.ReactNode; danger?: boolean }) {
  const [armed, setArmed] = React.useState(false);
  React.useEffect(() => { if (armed) { const t = setTimeout(() => setArmed(false), 3000); return () => clearTimeout(t); } }, [armed]);
  return (
    <Button size="xs" variant={armed ? (danger ? 'destructive' : 'primary') : 'ghost'} onClick={() => (armed ? (setArmed(false), onConfirm()) : setArmed(true))}>
      {icon}{armed ? 'Click to confirm' : label}
    </Button>
  );
}

export default function Integrations() {
  const { webhooks, createWebhook, webhookAction } = useStore();
  const [base, setBase] = React.useState(readBase);
  const [guideId, setGuideId] = React.useState<number | null>(null);
  const [shown, setShown] = React.useState<Record<number, boolean>>({});
  const guide = webhooks.find((w) => w.id === guideId);

  // The OAuth callback sends the browser back to #/integrations?connected=meta (or ?error=…).
  React.useEffect(() => {
    const q = new URLSearchParams(location.hash.split('?')[1] ?? '');
    if (q.get('connected')) toast.success(`${q.get('connected') === 'meta' ? 'Meta Ads' : 'Google Ads'} connected`, 'Leads will now appear automatically.');
    if (q.get('error')) toast.error('Connection failed', q.get('error')!);
    if (q.get('connected') || q.get('error')) history.replaceState(null, '', '#/integrations');
  }, []);

  return (
    <>
      <PageHeader
        title="Integrations"
        description="Connect your ad accounts and website so leads arrive on their own."
      />
      <HowItWorks />
      <AdPlatforms />

      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-0.5">
          <h2 className="text-base font-semibold tracking-tight">Website forms &amp; custom webhooks</h2>
          <p className="text-[13px] text-muted-foreground">Your website has no login to connect, so it sends leads to a webhook URL. Each webhook gets a setup guide and a delivery log.</p>
        </div>
        <NewWebhook onCreate={async (w) => { const h = await createWebhook(w); if (h) setGuideId(h.id); }} />
      </div>

      <Card className="mb-4 grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <Field label="Your CRM address" hint="The links below are built from this. Put your real website address (https://crm.yourcompany.com) before using them outside your computer.">
          <Input value={base} onChange={(e) => { setBase(e.target.value); try { localStorage.setItem(BASE_KEY, e.target.value); } catch { /* ignore */ } }} />
        </Field>
        <Button variant="outline" size="sm" onClick={() => { setBase(location.origin); try { localStorage.removeItem(BASE_KEY); } catch { /* ignore */ } }}>Reset</Button>
      </Card>

      {webhooks.length === 0 ? (
        <EmptyState icon={<WebhookIcon />} title="No webhooks yet" description="Create one for your website form, Meta Ads or Google Ads, then follow its setup guide." action={<NewWebhook onCreate={async (w) => { const h = await createWebhook(w); if (h) setGuideId(h.id); }} />} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {webhooks.map((w) => {
            const url = `${base.replace(/\/$/, '')}${w.path}`;
            return (
              <Card key={w.id} className="grid gap-4 p-5">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground [&_svg]:size-5">{KIND[w.kind].icon}</span>
                  <div className="grid min-w-0 flex-1 gap-0.5">
                    <p className="truncate font-semibold">{w.name}</p>
                    <p className="text-xs text-muted-foreground">{KIND[w.kind].label}{w.campaign && ` · default campaign "${w.campaign}"`}</p>
                  </div>
                  <Badge variant={w.enabled ? 'success' : 'default'} dot>{w.enabled ? 'Active' : 'Paused'}</Badge>
                  <Switch checked={w.enabled} onCheckedChange={() => webhookAction(w.id, 'toggle')} aria-label={`Enable ${w.name}`} />
                </div>

                <div className="grid gap-2 text-xs">
                  <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-2.5 py-1.5">
                    <code className="min-w-0 flex-1 truncate font-mono">{url}</code>
                    <button aria-label="Copy URL" className="text-muted-foreground hover:text-foreground" onClick={() => copy(url, 'URL copied')}><Copy className="size-3.5" /></button>
                  </div>
                  {w.kind !== 'website' && (
                    <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-2.5 py-1.5">
                      <span className="text-muted-foreground">{w.kind === 'meta' ? 'Verify token' : 'Key'}</span>
                      <code className="min-w-0 flex-1 truncate font-mono">{shown[w.id] ? w.secret : '••••••••••••'}</code>
                      <button aria-label="Show secret" className="text-muted-foreground hover:text-foreground" onClick={() => setShown({ ...shown, [w.id]: !shown[w.id] })}>{shown[w.id] ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}</button>
                      <button aria-label="Copy secret" className="text-muted-foreground hover:text-foreground" onClick={() => copy(w.secret, 'Copied')}><Copy className="size-3.5" /></button>
                    </div>
                  )}
                </div>

                <p className="text-[13px] text-muted-foreground"><b className="font-semibold tabular-nums text-foreground">{w.total}</b> leads received · {w.lastAt ? `last request ${ago(w.lastAt)}` : 'nothing received yet'}</p>

                <div className="flex flex-wrap items-center gap-1.5 border-t pt-3">
                  <Button size="xs" variant="outline" onClick={() => setGuideId(w.id)}><BookOpen /> Setup guide</Button>
                  <Button size="xs" variant="outline" onClick={() => webhookAction(w.id, 'test')}><Send /> Send test lead</Button>
                  <span className="ml-auto flex gap-1">
                    <Confirm label="Rotate" icon={<RefreshCw />} onConfirm={() => webhookAction(w.id, 'rotate')} />
                    <Confirm label="Delete" icon={<Trash2 />} danger onConfirm={() => webhookAction(w.id, 'delete')} />
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Sheet open={!!guide} onOpenChange={(o) => !o && setGuideId(null)}>
        <SheetContent className="max-w-2xl gap-4 overflow-y-auto" aria-describedby={undefined}>
          {guide && <GuideSheet hook={guide} base={base} />}
        </SheetContent>
      </Sheet>
    </>
  );
}

function GuideSheet({ hook, base }: { hook: Webhook; base: string }) {
  return (
    <>
      <SheetHeader>
        <SheetTitle>{hook.name}</SheetTitle>
        <SheetDescription>{KIND[hook.kind].label} · follow the steps. Use the Deliveries tab if something does not arrive.</SheetDescription>
      </SheetHeader>
      <Tabs defaultValue="guide">
        <TabsList>
          <TabsTrigger value="guide">Setup guide</TabsTrigger>
          <TabsTrigger value="log">Deliveries {hook.deliveries.length > 0 && <Badge>{hook.deliveries.length}</Badge>}</TabsTrigger>
        </TabsList>
        <TabsContent value="guide"><Guide hook={hook} base={base} /></TabsContent>
        <TabsContent value="log" className="grid gap-2">
          {hook.deliveries.length === 0 && <EmptyState title="Nothing received yet" description="Requests to this webhook, including failures, show up here." />}
          {hook.deliveries.map((d) => (
            <details key={d.id} className="rounded-lg border p-3 text-[13px]">
              <summary className="flex cursor-pointer items-center gap-2">
                <Badge variant={d.ok ? 'success' : 'danger'} dot>{d.ok ? 'OK' : 'Failed'}</Badge>
                {d.test && <Badge variant="info">Test</Badge>}
                <span className="min-w-0 flex-1 truncate">{d.message}{d.leads && ` · ${d.leads}`}</span>
                <span className="text-xs text-muted-foreground">{fmtDateTime(d.at)}</span>
              </summary>
              <div className="mt-2"><CodeBlock label="Request body" code={d.payload || '(empty)'} /></div>
            </details>
          ))}
        </TabsContent>
      </Tabs>
    </>
  );
}

const HowItWorks = () => (
  <ol className="mb-6 grid gap-3 sm:grid-cols-3">
    {[['1', 'Pick a source', 'Website, Meta Ads or Google Ads.'], ['2', 'Connect it', 'Click Connect, or copy the link we give you.'], ['3', 'Send a test', 'Leads then appear in the Lead Inbox by themselves.']].map(([n, t, d]) => (
      <li key={n} className="flex items-start gap-3 rounded-xl border bg-card p-4">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{n}</span>
        <span className="grid gap-0.5"><b className="text-[13px] font-semibold">{t}</b><span className="text-xs text-muted-foreground">{d}</span></span>
      </li>
    ))}
  </ol>
);

const DEFAULT_NAME: Record<HookKind, string> = { website: 'Website contact form', meta: 'Meta lead ads', google: 'Google lead form' };

function NewWebhook({ onCreate }: { onCreate: (w: { name: string; kind: HookKind; campaign: string }) => Promise<void> }) {
  const [open, setOpen] = React.useState(false);
  const [kind, setKind] = React.useState<HookKind>('website');
  const [name, setName] = React.useState('');
  const [campaign, setCampaign] = React.useState('');
  const reset = () => { setKind('website'); setName(''); setCampaign(''); };
  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild><Button size="sm"><Plus /> New webhook</Button></DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add a lead source</DialogTitle><DialogDescription>Choose where your leads come from. You get a link and simple steps next.</DialogDescription></DialogHeader>
        <form className="grid gap-4" onSubmit={async (e) => { e.preventDefault(); await onCreate({ name: name.trim() || DEFAULT_NAME[kind], kind, campaign }); setOpen(false); reset(); }}>
          <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Lead source">
            {(Object.keys(KIND) as HookKind[]).map((k) => (
              <button
                key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)}
                className={`grid justify-items-center gap-2 rounded-xl border p-4 text-center transition-colors ${kind === k ? 'border-primary bg-accent' : 'hover:bg-muted'}`}
              >
                <span className="grid size-9 place-items-center rounded-lg bg-background text-accent-foreground [&_svg]:size-5">{KIND[k].icon}</span>
                <span className="text-[13px] font-semibold">{KIND[k].label}</span>
                <span className="text-[11px] leading-snug text-muted-foreground">{KIND[k].hint}</span>
              </button>
            ))}
          </div>
          <Field label="Name" hint="So you can recognise it later."><Input value={name} onChange={(e) => setName(e.target.value)} placeholder={DEFAULT_NAME[kind]} /></Field>
          <details className="text-[13px]"><summary className="cursor-pointer text-muted-foreground">Optional: default campaign</summary>
            <div className="mt-2"><Input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="Diwali offer" /></div>
          </details>
          <DialogFooter><Button type="submit">Create and show steps</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
