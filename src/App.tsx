import React from 'react';
import { CRMProvider, useCRM } from './context/CRMContext';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { LeadInboxView } from './components/LeadInboxView';
import { VerificationQueueView } from './components/VerificationQueueView';
import { PipelineView } from './components/PipelineView';
import { FollowUpsView } from './components/FollowUpsView';
import { ReportsView } from './components/ReportsView';
import { LeadDetailModal } from './components/LeadDetailModal';
import { LeadVerificationModal } from './components/LeadVerificationModal';
import { LeadAssignmentModal } from './components/LeadAssignmentModal';
import { LeadCaptureModal } from './components/LeadCaptureModal';
import { DuplicateReviewModal } from './components/DuplicateReviewModal';

const CRMMainContent: React.FC = () => {
  const { activeTab } = useCRM();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'inbox' && <LeadInboxView />}
        {activeTab === 'verification' && <VerificationQueueView />}
        {activeTab === 'pipeline' && <PipelineView />}
        {activeTab === 'followups' && <FollowUpsView />}
        {activeTab === 'reports' && <ReportsView />}
      </main>

      {/* Global CRM Modals */}
      <LeadDetailModal />
      <LeadVerificationModal />
      <LeadAssignmentModal />
      <LeadCaptureModal />
      <DuplicateReviewModal />

      {/* Clean Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-800">BeForth CRM</span>
            <span>•</span>
            <span>Lead &amp; Sales Management</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Capture • Verify • Assign • Follow Up • Close
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <CRMProvider>
      <CRMMainContent />
    </CRMProvider>
  );
}
