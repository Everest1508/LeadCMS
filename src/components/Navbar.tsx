import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { 
  ShieldCheck, 
  Users, 
  Bell, 
  Plus, 
  RotateCcw, 
  LayoutDashboard, 
  Inbox, 
  CheckSquare, 
  Kanban, 
  CalendarClock, 
  BarChart3, 
  Check, 
  AlertTriangle,
  ChevronDown
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    currentUser, 
    users, 
    switchUser, 
    activeTab, 
    setActiveTab, 
    notifications, 
    unreadNotificationCount, 
    markNotificationRead, 
    markAllNotificationsRead,
    setIsCaptureModalOpen,
    resetDemoData,
    leads,
    setSelectedLeadId
  } = useCRM();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Active counts
  const unverifiedCount = leads.filter(l => l.status === 'New' || l.status === 'Pending Verification').length;
  const todayStr = '2026-10-06';
  const todayFollowUpsCount = leads.flatMap(l => l.activities).filter(a => a.followUpDate === todayStr && !a.followUpCompleted).length;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="font-bold text-lg text-slate-900 tracking-tight">BeForth <span className="text-indigo-600">CRM</span></span>
              <span className="hidden sm:inline-block text-[11px] font-semibold text-slate-400">Sales &amp; Lead Management</span>
            </div>
          </div>

          {/* Action Tools: New Lead, Reset, Notifications, User Switcher */}
          <div className="flex items-center space-x-2.5">
            {/* New Lead Button */}
            <button
              onClick={() => setIsCaptureModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>New Lead</span>
            </button>

            {/* Reset Data Button */}
            <button 
              onClick={resetDemoData}
              className="hidden md:flex items-center space-x-1.5 px-2.5 py-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl text-xs transition-colors cursor-pointer"
              title="Reset sample data"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Data</span>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                  <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-xs text-slate-900">Notifications</span>
                      {unreadNotificationCount > 0 && (
                        <span className="bg-rose-100 text-rose-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          {unreadNotificationCount} unread
                        </span>
                      )}
                    </div>
                    {unreadNotificationCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">No new notifications</div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markNotificationRead(n.id);
                            if (n.leadId) {
                              setSelectedLeadId(n.leadId);
                              setShowNotifications(false);
                            }
                          }}
                          className={`p-3 text-xs transition-colors cursor-pointer hover:bg-slate-50 flex items-start space-x-2.5 ${
                            !n.read ? 'bg-indigo-50/40' : ''
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {n.type === 'new_lead' && <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700 inline-block"><Inbox className="w-3.5 h-3.5" /></span>}
                            {n.type === 'verification' && <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700 inline-block"><AlertTriangle className="w-3.5 h-3.5" /></span>}
                            {n.type === 'assigned' && <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700 inline-block"><Users className="w-3.5 h-3.5" /></span>}
                            {n.type === 'won' && <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 inline-block"><Check className="w-3.5 h-3.5" /></span>}
                            {(n.type === 'followup_due' || n.type === 'followup_overdue') && (
                              <span className="p-1.5 rounded-lg bg-rose-100 text-rose-700 inline-block"><CalendarClock className="w-3.5 h-3.5" /></span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline">
                              <p className={`font-semibold truncate ${!n.read ? 'text-slate-900' : 'text-slate-700'}`}>{n.title}</p>
                              <span className="text-[10px] text-slate-400 shrink-0 ml-1">{n.timestamp}</span>
                            </div>
                            <p className="text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile & Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center space-x-2 p-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer text-left"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-200"
                />
                <div className="hidden sm:block text-left pr-1">
                  <div className="text-xs font-semibold text-slate-800 leading-tight">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-500 font-medium leading-tight">{currentUser.role}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Dropdown */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                  <div className="p-3 bg-slate-50 border-b border-slate-200">
                    <p className="text-xs font-semibold text-slate-900">Switch User Account</p>
                    <p className="text-[11px] text-slate-500">Test different user permissions and views</p>
                  </div>
                  <div className="p-1.5 space-y-1">
                    {users.map(u => {
                      const userLeads = leads.filter(l => l.assignedTo === u.name).length;

                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            switchUser(u.id);
                            setShowUserDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                            currentUser.id === u.id ? 'bg-indigo-50 text-indigo-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-900 truncate">{u.name}</p>
                              <p className="text-[11px] text-slate-500 truncate">{u.role}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ml-1.5 ${
                            currentUser.id === u.id ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {u.role === 'Salesperson' ? `${userLeads} leads` : 'Team View'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Clean Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto border-t border-slate-100 py-2 no-scrollbar">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'dashboard' 
                ? 'bg-slate-900 text-white' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'inbox' 
                ? 'bg-slate-900 text-white' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Leads</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'inbox' ? 'bg-slate-700 text-slate-100' : 'bg-slate-200 text-slate-700'
            }`}>
              {leads.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('verification')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'verification' 
                ? 'bg-slate-900 text-white' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Verification</span>
            {unverifiedCount > 0 && (
              <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {unverifiedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('pipeline')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'pipeline' 
                ? 'bg-slate-900 text-white' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Pipeline</span>
          </button>

          <button
            onClick={() => setActiveTab('followups')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'followups' 
                ? 'bg-slate-900 text-white' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CalendarClock className="w-3.5 h-3.5" />
            <span>Follow-ups</span>
            {todayFollowUpsCount > 0 && (
              <span className="bg-rose-100 text-rose-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {todayFollowUpsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'reports' 
                ? 'bg-slate-900 text-white' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Reports</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
