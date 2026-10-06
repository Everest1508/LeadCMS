import React, { useState, useMemo } from 'react';
import { useCRM } from '../context/CRMContext';
import { 
  Search, 
  Filter, 
  SlidersHorizontal, 
  Download, 
  UserCheck, 
  UserPlus, 
  Eye, 
  AlertTriangle, 
  Plus,
  ArrowUpDown, 
  ChevronRight
} from 'lucide-react';
import { LeadSource, LeadStatus, LeadPriority } from '../types/crm';

export const LeadInboxView: React.FC = () => {
  const { 
    leads, 
    currentUser,
    dataScope,
    setDataScope,
    setSelectedLeadId, 
    setVerifyingLeadId, 
    setAssigningLeadId, 
    setDuplicateReviewLead, 
    setIsCaptureModalOpen,
    users
  } = useCRM();

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assignedFilter, setAssignedFilter] = useState<string>('all');
  const [minScore, setMinScore] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'value'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [quickTab, setQuickTab] = useState<'all' | 'new' | 'unverified' | 'duplicates' | 'hot'>('all');

  const myLeadsCount = leads.filter(l => l.assignedTo === currentUser.name).length;

  // Filtered & Sorted Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // User data scope
      if (dataScope === 'my' && lead.assignedTo !== currentUser.name) return false;

      if (quickTab === 'new' && lead.status !== 'New') return false;
      if (quickTab === 'unverified' && !['New', 'Pending Verification'].includes(lead.status)) return false;
      if (quickTab === 'duplicates' && !lead.possibleDuplicateId) return false;
      if (quickTab === 'hot' && lead.priority !== 'Hot') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = 
          lead.id.toLowerCase().includes(q) ||
          lead.name.toLowerCase().includes(q) ||
          lead.companyName.toLowerCase().includes(q) ||
          lead.email.toLowerCase().includes(q) ||
          lead.phone.includes(q) ||
          lead.requirement.toLowerCase().includes(q) ||
          lead.location.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (sourceFilter !== 'all' && lead.source !== sourceFilter) return false;
      if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && lead.priority !== priorityFilter) return false;
      if (assignedFilter !== 'all') {
        if (assignedFilter === 'unassigned' && lead.assignedTo) return false;
        if (assignedFilter !== 'unassigned' && lead.assignedTo !== assignedFilter) return false;
      }
      if (lead.score < minScore) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'score') {
        return sortOrder === 'desc' ? b.score - a.score : a.score - b.score;
      }
      if (sortBy === 'value') {
        return sortOrder === 'desc' ? b.estimatedValue - a.estimatedValue : a.estimatedValue - b.estimatedValue;
      }
      return sortOrder === 'desc' 
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [leads, searchQuery, sourceFilter, statusFilter, priorityFilter, assignedFilter, minScore, sortBy, sortOrder, quickTab]);

  const formatINR = (val: number) => '₹' + val.toLocaleString('en-IN');

  const handleExportCSV = () => {
    const headers = ['Lead ID', 'Name', 'Company', 'Phone', 'Email', 'Location', 'Source', 'Status', 'Score', 'Priority', 'Estimated Value', 'Assigned To', 'Date'];
    const rows = filteredLeads.map(l => [
      l.id,
      `"${l.name}"`,
      `"${l.companyName}"`,
      `"${l.phone}"`,
      `"${l.email}"`,
      `"${l.location}"`,
      l.source,
      l.status,
      l.score,
      l.priority,
      l.estimatedValue,
      `"${l.assignedTo || 'Unassigned'}"`,
      l.createdAt
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSourceFilter('all');
    setStatusFilter('all');
    setPriorityFilter('all');
    setAssignedFilter('all');
    setMinScore(0);
    setQuickTab('all');
  };

  return (
    <div className="space-y-4">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Leads</h1>
            <span className="text-xs font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
              {filteredLeads.length} of {leads.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Incoming customer inquiries across all channels.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Scope Toggle */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setDataScope('my')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                dataScope === 'my' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Leads ({myLeadsCount})
            </button>
            <button
              onClick={() => setDataScope('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                dataScope === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Team ({leads.length})
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center space-x-1.5"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
          <button
            onClick={() => setIsCaptureModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Quick Segment Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => setQuickTab('all')}
          className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            quickTab === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All ({leads.length})
        </button>
        <button
          onClick={() => setQuickTab('unverified')}
          className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center space-x-1.5 ${
            quickTab === 'unverified' ? 'bg-amber-600 text-white' : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
          }`}
        >
          <span>Pending Verification</span>
          <span className="bg-amber-100 text-amber-900 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
            {leads.filter(l => ['New', 'Pending Verification'].includes(l.status)).length}
          </span>
        </button>
        <button
          onClick={() => setQuickTab('duplicates')}
          className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center space-x-1.5 ${
            quickTab === 'duplicates' ? 'bg-rose-600 text-white' : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
          }`}
        >
          <AlertTriangle className="w-3 h-3" />
          <span>Possible Duplicates</span>
          <span className="bg-rose-100 text-rose-900 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
            {leads.filter(l => l.possibleDuplicateId).length}
          </span>
        </button>
        <button
          onClick={() => setQuickTab('hot')}
          className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center space-x-1.5 ${
            quickTab === 'hot' ? 'bg-red-600 text-white' : 'bg-white text-red-700 border border-red-200 hover:bg-red-50'
          }`}
        >
          <span>Hot Priority</span>
          <span className="bg-red-100 text-red-900 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
            {leads.filter(l => l.priority === 'Hot').length}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          
          {/* Main Search Input */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, company, phone, email, location..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Sort Selector */}
          <div className="flex items-center space-x-2 shrink-0">
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-transparent font-semibold text-slate-800 outline-hidden cursor-pointer"
              >
                <option value="date">Date</option>
                <option value="score">Score</option>
                <option value="value">Value</option>
              </select>
              <button
                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                className="ml-1 text-[10px] font-bold uppercase text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                {sortOrder}
              </button>
            </div>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">SOURCE</label>
            <select
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-800 font-medium"
            >
              <option value="all">All Sources</option>
              <option value="Website">Website</option>
              <option value="Instagram">Instagram</option>
              <option value="Facebook">Facebook</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Manual Entry">Manual Entry</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">STATUS</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-800 font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="New">New</option>
              <option value="Pending Verification">Pending Verification</option>
              <option value="Verified">Verified</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Meeting Scheduled">Meeting Scheduled</option>
              <option value="Proposal Sent">Proposal Sent</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">PRIORITY</label>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-800 font-medium"
            >
              <option value="all">All Priorities</option>
              <option value="Hot">Hot</option>
              <option value="Warm">Warm</option>
              <option value="Cold">Cold</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">ASSIGNED TO</label>
            <select
              value={assignedFilter}
              onChange={e => setAssignedFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-800 font-medium"
            >
              <option value="all">Everyone</option>
              <option value="unassigned">Unassigned</option>
              {users.map(u => (
                <option key={u.id} value={u.name}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="col-span-2 sm:col-span-1 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">MIN SCORE</label>
                <span className="text-[10px] font-bold font-mono text-indigo-600">{minScore} pts</span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="10"
                value={minScore}
                onChange={e => setMinScore(Number(e.target.value))}
                className="w-full accent-indigo-600 h-1.5 cursor-pointer"
              />
            </div>
            {(searchQuery || sourceFilter !== 'all' || statusFilter !== 'all' || priorityFilter !== 'all' || assignedFilter !== 'all' || minScore > 0 || quickTab !== 'all') && (
              <button
                onClick={resetFilters}
                className="text-[10px] text-rose-600 hover:text-rose-800 font-semibold text-right cursor-pointer mt-1"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Lead</th>
                <th className="py-3 px-4">Contact &amp; Company</th>
                <th className="py-3 px-4">Requirement</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Status &amp; Priority</th>
                <th className="py-3 px-4">Assigned To</th>
                <th className="py-3 px-4 text-right">Value</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-semibold text-slate-700">No leads found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters.</p>
                    <button
                      onClick={resetFilters}
                      className="mt-3 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200 cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredLeads.map(lead => {
                  const isDuplicate = !!lead.possibleDuplicateId;

                  return (
                    <tr 
                      key={lead.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isDuplicate ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* ID & Source */}
                      <td className="py-3 px-4 align-top">
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => setSelectedLeadId(lead.id)}
                            className="font-mono font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer"
                          >
                            {lead.id}
                          </button>
                          {isDuplicate && (
                            <span 
                              onClick={() => setDuplicateReviewLead(lead)}
                              className="text-amber-600 hover:text-amber-800 cursor-pointer"
                              title="Duplicate detected. Click to compare."
                            >
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            </span>
                          )}
                        </div>
                        <div className="mt-1">
                          <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            {lead.source}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          {new Date(lead.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </span>
                      </td>

                      {/* Name & Company */}
                      <td className="py-3 px-4 align-top">
                        <div 
                          onClick={() => setSelectedLeadId(lead.id)}
                          className="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer"
                        >
                          {lead.name}
                        </div>
                        <div className="text-slate-600 text-[11px] truncate max-w-[160px]">
                          {lead.companyName}
                        </div>
                        <div className="text-slate-400 text-[10px] mt-0.5">
                          {lead.location}
                        </div>
                      </td>

                      {/* Requirement */}
                      <td className="py-3 px-4 align-top max-w-[220px]">
                        <p className="text-slate-700 text-xs line-clamp-2 leading-relaxed">
                          {lead.requirement}
                        </p>
                      </td>

                      {/* Score */}
                      <td className="py-3 px-4 align-top">
                        <div className="flex items-center space-x-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                            lead.score >= 80 ? 'bg-emerald-100 text-emerald-800' :
                            lead.score >= 60 ? 'bg-blue-100 text-blue-800' :
                            lead.score >= 40 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {lead.score}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {lead.verification.result === 'Genuine' ? 'Genuine' :
                             lead.verification.result === 'Not Genuine' ? 'Junk' : 'Pending'}
                          </div>
                        </div>
                      </td>

                      {/* Status & Priority */}
                      <td className="py-3 px-4 align-top">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          lead.status === 'New' ? 'bg-slate-100 text-slate-700' :
                          lead.status === 'Pending Verification' ? 'bg-amber-100 text-amber-800' :
                          lead.status === 'Verified' ? 'bg-indigo-100 text-indigo-700' :
                          lead.status === 'Contacted' ? 'bg-sky-100 text-sky-800' :
                          lead.status === 'Qualified' ? 'bg-blue-100 text-blue-800' :
                          lead.status === 'Meeting Scheduled' ? 'bg-amber-100 text-amber-800' :
                          lead.status === 'Proposal Sent' ? 'bg-purple-100 text-purple-800' :
                          lead.status === 'Negotiation' ? 'bg-orange-100 text-orange-800' :
                          lead.status === 'Won' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {lead.status}
                        </span>

                        <div className="mt-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            lead.priority === 'Hot' ? 'bg-red-50 text-red-700' :
                            lead.priority === 'Warm' ? 'bg-amber-50 text-amber-700' :
                            'bg-slate-50 text-slate-600'
                          }`}>
                            {lead.priority}
                          </span>
                        </div>
                      </td>

                      {/* Assigned */}
                      <td className="py-3 px-4 align-top">
                        {lead.assignedTo ? (
                          <div className="text-slate-800 font-medium">
                            <span className="block truncate">{lead.assignedTo}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAssigningLeadId(lead.id)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            + Assign
                          </button>
                        )}
                      </td>

                      {/* Value */}
                      <td className="py-3 px-4 align-top text-right font-bold text-slate-900">
                        {formatINR(lead.estimatedValue)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 align-top text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {['New', 'Pending Verification'].includes(lead.status) && (
                            <button
                              onClick={() => setVerifyingLeadId(lead.id)}
                              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer"
                              title="Verify Lead"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {!lead.assignedTo && lead.verification.result === 'Genuine' && (
                            <button
                              onClick={() => setAssigningLeadId(lead.id)}
                              className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors cursor-pointer"
                              title="Assign Salesperson"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedLeadId(lead.id)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
          <span>{filteredLeads.length} leads displayed</span>
          <span>Click on any lead row to open full contact profile and timeline</span>
        </div>
      </div>

    </div>
  );
};
