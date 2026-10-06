import * as React from 'react';
import { toast } from '@/components/ui/toast';
import { api, ApiError, getToken, setToken } from './api';
import { stageLabel, type ActivityType, type CheckKey, type Lead, type Peer, type Priority, type Source, type Status, type User, type VerifyResult } from './data';

export interface Delivery { id: number; at: string; ok: boolean; test: boolean; message: string; leads: string; payload: string }
export type HookKind = 'website' | 'meta' | 'google';
export interface Webhook {
  id: number; name: string; kind: HookKind; path: string; secret: string; campaign: string; enabled: boolean;
  createdAt: string; createdBy: string; total: number; lastAt: string | null; metaConfigured: boolean; deliveries: Delivery[];
}
export interface AdConnection {
  id: number; platform: 'meta' | 'google'; status: 'active' | 'expiring' | 'expired' | 'revoked' | 'error'; error: string;
  accountId: string; accountName: string; businessName: string; connectedBy: string | null; scopes: string[];
  expiresAt: string | null; createdAt: string; lastSyncAt: string | null; lastSyncCount: number; login: string | null;
  accounts: { id: string; name: string; manager?: boolean }[]; pages: { id: string; name: string; listening: boolean; error?: string }[];
}
export type PlatformInfo = Record<string, { label: string; configured: boolean }> & { mock?: boolean };
export interface Notification { id: string; text: string; leadId?: string; at: string; read: boolean }
interface State { user?: User; leads: Lead[]; peers: Peer[]; notifications: Notification[]; sources: Record<string, boolean>; webhooks: Webhook[]; connections: AdConnection[]; platforms: PlatformInfo; loading: boolean }

interface Store {
  user?: User;
  loading: boolean;
  leads: Lead[]; // what the signed-in role may see
  peers: Peer[]; // every lead's id/name/phone/email/company, for duplicate checks
  notifications: Notification[];
  sources: Record<string, boolean>;
  webhooks: Webhook[];
  connections: AdConnection[];
  platforms: PlatformInfo;
  can: { assign: boolean; configure: boolean; seeAll: boolean };
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  addLead: (l: Partial<Lead> & Pick<Lead, 'name' | 'source'>) => Promise<Lead | undefined>;
  simulate: (source: Source) => Promise<void>;
  verify: (id: string, checks: Partial<Record<CheckKey, boolean>>, result: VerifyResult, note: string) => Promise<void>;
  assign: (id: string, to: string, priority: Priority) => Promise<void>;
  setStatus: (id: string, status: Status) => Promise<boolean>;
  addActivity: (id: string, type: ActivityType, description: string, due?: string) => Promise<void>;
  completeFollowUp: (id: string, activityId: string) => Promise<void>;
  toggleSource: (s: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  createWebhook: (w: { name: string; kind: HookKind; campaign: string }) => Promise<Webhook | undefined>;
  webhookAction: (id: number, action: 'toggle' | 'rotate' | 'delete' | 'test') => Promise<void>;
  connectPlatform: (platform: string) => Promise<void>;
  disconnectPlatform: (id: number) => Promise<void>;
  syncPlatform: (id: number) => Promise<void>;
  recheckPlatform: (id: number) => Promise<void>;
  simulateLead: (id: number, quiet?: boolean) => Promise<void>;
  selectAccount: (id: number, body: { accountId?: string; pageIds?: string[] }) => Promise<void>;
  reset: () => Promise<void>;
}
const Ctx = React.createContext<Store>(null!);
export const useStore = () => React.useContext(Ctx);

const POLL_MS = 8000;

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = React.useState<State>({ leads: [], peers: [], notifications: [], sources: {}, webhooks: [], connections: [], platforms: {}, loading: !!getToken() });

  const refresh = React.useCallback(async () => {
    if (!getToken()) return setS((x) => ({ ...x, user: undefined, loading: false }));
    try {
      const d = await api('state');
      setS({ user: d.user, leads: d.leads, peers: d.dupIndex, notifications: d.notifications, sources: d.sources, webhooks: d.webhooks, connections: d.connections.connections, platforms: d.connections.platforms, loading: false });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setToken(null);
      setS((x) => ({ ...x, user: e instanceof ApiError && e.status === 401 ? undefined : x.user, loading: false }));
    }
  }, []);

  // Load once, then poll so leads arriving from the website / Meta / Google show up without a reload.
  React.useEffect(() => {
    refresh();
    const t = setInterval(() => !document.hidden && refresh(), POLL_MS);
    return () => clearInterval(t);
  }, [refresh]);

