import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { 
  X, 
  Phone, 
  Mail, 
  Building, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  UserCheck, 
  UserPlus, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  Send, 
  FileText
} from 'lucide-react';
import { LeadStatus, LeadPriority, Activity } from '../types/crm';

export const LeadDetailModal: React.FC = () => {
  const { 
    selectedLead, 
    setSelectedLeadId, 
    setVerifyingLeadId, 
    setAssigningLeadId, 
    setDuplicateReviewLead, 
    moveLeadStage, 
    addActivity, 
    currentUser,
    leads 
  } = useCRM();

  const [activeTab, setActiveTab] = useState<'timeline' | 'add_activity' | 'verification_info'>('timeline');

  // Add activity form state
  const [actType, setActType] = useState<Activity['type']>('Call');
  const [actTitle, setActTitle] = useState('');
  const [actDesc, setActDesc] = useState('');
  const [scheduleFollowUp, setScheduleFollowUp] = useState(false);
  const [fuDate, setFuDate] = useState('2026-10-06');
  const [fuTime, setFuTime] = useState('11:00 AM');
  const [fuType, setFuType] = useState<Activity['followUpType']>('Call');

  if (!selectedLead) return null;

  const formatINR = (val: number) => '₹' + val.toLocaleString('en-IN');
  const isDuplicate = !!selectedLead.possibleDuplicateId;
  const duplicateLead = isDuplicate ? leads.find(l => l.id === selectedLead.possibleDuplicateId) : null;

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actTitle.trim()) return;

    addActivity(selectedLead.id, {
      type: actType,
      title: actTitle,
      description: actDesc || `${actType} completed by ${currentUser.name}`,
      followUpDate: scheduleFollowUp ? fuDate : undefined,
      followUpTime: scheduleFollowUp ? fuTime : undefined,
      followUpType: scheduleFollowUp ? fuType : undefined
    });

    setActTitle('');
    setActDesc('');
    setScheduleFollowUp(false);
    setActiveTab('timeline');
  };

  const stages: LeadStatus[] = [
    'New', 'Pending Verification', 'Verified', 'Contacted', 
    'Qualified', 'Meeting Scheduled', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        
        {/* Header Bar */}
        <div className="p-5 bg-slate-900 text-white flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-indigo-300 bg-slate-800 px-2 py-0.5 rounded">
                {selectedLead.id}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                selectedLead.priority === 'Hot' ? 'bg-red-500/20 text-red-300' :
                selectedLead.priority === 'Warm' ? 'bg-amber-500/20 text-amber-300' :
                'bg-slate-700 text-slate-300'
              }`}>
                {selectedLead.priority}
              </span>
              <span className="text-xs text-slate-400">
                {selectedLead.source}
              </span>
            </div>

            <h2 className="text-lg font-bold text-white mt-2 leading-tight">{selectedLead.name}</h2>
            <p className="text-xs text-slate-400">{selectedLead.companyName}</p>
          </div>

          <button
            onClick={() => setSelectedLeadId(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Duplicate Alert Banner */}
        {isDuplicate && duplicateLead && (
          <div className="p-3 bg-amber-50 border-b border-amber-200 flex items-center justify-between text-xs px-5">
            <div className="flex items-center space-x-2 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Possible duplicate:</strong> Matches <span className="font-mono font-bold">{duplicateLead.id}</span> ({duplicateLead.name})
              </span>
            </div>
            <button
              onClick={() => setDuplicateReviewLead(selectedLead)}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ml-2"
            >
              Compare
            </button>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* Quick Stage Selector & Actions */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">STAGE</span>
                <select
                  value={selectedLead.status}
                  onChange={e => moveLeadStage(selectedLead.id, e.target.value as any)}
                  className="mt-0.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 cursor-pointer"
                >
                  {stages.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setVerifyingLeadId(selectedLead.id)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>{selectedLead.verification.result === 'Pending' ? 'Verify Lead' : 'Re-verify'}</span>
                </button>

                <button
                  onClick={() => setAssigningLeadId(selectedLead.id)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{selectedLead.assignedTo ? 'Reassign' : 'Assign'}</span>
                </button>
              </div>
            </div>

            {/* Quick Contact buttons */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200">
              <a
                href={`tel:${selectedLead.phone}`}
                className="py-1.5 px-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center space-x-1 cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>Call</span>
              </a>
              <a
                href={`https://wa.me/${selectedLead.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="py-1.5 px-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center space-x-1 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </a>
              <a
                href={`mailto:${selectedLead.email}`}
                className="py-1.5 px-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center space-x-1 cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5 text-indigo-600" />
                <span>Email</span>
              </a>
            </div>
          </div>

          {/* Details Overview Card */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CONTACT</span>
              <div>
                <span className="text-slate-400 block text-[10px]">Phone</span>
                <span className="font-medium text-slate-800">{selectedLead.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Email</span>
                <span className="font-medium text-slate-800 break-all">{selectedLead.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Location</span>
                <span className="font-medium text-slate-800">{selectedLead.location || 'Not Specified'}</span>
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">DEAL DETAILS</span>
              <div>
                <span className="text-slate-400 block text-[10px]">Estimated Value</span>
                <span className="font-bold text-slate-900 font-mono text-sm">{formatINR(selectedLead.estimatedValue)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Assignee</span>
                <span className="font-semibold text-slate-800">{selectedLead.assignedTo || 'Unassigned'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Qualification Score</span>
                <span className="font-bold text-slate-800">{selectedLead.score} / 100</span>
              </div>
            </div>
          </div>

          {/* Requirement */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">CUSTOMER REQUIREMENT</span>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-xl">
              {selectedLead.requirement}
            </p>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-slate-200 text-xs">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`pb-2 px-3 font-semibold transition-colors cursor-pointer border-b-2 ${
                activeTab === 'timeline' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Activity Timeline ({selectedLead.activities.length})
            </button>
            <button
              onClick={() => setActiveTab('add_activity')}
              className={`pb-2 px-3 font-semibold transition-colors cursor-pointer border-b-2 ${
                activeTab === 'add_activity' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              + Log Activity
            </button>
            <button
              onClick={() => setActiveTab('verification_info')}
              className={`pb-2 px-3 font-semibold transition-colors cursor-pointer border-b-2 ${
                activeTab === 'verification_info' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Verification Details
            </button>
          </div>

          {/* Tab 1: Timeline */}
          {activeTab === 'timeline' && (
            <div className="space-y-3 pt-1">
              <div className="relative pl-5 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {selectedLead.activities.slice().reverse().map(act => (
                  <div key={act.id} className="relative">
                    <div className="absolute -left-5 top-1.5 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-white" />
                    
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-800">{act.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(act.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1">{act.description}</p>
                      
                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                        <span>By {act.user}</span>
                        {act.followUpDate && (
                          <span className="font-medium text-indigo-600">
                            📅 Next: {act.followUpDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Add Activity Form */}
          {activeTab === 'add_activity' && (
            <form onSubmit={handleAddActivity} className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">ACTIVITY TYPE</label>
                <div className="flex flex-wrap gap-1.5">
                  {(['Call', 'Meeting', 'WhatsApp', 'Email', 'Note'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setActType(type)}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                        actType === type ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">TITLE</label>
                <input
                  type="text"
                  required
                  value={actTitle}
                  onChange={e => setActTitle(e.target.value)}
                  placeholder="e.g. Discussed pricing and software requirements"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">NOTES</label>
                <textarea
                  rows={3}
                  value={actDesc}
                  onChange={e => setActDesc(e.target.value)}
                  placeholder="Key discussion points, customer feedback, next steps..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800"
                />
              </div>

              {/* Schedule Follow-up */}
              <div className="pt-2 border-t border-slate-200">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleFollowUp}
                    onChange={e => setScheduleFollowUp(e.target.checked)}
                    className="accent-indigo-600 rounded"
                  />
                  <span className="font-bold text-slate-800">Schedule next follow-up</span>
                </label>

                {scheduleFollowUp && (
                  <div className="grid grid-cols-3 gap-2 mt-2 p-3 bg-white rounded-xl border border-slate-200">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">DATE</label>
                      <input
                        type="date"
                        value={fuDate}
                        onChange={e => setFuDate(e.target.value)}
                        className="w-full border border-slate-300 rounded p-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">TIME</label>
                      <input
                        type="text"
                        value={fuTime}
                        onChange={e => setFuTime(e.target.value)}
                        placeholder="11:00 AM"
                        className="w-full border border-slate-300 rounded p-1 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">TYPE</label>
                      <select
                        value={fuType}
                        onChange={e => setFuType(e.target.value as any)}
                        className="w-full border border-slate-300 rounded p-1 text-xs"
                      >
                        <option value="Call">Call</option>
                        <option value="Meeting">Meeting / Demo</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Email">Email</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition-colors cursor-pointer mt-2"
              >
                Save Activity
              </button>
            </form>
          )}

          {/* Tab 3: Verification Info */}
          {activeTab === 'verification_info' && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800">Verification Outcome:</span>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                  selectedLead.verification.result === 'Genuine' ? 'bg-emerald-100 text-emerald-800' :
                  selectedLead.verification.result === 'Not Genuine' ? 'bg-rose-100 text-rose-800' :
                  selectedLead.verification.result === 'Need More Information' ? 'bg-blue-100 text-blue-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {selectedLead.verification.result}
                </span>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-200">
                <div className="flex justify-between py-1">
                  <span>Phone Verified:</span>
                  <span className="font-semibold">{selectedLead.verification.phoneVerified ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Email Deliverable:</span>
                  <span className="font-semibold">{selectedLead.verification.emailVerified ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Company Exists:</span>
                  <span className="font-semibold">{selectedLead.verification.companyVerified ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Requirement Scoped:</span>
                  <span className="font-semibold">{selectedLead.verification.requirementVerified ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Duplicate Checked:</span>
                  <span className="font-semibold">{selectedLead.verification.duplicateChecked ? 'Yes' : 'No'}</span>
                </div>
              </div>

              {selectedLead.verification.notes && (
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-700">
                  "{selectedLead.verification.notes}"
                </div>
              )}

              <button
                onClick={() => setVerifyingLeadId(selectedLead.id)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Run Verification Check
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
