import React, { useState, useEffect } from 'react';
import { useCRM } from '../context/CRMContext';
import { 
  X, 
  UserPlus, 
  Send 
} from 'lucide-react';
import { LeadPriority } from '../types/crm';

export const LeadAssignmentModal: React.FC = () => {
  const { 
    assigningLead, 
    setAssigningLeadId, 
    assignLead, 
    users, 
    leads 
  } = useCRM();

  const [selectedRep, setSelectedRep] = useState<string>('');
  const [priority, setPriority] = useState<LeadPriority>('Warm');
  const [assignmentNote, setAssignmentNote] = useState('');

  const salesReps = users.filter(u => u.role === 'Salesperson' || u.role === 'Sales Manager');

  useEffect(() => {
    if (assigningLead) {
      setSelectedRep(assigningLead.assignedTo || salesReps[0]?.name || '');
      setPriority(assigningLead.priority || 'Warm');
      setAssignmentNote('');
    }
  }, [assigningLead]);

  if (!assigningLead) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRep) return;

    assignLead(assigningLead.id, selectedRep, priority, assignmentNote);
    setAssigningLeadId(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-slate-800 text-indigo-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-indigo-300">
                  {assigningLead.id}
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">Assign Lead</h2>
            </div>
          </div>

          <button
            onClick={() => setAssigningLeadId(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lead Summary */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs flex justify-between items-center">
          <div>
            <span className="font-bold text-slate-900 block">{assigningLead.name}</span>
            <span className="text-slate-500">{assigningLead.companyName} • {assigningLead.location}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[10px] uppercase">DEAL VALUE</span>
            <span className="font-bold text-slate-900 font-mono text-xs">₹{assigningLead.estimatedValue.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Salesperson Picker */}
          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
              Select Sales Representative
            </label>
            <div className="space-y-2">
              {salesReps.map(rep => {
                const activeLeadCount = leads.filter(l => l.assignedTo === rep.name && !['Won', 'Lost'].includes(l.status)).length;
                const isSelected = selectedRep === rep.name;

                return (
                  <div
                    key={rep.id}
                    onClick={() => setSelectedRep(rep.name)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-indigo-50/70 border-indigo-400 ring-1 ring-indigo-300' 
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <img src={rep.avatar} alt={rep.name} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <span className="font-semibold text-slate-900 block">{rep.name}</span>
                        <span className="text-slate-500 text-[11px]">{rep.title}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-slate-700 font-mono block">
                        {activeLeadCount} active deals
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
              Priority Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Hot', 'Warm', 'Cold'] as LeadPriority[]).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`py-2 px-3 rounded-xl font-semibold text-xs transition-colors cursor-pointer border ${
                    priority === p
                      ? p === 'Hot' ? 'bg-red-500 text-white border-red-600' :
                        p === 'Warm' ? 'bg-amber-500 text-white border-amber-600' :
                        'bg-slate-800 text-white border-slate-900'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-800 block mb-1">
              Instructions / Notes
            </label>
            <textarea
              rows={2}
              value={assignmentNote}
              onChange={e => setAssignmentNote(e.target.value)}
              placeholder="Add instructions for the sales rep..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <Send className="w-4 h-4" />
              <span>Assign to {selectedRep}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