  /** Run an API call, toast failures, refresh on success. */
  const act = async <T,>(fn: () => Promise<T>, ok?: (r: T) => void): Promise<T | undefined> => {
    try { const r = await fn(); ok?.(r); await refresh(); return r; }
    catch (e) { toast.error('Could not save', (e as Error).message); }
  };
  const user = s.user;

  const value: Store = {
    ...s,
    can: { assign: !!user && user.role !== 'Salesperson', configure: user?.role === 'Administrator', seeAll: !!user && user.role !== 'Salesperson' },

    async login(username, password) {
      const d = await api('auth/login', { username, password });
      setToken(d.token);
      setS((x) => ({ ...x, loading: true }));
      await refresh();
    },
    logout: () => { setToken(null); setS({ leads: [], peers: [], notifications: [], sources: {}, webhooks: [], connections: [], platforms: {}, loading: false }); },

    addLead: (l) => act(() => api<Lead>('leads', l)),

    // Runs the real ingestion code on the server with a sample payload in that source's format.
    simulate: (source) => act(() => api('simulate', { source }), () => toast.info(`Lead captured from ${source}`, 'Created by the server-side ingestion code.')).then(() => {}),

    verify: (id, checks, result, note) => act(() => api(`leads/${id}/verify`, { checks, result, note }), () =>
      toast.success(`Marked ${result}`, result === 'Genuine' ? 'You can now assign this lead.' : result === 'Not Genuine' ? 'Lead retained and moved to Lost.' : 'Lead is waiting for more information.')).then(() => {}),

    assign: (id, to, priority) => act(() => api(`leads/${id}/assign`, { to, priority }), () => toast.success('Lead assigned', `Now with ${to}.`)).then(() => {}),

    async setStatus(id, status) {
      const r = await act(() => api(`leads/${id}/status`, { status }), () =>
        status === 'Won' ? toast.success('Deal won 🎉') : status === 'Lost' ? toast.info('Marked as lost') : toast.success(`Moved to ${stageLabel(status)}`));
      return !!r;
    },

    addActivity: (id, type, description, due) => act(() => api(`leads/${id}/activities`, { type, description, due }), () =>
      toast.success(`${type} recorded`, due ? 'Follow-up scheduled.' : undefined)).then(() => {}),

    completeFollowUp: (id, aid) => act(() => api(`leads/${id}/activities/${aid}/done`, {})).then(() => {}),
    toggleSource: (name) => act(() => api(`sources/${encodeURIComponent(name)}/toggle`, {})).then(() => {}),
    markAllRead: () => act(() => api('notifications/read', {})).then(() => {}),
    createWebhook: (w) => act(() => api<Webhook>('webhooks', w), () => toast.success('Webhook created', 'Open its setup guide to connect it.')),
    webhookAction: (id, action) => act(() => api(`webhooks/${id}/${action}`, {}), () => {
      if (action === 'test') toast.success('Test lead delivered', 'Check the Lead Inbox and the delivery log.');
      if (action === 'rotate') toast.info('Secret rotated', 'Update the URL in the source system.');
      if (action === 'delete') toast.info('Webhook deleted');
    }).then(() => {}),
    // Step 1 of OAuth: ask our server for the platform's official login URL, then send the browser there.
    async connectPlatform(platform) {
      try { const { url } = await api<{ url: string }>(`connections/${platform}/start`, {}); window.location.href = url; }
      catch (e) { toast.error('Could not start the connection', (e as Error).message); }
    },
    disconnectPlatform: (id) => act(() => api(`connections/${id}/disconnect`, {}), () => toast.info('Disconnected', 'Stored credentials were deleted.')).then(() => {}),
    syncPlatform: (id) => act(() => api<{ imported: number }>(`connections/${id}/sync`, {}), (r) => toast.success('Sync finished', `${r.imported} new lead${r.imported === 1 ? '' : 's'} imported.`)).then(() => {}),
    recheckPlatform: (id) => act(() => api(`connections/${id}/recheck`, {}), () => toast.info('Connection checked')).then(() => {}),
    // Demo: asks the server to behave as if the platform just delivered a lead.
    simulateLead: async (id, quiet) => {
      try { await api(`connections/${id}/simulate`, {}); if (!quiet) toast.info('Demo lead received', 'It arrived like a real one. Check the Lead Inbox.'); await refresh(); }
      catch (e) { toast.error('Could not simulate', (e as Error).message); }
    },
    selectAccount: (id, body) => act(() => api(`connections/${id}/select`, body)).then(() => {}),
    reset: () => act(() => api('reset', {}), () => toast.info('Demo data reset')).then(() => {}),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
