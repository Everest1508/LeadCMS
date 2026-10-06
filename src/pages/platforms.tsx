import * as React from 'react';
import { BookOpen, CircleCheck, Link2, Megaphone, RefreshCw, Search, TriangleAlert, Unplug } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ago, fmtDate } from '@/data';
import { useStore, type AdConnection } from '@/store';
import { PlatformSetup } from './guide';
import { Row } from './bits';

const META = { id: 'meta', title: 'Meta Ads', sub: 'Facebook + Instagram', icon: <Megaphone />, accountLabel: 'Ad account' } as const;
const GOOGLE = { id: 'google', title: 'Google Ads', sub: 'Search, Display, YouTube lead forms', icon: <Search />, accountLabel: 'Customer ID' } as const;
const STATUS: Record<AdConnection['status'], { label: string; variant: React.ComponentProps<typeof Badge>['variant'] }> = {
  active: { label: 'Connected', variant: 'success' }, expiring: { label: 'Expiring soon', variant: 'warning' }, expired: { label: 'Expired', variant: 'danger' },
  revoked: { label: 'Access removed', variant: 'danger' }, error: { label: 'Needs attention', variant: 'danger' },
};
const fmtId = (id: string) => (/^\d{10}$/.test(id) ? `${id.slice(0, 3)}-${id.slice(3, 6)}-${id.slice(6)}` : id); // Google customer ids read as 123-456-7890

