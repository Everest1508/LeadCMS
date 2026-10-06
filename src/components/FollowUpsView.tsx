import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { 
  CalendarClock, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Calendar, 
  Phone, 
  Mail, 
  Check, 
  User, 
  Eye
} from 'lucide-react';
import { Activity } from '../types/crm';

export const FollowUpsView: React.FC = () => {
  const { 
    leads, 
    currentUser,
    dataScope,
    setDataScope,
    toggleFollowUpComplete, 
    setSelectedLeadId, 
    users 
  } = useCRM();

  const [activeTab, setActiveTab] = useState<'today' | 'overdue' | 'upcoming' | 'completed'>('today');
  const [salespersonFilter, setSalespersonFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const todayStr = '2026-10-06';

  const allFollowUps = leads.flatMap(lead => {
    if (dataScope === 'my' && lead.assignedTo !== currentUser.name) return [];

    return lead.activities
      .filter(act => act.followUpDate)
      .map(act => {
        const isOverdue = !act.followUpCompleted && (act.followUpDate ? act.followUpDate < todayStr : false);
        const isToday = !act.followUpCompleted && act.followUpDate === todayStr;
        const isUpcoming = !act.followUpCompleted && (act.followUpDate ? act.followUpDate > todayStr : false);

        return {
          lead,
          activity: act,
          isOverdue,
          isToday,
          isUpcoming,
          isCompleted: !!act.followUpCompleted
        };
      });
  });

  const myTasksCount = leads.flatMap(l => l.assignedTo === currentUser.name ? l.activities.filter(a => a.followUpDate && !a.followUpCompleted) : []).length;
  const allTasksCount = leads.flatMap(l => l.activities.filter(a => a.followUpDate && !a.followUpCompleted)).length;

  const overdueList = allFollowUps.filter(f => f.isOverdue);
  const todayList = allFollowUps.filter(f => f.isToday);
  const upcomingList = allFollowUps.filter(f => f.isUpcoming);
  const completedList = allFollowUps.filter(f => f.isCompleted);

  const displayedList = (
    activeTab === 'today' ? todayList :
    activeTab === 'overdue' ? overdueList :
    activeTab === 'upcoming' ? upcomingList : completedList
  ).filter(f => {
    if (salespersonFilter !== 'all' && f.lead.assignedTo !== salespersonFilter) return false;
    if (typeFilter !== 'all' && f.activity.followUpType !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Follow-ups</h1>
            <span className="text-xs bg-slate-200 text-slate-800 px-2.5 py-0.5 rounded-full font-bold">
              {todayList.length} today • {overdueList.length} overdue
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Scheduled calls, demos, and follow-ups across sales reps.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 text-xs">
          {/* Scope Toggle */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl font-semibold">
            <button
              onClick={() => setDataScope('my')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                dataScope === 'my' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Tasks ({myTasksCount})
            </button>
            <button
              onClick={() => setDataScope('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                dataScope === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Team ({allTasksCount})
            </button>
          </div>

          <select
            value={salespersonFilter}
            onChange={e => setSalespersonFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-800"
          >
            <option value="all">All Assignees</option>
            {users.map(u => (
              <option key={u.id} value={u.name}>{u.name}</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-800"
          >
            <option value="all">All Types</option>
            <option value="Call">Call</option>
            <option value="Meeting">Meeting / Demo</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Email">Email</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar text-xs">
        <button
          onClick={() => setActiveTab('today')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'today' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Today</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === 'today' ? 'bg-slate-700 text-slate-100' : 'bg-slate-100 text-slate-700'}`}>
            {todayList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'overdue' ? 'bg-rose-600 text-white' : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Overdue</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === 'overdue' ? 'bg-rose-800 text-rose-100' : 'bg-rose-100 text-rose-800'}`}>
            {overdueList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'upcoming' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Upcoming</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === 'upcoming' ? 'bg-slate-700 text-slate-100' : 'bg-slate-100 text-slate-700'}`}>
            {upcomingList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'completed' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Completed</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === 'completed' ? 'bg-slate-700 text-slate-100' : 'bg-slate-100 text-slate-700'}`}>
            {completedList.length}
          </span>
        </button>
      </div>

      {/* Follow-ups List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {displayedList.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No tasks in this section</p>
            <p className="text-xs text-slate-400 mt-1">All scheduled follow-ups are up to date.</p>
          </div>
        ) : (
          displayedList.map(({ lead, activity, isOverdue }) => (
            <div 
              key={activity.id}
              className={`p-4 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                activity.followUpCompleted ? 'bg-slate-50/50 opacity-70' : isOverdue ? 'bg-rose-50/20' : 'hover:bg-slate-50'
              }`}
            >
              {/* Checkbox + Details */}
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                <button
                  onClick={() => toggleFollowUpComplete(lead.id, activity.id)}
                  className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                    activity.followUpCompleted
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-slate-300 hover:border-slate-400 bg-white'
                  }`}
                  title={activity.followUpCompleted ? 'Mark Pending' : 'Mark Completed'}
                >
                  {activity.followUpCompleted && <Check className="w-3.5 h-3.5" />}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span 
                      onClick={() => setSelectedLeadId(lead.id)}
                      className={`text-sm font-bold text-slate-900 hover:text-indigo-600 cursor-pointer ${
                        activity.followUpCompleted ? 'line-through text-slate-400' : ''
                      }`}
                    >
                      {lead.name}
                    </span>
                    <span className="text-xs text-slate-500">({lead.companyName})</span>
                    <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded font-semibold">
                      {lead.id}
                    </span>
                    {isOverdue && !activity.followUpCompleted && (
                      <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded-full">
                        Overdue
                      </span>
                    )}
                  </div>

                  <p className={`text-xs mt-1 text-slate-800 font-medium ${activity.followUpCompleted ? 'line-through text-slate-400' : ''}`}>
                    {activity.title}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{activity.description}</p>

                  <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-400">
                    <span className="text-slate-600 font-medium">📅 {activity.followUpDate}</span>
                    {activity.followUpTime && <span className="text-slate-600 font-medium">⏰ {activity.followUpTime}</span>}
                    <span className="text-slate-600">Assignee: {lead.assignedTo || 'Unassigned'}</span>
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.2 rounded text-[10px]">
                      {lead.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                <a
                  href={`tel:${lead.phone}`}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call</span>
                </a>
                <a
                  href={`mailto:${lead.email}`}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email</span>
                </a>
                <button
                  onClick={() => setSelectedLeadId(lead.id)}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span>Open Lead</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
