import React, { useState, useEffect } from 'react';
import { useCRM } from '../context/CRMContext';
import { 
  X, 
  CheckSquare, 
  Square, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Building, 
  FileText, 
  CopyCheck, 
  AlertTriangle,
  UserCheck,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { VerificationResult } from '../types/crm';

export const LeadVerificationModal: React.FC = () => {
  const { 
    verifyingLead, 
    setVerifyingLeadId, 
    verifyLead, 
    setAssigningLeadId 
  } = useCRM();

  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [companyVerified, setCompanyVerified] = useState(false);
  const [requirementVerified, setRequirementVerified] = useState(false);
  const [duplicateChecked, setDuplicateChecked] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (verifyingLead) {
      setPhoneVerified(verifyingLead.verification.phoneVerified || verifyingLead.qualification.validPhone);
      setEmailVerified(verifyingLead.verification.emailVerified || verifyingLead.qualification.validEmail);
      setCompanyVerified(verifyingLead.verification.companyVerified || verifyingLead.qualification.companyIdentified);
      setRequirementVerified(verifyingLead.verification.requirementVerified || verifyingLead.qualification.requirementAvailable);
      setDuplicateChecked(verifyingLead.verification.duplicateChecked || !verifyingLead.possibleDuplicateId);
      setNotes(verifyingLead.verification.notes || '');
    }
  }, [verifyingLead]);

  if (!verifyingLead) return null;

  const checkedCount = [phoneVerified, emailVerified, companyVerified, requirementVerified, duplicateChecked].filter(Boolean).length;
  const isDuplicate = !!verifyingLead.possibleDuplicateId;

  const handleSubmit = (result: VerificationResult) => {
    verifyLead(
      verifyingLead.id,
      {
        phoneVerified,
        emailVerified,
        companyVerified,
        requirementVerified,
        duplicateChecked
      },
      result,
      notes
    );

    setVerifyingLeadId(null);

    // If marked genuine and unassigned, automatically suggest salesperson assignment
    if (result === 'Genuine' && !verifyingLead.assignedTo) {
      setAssigningLeadId(verifyingLead.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-slate-800 text-indigo-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-indigo-300">
                  {verifyingLead.id}
                </span>
                <span className="text-xs text-slate-400">• {verifyingLead.source}</span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">Verify Lead Authenticity</h2>
            </div>
          </div>

          <button
            onClick={() => setVerifyingLeadId(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lead Context Summary */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs flex justify-between items-center">
          <div>
            <span className="font-bold text-slate-900 block">{verifyingLead.name}</span>
            <span className="text-slate-500">{verifyingLead.companyName || 'Independent'}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[10px] uppercase">DEAL VALUE</span>
            <span className="font-bold text-slate-900 font-mono text-xs">₹{verifyingLead.estimatedValue.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Duplicate warning */}
        {isDuplicate && (
          <div className="p-3 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Note:</strong> Matches phone/email of existing lead <span className="font-mono font-bold">{verifyingLead.possibleDuplicateId}</span>.
            </span>
          </div>
        )}

        {/* Checklist */}
        <div className="p-5 space-y-4 flex-1 overflow-y-auto">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Verification Checklist
              </label>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                {checkedCount} of 5 checked
              </span>
            </div>

            <div className="space-y-2">
              {/* 1. Phone */}
              <div 
                onClick={() => setPhoneVerified(!phoneVerified)}
                className={`p-3 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                  phoneVerified ? 'bg-emerald-50/50 border-emerald-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <div className={`w-4 h-4 rounded flex items-center justify-center font-bold text-xs ${
                    phoneVerified ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                  }`}>
                    {phoneVerified && '✓'}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block">Phone Verified</span>
                    <span className="text-slate-500 text-[11px]">{verifyingLead.phone}</span>
                  </div>
                </div>
                <Phone className={`w-3.5 h-3.5 ${phoneVerified ? 'text-emerald-600' : 'text-slate-400'}`} />
              </div>

              {/* 2. Email */}
              <div 
                onClick={() => setEmailVerified(!emailVerified)}
                className={`p-3 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                  emailVerified ? 'bg-emerald-50/50 border-emerald-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <div className={`w-4 h-4 rounded flex items-center justify-center font-bold text-xs ${
                    emailVerified ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                  }`}>
                    {emailVerified && '✓'}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block">Email Deliverable</span>
                    <span className="text-slate-500 text-[11px]">{verifyingLead.email}</span>
                  </div>
                </div>
                <Mail className={`w-3.5 h-3.5 ${emailVerified ? 'text-emerald-600' : 'text-slate-400'}`} />
              </div>

              {/* 3. Company */}
              <div 
                onClick={() => setCompanyVerified(!companyVerified)}
                className={`p-3 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                  companyVerified ? 'bg-emerald-50/50 border-emerald-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <div className={`w-4 h-4 rounded flex items-center justify-center font-bold text-xs ${
                    companyVerified ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                  }`}>
                    {companyVerified && '✓'}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block">Company Verified</span>
                    <span className="text-slate-500 text-[11px]">{verifyingLead.companyName}</span>
                  </div>
                </div>
                <Building className={`w-3.5 h-3.5 ${companyVerified ? 'text-emerald-600' : 'text-slate-400'}`} />
              </div>

              {/* 4. Requirement */}
              <div 
                onClick={() => setRequirementVerified(!requirementVerified)}
                className={`p-3 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                  requirementVerified ? 'bg-emerald-50/50 border-emerald-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <div className={`w-4 h-4 rounded flex items-center justify-center font-bold text-xs ${
                    requirementVerified ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                  }`}>
                    {requirementVerified && '✓'}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block">Requirement &amp; Scope Clear</span>
                    <span className="text-slate-500 text-[11px]">Real purchasing requirement and timeline</span>
                  </div>
                </div>
                <FileText className={`w-3.5 h-3.5 ${requirementVerified ? 'text-emerald-600' : 'text-slate-400'}`} />
              </div>

              {/* 5. Duplicate */}
              <div 
                onClick={() => setDuplicateChecked(!duplicateChecked)}
                className={`p-3 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                  duplicateChecked ? 'bg-emerald-50/50 border-emerald-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <div className={`w-4 h-4 rounded flex items-center justify-center font-bold text-xs ${
                    duplicateChecked ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                  }`}>
                    {duplicateChecked && '✓'}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block">No Duplicate Conflict</span>
                    <span className="text-slate-500 text-[11px]">Unique opportunity, not already being handled</span>
                  </div>
                </div>
                <CopyCheck className={`w-3.5 h-3.5 ${duplicateChecked ? 'text-emerald-600' : 'text-slate-400'}`} />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-800 block mb-1">
              Verification Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add verification notes..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => handleSubmit('Genuine')}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Mark as Genuine</span>
          </button>

          <button
            onClick={() => handleSubmit('Need More Information')}
            className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium text-xs transition-colors cursor-pointer"
          >
            Needs Info
          </button>

          <button
            onClick={() => handleSubmit('Not Genuine')}
            className="py-2.5 px-3 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-medium text-xs transition-colors cursor-pointer"
          >
            Junk / Invalid
          </button>
        </div>

      </div>
    </div>
  );
};