/** Advertising platforms: one card per platform, same Connect flow for both. All platform detail lives in the backend. */
export function AdPlatforms() {
  const { connections, platforms, connectPlatform } = useStore();
  const [setup, setSetup] = React.useState<'meta' | 'google' | null>(null);
  const redirect = (p: string) => `${location.origin}/api/connections/${p}/callback`;

  return (
    <section className="mb-8">
      <div className="mb-3 grid gap-0.5">
        <h2 className="text-base font-semibold tracking-tight">Advertising platforms</h2>
        <p className="text-[13px] text-muted-foreground">Connect an account once and its leads appear in the Lead Inbox automatically. You sign in on the platform's own page; we never see your password.</p>
      </div>
      {platforms.mock && <Alert variant="warning" title="Mock mode is on" className="mb-3">Connect uses a fake Meta/Google sign-in with demo accounts. Turn off <code>AD_PLATFORMS_MOCK</code> to use real ones.</Alert>}
      <div className="grid gap-4 lg:grid-cols-2">
        {[META, GOOGLE].map((p) => {
          const conn = connections.find((c) => c.platform === p.id);
          const configured = platforms[p.id]?.configured;
          return (
            <Card key={p.id} className="grid content-start gap-4 p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground [&_svg]:size-5">{p.icon}</span>
                <div className="grid flex-1 gap-0.5"><p className="font-semibold">{p.title}</p><p className="text-xs text-muted-foreground">{p.sub}</p></div>
                {conn ? <Badge variant={STATUS[conn.status].variant} dot>{STATUS[conn.status].label}</Badge> : <Badge>Not connected</Badge>}
              </div>
              {conn ? <Connected conn={conn} spec={p} /> : (
                <div className="grid gap-3">
                  {!configured && <Alert variant="info" title="Setup needed on the server">A developer has to register the {p.title} app and add its keys once. <button className="font-medium text-primary hover:underline" onClick={() => setSetup(p.id)}>Show how</button></Alert>}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" disabled={!configured} onClick={() => connectPlatform(p.id)}><Link2 /> Connect {p.title}</Button>
                    <Button size="sm" variant="ghost" onClick={() => setSetup(p.id)}><BookOpen /> Developer setup</Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
      <Sheet open={!!setup} onOpenChange={(o) => !o && setSetup(null)}>
        <SheetContent className="max-w-2xl gap-4 overflow-y-auto" aria-describedby={undefined}>
          {setup && (
            <>
              <SheetHeader><SheetTitle>{setup === 'meta' ? 'Meta' : 'Google'} developer setup</SheetTitle><SheetDescription>Done once by whoever deploys the CRM. Customers only click Connect.</SheetDescription></SheetHeader>
              <PlatformSetup platform={setup} redirect={redirect(setup)} />
            </>
          )}
        </SheetContent>
      </Sheet>
    </section>
  );
}

function Connected({ conn, spec }: { conn: AdConnection; spec: typeof META | typeof GOOGLE }) {
  const { connectPlatform, disconnectPlatform, syncPlatform, recheckPlatform, selectAccount, simulateLead, platforms } = useStore();
  const [live, setLive] = React.useState(false);
  const [armed, setArmed] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  React.useEffect(() => { if (armed) { const t = setTimeout(() => setArmed(false), 3000); return () => clearTimeout(t); } }, [armed]);
  const broken = ['expired', 'revoked', 'error'].includes(conn.status);
  const days = conn.expiresAt ? Math.ceil((+new Date(conn.expiresAt) - Date.now()) / 86400e3) : null;
  // Live demo: a new lead every 15 s while this switch is on and the page is open.
  React.useEffect(() => {
    if (!live) return;
    const t = setInterval(() => simulateLead(conn.id, true), 15000);
    return () => clearInterval(t);
  }, [live, conn.id, simulateLead]);
  const run = async (fn: () => Promise<void>) => { setBusy(true); await fn(); setBusy(false); };

  return (
    <div className="grid gap-4">
      {(broken || conn.status === 'expiring') && (
        <Alert variant={broken ? 'danger' : 'warning'} title={broken ? 'Leads have stopped syncing' : 'Reconnect soon'}>
          {conn.error || 'Access needs to be renewed.'} <button className="font-medium text-primary hover:underline" onClick={() => connectPlatform(conn.platform)}>Reconnect {spec.title}</button>
        </Alert>
      )}
      <dl className="divide-y">
        {conn.businessName && <Row label="Business">{conn.businessName}</Row>}
        <Row label={spec.accountLabel}>
          {conn.accounts.length > 1 ? (
            <Select value={conn.accountId} onValueChange={(v) => selectAccount(conn.id, { accountId: v })}>
              <SelectTrigger className="h-8 w-64 text-[13px]"><SelectValue /></SelectTrigger>
              <SelectContent>{conn.accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}{a.manager ? ' (manager)' : ''} · {fmtId(a.id)}</SelectItem>)}</SelectContent>
            </Select>
          ) : <span>{conn.accountName} <span className="font-normal text-muted-foreground">{fmtId(conn.accountId)}</span></span>}
        </Row>
        <Row label="Signed in as">{conn.login}</Row>
        <Row label="Connected by">{conn.connectedBy ? `${conn.connectedBy} · ${fmtDate(conn.createdAt)}` : fmtDate(conn.createdAt)}</Row>
        <Row label="Access valid">{days === null ? 'Until revoked' : days > 0 ? `${days} days` : 'Expired'}</Row>
        <Row label="Last sync">{conn.lastSyncAt ? `${ago(conn.lastSyncAt)} · ${conn.lastSyncCount} new` : 'Not yet'}</Row>
      </dl>

      {conn.platform === 'meta' && conn.pages.length > 0 && (
        <div className="grid gap-2">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Facebook Pages we listen to for lead forms</p>
          {conn.pages.map((pg) => (
            <label key={pg.id} className="flex items-center gap-3 rounded-lg border p-2.5 text-[13px]">
              <span className="flex-1 font-medium">{pg.name}{pg.error && <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-destructive"><TriangleAlert className="size-3" />{pg.error}</span>}</span>
              <Switch checked={pg.listening} onCheckedChange={(on) => selectAccount(conn.id, { pageIds: conn.pages.filter((x) => (x.id === pg.id ? on : x.listening)).map((x) => x.id) })} />
            </label>
          ))}
        </div>
      )}

      {platforms.mock && !broken && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed bg-muted/40 p-3 text-[13px]">
          <span className="font-medium">Demo tools</span>
          <Button size="xs" variant="outline" onClick={() => simulateLead(conn.id)}>Simulate incoming lead</Button>
          <label className="ml-auto flex items-center gap-2 text-muted-foreground">Live demo (a lead every 15 s)<Switch checked={live} onCheckedChange={setLive} /></label>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5 border-t pt-3">
        <Button size="xs" variant="outline" disabled={busy || broken} onClick={() => run(() => syncPlatform(conn.id))}><RefreshCw className={busy ? 'animate-spin' : ''} /> Sync now</Button>
        <Button size="xs" variant="ghost" disabled={busy} onClick={() => run(() => recheckPlatform(conn.id))}><CircleCheck /> Check connection</Button>
        <Button size="xs" variant={armed ? 'destructive' : 'ghost'} className="ml-auto" onClick={() => (armed ? (setArmed(false), disconnectPlatform(conn.id)) : setArmed(true))}><Unplug />{armed ? 'Click to confirm' : 'Disconnect'}</Button>
      </div>
    </div>
  );
}
