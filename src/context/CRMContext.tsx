import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Lead, 
  UserProfile, 
  LeadStatus, 
  LeadPriority, 
  VerificationResult, 
  VerificationChecklist, 
  Activity, 
  NotificationItem,
  LeadSource
} from '../types/crm';
import { INITIAL_LEADS, USERS } from '../data/initialLeads';

interface CRMContextType {
  leads: Lead[];
  currentUser: UserProfile;
  users: UserProfile[];
  switchUser: (userId: string) => void;
  dataScope: 'my' | 'all';
  setDataScope: (scope: 'my' | 'all') => void;
  userScopedLeads: Lead[];
  activeTab: 'dashboard' | 'inbox' | 'verification' | 'pipeline' | 'followups' | 'reports';
  setActiveTab: (tab: 'dashboard' | 'inbox' | 'verification' | 'pipeline' | 'followups' | 'reports') => void;
  
  // Selection and modal triggers
  selectedLeadId: string | null;
  setSelectedLeadId: (id: string | null) => void;
  selectedLead: Lead | null;
  
  verifyingLeadId: string | null;
  setVerifyingLeadId: (id: string | null) => void;
  verifyingLead: Lead | null;

  assigningLeadId: string | null;
  setAssigningLeadId: (id: string | null) => void;
  assigningLead: Lead | null;

  duplicateReviewLead: Lead | null;
  setDuplicateReviewLead: (lead: Lead | null) => void;

  isCaptureModalOpen: boolean;
  setIsCaptureModalOpen: (open: boolean) => void;

  // Actions
  addLead: (leadData: {
    name: string;
    companyName: string;
    email: string;
    phone: string;
    location: string;
    requirement: string;
    source: LeadSource;
    campaign?: string;
    estimatedValue?: number;
    priority?: LeadPriority;
  }) => Lead;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  verifyLead: (id: string, checklist: Partial<VerificationChecklist>, result: VerificationResult, notes: string) => void;
  assignLead: (id: string, salespersonName: string, priority?: LeadPriority, notes?: string) => void;
  moveLeadStage: (id: string, newStage: LeadStatus, notes?: string) => void;
  addActivity: (leadId: string, activityData: {
    type: Activity['type'];
    title: string;
    description: string;
    followUpDate?: string;
    followUpTime?: string;
    followUpType?: Activity['followUpType'];
  }) => void;
  toggleFollowUpComplete: (leadId: string, activityId: string) => void;
  deleteLead: (id: string) => void;
  resetDemoData: () => void;

  // Duplicate helper
  checkDuplicate: (phone: string, email: string, company: string, excludeId?: string) => Lead | undefined;

  // Notifications
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (title: string, message: string, type: NotificationItem['type'], leadId?: string) => void;

