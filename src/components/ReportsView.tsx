import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  Users, 
  ShieldCheck, 
  Calendar, 
  ArrowUpRight
} from 'lucide-react';
import { LeadSource, LeadStatus } from '../types/crm';

export const ReportsView: React.FC = () => {
  const { leads, users, currentUser } = useCRM();

  const [dateRange, setDateRange] = useState<'all' | '30d' | '90d'>('all');
  const [activeReportTab, setActiveReportTab] = useState<'source' | 'salesperson' | 'pipeline' | 'verification'>('source');

  const formatINR = (val: number) => '₹' + val.toLocaleString('en-IN');

  // Leads by Source
  const sources: LeadSource[] = ['Website', 'Instagram', 'Facebook', 'LinkedIn', 'WhatsApp', 'Manual Entry'];
  const sourceReports = sources.map(source => {
    const matched = leads.filter(l => l.source === source);
    const count = matched.length;
    const genuineCount = matched.filter(l => l.verification.result === 'Genuine').length;
    const wonLeads = matched.filter(l => l.status === 'Won');
    const wonCount = wonLeads.length;
    const revenue = wonLeads.reduce((acc, l) => acc + (l.estimatedValue || 0), 0);
    const convRate = count > 0 ? ((wonCount / count) * 100).toFixed(1) : '0.0';

    return {
      source,
      count,
      genuineCount,
      wonCount,
      revenue,
      convRate
    };
  }).sort((a, b) => b.count - a.count);

  // Salesperson Performance
  const salesReps = users.filter(u => u.role === 'Salesperson' || u.role === 'Sales Manager');
  const salespersonReports = salesReps.map(rep => {
    const assignedLeads = leads.filter(l => l.assignedTo === rep.name);
    const count = assignedLeads.length;
    const verified = assignedLeads.filter(l => l.verification.result === 'Genuine').length;
    const contacted = assignedLeads.filter(l => ['Contacted', 'Qualified', 'Meeting Scheduled', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'].includes(l.status)).length;
    const meetings = assignedLeads.filter(l => ['Meeting Scheduled', 'Proposal Sent', 'Negotiation', 'Won'].includes(l.status)).length;
    const proposals = assignedLeads.filter(l => ['Proposal Sent', 'Negotiation', 'Won'].includes(l.status)).length;
    const wonDeals = assignedLeads.filter(l => l.status === 'Won');
    const wonCount = wonDeals.length;
    const wonValue = wonDeals.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
    const lostCount = assignedLeads.filter(l => l.status === 'Lost').length;
    const convRate = count > 0 ? ((wonCount / count) * 100).toFixed(1) : '0.0';

    return {
      name: rep.name,
      title: rep.title,
      assigned: count,
      verified,
      contacted,
      meetings,
      proposals,
      wonCount,
      wonValue,
      lostCount,
      convRate
    };
  });

  // Funnel & Pipeline breakdown
  const stages: LeadStatus[] = [
    'New', 'Pending Verification', 'Verified', 'Contacted', 
    'Qualified', 'Meeting Scheduled', 'Proposal Sent', 'Negotiation', 'Won'
  ];
  const funnelReports = stages.map(st => ({
    stage: st,
    count: leads.filter(l => l.status === st).length,
    value: leads.filter(l => l.status === st).reduce((sum, l) => sum + (l.estimatedValue || 0), 0)
  }));

  const totalVerified = leads.filter(l => l.verification.result !== 'Pending').length;
  const genuineTotal = leads.filter(l => l.verification.result === 'Genuine').length;
  const notGenuineTotal = leads.filter(l => l.verification.result === 'Not Genuine').length;
  const needInfoTotal = leads.filter(l => l.verification.result === 'Need More Information').length;

  const exportReportCSV = () => {
    let rows: string[][] = [];
    let filename = 'crm_report.csv';

    if (activeReportTab === 'source') {
      rows = [
        ['Lead Source', 'Total Ingested', 'Genuine Leads', 'Won Deals', 'Revenue (INR)', 'Conversion Rate (%)'],
        ...sourceReports.map(s => [s.source, String(s.count), String(s.genuineCount), String(s.wonCount), String(s.revenue), `${s.convRate}%`])
      ];
      filename = 'leads_by_source_report.csv';
    } else if (activeReportTab === 'salesperson') {
      rows = [
        ['Salesperson', 'Leads Assigned', 'Verified', 'Contacted', 'Meetings', 'Proposals', 'Won Deals', 'Lost Deals', 'Revenue Won (INR)', 'Conversion Rate (%)'],
        ...salespersonReports.map(s => [
          s.name, String(s.assigned), String(s.verified), String(s.contacted), 
          String(s.meetings), String(s.proposals), String(s.wonCount), 
          String(s.lostCount), String(s.wonValue), `${s.convRate}%`
        ])
      ];
      filename = 'salesperson_performance_report.csv';
    } else {
      rows = [
        ['Stage', 'Lead Count', 'Pipeline Value (INR)'],
        ...funnelReports.map(f => [f.stage, String(f.count), String(f.value)])
      ];
      filename = 'pipeline_funnel_report.csv';
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Performance analytics across sources, sales reps, and pipeline conversion.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value as any)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800"
          >
            <option value="all">All Time</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>

          <button
            onClick={exportReportCSV}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar text-xs">
        <button
          onClick={() => setActiveReportTab('source')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer flex items-center space-x-1.5 ${
            activeReportTab === 'source' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>By Lead Source</span>
        </button>

        <button
          onClick={() => setActiveReportTab('salesperson')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer flex items-center space-x-1.5 ${
            activeReportTab === 'salesperson' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>By Sales Rep</span>
        </button>

        <button
          onClick={() => setActiveReportTab('pipeline')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer flex items-center space-x-1.5 ${
            activeReportTab === 'pipeline' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Pipeline Funnel</span>
        </button>

        <button
          onClick={() => setActiveReportTab('verification')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer flex items-center space-x-1.5 ${
            activeReportTab === 'verification' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verification Stats</span>
        </button>
      </div>

      {/* Tab 1: Leads by Source */}
      {activeReportTab === 'source' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">Lead Source Performance</h2>
            <p className="text-xs text-slate-500">Inbound inquiries, genuine rate, and won revenue by acquisition channel</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Total Leads</th>
                  <th className="py-3 px-4">Genuine</th>
                  <th className="py-3 px-4">Won Deals</th>
                  <th className="py-3 px-4">Won Revenue</th>
                  <th className="py-3 px-4 text-right">Conversion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sourceReports.map(s => (
                  <tr key={s.source} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${
                        s.source === 'Website' ? 'bg-indigo-600' :
                        s.source === 'LinkedIn' ? 'bg-blue-600' :
                        s.source === 'WhatsApp' ? 'bg-emerald-500' :
                        s.source === 'Facebook' ? 'bg-sky-500' :
                        s.source === 'Instagram' ? 'bg-pink-500' : 'bg-slate-500'
                      }`} />
                      <span>{s.source}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">{s.count}</td>
                    <td className="py-3.5 px-4 font-mono text-emerald-700 font-semibold">{s.genuineCount}</td>
                    <td className="py-3.5 px-4 font-mono text-indigo-700 font-semibold">{s.wonCount}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{formatINR(s.revenue)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full">
                        {s.convRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Sales Rep Performance */}
      {activeReportTab === 'salesperson' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">Sales Rep Scorecard</h2>
            <p className="text-xs text-slate-500">Assigned leads, activities, closed deals, and revenue</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="py-3 px-4">Sales Rep</th>
                  <th className="py-3 px-4">Assigned</th>
                  <th className="py-3 px-4">Verified</th>
                  <th className="py-3 px-4">Contacted</th>
                  <th className="py-3 px-4">Meetings</th>
                  <th className="py-3 px-4">Proposals</th>
                  <th className="py-3 px-4">Won Deals</th>
                  <th className="py-3 px-4">Lost</th>
                  <th className="py-3 px-4">Won Revenue</th>
                  <th className="py-3 px-4 text-right">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salespersonReports.map(rep => {
                  const isCurrent = rep.name === currentUser.name;

                  return (
                    <tr key={rep.name} className={`transition-colors ${isCurrent ? 'bg-indigo-50/60 font-medium' : 'hover:bg-slate-50'}`}>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-slate-900">{rep.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] bg-indigo-600 text-white font-bold px-1.5 py-0.2 rounded">
                              Current User
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">{rep.title}</div>
                      </td>
                    <td className="py-3.5 px-4 font-mono font-semibold">{rep.assigned}</td>
                    <td className="py-3.5 px-4 font-mono">{rep.verified}</td>
                    <td className="py-3.5 px-4 font-mono">{rep.contacted}</td>
                    <td className="py-3.5 px-4 font-mono">{rep.meetings}</td>
                    <td className="py-3.5 px-4 font-mono">{rep.proposals}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">{rep.wonCount}</td>
                    <td className="py-3.5 px-4 font-mono text-rose-600">{rep.lostCount}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{formatINR(rep.wonValue)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-mono font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                        {rep.convRate}%
                      </span>
                    </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Funnel */}
      {activeReportTab === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Funnel Volume</h2>
            <p className="text-xs text-slate-500 mb-4">Number of leads at each stage</p>

            <div className="space-y-3">
              {funnelReports.map(f => {
                const maxCount = Math.max(...funnelReports.map(i => i.count), 1);
                const pct = Math.round((f.count / maxCount) * 100);

                return (
                  <div key={f.stage} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-800">{f.stage}</span>
                      <span className="font-mono font-bold text-slate-900">{f.count} leads</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Pipeline Value</h2>
            <p className="text-xs text-slate-500 mb-4">Total estimated deal value per stage</p>

            <div className="space-y-2">
              {funnelReports.map(f => (
                <div key={f.stage} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <span className="font-medium text-slate-700">{f.stage}</span>
                  <span className="font-mono font-bold text-slate-900">{formatINR(f.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Verification Stats */}
      {activeReportTab === 'verification' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-5">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Lead Verification Summary</h2>
            <p className="text-xs text-slate-500">Screening outcomes across incoming inquiries</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium uppercase">Reviewed</span>
              <div className="text-xl font-bold text-slate-900 mt-0.5">{totalVerified}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[11px] text-emerald-700 font-medium uppercase">Genuine</span>
              <div className="text-xl font-bold text-emerald-900 mt-0.5">{genuineTotal}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
              <span className="text-[11px] text-rose-700 font-medium uppercase">Junk / Invalid</span>
              <div className="text-xl font-bold text-rose-900 mt-0.5">{notGenuineTotal}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-[11px] text-blue-700 font-medium uppercase">Needs Info</span>
              <div className="text-xl font-bold text-blue-900 mt-0.5">{needInfoTotal}</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
