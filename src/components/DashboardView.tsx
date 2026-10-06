import React from 'react';
import { useCRM } from '../context/CRMContext';
import { 
  Users, 
  UserCheck, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Layers, 
  Calendar, 
  AlertCircle, 
  ArrowUpRight, 
  Plus, 
  Check, 
  ChevronRight, 
  User 
} from 'lucide-react';
import { LeadSource } from '../types/crm';

export const DashboardView: React.FC = () => {
  const { 
    leads, 
    currentUser, 
    dataScope, 
    setDataScope, 
    setActiveTab, 
    setSelectedLeadId, 
    setIsCaptureModalOpen,
    toggleFollowUpComplete
  } = useCRM();

  // Active leads based on scope
  const isPersonalScope = dataScope === 'my';
  const myAssignedLeads = leads.filter(l => l.assignedTo === currentUser.name);
  const activeScopedLeads = isPersonalScope ? myAssignedLeads : leads;

  // Metrics
  const totalLeads = activeScopedLeads.length;
  const newLeads = activeScopedLeads.filter(l => l.status === 'New').length;
  const pendingVerification = leads.filter(l => l.status === 'Pending Verification' || l.verification.result === 'Pending').length;
  const genuineLeads = activeScopedLeads.filter(l => l.verification.result === 'Genuine').length;
  const qualifiedLeads = activeScopedLeads.filter(l => !['New', 'Pending Verification', 'Won', 'Lost'].includes(l.status)).length;
  const wonLeads = activeScopedLeads.filter(l => l.status === 'Won');
  const wonTotalValue = wonLeads.reduce((acc, l) => acc + (l.estimatedValue || 0), 0);
  const pipelineValue = activeScopedLeads
    .filter(l => !['Won', 'Lost'].includes(l.status))
    .reduce((acc, l) => acc + (l.estimatedValue || 0), 0);

  const conversionRate = totalLeads > 0 
    ? ((wonLeads.length / totalLeads) * 100).toFixed(1) 
    : '0.0';

  // Lead Sources breakdown
  const sources: LeadSource[] = ['Website', 'Instagram', 'Facebook', 'LinkedIn', 'WhatsApp', 'Manual Entry'];
  const sourceStats = sources.map(source => {
    const count = activeScopedLeads.filter(l => l.source === source).length;
    const wonCount = activeScopedLeads.filter(l => l.source === source && l.status === 'Won').length;
    const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
    return { source, count, wonCount, pct };
  }).sort((a, b) => b.count - a.count);

  // Pipeline stages
  const stages = [
    { name: 'New', color: 'bg-slate-400' },
    { name: 'Verified', color: 'bg-indigo-500' },
    { name: 'Contacted', color: 'bg-sky-500' },
    { name: 'Qualified', color: 'bg-blue-600' },
    { name: 'Meeting Scheduled', color: 'bg-amber-500' },
    { name: 'Proposal Sent', color: 'bg-purple-500' },
    { name: 'Negotiation', color: 'bg-orange-500' },
    { name: 'Won', color: 'bg-emerald-600' },
    { name: 'Lost', color: 'bg-rose-500' }
  ];

  const stageCounts = stages.map(s => ({
    name: s.name,
    color: s.color,
    count: activeScopedLeads.filter(l => l.status === s.name).length
  }));

  // Follow-ups today & overdue
  const todayStr = '2026-10-06';
  const followUpItems = (isPersonalScope ? myAssignedLeads : leads).flatMap(lead => 
    lead.activities
      .filter(act => act.followUpDate && !act.followUpCompleted)
      .map(act => ({
        lead,
        activity: act,
        isOverdue: act.followUpDate ? act.followUpDate < todayStr : false,
        isToday: act.followUpDate === todayStr
      }))
  ).sort((a, b) => (a.activity.followUpDate || '').localeCompare(b.activity.followUpDate || ''));

  const overdueCount = followUpItems.filter(f => f.isOverdue).length;
  const todayCount = followUpItems.filter(f => f.isToday).length;

  const formatINR = (val: number) => '₹' + val.toLocaleString('en-IN');

  return (
    <div className="space-y-6">
      
      {/* Dynamic User Scope Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <img 
            src={currentUser.avatar} 
            alt={currentUser.name} 
            className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-100 shrink-0"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {currentUser.role === 'Salesperson' ? `${currentUser.name}'s Dashboard` : `${currentUser.name} (Team Overview)`}
              </h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                currentUser.role === 'Administrator' ? 'bg-purple-100 text-purple-700' :
                currentUser.role === 'Sales Manager' ? 'bg-blue-100 text-blue-700' :
                'bg-emerald-100 text-emerald-700'
              }`}>
                {currentUser.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isPersonalScope 
                ? `Showing ${myAssignedLeads.length} accounts assigned directly to you (${formatINR(pipelineValue + wonTotalValue)} total value).`
                : `Showing all ${leads.length} accounts across the entire sales team.`
              }
            </p>
          </div>
        </div>

        {/* Scope Toggle & Quick Add */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setDataScope('my')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                isPersonalScope ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Leads ({myAssignedLeads.length})
            </button>
            <button
              onClick={() => setDataScope('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                !isPersonalScope ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Team ({leads.length})
            </button>
          </div>

          <button
            onClick={() => setIsCaptureModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads */}
        <div 
          onClick={() => setActiveTab('inbox')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {isPersonalScope ? 'My Assigned Leads' : 'Total Leads'}
            </span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{totalLeads}</span>
            <span className="text-xs text-slate-400">leads</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{newLeads} new leads</span>
            <span className="text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center text-[11px]">
              View all <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Pending Verification */}
        <div 
          onClick={() => setActiveTab('verification')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-300 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending Review</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{pendingVerification}</span>
            <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-full">
              Incoming
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{genuineLeads} genuine</span>
            <span className="text-amber-700 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center text-[11px]">
              Verify <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Active Pipeline */}
        <div 
          onClick={() => setActiveTab('pipeline')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {isPersonalScope ? 'My Active Pipeline' : 'Team Active Deals'}
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{qualifiedLeads}</span>
            <span className="text-xs text-slate-400">in pipeline</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-blue-700">{formatINR(pipelineValue)}</span>
            <span className="text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center text-[11px]">
              Pipeline <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Closed Won Revenue */}
        <div 
          onClick={() => setActiveTab('reports')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {isPersonalScope ? 'My Won Deals' : 'Team Won Revenue'}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-xl sm:text-2xl font-bold text-emerald-700 tracking-tight">{formatINR(wonTotalValue)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span className="text-emerald-700 font-medium">{wonLeads.length} won ({conversionRate}%)</span>
            <span className="text-emerald-700 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center text-[11px]">
              Reports <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Lead Sources + Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Lead Sources */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {isPersonalScope ? `${currentUser.name}'s Leads by Source` : 'Lead Sources Breakdown'}
              </h2>
              <p className="text-xs text-slate-500">Distribution across marketing and inbound channels</p>
            </div>
            <button 
              onClick={() => setActiveTab('reports')}
              className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 flex items-center cursor-pointer"
            >
              See report <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          <div className="space-y-3.5">
            {sourceStats.map(item => (
              <div key={item.source} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-800">{item.source}</span>
                    <span className="text-slate-400">({item.count} leads)</span>
                  </div>
                  <div className="flex items-center space-x-3 text-slate-600">
                    <span className="font-mono">{item.pct}%</span>
                    {item.wonCount > 0 && (
                      <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.2 rounded-full text-[10px]">
                        {item.wonCount} won
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      item.source === 'Website' ? 'bg-indigo-600' :
                      item.source === 'LinkedIn' ? 'bg-blue-600' :
                      item.source === 'WhatsApp' ? 'bg-emerald-500' :
                      item.source === 'Facebook' ? 'bg-sky-600' :
                      item.source === 'Instagram' ? 'bg-pink-600' : 'bg-slate-500'
                    }`}
                    style={{ width: `${Math.max(item.pct, item.count > 0 ? 3 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-[11px] text-slate-500 block">Top Channel</span>
              <span className="text-xs font-bold text-slate-900 mt-0.5 block">{sourceStats[0]?.source || 'Website'}</span>
              <span className="text-[10px] text-slate-400">{sourceStats[0]?.count} leads</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-[11px] text-slate-500 block">Fastest Response</span>
              <span className="text-xs font-bold text-emerald-700 mt-0.5 block">WhatsApp</span>
              <span className="text-[10px] text-slate-400">High engagement</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-[11px] text-slate-500 block">Highest Value</span>
              <span className="text-xs font-bold text-blue-700 mt-0.5 block">LinkedIn</span>
              <span className="text-[10px] text-slate-400">Enterprise B2B</span>
            </div>
          </div>
        </div>

        {/* Follow-up Tasks */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  {isPersonalScope ? 'My Follow-up Tasks' : 'Team Follow-ups'}
                </h2>
                <p className="text-xs text-slate-500">Upcoming calls and demos</p>
              </div>
              <button
                onClick={() => setActiveTab('followups')}
                className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 cursor-pointer"
              >
                View all
              </button>
            </div>

            {/* Badges */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-rose-600 uppercase">Overdue</span>
                  <div className="text-base font-bold text-rose-900">{overdueCount}</div>
                </div>
                <AlertCircle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase">Today</span>
                  <div className="text-base font-bold text-blue-900">{todayCount}</div>
                </div>
                <Calendar className="w-4 h-4 text-blue-500" />
              </div>
            </div>

            {/* List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {followUpItems.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No pending follow-ups scheduled for {isPersonalScope ? currentUser.name : 'the team'}
                </div>
              ) : (
                followUpItems.slice(0, 4).map(({ lead, activity, isOverdue }) => (
                  <div 
                    key={activity.id}
                    className={`p-2.5 rounded-xl border text-xs flex items-start justify-between gap-2 ${
                      isOverdue 
                        ? 'bg-rose-50/40 border-rose-200' 
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-slate-800 truncate">{lead.name}</span>
                        {isOverdue && (
                          <span className="text-[9px] bg-rose-100 text-rose-700 px-1 py-0.1 rounded font-bold">
                            OVERDUE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{lead.companyName}</p>
                      <p className="text-[11px] text-slate-700 font-medium mt-0.5 line-clamp-1">{activity.title}</p>
                    </div>
                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={() => toggleFollowUpComplete(lead.id, activity.id)}
                        className="p-1 rounded-lg bg-white border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 text-slate-500 transition-colors cursor-pointer"
                        title="Mark Complete"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('followups')}
            className="w-full mt-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-center block"
          >
            Manage Follow-ups &rarr;
          </button>
        </div>

      </div>

      {/* Bottom Grid: Pipeline Funnel + Priority Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pipeline Distribution */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {isPersonalScope ? `${currentUser.name}'s Deals Across Stages` : 'Pipeline Stages'}
              </h2>
              <p className="text-xs text-slate-500">Breakdown of deals by progression stage</p>
            </div>
            <button
              onClick={() => setActiveTab('pipeline')}
              className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 cursor-pointer"
            >
              Open Pipeline &rarr;
            </button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
            {stageCounts.map(st => (
              <div 
                key={st.name} 
                onClick={() => setActiveTab('pipeline')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-center transition-colors cursor-pointer"
              >
                <div className="text-base font-bold text-slate-900">{st.count}</div>
                <div className="text-[10px] font-medium text-slate-500 truncate" title={st.name}>
                  {st.name}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
            {stageCounts.map(st => {
              const pct = totalLeads > 0 ? (st.count / totalLeads) * 100 : 0;
              if (pct === 0) return null;
              return (
                <div 
                  key={st.name}
                  className={`${st.color} h-full transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${st.name}: ${st.count} deals`}
                />
              );
            })}
          </div>
        </div>

        {/* Priority Deals */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Priority Deals</h2>
              <p className="text-xs text-slate-500">Top active opportunities</p>
            </div>
            <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
              Hot
            </span>
          </div>

          <div className="space-y-2.5">
            {activeScopedLeads
              .filter(l => l.priority === 'Hot' && !['Won', 'Lost'].includes(l.status))
              .slice(0, 4)
              .map(lead => (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLeadId(lead.id)}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 transition-colors cursor-pointer flex justify-between items-center text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-slate-900 block truncate">{lead.name}</span>
                    <span className="text-[11px] text-slate-500 truncate block">{lead.companyName}</span>
                  </div>
                  <div className="text-right ml-2 shrink-0">
                    <span className="font-bold text-slate-900 block">{formatINR(lead.estimatedValue)}</span>
                    <span className="text-[10px] text-blue-600 font-medium">{lead.status}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

      </div>

    </div>
  );
};
