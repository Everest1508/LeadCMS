import React from 'react';
import { useCRM } from '../context/CRMContext';
import { 
  X, 
  AlertTriangle, 
  Merge, 
  ExternalLink 
} from 'lucide-react';

export const DuplicateReviewModal: React.FC = () => {
  const { 
    duplicateReviewLead, 
    setDuplicateReviewLead, 
    leads, 
    updateLead, 
    setSelectedLeadId,
    addActivity,
    currentUser
  } = useCRM();

  if (!duplicateReviewLead) return null;

  const originalLead = leads.find(l => l.id === duplicateReviewLead.possibleDuplicateId);

  const handleMarkAsDistinct = () => {
    updateLead(duplicateReviewLead.id, {
      possibleDuplicateId: undefined,
      qualification: {
        ...duplicateReviewLead.qualification,
        duplicateCheckPassed: true
      }
    });
    addActivity(duplicateReviewLead.id, {
      type: 'Verification',
      title: 'Duplicate Flag Cleared',
      description: `Marked as separate unique inquiry by ${currentUser.name}`
    });
    setDuplicateReviewLead(null);
  };

  const handleMergeNotes = () => {
    if (!originalLead) return;

    addActivity(originalLead.id, {
      type: 'Note',
      title: `Merged Inquiry from ${duplicateReviewLead.name} (${duplicateReviewLead.id})`,
      description: `Inbound inquiry on ${duplicateReviewLead.source}: "${duplicateReviewLead.requirement}". Merged by ${currentUser.name}.`
    });

    updateLead(duplicateReviewLead.id, {
      status: 'Lost',
      verification: {
        ...duplicateReviewLead.verification,
        result: 'Not Genuine',
        notes: `Merged into primary account ${originalLead.id}`
      }
    });

    setDuplicateReviewLead(null);
    setSelectedLeadId(originalLead.id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-slate-800 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Duplicate Lead Detected</h2>
              <p className="text-xs text-slate-400 mt-0.5">Compare and resolve matching records</p>
            </div>
          </div>

          <button
            onClick={() => setDuplicateReviewLead(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Body */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[70vh]">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
            This inquiry matches the phone number, email, or company name of an existing lead in your system. Review both records below.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Left: Flagged Inbound Lead */}
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/20 space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-amber-200">
                <span className="font-bold text-amber-800 text-[10px] uppercase">NEW INQUIRY</span>
                <span className="font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-amber-200">
                  {duplicateReviewLead.id}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block">NAME</span>
                <span className="font-bold text-slate-900 text-sm">{duplicateReviewLead.name}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block">COMPANY</span>
                <span className="font-semibold text-slate-800">{duplicateReviewLead.companyName}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block">PHONE</span>
                <span className="font-mono font-bold text-slate-900">{duplicateReviewLead.phone}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block">EMAIL</span>
                <span className="font-mono text-slate-800 break-all">{duplicateReviewLead.email}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block">SOURCE &amp; DATE</span>
                <span className="text-slate-700">{duplicateReviewLead.source} • {new Date(duplicateReviewLead.createdAt).toLocaleDateString()}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block">REQUIREMENT</span>
                <p className="text-slate-700 bg-white p-2 rounded border border-amber-200/60 line-clamp-2">
                  {duplicateReviewLead.requirement}
                </p>
              </div>
            </div>

            {/* Right: Existing Lead in System */}
            {originalLead ? (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-500 text-[10px] uppercase">EXISTING RECORD</span>
                  <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {originalLead.id}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">NAME</span>
                  <span className="font-bold text-slate-900 text-sm">{originalLead.name}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">COMPANY</span>
                  <span className="font-semibold text-slate-800">{originalLead.companyName}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">PHONE</span>
                  <span className="font-mono font-bold text-slate-900">{originalLead.phone}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">EMAIL</span>
                  <span className="font-mono text-slate-800 break-all">{originalLead.email}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">STAGE &amp; ASSIGNEE</span>
                  <span className="font-semibold text-slate-800">{originalLead.status} • {originalLead.assignedTo || 'Unassigned'}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">REQUIREMENT</span>
                  <p className="text-slate-700 bg-white p-2 rounded border border-slate-200 line-clamp-2">
                    {originalLead.requirement}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400">
                Original record not found
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-end gap-2 text-xs">
          <button
            onClick={handleMarkAsDistinct}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Mark as Separate Lead
          </button>

          {originalLead && (
            <button
              onClick={handleMergeNotes}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <Merge className="w-3.5 h-3.5" />
              <span>Merge into Existing Lead</span>
            </button>
          )}

          {originalLead && (
            <button
              onClick={() => {
                setDuplicateReviewLead(null);
                setSelectedLeadId(originalLead.id);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Lead ({originalLead.id})</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