  // Guided Tour
  demoStep: number;
  setDemoStep: (step: number) => void;
  isTourActive: boolean;
  setIsTourActive: (active: boolean) => void;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

const STORAGE_KEY_LEADS = 'beforth_crm_leads_v1';
const STORAGE_KEY_NOTIFS = 'beforth_crm_notifs_v1';
const STORAGE_KEY_USER = 'beforth_crm_active_user_v1';

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users] = useState<UserProfile[]>(USERS);
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USER);
    if (saved) {
      const found = USERS.find(u => u.id === saved);
      if (found) return found;
    }
    return USERS[1]; // Default to Priya Sharma (Sales Manager) for best overview
  });

  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LEADS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_LEADS;
      }
    }
    return INITIAL_LEADS;
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'inbox' | 'verification' | 'pipeline' | 'followups' | 'reports'>('dashboard');

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [verifyingLeadId, setVerifyingLeadId] = useState<string | null>(null);
  const [assigningLeadId, setAssigningLeadId] = useState<string | null>(null);
  const [duplicateReviewLead, setDuplicateReviewLead] = useState<Lead | null>(null);
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState<boolean>(false);

  // Guided demo tour state
  const [demoStep, setDemoStep] = useState<number>(1);
  const [isTourActive, setIsTourActive] = useState<boolean>(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_NOTIFS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // default
      }
    }
    return [
      {
        id: 'notif-1',
        type: 'new_lead',
        title: 'New Lead Ingested',
        message: 'Mahesh Kadam (ABC Industries) received via Website form',
        leadId: 'LEAD-1006',
        timestamp: 'Just now',
        read: false
      },
      {
        id: 'notif-2',
        type: 'verification',
        title: 'Duplicate Warning Flagged',
        message: 'LEAD-1006 matches phone number of LEAD-1001 (Rahul Patil)',
        leadId: 'LEAD-1006',
        timestamp: '15 mins ago',
        read: false
      },
      {
        id: 'notif-3',
        type: 'followup_due',
        title: 'Follow-up Due Today',
        message: 'Introductory Discovery Call with Rahul Patil (ABC Industries)',
        leadId: 'LEAD-1001',
        timestamp: '1 hour ago',
        read: false
      },
      {
        id: 'notif-4',
        type: 'won',
        title: 'Deal Won! ₹7,50,000',
        message: 'Zenith Pharma Chem signed Purchase Order with Sneha Kulkarni',
        leadId: 'LEAD-1008',
        timestamp: 'Yesterday',
        read: true
      }
    ];
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USER, currentUser.id);
  }, [currentUser]);

  const [dataScope, setDataScope] = useState<'my' | 'all'>(() => {
    return currentUser.role === 'Salesperson' ? 'my' : 'all';
  });

  const switchUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      if (user.role === 'Salesperson') {
        setDataScope('my');
      } else {
        setDataScope('all');
      }
      addNotification(
        `Logged in as ${user.name}`,
        user.role === 'Salesperson' 
          ? `Displaying leads, deals, and tasks assigned to ${user.name}.`
          : `Displaying all company-wide team deals and pipeline.`,
        'assigned'
      );
    }
  };

  const userScopedLeads = React.useMemo(() => {
    if (dataScope === 'my') {
      return leads.filter(l => l.assignedTo === currentUser.name);
    }
    return leads;
  }, [leads, dataScope, currentUser.name]);

  const selectedLead = leads.find(l => l.id === selectedLeadId) || null;
  const verifyingLead = leads.find(l => l.id === verifyingLeadId) || null;
  const assigningLead = leads.find(l => l.id === assigningLeadId) || null;

  const addNotification = (title: string, message: string, type: NotificationItem['type'], leadId?: string) => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      leadId,
      timestamp: 'Just now',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  const checkDuplicate = (phone: string, email: string, company: string, excludeId?: string): Lead | undefined => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const cleanEmail = email.trim().toLowerCase();
    const cleanCompany = company.trim().toLowerCase();

    return leads.find(lead => {
      if (excludeId && lead.id === excludeId) return false;
      const targetPhone = lead.phone.replace(/\D/g, '').slice(-10);
      const targetEmail = lead.email.trim().toLowerCase();
      const targetCompany = lead.companyName.trim().toLowerCase();

      if (cleanPhone && targetPhone && cleanPhone.length >= 8 && cleanPhone === targetPhone) return true;
      if (cleanEmail && targetEmail && cleanEmail === targetEmail) return true;
      if (cleanCompany && targetCompany && cleanCompany.length > 3 && cleanCompany === targetCompany) return true;
      return false;
    });
  };

  const addLead = (data: {
    name: string;
    companyName: string;
    email: string;
    phone: string;
    location: string;
    requirement: string;
    source: LeadSource;
    campaign?: string;
    estimatedValue?: number;
    priority?: LeadPriority;
  }): Lead => {
    // Generate new ID
    const nextNumber = leads.length + 1001;
    const newId = `LEAD-${nextNumber}`;

    // Duplicate check
    const duplicateMatch = checkDuplicate(data.phone, data.email, data.companyName);

    // Calculate initial qualification score
    const validPhone = data.phone.trim().length >= 8;
    const validEmail = data.email.includes('@') && data.email.includes('.');
    const companyIdentified = data.companyName.trim().length > 1;
    const requirementAvailable = data.requirement.trim().length > 5;
    const locationAvailable = data.location.trim().length > 2;
    const duplicateCheckPassed = !duplicateMatch;

    let score = 30;
    if (validPhone) score += 15;
    if (validEmail) score += 15;
    if (companyIdentified) score += 15;
    if (requirementAvailable) score += 15;
    if (locationAvailable) score += 10;
    if (!duplicateCheckPassed) score = Math.max(20, score - 20);

    const newLead: Lead = {
      id: newId,
      name: data.name,
      companyName: data.companyName,
      email: data.email,
      phone: data.phone,
      location: data.location,
      requirement: data.requirement,
      source: data.source,
      campaign: data.campaign || `${data.source} Inbound Channel`,
      createdAt: new Date().toISOString(),
      status: 'New',
      score: Math.min(score, 100),
      priority: data.priority || (score >= 80 ? 'Hot' : score >= 60 ? 'Warm' : 'Cold'),
      estimatedValue: data.estimatedValue || 150000,
      possibleDuplicateId: duplicateMatch ? duplicateMatch.id : undefined,
      qualification: {
        validPhone,
        validEmail,
        companyIdentified,
        requirementAvailable,
        duplicateCheckPassed,
        locationAvailable
      },
      verification: {
        phoneVerified: false,
        emailVerified: false,
        companyVerified: false,
        requirementVerified: false,
        duplicateChecked: false,
        result: 'Pending'
      },
      activities: [
        {
          id: `act-${Date.now()}-1`,
          type: 'Stage Change',
          title: 'Lead Captured Automatically',
          description: `Ingested from ${data.source} (${data.campaign || 'Direct Channel'})`,
          user: 'System Bot',
          timestamp: new Date().toISOString()
        }
      ]
    };

    if (duplicateMatch) {
      newLead.activities.push({
        id: `act-${Date.now()}-2`,
        type: 'Verification',
        title: '⚠️ Potential Duplicate Detected',
        description: `Matched with existing lead ${duplicateMatch.id} (${duplicateMatch.name}) by phone/email/company`,
        user: 'System Bot',
        timestamp: new Date().toISOString()
      });
      addNotification(
        'Possible Duplicate Lead Found',
        `${data.name} matches existing record ${duplicateMatch.id} (${duplicateMatch.name})`,
        'verification',
        newId
      );
    } else {
      addNotification(
        'New Lead Captured',
        `${data.name} from ${data.companyName} received via ${data.source}`,
        'new_lead',
        newId
      );
    }

    setLeads(prev => [newLead, ...prev]);
    return newLead;
  };

  const updateLead = (id: string, updates: Partial<Lead>) => {
    setLeads(prev => prev.map(lead => {
      if (lead.id === id) {
        return { ...lead, ...updates };
      }
      return lead;
    }));
  };

  const verifyLead = (
    id: string, 
    checklist: Partial<VerificationChecklist>, 
    result: VerificationResult, 
    notes: string
  ) => {
    setLeads(prev => prev.map(lead => {
      if (lead.id !== id) return lead;

      const updatedChecklist: VerificationChecklist = {
        ...lead.verification,
        ...checklist,
        notes: notes || lead.verification.notes,
        verifiedBy: currentUser.name,
        verifiedAt: new Date().toISOString(),
        result
      };

      // Recalculate score based on verification
      let newScore = lead.score;
      if (result === 'Genuine') {
        newScore = Math.max(75, Math.min(100, lead.score + 25));
      } else if (result === 'Not Genuine') {
        newScore = 15;
      }

      // Next status based on verification result
      let newStatus: LeadStatus = lead.status;
      if (result === 'Genuine') {
        // If not assigned yet, move to Verified
        if (lead.status === 'New' || lead.status === 'Pending Verification') {
          newStatus = 'Verified';
        }
      } else if (result === 'Not Genuine') {
        newStatus = 'Lost';
      } else if (result === 'Need More Information') {
        newStatus = 'Pending Verification';
      }

      const newActivities: Activity[] = [
        ...lead.activities,
        {
          id: `act-${Date.now()}`,
          type: 'Verification',
          title: `Lead Verification: ${result}`,
          description: notes ? `Result: ${result}. Note: ${notes}` : `Marked as ${result} by ${currentUser.name}`,
          user: currentUser.name,
          timestamp: new Date().toISOString()
        }
      ];

      if (newStatus !== lead.status) {
        newActivities.push({
          id: `act-${Date.now() + 1}`,
          type: 'Stage Change',
          title: `Status Updated to ${newStatus}`,
          description: `Automatically moved after verification outcome: ${result}`,
          user: currentUser.name,
          timestamp: new Date().toISOString()
        });
      }

      return {
        ...lead,
        verification: updatedChecklist,
        score: newScore,
        status: newStatus,
        activities: newActivities
      };
    }));

    addNotification(
      `Lead Verified: ${result}`,
      `${id} was verified as ${result} by ${currentUser.name}`,
      'verification',
      id
    );
  };

  const assignLead = (id: string, salespersonName: string, priority?: LeadPriority, notes?: string) => {
    setLeads(prev => prev.map(lead => {
      if (lead.id !== id) return lead;

      const newPriority = priority || lead.priority;
      const newStatus = (lead.status === 'New' || lead.status === 'Pending Verification') ? 'Verified' : lead.status;

      const newActivities: Activity[] = [
        ...lead.activities,
        {
          id: `act-${Date.now()}`,
          type: 'Assignment',
          title: `Lead Assigned to ${salespersonName}`,
          description: notes ? `Assigned by ${currentUser.name}. Instructions: ${notes}` : `Assigned by ${currentUser.name} with ${newPriority} priority`,
          user: currentUser.name,
          timestamp: new Date().toISOString()
        }
      ];

      return {
        ...lead,
        assignedTo: salespersonName,
        assignedBy: currentUser.name,
        assignedAt: new Date().toISOString(),
        priority: newPriority,
        status: newStatus,
        activities: newActivities
      };
    }));

    addNotification(
      'Lead Assigned',
      `${id} assigned to ${salespersonName} by ${currentUser.name}`,
      'assigned',
      id
    );
  };

  const moveLeadStage = (id: string, newStage: LeadStatus, notes?: string) => {
    setLeads(prev => prev.map(lead => {
      if (lead.id !== id) return lead;
      if (lead.status === newStage) return lead;

      const isWon = newStage === 'Won';
      const isLost = newStage === 'Lost';

      const activity: Activity = {
        id: `act-${Date.now()}`,
        type: 'Stage Change',
        title: isWon ? '🎉 Deal Marked Won!' : isLost ? 'Deal Marked Lost' : `Stage Changed to ${newStage}`,
        description: notes || `Moved from ${lead.status} to ${newStage} by ${currentUser.name}`,
        user: currentUser.name,
        timestamp: new Date().toISOString()
      };

      return {
        ...lead,
        status: newStage,
        activities: [...lead.activities, activity]
      };
    }));

    if (newStage === 'Won') {
      addNotification('Deal Won! 🎉', `Lead ${id} has been marked as Won by ${currentUser.name}!`, 'won', id);
    }
  };

  const addActivity = (leadId: string, activityData: {
    type: Activity['type'];
    title: string;
    description: string;
    followUpDate?: string;
    followUpTime?: string;
    followUpType?: Activity['followUpType'];
  }) => {
    setLeads(prev => prev.map(lead => {
      if (lead.id !== leadId) return lead;

      const newActivity: Activity = {
        id: `act-${Date.now()}`,
        type: activityData.type,
        title: activityData.title,
        description: activityData.description,
        user: currentUser.name,
        timestamp: new Date().toISOString(),
        followUpDate: activityData.followUpDate,
        followUpTime: activityData.followUpTime,
        followUpType: activityData.followUpType,
        followUpCompleted: false
      };

      return {
        ...lead,
        activities: [...lead.activities, newActivity]
      };
    }));
  };

  const toggleFollowUpComplete = (leadId: string, activityId: string) => {
    setLeads(prev => prev.map(lead => {
      if (lead.id !== leadId) return lead;

      return {
        ...lead,
        activities: lead.activities.map(act => {
          if (act.id === activityId) {
            return {
              ...act,
              followUpCompleted: !act.followUpCompleted
            };
          }
          return act;
        })
      };
    }));
  };

  const deleteLead = (id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id));
    if (selectedLeadId === id) setSelectedLeadId(null);
  };

  const resetDemoData = () => {
    setLeads(INITIAL_LEADS);
    localStorage.removeItem(STORAGE_KEY_LEADS);
    localStorage.removeItem(STORAGE_KEY_NOTIFS);
    setNotifications([
      {
        id: 'notif-1',
        type: 'new_lead',
        title: 'Demo Data Reset',
        message: 'Loaded 25 pristine sample leads and workflow pipeline records',
        timestamp: 'Just now',
        read: false
      }
    ]);
  };

  return (
    <CRMContext.Provider value={{
      leads,
      currentUser,
      users,
      switchUser,
      dataScope,
      setDataScope,
      userScopedLeads,
      activeTab,
      setActiveTab,

      selectedLeadId,
      setSelectedLeadId,
      selectedLead,

      verifyingLeadId,
      setVerifyingLeadId,
      verifyingLead,

      assigningLeadId,
      setAssigningLeadId,
      assigningLead,

      duplicateReviewLead,
      setDuplicateReviewLead,

      isCaptureModalOpen,
      setIsCaptureModalOpen,

      addLead,
      updateLead,
      verifyLead,
      assignLead,
      moveLeadStage,
      addActivity,
      toggleFollowUpComplete,
      deleteLead,
      resetDemoData,

      checkDuplicate,

      notifications,
      unreadNotificationCount,
      markNotificationRead,
      markAllNotificationsRead,
      addNotification,

      demoStep,
      setDemoStep,
      isTourActive,
      setIsTourActive
    }}>
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
};
