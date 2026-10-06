export type LeadSource = 
  | 'Website' 
  | 'Instagram' 
  | 'Facebook' 
  | 'LinkedIn' 
  | 'WhatsApp' 
  | 'Manual Entry';

export type LeadStatus = 
  | 'New'
  | 'Pending Verification'
  | 'Verified'
  | 'Contacted'
  | 'Qualified'
  | 'Meeting Scheduled'
  | 'Proposal Sent'
  | 'Negotiation'
  | 'Won'
  | 'Lost';

export type LeadPriority = 'Hot' | 'Warm' | 'Cold';

export type VerificationResult = 'Genuine' | 'Not Genuine' | 'Need More Information' | 'Pending';

export type UserRole = 'Administrator' | 'Sales Manager' | 'Salesperson';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  title: string;
}

export interface VerificationChecklist {
  phoneVerified: boolean;
  emailVerified: boolean;
  companyVerified: boolean;
  requirementVerified: boolean;
  duplicateChecked: boolean;
  notes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  result: VerificationResult;
}

export interface QualificationIndicators {
  validPhone: boolean;
  validEmail: boolean;
  companyIdentified: boolean;
  requirementAvailable: boolean;
  duplicateCheckPassed: boolean;
  locationAvailable: boolean;
}

export type ActivityType = 
  | 'Call' 
  | 'Email' 
  | 'Meeting' 
  | 'WhatsApp' 
  | 'Note' 
  | 'Follow-up' 
  | 'Verification' 
  | 'Assignment' 
  | 'Stage Change';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  user: string;
  timestamp: string;
  followUpDate?: string;
  followUpTime?: string;
  followUpType?: 'Call' | 'Meeting' | 'Demo' | 'Email' | 'WhatsApp';
  followUpCompleted?: boolean;
}

export interface Lead {
  id: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  location: string;
  requirement: string;
  source: LeadSource;
  campaign?: string;
  createdAt: string;
  assignedTo?: string; // salesperson name or id
  assignedBy?: string;
  assignedAt?: string;
  status: LeadStatus;
  score: number; // 0 - 100
  priority: LeadPriority;
  estimatedValue: number; // in INR ₹
  qualification: QualificationIndicators;
  verification: VerificationChecklist;
  activities: Activity[];
  possibleDuplicateId?: string;
}

export interface NotificationItem {
  id: string;
  type: 'new_lead' | 'assigned' | 'verification' | 'followup_due' | 'followup_overdue' | 'won';
  title: string;
  message: string;
  leadId?: string;
  timestamp: string;
  read: boolean;
}

export interface FilterState {
  searchQuery: string;
  source: string;
  status: string;
  priority: string;
  assignedTo: string;
  scoreRange: [number, number];
  dateFilter: 'all' | 'today' | 'week' | 'month';
}
