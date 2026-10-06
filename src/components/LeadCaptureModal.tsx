import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { 
  X, 
  Send, 
  AlertTriangle, 
  Plus 
} from 'lucide-react';
import { LeadSource, LeadPriority } from '../types/crm';

export const LeadCaptureModal: React.FC = () => {
  const { 
    isCaptureModalOpen, 
    setIsCaptureModalOpen, 
    addLead, 
    checkDuplicate,
    setSelectedLeadId,
    setActiveTab
  } = useCRM();

  const [source, setSource] = useState<LeadSource>('Website');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [requirement, setRequirement] = useState('');
  const [campaign, setCampaign] = useState('');
  const [estimatedValue, setEstimatedValue] = useState<number>(250000);
  const [priority, setPriority] = useState<LeadPriority>('Warm');

  // Real-time duplicate check
  const duplicateMatch = (phone.length >= 8 || email.includes('@') || companyName.length > 3)
    ? checkDuplicate(phone, email, companyName)
    : undefined;

  const loadPreset = (presetType: 'manufacturing' | 'retail' | 'duplicate_test') => {
    if (presetType === 'manufacturing') {
      setSource('Website');
      setName('Sunil Deshmukh');
      setCompanyName('Pragati Gears Pvt. Ltd.');
      setEmail('sunil@pragatigears.com');
      setPhone('+91 98229 88123');
      setLocation('Pune, Maharashtra');
      setRequirement('Production scheduling, BOM revision tracking and material rejection logs');
      setCampaign('Website Inquiry Form');
      setEstimatedValue(350000);
      setPriority('Hot');
    } else if (presetType === 'retail') {
      setSource('Instagram');
      setName('Pooja Kulkarni');
      setCompanyName('Chic Boutiques Retail');
      setEmail('pooja@chicboutiques.in');
      setPhone('+91 97640 12890');
      setLocation('Thane, Mumbai');
      setRequirement('Multi-outlet POS billing, barcode printers, and loyalty points engine');
      setCampaign('Instagram Ad');
      setEstimatedValue(180000);
      setPriority('Warm');
    } else if (presetType === 'duplicate_test') {
      setSource('WhatsApp');
      setName('Rahul Patil');
      setCompanyName('ABC Industries Pvt. Ltd.');
      setEmail('rahul.patil@abcindustries.co.in');
      setPhone('+91 98230 45671');
      setLocation('Nashik, Maharashtra');
      setRequirement('Urgent inquiry regarding ERP deployment timeline and quote');
      setCampaign('WhatsApp Inbound');
      setEstimatedValue(250000);
      setPriority('Hot');
    }
  };

  if (!isCaptureModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const newLead = addLead({
      name,
      companyName: companyName || 'Independent',
      email: email || 'contact@prospect.com',
      phone,
      location: location || 'India',
      requirement: requirement || 'Software requirement',
      source,
      campaign: campaign || `${source} Inbound`,
      estimatedValue: Number(estimatedValue) || 150000,
      priority
    });

    setIsCaptureModalOpen(false);
    setSelectedLeadId(newLead.id);
    setActiveTab('inbox');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-slate-800 text-indigo-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Add New Lead</h2>
              <p className="text-xs text-slate-400 mt-0.5">Enter contact information or fill sample data</p>
            </div>
          </div>

          <button
            onClick={() => setIsCaptureModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Fill Pills */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-[11px] font-semibold text-slate-500">Quick Fill:</span>
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => loadPreset('manufacturing')}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
            >
              Manufacturing Lead
            </button>
            <button
              type="button"
              onClick={() => loadPreset('retail')}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
            >
              Retail Lead
            </button>
            <button
              type="button"
              onClick={() => loadPreset('duplicate_test')}
              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-medium transition-colors cursor-pointer flex items-center space-x-1"
            >
              <span>Test Duplicate</span>
            </button>
          </div>
        </div>

        {/* Live Duplicate Alert */}
        {duplicateMatch && (
          <div className="p-3 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-semibold">Possible duplicate detected:</span> Matches existing lead{' '}
              <span className="font-mono font-bold">{duplicateMatch.id}</span> ({duplicateMatch.name}).
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 overflow-y-auto text-xs flex-1">
          {/* Source Selection */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              LEAD SOURCE
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {(['Website', 'WhatsApp', 'LinkedIn', 'Instagram', 'Facebook', 'Manual Entry'] as LeadSource[]).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSource(s)}
                  className={`py-1.5 px-2 rounded-xl text-center font-semibold text-[11px] transition-colors cursor-pointer border ${
                    source === s 
                      ? 'bg-slate-900 text-white border-slate-900' 
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">PROSPECT NAME *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Rahul Patil"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">COMPANY NAME *</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="e.g. ABC Industries Pvt. Ltd."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">PHONE NUMBER *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 98230 45671"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">EMAIL ADDRESS</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="rahul@company.com"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">LOCATION / CITY</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Nashik, Maharashtra"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">ESTIMATED VALUE (INR ₹)</label>
              <input
                type="number"
                value={estimatedValue}
                onChange={e => setEstimatedValue(Number(e.target.value))}
                placeholder="250000"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">REQUIREMENT DESCRIPTION *</label>
            <textarea
              rows={2}
              required
              value={requirement}
              onChange={e => setRequirement(e.target.value)}
              placeholder="e.g. ERP Software for manufacturing & inventory management"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">CAMPAIGN / SOURCE DETAILS</label>
              <input
                type="text"
                value={campaign}
                onChange={e => setCampaign(e.target.value)}
                placeholder="Google Ads - Q4 Campaign"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">INITIAL PRIORITY</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-semibold"
              >
                <option value="Hot">Hot</option>
                <option value="Warm">Warm</option>
                <option value="Cold">Cold</option>
              </select>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Lead</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
