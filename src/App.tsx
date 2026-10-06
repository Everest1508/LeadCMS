import * as React from 'react';
import { Bell, BarChart3, ChevronsUpDown, Inbox, KanbanSquare, LayoutDashboard, LogOut, Plug, RotateCcw, Search, Webhook } from 'lucide-react';
import { AppContent, AppShell, Topbar } from '@/components/ui/app-shell';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Kbd } from '@/components/ui/kbd';
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarItem } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toast';
import { ago, fuBucket } from './data';
import { StoreProvider, useStore } from './store';
import { go, useRoute } from './router';
import Login from './pages/login';
import Dashboard from './pages/dashboard';
import InboxPage from './pages/inbox';
import LeadPage from './pages/lead';
import Pipeline from './pages/pipeline';
import Reports from './pages/reports';
import Sources from './pages/sources';
import Integrations from './pages/integrations';

export default function App() {
  return (
    <StoreProvider>
      <Gate />
      <Toaster />
    </StoreProvider>
  );
}

function Gate() {
  const { user, loading } = useStore();
  if (loading) return <div className="grid min-h-dvh place-items-center text-sm text-muted-foreground">Loading…</div>;
  return user ? <Frame /> : <Login />;
}

const TITLES: Record<string, string> = { dashboard: 'Dashboard', inbox: 'Lead Inbox', pipeline: 'Sales Pipeline', reports: 'Reports', sources: 'Lead Sources', integrations: 'Integrations', lead: 'Lead Details' };

function Frame() {
  const { user, leads, can, logout, reset, notifications, markAllRead } = useStore();
  const [name, id] = useRoute();
  const page = name in TITLES ? name : 'dashboard';
  const unread = notifications.filter((n) => !n.read).length;
  const pending = leads.filter((l) => l.status === 'New' || l.status === 'Pending Verification').length;
  const dueNow = leads.flatMap((l) => l.activities).filter((a) => ['overdue', 'today'].includes(fuBucket(a) ?? '')).length;
  const nav = (p: string, label: string, icon: React.ReactNode, badge?: React.ReactNode) => (
    <SidebarItem icon={icon} label={label} badge={badge} active={page === p || (p === 'inbox' && page === 'lead')} onClick={() => go(p)} />
  );

  return (
    <AppShell
      sidebar={
        // `dark` re-themes the sidebar only, like the BeForth Business Suite look.
        <Sidebar className="dark w-60 border-r-0 bg-[#1b1c1f] text-foreground">
          <SidebarHeader>
            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">B</span>
            <span className="grid leading-tight">
              <span className="text-sm font-bold tracking-[0.12em]">BEFORTH</span>
              <span className="text-[11px] text-muted-foreground">CRM · Sales Suite</span>
            </span>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup label="Workspace">
              {nav('dashboard', 'Dashboard', <LayoutDashboard />)}
              {nav('inbox', 'Lead Inbox', <Inbox />, pending || undefined)}
              {nav('pipeline', 'Sales Pipeline', <KanbanSquare />)}
              {nav('reports', 'Reports', <BarChart3 />)}
            </SidebarGroup>
            {can.configure && (
              <SidebarGroup label="Admin">{nav('integrations', 'Integrations', <Webhook />)}
                {nav('sources', 'Lead Sources', <Plug />)}</SidebarGroup>
            )}
          </SidebarContent>
          <SidebarFooter>
            <div className="flex items-center gap-2.5 px-1.5 py-1">
              <Avatar name={user!.name} size="sm" />
              <span className="grid min-w-0 leading-tight">
                <span className="truncate text-[13px] font-medium">{user!.name}</span>
                <span className="text-[11px] text-muted-foreground">{user!.role}</span>
              </span>
            </div>
          </SidebarFooter>
        </Sidebar>
      }
    >
      <Topbar className="bg-muted/60">
        <Breadcrumb items={[{ label: 'CRM' }, { label: TITLES[page]! }]} className="ml-1" />
        <button
          onClick={() => go('inbox')}
          className="ml-auto hidden h-8 w-64 items-center gap-2 rounded-md border bg-background px-2.5 text-[13px] text-muted-foreground transition-colors hover:bg-secondary md:flex"
        >
          <Search className="size-3.5" /> Search leads… <Kbd className="ml-auto">/</Kbd>
        </button>
        {dueNow > 0 && <Badge variant="warning" className="hidden lg:inline-flex">{dueNow} follow-ups due</Badge>}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Notifications" className="relative max-md:ml-auto">
              <Bell />
              {unread > 0 && <span className="absolute right-1 top-1 grid size-3.5 place-items-center rounded-full bg-destructive text-[9px] font-bold text-white">{unread}</span>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-[13px] font-semibold">Notifications</span>
              <button className="text-xs text-primary hover:underline" onClick={markAllRead}>Mark all read</button>
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {notifications.slice(0, 12).map((n) => (
                <DropdownMenuItem key={n.id} onSelect={() => n.leadId && go('lead', n.leadId)} className="items-start gap-2">
                  <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-primary'}`} />
                  <span className="grid"><span className="text-[13px] text-foreground">{n.text}</span><span className="text-[11px] text-muted-foreground">{ago(n.at)}</span></span>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        {can.configure && (
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw /> <span className="hidden sm:inline">Reset demo</span>
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 rounded-md p-1 outline-none transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring/40">
              <Avatar name={user!.name} size="sm" /><ChevronsUpDown className="hidden size-3.5 text-muted-foreground sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{user!.email} · {user!.role}</DropdownMenuLabel>
            <DropdownMenuItem destructive onSelect={logout}><LogOut /> Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Topbar>
      <AppContent className="bg-muted/40">
        <div className="mx-auto max-w-[1400px]" key={page + (id ?? '')}>
          {page === 'dashboard' && <Dashboard />}
          {page === 'inbox' && <InboxPage />}
          {page === 'lead' && <LeadPage id={id!} />}
          {page === 'pipeline' && <Pipeline />}
          {page === 'reports' && <Reports />}
          {page === 'sources' && (can.configure ? <Sources /> : <Dashboard />)}
          {page === 'integrations' && (can.configure ? <Integrations /> : <Dashboard />)}
        </div>
      </AppContent>
    </AppShell>
  );
}
