import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  UserCheck, 
  ShieldAlert, 
  Search, 
  Phone, 
  Mail, 
  Building, 
  FileText, 
  CopyCheck, 
  MapPin, 
  Eye, 
  AlertTriangle 
} from 'lucide-react';

export const VerificationQueueView: React.FC = () => {
  const { 
    leads, 
    setVerifyingLeadId, 
    setSelectedLeadId, 
    setDuplicateReviewLead
  } = useCRM();

  const [activeFilter, setActiveFilter] = useState<'pending' | 'genuine' | 'not_genuine' | 'need_info'>('pending');
  const [searchTerm, setSearchTerm] = useState('');

  const pendingLeads = leads.filter(l => l.status === 'New' || l.status === 'Pending Verification' || l.verification.result === 'Pending');
  const genuineLeads = leads.filter(l => l.verification.result === 'Genuine');
  const notGenuineLeads = leads.filter(l => l.verification.result === 'Not Genuine');
  const needInfoLeads = leads.filter(l => l.verification.result === 'Need More Information');

  const currentList = activeFilter === 'pending' ? pendingLeads :
                      activeFilter === 'genuine' ? genuineLeads :
                      activeFilter === 'not_genuine' ? notGenuineLeads : needInfoLeads;

  const filteredList = currentList.filter(l => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return l.id.toLowerCase().includes(q) ||
           l.name.toLowerCase().includes(q) ||
           l.companyName.toLowerCase().includes(q) ||
           l.phone.includes(q) ||
           l.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Lead Verification</h1>
            <span className="text-xs bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-full font-bold border border-amber-200">
              {pendingLeads.length} to review
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Verify phone numbers, email addresses, and company details before assigning to sales reps.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-500">Genuine Leads:</span>
          <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
            {leads.length > 0 ? Math.round((genuineLeads.length / leads.length) * 100) : 0}% of all inquiries
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar text-xs">
          <button
            onClick={() => setActiveFilter('pending')}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeFilter === 'pending' 
                ? 'bg-slate-900 text-white' 
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>Needs Review</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeFilter === 'pending' ? 'bg-slate-700 text-slate-100' : 'bg-slate-100 text-slate-700'
            }`}>
              {pendingLeads.length}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('genuine')}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeFilter === 'genuine' 
                ? 'bg-slate-900 text-white' 
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>Genuine</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeFilter === 'genuine' ? 'bg-slate-700 text-slate-100' : 'bg-slate-100 text-slate-700'
            }`}>
              {genuineLeads.length}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('need_info')}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeFilter === 'need_info' 
                ? 'bg-slate-900 text-white' 
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>Needs More Info</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeFilter === 'need_info' ? 'bg-slate-700 text-slate-100' : 'bg-slate-100 text-slate-700'
            }`}>
              {needInfoLeads.length}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter('not_genuine')}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeFilter === 'not_genuine' 
                ? 'bg-slate-900 text-white' 
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>Junk / Not Genuine</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeFilter === 'not_genuine' ? 'bg-slate-700 text-slate-100' : 'bg-slate-100 text-slate-700'
            }`}>
              {notGenuineLeads.length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search queue..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredList.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 p-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No leads in this queue</h3>
            <p className="text-xs text-slate-400 mt-1">All leads in this section have been reviewed.</p>
          </div>
        ) : (
          filteredList.map(lead => {
            const isDuplicate = !!lead.possibleDuplicateId;

            return (
              <div 
                key={lead.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top tags */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-indigo-700">{lead.id}</span>
                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {lead.source}
                      </span>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      lead.verification.result === 'Genuine' ? 'bg-emerald-100 text-emerald-800' :
                      lead.verification.result === 'Not Genuine' ? 'bg-rose-100 text-rose-800' :
                      lead.verification.result === 'Need More Information' ? 'bg-blue-100 text-blue-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {lead.verification.result === 'Need More Information' ? 'Need Info' : lead.verification.result}
                    </span>
                  </div>

                  {/* Header */}
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{lead.name}</h3>
                  <p className="text-xs text-slate-500">{lead.companyName || 'Independent'}</p>
                  
                  {/* Duplicate Alert */}
                  {isDuplicate && (
                    <div 
                      onClick={() => setDuplicateReviewLead(lead)}
                      className="mt-2.5 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between cursor-pointer hover:bg-amber-100 transition-colors"
                    >
                      <div className="flex items-center space-x-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="font-semibold text-[11px]">Matches lead {lead.possibleDuplicateId}</span>
                      </div>
                      <span className="text-[10px] font-bold underline">Compare</span>
                    </div>
                  )}

                  {/* Contact Details */}
                  <div className="mt-3 space-y-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-1 text-slate-600">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{lead.phone}</span>
                      </span>
                      <span className={`text-[10px] font-semibold ${lead.qualification.validPhone ? 'text-emerald-700' : 'text-rose-500'}`}>
                        {lead.qualification.validPhone ? 'Valid' : 'Check format'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-1 text-slate-600 truncate max-w-[170px]">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="truncate">{lead.email}</span>
                      </span>
                      <span className={`text-[10px] font-semibold ${lead.qualification.validEmail ? 'text-emerald-700' : 'text-rose-500'}`}>
                        {lead.qualification.validEmail ? 'Valid domain' : 'Unverified'}
                      </span>
                    </div>
                    {lead.location && (
                      <div className="flex items-center space-x-1 text-slate-500 text-[11px] pt-1 border-t border-slate-200">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{lead.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Requirement */}
                  <div className="mt-3">
                    <p className="text-xs text-slate-700 bg-white p-2 rounded-xl border border-slate-200 line-clamp-2">
                      {lead.requirement}
                    </p>
                  </div>

                  {/* Checklist status */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                      <div className="flex items-center space-x-1.5">
                        <span className={lead.verification.phoneVerified ? 'text-emerald-600 font-bold' : 'text-slate-300'}>
                          {lead.verification.phoneVerified ? '✓' : '○'}
                        </span>
                        <span>Phone checked</span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <span className={lead.verification.emailVerified ? 'text-emerald-600 font-bold' : 'text-slate-300'}>
                          {lead.verification.emailVerified ? '✓' : '○'}
                        </span>
                        <span>Email checked</span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <span className={lead.verification.companyVerified ? 'text-emerald-600 font-bold' : 'text-slate-300'}>
                          {lead.verification.companyVerified ? '✓' : '○'}
                        </span>
                        <span>Company verified</span>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <span className={lead.verification.requirementVerified ? 'text-emerald-600 font-bold' : 'text-slate-300'}>
                          {lead.verification.requirementVerified ? '✓' : '○'}
                        </span>
                        <span>Requirement scoped</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedLeadId(lead.id)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    title="View Profile"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setVerifyingLeadId(lead.id)}
                    className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5 shadow-xs"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Verify Lead</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
