import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { 
  Kanban, 
  Plus, 
  DollarSign, 
  Flame, 
  Users, 
  ArrowRight, 
  ChevronRight, 
  ChevronLeft,
  Eye
} from 'lucide-react';
import { LeadStatus, Lead, LeadPriority } from '../types/crm';

const STAGES: { id: LeadStatus; label: string; headerColor: string }[] = [
  { id: 'New', label: 'New', headerColor: 'border-slate-300' },
  { id: 'Verified', label: 'Verified', headerColor: 'border-indigo-500' },
  { id: 'Contacted', label: 'Contacted', headerColor: 'border-sky-500' },
  { id: 'Qualified', label: 'Qualified', headerColor: 'border-blue-600' },
  { id: 'Meeting Scheduled', label: 'Meeting', headerColor: 'border-amber-500' },
  { id: 'Proposal Sent', label: 'Proposal', headerColor: 'border-purple-500' },
  { id: 'Negotiation', label: 'Negotiation', headerColor: 'border-orange-500' },
  { id: 'Won', label: 'Won', headerColor: 'border-emerald-600' },
  { id: 'Lost', label: 'Lost', headerColor: 'border-rose-400' }
];

export const PipelineView: React.FC = () => {
  const { 
    leads, 
    currentUser,
    dataScope,
    setDataScope,
    moveLeadStage, 
    setSelectedLeadId, 
    users, 
    setIsCaptureModalOpen 
  } = useCRM();

  const [salespersonFilter, setSalespersonFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  const formatINR = (val: number) => '₹' + val.toLocaleString('en-IN');
  const myDealsCount = leads.filter(l => l.assignedTo === currentUser.name).length;

  const visibleLeads = leads.filter(l => {
    // User data scope
    if (dataScope === 'my' && l.assignedTo !== currentUser.name) return false;

    if (salespersonFilter !== 'all') {
      if (salespersonFilter === 'unassigned' && l.assignedTo) return false;
      if (salespersonFilter !== 'unassigned' && l.assignedTo !== salespersonFilter) return false;
    }
    if (priorityFilter !== 'all' && l.priority !== priorityFilter) return false;
    return true;
  });

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedLeadId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStage: LeadStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedLeadId;
    if (id) {
      moveLeadStage(id, targetStage);
    }
    setDraggedLeadId(null);
  };

  const totalActivePipelineValue = visibleLeads
    .filter(l => !['Won', 'Lost'].includes(l.status))
    .reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

  return (
    <div className="space-y-4">
      
      {/* Top Banner & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pipeline</h1>
            <span className="text-xs bg-slate-200 text-slate-800 px-2.5 py-0.5 rounded-full font-bold">
              Active: {formatINR(totalActivePipelineValue)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Drag cards or click arrows to move deals across stages.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Scope Toggle */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl font-semibold">
            <button
              onClick={() => setDataScope('my')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                dataScope === 'my' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Deals ({myDealsCount})
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

          <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={salespersonFilter}
              onChange={e => setSalespersonFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-800 outline-hidden cursor-pointer"
            >
              <option value="all">All Assignees</option>
              <option value="unassigned">Unassigned</option>
              {users.map(u => (
                <option key={u.id} value={u.name}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Flame className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-800 outline-hidden cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="Hot">Hot</option>
              <option value="Warm">Warm</option>
              <option value="Cold">Cold</option>
            </select>
          </div>

          <button
            onClick={() => setIsCaptureModalOpen(true)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="overflow-x-auto pb-4 pt-1 no-scrollbar">
        <div className="flex space-x-3.5 min-w-[1850px] items-start">
          {STAGES.map((stage, stageIdx) => {
            const stageLeads = visibleLeads.filter(l => l.status === stage.id);
            const stageTotalValue = stageLeads.reduce((acc, l) => acc + (l.estimatedValue || 0), 0);

            return (
              <div
                key={stage.id}
                onDragOver={handleDragOver}
                onDrop={e => handleDrop(e, stage.id)}
                className={`w-72 shrink-0 rounded-2xl border-t-4 ${stage.headerColor} bg-slate-100/70 border border-slate-200 p-3 shadow-xs flex flex-col max-h-[calc(100vh-210px)]`}
              >
                {/* Header */}
                <div className="pb-2 border-b border-slate-200 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-xs text-slate-900">{stage.label}</h3>
                    <div className="text-[11px] font-mono text-slate-500 font-medium">
                      {formatINR(stageTotalValue)}
                    </div>
                  </div>
                  <span className="bg-white text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full text-[11px] font-bold">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="mt-2.5 space-y-2 overflow-y-auto pr-1 flex-1 min-h-[300px]">
                  {stageLeads.length === 0 ? (
                    <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs my-6">
                      No deals
                    </div>
                  ) : (
                    stageLeads.map(lead => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={e => handleDragStart(e, lead.id)}
                        className="bg-white rounded-xl p-3 border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-sm transition-all cursor-grab active:cursor-grabbing group relative"
                      >
                        {/* ID & Priority */}
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span 
                            onClick={() => setSelectedLeadId(lead.id)}
                            className="font-mono font-bold text-indigo-700 hover:underline cursor-pointer text-[11px]"
                          >
                            {lead.id}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            lead.priority === 'Hot' ? 'bg-red-50 text-red-700' :
                            lead.priority === 'Warm' ? 'bg-amber-50 text-amber-700' :
                            'bg-slate-50 text-slate-600'
                          }`}>
                            {lead.priority}
                          </span>
                        </div>

                        {/* Name & Company */}
                        <h4 
                          onClick={() => setSelectedLeadId(lead.id)}
                          className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer leading-snug"
                        >
                          {lead.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate">{lead.companyName}</p>

                        {/* Requirement */}
                        <p className="text-[11px] text-slate-600 mt-1.5 line-clamp-2 bg-slate-50 p-1.5 rounded-lg">
                          {lead.requirement}
                        </p>

                        {/* Value & Source */}
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900 font-mono text-xs">
                            {formatINR(lead.estimatedValue)}
                          </span>
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                            {lead.source}
                          </span>
                        </div>

                        {/* Footer & Stage Step Arrows */}
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                          <span className="truncate max-w-[110px]" title={lead.assignedTo || 'Unassigned'}>
                            {lead.assignedTo || <span className="text-amber-600">Unassigned</span>}
                          </span>

                          <div className="flex items-center space-x-1 shrink-0">
                            {stageIdx > 0 && (
                              <button
                                onClick={() => moveLeadStage(lead.id, STAGES[stageIdx - 1].id)}
                                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                                title="Previous stage"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {stageIdx < STAGES.length - 1 && (
                              <button
                                onClick={() => moveLeadStage(lead.id, STAGES[stageIdx + 1].id)}
                                className="p-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 cursor-pointer"
                                title="Next stage"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
