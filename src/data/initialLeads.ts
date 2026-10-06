import { Lead, UserProfile } from '../types/crm';

export const USERS: UserProfile[] = [
  {
    id: 'user-admin',
    name: 'Arjun Varma',
    email: 'arjun.varma@beforth.com',
    role: 'Administrator',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    title: 'Managing Director & Admin'
  },
  {
    id: 'user-manager',
    name: 'Priya Sharma',
    email: 'priya.sharma@beforth.com',
    role: 'Sales Manager',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    title: 'Sales & Operations Head'
  },
  {
    id: 'user-sales1',
    name: 'Amit Sharma',
    email: 'amit.sharma@beforth.com',
    role: 'Salesperson',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    title: 'Senior Account Executive'
  },
  {
    id: 'user-sales2',
    name: 'Sneha Kulkarni',
    email: 'sneha.kulkarni@beforth.com',
    role: 'Salesperson',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    title: 'Enterprise Sales Rep'
  },
  {
    id: 'user-sales3',
    name: 'Rohit Mehta',
    email: 'rohit.mehta@beforth.com',
    role: 'Salesperson',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    title: 'Inside Sales Specialist'
  }
];

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'LEAD-1001',
    name: 'Rahul Patil',
    companyName: 'ABC Industries Pvt. Ltd.',
    email: 'rahul.patil@abcindustries.co.in',
    phone: '+91 98230 45671',
    location: 'Nashik, Maharashtra',
    requirement: 'ERP Software for manufacturing & inventory management across 3 plants',
    source: 'Website',
    campaign: 'Google Ads - Q4 Manufacturing ERP',
    createdAt: '2026-10-04T09:30:00Z',
    assignedTo: 'Amit Sharma',
    assignedBy: 'Priya Sharma',
    assignedAt: '2026-10-04T11:00:00Z',
    status: 'Verified',
    score: 88,
    priority: 'Hot',
    estimatedValue: 250000,
    qualification: {
      validPhone: true,
      validEmail: true,
      companyIdentified: true,
      requirementAvailable: true,
      duplicateCheckPassed: true,
      locationAvailable: true
    },
    verification: {
      phoneVerified: true,
      emailVerified: true,
      companyVerified: true,
      requirementVerified: true,
      duplicateChecked: true,
      notes: 'Spoke directly with Director. Confirmed 45 desktop user seats required by November.',
      verifiedBy: 'Priya Sharma',
      verifiedAt: '2026-10-04T10:45:00Z',
      result: 'Genuine'
    },
    activities: [
      {
        id: 'act-1',
        type: 'Stage Change',
        title: 'Lead Captured',
        description: 'Auto-ingested from Website Contact Us form',
        user: 'System Bot',
        timestamp: '2026-10-04T09:30:00Z'
      },
      {
        id: 'act-2',
        type: 'Verification',
        title: 'Lead Verified as Genuine',
        description: 'Verified GSTIN, phone & confirmed budget with Director',
        user: 'Priya Sharma',
        timestamp: '2026-10-04T10:45:00Z'
      },
      {
        id: 'act-3',
        type: 'Assignment',
        title: 'Assigned to Amit Sharma',
        description: 'Assigned based on West Zone manufacturing portfolio',
        user: 'Priya Sharma',
        timestamp: '2026-10-04T11:00:00Z'
      },
      {
        id: 'act-4',
        type: 'Follow-up',
        title: 'Introductory Discovery Call',
        description: 'Scheduled deep-dive requirements gathering call with their IT head',
        user: 'Amit Sharma',
        timestamp: '2026-10-05T14:00:00Z',
        followUpDate: '2026-10-06',
        followUpTime: '11:00 AM',
        followUpType: 'Call',
        followUpCompleted: false
      }
    ]
  },
  {
    id: 'LEAD-1002',
    name: 'Sneha Rao',
    companyName: 'TechNova Solutions',
    email: 'sneha.rao@technovasol.com',
    phone: '+91 97654 11223',
    location: 'Pune, Maharashtra',
    requirement: 'CRM & Cloud Migration for 60-member customer success division',
    source: 'LinkedIn',
    campaign: 'LinkedIn Sponsored InMail - SaaS Leaders',
    createdAt: '2026-10-02T11:15:00Z',
    assignedTo: 'Amit Sharma',
    assignedBy: 'Priya Sharma',
    assignedAt: '2026-10-02T13:30:00Z',
    status: 'Proposal Sent',
    score: 94,
    priority: 'Hot',
    estimatedValue: 480000,
    qualification: {
      validPhone: true,
      validEmail: true,
      companyIdentified: true,
      requirementAvailable: true,
      duplicateCheckPassed: true,
      locationAvailable: true
    },
    verification: {
      phoneVerified: true,
      emailVerified: true,
      companyVerified: true,
      requirementVerified: true,
      duplicateChecked: true,
      notes: 'Active LinkedIn company profile with 120 employees. Budget approved for current quarter.',
      verifiedBy: 'Priya Sharma',
      verifiedAt: '2026-10-02T12:00:00Z',
      result: 'Genuine'
    },
    activities: [
      {
        id: 'act-10',
        type: 'Stage Change',
        title: 'Lead Ingested from LinkedIn',
        description: 'LinkedIn Lead Gen Form response parsed',
        user: 'System Bot',
        timestamp: '2026-10-02T11:15:00Z'
      },
      {
        id: 'act-11',
        type: 'Verification',
        title: 'Verified Genuine',
        description: 'Cross-checked with corporate domain and ROC records',
        user: 'Priya Sharma',
        timestamp: '2026-10-02T12:00:00Z'
      },
      {
        id: 'act-12',
        type: 'Meeting',
        title: 'Product Demo & Architecture Review',
        description: 'Demoed CRM workflows to VP Technology and Operations Head',
        user: 'Amit Sharma',
        timestamp: '2026-10-04T15:00:00Z'
      },
      {
        id: 'act-13',
        type: 'Stage Change',
        title: 'Proposal Submitted (v1.2)',
        description: 'Sent commercial proposal of ₹4,80,000 with 1-year enterprise support',
        user: 'Amit Sharma',
        timestamp: '2026-10-05T17:30:00Z'
      },
      {
        id: 'act-14',
        type: 'Follow-up',
        title: 'Commercial Discussion Follow-up',
        description: 'Review SLA terms and final pricing disc with CFO',
        user: 'Amit Sharma',
        timestamp: '2026-10-05T18:00:00Z',
        followUpDate: '2026-10-06',
        followUpTime: '03:30 PM',
        followUpType: 'Meeting',
        followUpCompleted: false
      }
    ]
  },
  {
    id: 'LEAD-1003',
    name: 'Vikram Joshi',
    companyName: 'Horizon Logistics',
    email: 'v.joshi@horizonlogistics.in',
    phone: '+91 99201 88472',
    location: 'Mumbai, Maharashtra',
    requirement: 'Fleet tracking, route dispatch and driver mobile app integration',
    source: 'Facebook',
    campaign: 'FB Lead Ad - Fleet Owners Summit',
    createdAt: '2026-10-03T14:20:00Z',
    assignedTo: 'Sneha Kulkarni',
    assignedBy: 'Priya Sharma',
    assignedAt: '2026-10-03T16:00:00Z',
    status: 'Contacted',
    score: 72,
    priority: 'Warm',
    estimatedValue: 175000,
    qualification: {
      validPhone: true,
      validEmail: true,
      companyIdentified: true,
      requirementAvailable: true,
      duplicateCheckPassed: true,
      locationAvailable: true
    },
    verification: {
      phoneVerified: true,
      emailVerified: true,
      companyVerified: true,
      requirementVerified: true,
      duplicateChecked: true,
      notes: 'Transport company operating 50+ intercity container trucks. Spoke with Operations Manager.',
      verifiedBy: 'Sneha Kulkarni',
      verifiedAt: '2026-10-03T15:45:00Z',
      result: 'Genuine'
    },
    activities: [
      {
        id: 'act-20',
        type: 'Stage Change',
        title: 'Lead Received via Facebook Ad',
        description: 'Auto captured from Facebook Lead form',
        user: 'System Bot',
        timestamp: '2026-10-03T14:20:00Z'
      },
      {
        id: 'act-21',
        type: 'Call',
        title: 'Initial Discovery Call Completed',
        description: 'Discussed integration with existing GPS trackers. Client requested tech spec document.',
        user: 'Sneha Kulkarni',
        timestamp: '2026-10-04T11:30:00Z'
      },
      {
        id: 'act-22',
        type: 'Follow-up',
        title: 'Follow-up on Tech Specs Document',
        description: 'Call Vikram to check if their vendor provided API tokens',
        user: 'Sneha Kulkarni',
        timestamp: '2026-10-04T12:00:00Z',
        followUpDate: '2026-10-05', // Overdue
        followUpTime: '10:00 AM',
        followUpType: 'Call',
        followUpCompleted: false
      }
    ]
  },
  {
    id: 'LEAD-1004',
    name: 'Ananya Deshmukh',
    companyName: 'GreenLeaf Agro Pvt. Ltd.',
    email: 'ananya@greenleafagro.com',
    phone: '+91 94220 77319',
    location: 'Aurangabad, Maharashtra',
    requirement: 'Supply chain automation & farmer procurement portal',
    source: 'WhatsApp',
    campaign: 'WhatsApp Business Inbound API',
    createdAt: '2026-10-01T08:45:00Z',
    assignedTo: 'Amit Sharma',
    assignedBy: 'Priya Sharma',
    assignedAt: '2026-10-01T10:15:00Z',
    status: 'Meeting Scheduled',
    score: 91,
    priority: 'Hot',
    estimatedValue: 320000,
    qualification: {
      validPhone: true,
      validEmail: true,
      companyIdentified: true,
      requirementAvailable: true,
      duplicateCheckPassed: true,
      locationAvailable: true
    },
    verification: {
      phoneVerified: true,
      emailVerified: true,
      companyVerified: true,
      requirementVerified: true,
      duplicateChecked: true,
      notes: 'Managing Director verified via official website & MCA database. Urgent requirement for rabi crop cycle.',
      verifiedBy: 'Priya Sharma',
      verifiedAt: '2026-10-01T09:30:00Z',
      result: 'Genuine'
    },
    activities: [
      {
        id: 'act-30',
        type: 'Stage Change',
        title: 'Lead Ingested from WhatsApp Business',
        description: 'User initiated conversation on +91 80000 12345',
        user: 'System Bot',
        timestamp: '2026-10-01T08:45:00Z'
      },
      {
        id: 'act-31',
        type: 'WhatsApp',
        title: 'Shared Corporate Deck',
        description: 'Sent PDF brochure and video walkthrough on WhatsApp',
        user: 'Amit Sharma',
        timestamp: '2026-10-01T14:20:00Z'
      },
      {
        id: 'act-32',
        type: 'Meeting',
        title: 'In-person Technical Demo Scheduled',
        description: 'Demo scheduled at GreenLeaf corporate headquarters in Waluj MIDC',
        user: 'Amit Sharma',
        timestamp: '2026-10-03T16:00:00Z'
      },
      {
        id: 'act-33',
        type: 'Follow-up',
        title: 'Pre-meeting Agenda Confirmation',
        description: 'Confirm attendees and projector availability with coordinator',
        user: 'Amit Sharma',
        timestamp: '2026-10-05T09:00:00Z',
        followUpDate: '2026-10-06',
        followUpTime: '10:30 AM',
        followUpType: 'WhatsApp',
        followUpCompleted: false
      }
    ]
  },
  {
    id: 'LEAD-1005',
    name: 'Rajesh Agarwal',
    companyName: 'Apex Electricals',
    email: 'rajesh@apexelectricals.in',
    phone: '+91 93710 66254',
    location: 'Nagpur, Maharashtra',
    requirement: 'Multi-branch POS and billing software with GST e-invoicing',
    source: 'Instagram',
    campaign: 'Instagram Reels - Smart Inventory',
    createdAt: '2026-10-05T19:20:00Z',
    status: 'Pending Verification',
    score: 65,
    priority: 'Warm',
    estimatedValue: 190000,
    qualification: {
      validPhone: true,
      validEmail: true,
      companyIdentified: true,
      requirementAvailable: true,
      duplicateCheckPassed: true,
      locationAvailable: true
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
        id: 'act-40',
        type: 'Stage Change',
        title: 'Lead Captured from Instagram',
        description: 'Direct Message campaign link converted',
        user: 'System Bot',
        timestamp: '2026-10-05T19:20:00Z'
      }
    ]
  },
  {
    id: 'LEAD-1006',
    name: 'Mahesh Kadam',
    companyName: 'ABC Industries Pvt. Ltd.', // Duplicate company test case!
    email: 'purchases@abcindustries.co.in',
    phone: '+91 98230 45671', // Duplicate phone test case matching LEAD-1001!
    location: 'Nashik, Maharashtra',
    requirement: 'Inquiry regarding manufacturing ERP cost and implementation timeline',
    source: 'Website',
    campaign: 'Organic Search',
    createdAt: '2026-10-05T21:40:00Z',
    status: 'New',
    score: 45,
    priority: 'Warm',
    estimatedValue: 200000,
    possibleDuplicateId: 'LEAD-1001',
    qualification: {
      validPhone: true,
      validEmail: true,
      companyIdentified: true,
      requirementAvailable: true,
      duplicateCheckPassed: false, // Flagged!
      locationAvailable: true
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
        id: 'act-50',
        type: 'Stage Change',
        title: 'Duplicate Inbound Inquiry Flagged',
        description: 'Auto-detected matching phone number +91 98230 45671 from LEAD-1001',
        user: 'System Bot',
        timestamp: '2026-10-05T21:40:00Z'
      }
    ]
  },
  {
    id: 'LEAD-1007',
    name: 'Kavita Nair',
    companyName: 'BlueSky Exports',
    email: 'kavita@blueskyexp.org',
    phone: '+91 98480 33921',
    location: 'Kochi, Kerala',
    requirement: 'Customs documentation tracking and shipment milestone alerts',
    source: 'LinkedIn',
    campaign: 'Export Trade Network',
    createdAt: '2026-09-28T10:00:00Z',
    assignedTo: 'Rohit Mehta',
    assignedBy: 'Priya Sharma',
    assignedAt: '2026-09-28T12:00:00Z',
    status: 'Negotiation',
    score: 95,
    priority: 'Hot',
    estimatedValue: 550000,
    qualification: {
      validPhone: true,
      validEmail: true,
      companyIdentified: true,
      requirementAvailable: true,
      duplicateCheckPassed: true,
      locationAvailable: true
    },
    verification: {
      phoneVerified: true,
      emailVerified: true,
      companyVerified: true,
      requirementVerified: true,
      duplicateChecked: true,
      notes: 'Exporter with 40cr turnover. Finalist vendor selection.',
      verifiedBy: 'Priya Sharma',
      verifiedAt: '2026-09-28T11:15:00Z',
      result: 'Genuine'
    },
    activities: [
      {
        id: 'act-60',
        type: 'Stage Change',
        title: 'Moved to Negotiation',
        description: 'Sent revised payment schedule with milestone-based tranches',
        user: 'Rohit Mehta',
        timestamp: '2026-10-04T16:20:00Z'
      },
      {
        id: 'act-61',
        type: 'Follow-up',
        title: 'Final Contract Sign-off Call',
        description: 'Close deal and obtain signed master service agreement',
        user: 'Rohit Mehta',
        timestamp: '2026-10-05T12:00:00Z',
        followUpDate: '2026-10-06',
        followUpTime: '02:00 PM',
        followUpType: 'Call',
        followUpCompleted: false
      }
    ]
  },
  {
    id: 'LEAD-1008',
    name: 'Pooja Bhatt',
    companyName: 'Zenith Pharma Chem',
    email: 'pooja.bhatt@zenithchem.com',
    phone: '+91 91580 99482',
    location: 'Vadodara, Gujarat',
    requirement: 'FDA audit compliant document management and batch tracking',
    source: 'Website',
    campaign: 'PharmaTech Directory',
    createdAt: '2026-09-22T09:15:00Z',
    assignedTo: 'Sneha Kulkarni',
    assignedBy: 'Arjun Varma',
    assignedAt: '2026-09-22T11:30:00Z',
    status: 'Won',
    score: 98,
    priority: 'Hot',
    estimatedValue: 750000,
    qualification: {
      validPhone: true,
      validEmail: true,
      companyIdentified: true,
      requirementAvailable: true,
      duplicateCheckPassed: true,
      locationAvailable: true
    },
    verification: {
      phoneVerified: true,
      emailVerified: true,
      companyVerified: true,
      requirementVerified: true,
      duplicateChecked: true,
      notes: 'Audited and verified enterprise buyer.',
      verifiedBy: 'Arjun Varma',
      verifiedAt: '2026-09-22T10:45:00Z',
      result: 'Genuine'
    },
    activities: [
      {
        id: 'act-70',
        type: 'Stage Change',
        title: 'Deal Won & Closed! 🎉',
        description: 'Purchase Order #PO-9921 received for ₹7,50,000',
        user: 'Sneha Kulkarni',
        timestamp: '2026-10-03T17:00:00Z'
      }
    ]
  },
  {
    id: 'LEAD-1009',
    name: 'Sameer Khan',
    companyName: 'UrbanStyle Garments',
    email: 'sameer@urbanstyle.co',
    phone: '+91 98211 44556',
    location: 'Tiruppur, Tamil Nadu',
    requirement: 'Textile barcode scanning & carton packing slip generator',
    source: 'Facebook',
    campaign: 'FB Garment Exporters Campaign',
    createdAt: '2026-09-20T14:00:00Z',
    assignedTo: 'Rohit Mehta',
    assignedBy: 'Priya Sharma',
    assignedAt: '2026-09-20T16:00:00Z',
    status: 'Lost',
    score: 55,
    priority: 'Cold',
    estimatedValue: 120000,
    qualification: {
      validPhone: true,
      validEmail: true,
      companyIdentified: true,
      requirementAvailable: true,
      duplicateCheckPassed: true,
      locationAvailable: true
    },
    verification: {
      phoneVerified: true,
      emailVerified: true,
      companyVerified: true,
      requirementVerified: true,
      duplicateChecked: true,
      notes: 'Genuine business, but budget constraints.',
      verifiedBy: 'Rohit Mehta',
      verifiedAt: '2026-09-20T15:30:00Z',
      result: 'Genuine'
    },
    activities: [
      {
        id: 'act-80',
        type: 'Stage Change',
        title: 'Marked as Lost',
        description: 'Customer selected local offline desktop tool due to cost sensitivity',
        user: 'Rohit Mehta',
        timestamp: '2026-10-02T11:00:00Z'
      }
    ]
  },
  {
    id: 'LEAD-1010',
    name: 'Unknown Tester',
    companyName: 'N/A',
    email: 'test12345@gmail.com',
    phone: '+91 12345 67890',
    location: '',
    requirement: 'how much is price',
    source: 'Website',
    campaign: 'Organic',
    createdAt: '2026-10-05T22:15:00Z',
    status: 'Pending Verification',
    score: 20,
    priority: 'Cold',
    estimatedValue: 50000,
    qualification: {
      validPhone: false,
      validEmail: true,
      companyIdentified: false,
      requirementAvailable: false,
      duplicateCheckPassed: true,
      locationAvailable: false
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
        id: 'act-90',
        type: 'Stage Change',
        title: 'Incoming Web Lead',
        description: 'Minimal fields submitted via quick inquiry widget',
        user: 'System Bot',
        timestamp: '2026-10-05T22:15:00Z'
      }
    ]
  },
  {
    id: 'LEAD-1011',
    name: 'Gaurav Singhal',
    companyName: 'Singhal Steels & Alloys',
    email: 'gaurav@singhalsteel.com',
    phone: '+91 97110 55432',
    location: 'Raipur, Chhattisgarh',
    requirement: 'Heavy engineering inventory, scrap yield calculation & weighbridge sync',
    source: 'Manual Entry',
    campaign: 'Trade Fair - EngiTech 2026',
    createdAt: '2026-10-03T11:00:00Z',
    assignedTo: 'Amit Sharma',
    assignedBy: 'Arjun Varma',
    assignedAt: '2026-10-03T11:30:00Z',
    status: 'Qualified',
    score: 85,
    priority: 'Hot',
    estimatedValue: 380000,
    qualification: {
      validPhone: true,
      validEmail: true,
      companyIdentified: true,
      requirementAvailable: true,
      duplicateCheckPassed: true,
      locationAvailable: true
    },
    verification: {
      phoneVerified: true,
      emailVerified: true,
      companyVerified: true,
      requirementVerified: true,
      duplicateChecked: true,
      notes: 'Met founder at booth. Verified credentials and visiting card.',
      verifiedBy: 'Arjun Varma',
      verifiedAt: '2026-10-03T11:15:00Z',
      result: 'Genuine'
    },
    activities: [
      {
        id: 'act-101',
        type: 'Call',
        title: 'Technical Scoping Discussion',
        description: 'Discussed weighbridge hardware protocol and RS-232 serial integration',
        user: 'Amit Sharma',
        timestamp: '2026-10-04T14:30:00Z'
      },
      {
        id: 'act-102',
        type: 'Follow-up',
        title: 'Hardware Specs Clarification',
        description: 'Call Singhal plant engineer to confirm indicator model numbers',
        user: 'Amit Sharma',
        timestamp: '2026-10-05T10:00:00Z',
        followUpDate: '2026-10-06',
        followUpTime: '04:00 PM',
        followUpType: 'Call',
        followUpCompleted: false
      }
    ]
  },
  {
    id: 'LEAD-1012',
    name: 'Manish Verma',
    companyName: 'CyberShield IT Systems',
    email: 'manish.v@cybershield.in',
    phone: '+91 98901 22345',
    location: 'Bengaluru, Karnataka',
    requirement: 'Enterprise customer support ticketing and SLA breach escalation engine',
    source: 'LinkedIn',
    campaign: 'LinkedIn IT Decision Makers',
    createdAt: '2026-10-04T16:00:00Z',
    assignedTo: 'Sneha Kulkarni',
    assignedBy: 'Priya Sharma',
    assignedAt: '2026-10-04T17:15:00Z',
    status: 'Contacted',
    score: 80,
    priority: 'Warm',
    estimatedValue: 290000,
    qualification: {
      validPhone: true,
      validEmail: true,
      companyIdentified: true,
      requirementAvailable: true,
      duplicateCheckPassed: true,
      locationAvailable: true
    },
    verification: {
      phoneVerified: true,
      emailVerified: true,
      companyVerified: true,
      requirementVerified: true,
      duplicateChecked: true,
      notes: 'Confirmed 20 agent seats with 24x7 rotation.',
      verifiedBy: 'Priya Sharma',
      verifiedAt: '2026-10-04T17:00:00Z',
      result: 'Genuine'
    },
    activities: [
      {
        id: 'act-110',
        type: 'Email',
        title: 'Sent Solution Overview Deck',
        description: 'Sent PDF deck covering ticketing workflows and webhook triggers',
        user: 'Sneha Kulkarni',
        timestamp: '2026-10-05T10:30:00Z'
      }
    ]
  },
  {
    id: 'LEAD-1013',
    name: 'Kishore Shinde',
    companyName: 'Shinde Cold Storage Ltd.',
    email: 'kishore@shindecold.com',
    phone: '+91 94231 88902',
    location: 'Baramati, Maharashtra',
    requirement: 'Temperature sensor alert logging & chamber batch inventory',
    source: 'WhatsApp',
    campaign: 'WhatsApp Agro Referral',
    createdAt: '2026-10-05T14:10:00Z',
    status: 'Pending Verification',
    score: 78,
    priority: 'Warm',
    estimatedValue: 210000,
    qualification: {
      validPhone: true,
      validEmail: true,
      companyIdentified: true,
      requirementAvailable: true,
      duplicateCheckPassed: true,
      locationAvailable: true
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
        id: 'act-120',
        type: 'Stage Change',
        title: 'Incoming Inquiry on WhatsApp',
        description: 'Client asked about multi-chamber temperature graphs',
        user: 'System Bot',
        timestamp: '2026-10-05T14:10:00Z'
      }
    ]
  },
  {
    id: 'LEAD-1014',
    name: 'Divya Nambiar',
    companyName: 'Kerala Spice Hub',
    email: 'orders@keralaspicehub.com',
    phone: '+91 94471 22334',
    location: 'Kozhikode, Kerala',
    requirement: 'B2B export order portal with multi-currency quotation builder',
    source: 'Website',
    campaign: 'Organic Search',
    createdAt: '2026-09-30T13:45:00Z',
    assignedTo: 'Rohit Mehta',
    assignedBy: 'Priya Sharma',
    assignedAt: '2026-09-30T15:00:00Z',
    status: 'Qualified',
    score: 82,
    priority: 'Warm',
    estimatedValue: 340000,
    qualification: {
      validPhone: true,
      validEmail: true,
      companyIdentified: true,
      requirementAvailable: true,
      duplicateCheckPassed: true,
      locationAvailable: true
    },
    verification: {
      phoneVerified: true,
      emailVerified: true,
      companyVerified: true,
      requirementVerified: true,
      duplicateChecked: true,
      notes: 'Spice board certified exporter. Ready for November pilot.',
      verifiedBy: 'Priya Sharma',
      verifiedAt: '2026-09-30T14:30:00Z',
      result: 'Genuine'
    },
    activities: [
      {
        id: 'act-130',
        type: 'Call',
        title: 'Discovery Call with Co-founder',
        description: 'Explained USD/EUR currency auto-rates and GST zero-rated export invoices',
        user: 'Rohit Mehta',
        timestamp: '2026-10-02T16:00:00Z'
      }
    ]
  },
  {
    id: 'LEAD-1015',
    name: 'Harpreet Singh',
    companyName: 'Punjab Auto Components',
    email: 'harpreet@punjabauto.in',
    phone: '+91 98150 77412',
    location: 'Ludhiana, Punjab',
    requirement: 'Production line inspection, QA checklist, and rejection logs',
    source: 'Facebook',
    campaign: 'FB Auto Ancillary Ads',
    createdAt: '2026-10-04T12:00:00Z',
    status: 'Pending Verification',
    score: 70,
    priority: 'Warm',
    estimatedValue: 240000,
    qualification: {
      validPhone: true,
      validEmail: true,
      companyIdentified: true,
      requirementAvailable: true,
      duplicateCheckPassed: true,
      locationAvailable: true
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
        id: 'act-140',
        type: 'Stage Change',
        title: 'Lead Captured via Facebook',
        description: 'Auto recorded from Facebook Instant Form',
        user: 'System Bot',
        timestamp: '2026-10-04T12:00:00Z'
      }
    ]
  },
  {
    id: 'LEAD-1016',
    name: 'Bhavna Chawla',
    companyName: 'Apex Health Wellness',
    email: 'bhavna@apexwellness.org',
    phone: '+91 98710 11998',
    location: 'New Delhi, Delhi',
    requirement: 'Clinic management software with WhatsApp appointment reminders',
    source: 'Instagram',
    campaign: 'IG Healthcare SaaS Promo',
    createdAt: '2026-10-02T15:30:00Z',
    assignedTo: 'Sneha Kulkarni',
    assignedBy: 'Priya Sharma',
    assignedAt: '2026-10-02T17:00:00Z',
    status: 'Meeting Scheduled',
    score: 87,
    priority: 'Hot',
    estimatedValue: 310000,
    qualification: {
      validPhone: true,
      validEmail: true,
      companyIdentified: true,
      requirementAvailable: true,
      duplicateCheckPassed: true,
      locationAvailable: true
    },
    verification: {
      phoneVerified: true,
      emailVerified: true,
      companyVerified: true,
      requirementVerified: true,
      duplicateChecked: true,
      notes: 'Chain of 4 physiotherapy clinics in NCR. Verified clinic registrations.',
      verifiedBy: 'Sneha Kulkarni',
      verifiedAt: '2026-10-02T16:30:00Z',
      result: 'Genuine'
    },
    activities: [
      {
        id: 'act-150',
        type: 'Meeting',
        title: 'Demo Scheduled with Operations Director',
        description: 'Online Google Meet demo scheduled for 4 clinic managers',
        user: 'Sneha Kulkarni',
        timestamp: '2026-10-04T11:00:00Z'
      },
      {
        id: 'act-151',
        type: 'Follow-up',
        title: 'Send Calendar Invite & Meeting Reminder',
        description: 'WhatsApp reminder with demo link to Dr. Bhavna',
        user: 'Sneha Kulkarni',
        timestamp: '2026-10-05T15:00:00Z',
        followUpDate: '2026-10-06',
        followUpTime: '11:30 AM',
        followUpType: 'Meeting',
        followUpCompleted: false
      }
    ]
  },
  {
    id: 'LEAD-1017',
    name: 'Suresh Menon',
    companyName: 'Delta Marine Engineering',
    email: 'suresh@deltamarine.co',
    phone: '+91 98450 66782',
    location: 'Mangaluru, Karnataka',
    requirement: 'Ship repair job work tracking, material requisitions & dock timesheets',
    source: 'LinkedIn',
    campaign: 'Marine Tech Summit',
    createdAt: '2026-09-25T11:00:00Z',
    assignedTo: 'Amit Sharma',
    assignedBy: 'Arjun Varma',
    assignedAt: '2026-09-25T14:00:00Z',
    status: 'Proposal Sent',
    score: 89,
    priority: 'Hot',
    estimatedValue: 620000,
    qualification: {
      validPhone: true,
      validEmail: true,
      companyIdentified: true,
      requirementAvailable: true,
      duplicateCheckPassed: true,
      locationAvailable: true
    },
    verification: {
      phoneVerified: true,
      emailVerified: true,
      companyVerified: true,
      requirementVerified: true,
      duplicateChecked: true,
      notes: 'Registered maritime contractor with Port Authority.',
      verifiedBy: 'Arjun Varma',
      verifiedAt: '2026-09-25T12:30:00Z',
      result: 'Genuine'
    },
    activities: [
      {
        id: 'act-160',
        type: 'Stage Change',
        title: 'Formal Proposal Dispatched',
        description: 'Sent ERP module breakdown with custom dockyard job sheets',
        user: 'Amit Sharma',
        timestamp: '2026-10-03T18:00:00Z'
      }
    ]
  },
  {
    id: 'LEAD-1018',
    name: 'Pramod Tawde',
    companyName: 'Tawde Packaging Materials',
    email: 'info@tawdepack.com',
    phone: '+91 98220 33419',
    location: 'Kolhapur, Maharashtra',
    requirement: 'Corrugated box size estimator, raw material paper reel GSM stock',
    source: 'Manual Entry',
    campaign: 'Referral by ABC Industries',
    createdAt: '2026-10-04T10:15:00Z',
    assignedTo: 'Amit Sharma',
    assignedBy: 'Priya Sharma',
    assignedAt: '2026-10-04T11:45:00Z',
    status: 'Verified',
    score: 84,
    priority: 'Warm',
    estimatedValue: 210000,
    qualification: {
      validPhone: true,
      validEmail: true,
      companyIdentified: true,
      requirementAvailable: true,
      duplicateCheckPassed: true,
      locationAvailable: true
    },
    verification: {
      phoneVerified: true,
      emailVerified: true,
      companyVerified: true,
      requirementVerified: true,
      duplicateChecked: true,
      notes: 'Direct referral from Rahul Patil at ABC Industries. High purchase intent.',
      verifiedBy: 'Priya Sharma',
      verifiedAt: '2026-10-04T11:00:00Z',
      result: 'Genuine'
    },
    activities: [
      {
        id: 'act-170',
        type: 'Verification',
        title: 'Verified Genuine Lead',
        description: 'Verified business address and contact person details',
        user: 'Priya Sharma',
        timestamp: '2026-10-04T11:00:00Z'
      }
    ]
  },
  {
    id: 'LEAD-1019',
    name: 'Tarun Saxena',
    companyName: 'Digital Edge Solutions',
    email: 'spam.lead@fakeinquiry.xyz',
    phone: '+91 90000 00000',
    location: '',
    requirement: 'want seo backlinks demo free',
    source: 'Website',
    campaign: 'Organic',
    createdAt: '2026-10-04T08:10:00Z',
    status: 'Lost',
    score: 15,
    priority: 'Cold',
    estimatedValue: 10000,
    qualification: {
      validPhone: false,
      validEmail: false,
      companyIdentified: false,
      requirementAvailable: false,
      duplicateCheckPassed: true,
      locationAvailable: false
    },
    verification: {
      phoneVerified: false,
      emailVerified: false,
      companyVerified: false,
      requirementVerified: false,
      duplicateChecked: true,
      notes: 'Fake phone number and disposable email domain. Not a genuine enterprise prospect.',
      verifiedBy: 'Priya Sharma',
      verifiedAt: '2026-10-04T09:00:00Z',
      result: 'Not Genuine'
    },
    activities: [
      {
        id: 'act-180',
        type: 'Verification',
        title: 'Marked as Not Genuine',
        description: 'Failed phone & email validation tests. Spam flagged.',
        user: 'Priya Sharma',
        timestamp: '2026-10-04T09:00:00Z'
      }
    ]
  },
  {
    id: 'LEAD-1020',
    name: 'Nitin Gadgil',
    companyName: 'Sahyadri Agro Processing',
    email: 'nitin@sahyadriagro.co.in',
    phone: '+91 94222 55109',
    location: 'Satara, Maharashtra',
    requirement: 'Fruit pulp processing traceability and cold chain export certification',
    source: 'Website',
    campaign: 'Google Ads - Food Processing ERP',
    createdAt: '2026-09-18T10:00:00Z',
    assignedTo: 'Amit Sharma',
    assignedBy: 'Priya Sharma',
    assignedAt: '2026-09-18T12:00:00Z',
    status: 'Won',
    score: 96,
    priority: 'Hot',
    estimatedValue: 450000,
    qualification: {
      validPhone: true,
      validEmail: true,
      companyIdentified: true,
      requirementAvailable: true,
      duplicateCheckPassed: true,
      locationAvailable: true
    },
    verification: {
      phoneVerified: true,
      emailVerified: true,
      companyVerified: true,
      requirementVerified: true,
      duplicateChecked: true,
      notes: 'Verified agro exporter. Fast-tracked implementation.',
      verifiedBy: 'Priya Sharma',
      verifiedAt: '2026-09-18T11:00:00Z',
      result: 'Genuine'
    },
    activities: [
      {
        id: 'act-190',
        type: 'Stage Change',
        title: 'Deal Won & Implementation Kickoff',
        description: 'Advance payment received. Deployment started.',
        user: 'Amit Sharma',
        timestamp: '2026-09-29T16:00:00Z'
      }
    ]
  },
  {
    id: 'LEAD-1021',
    name: 'Alok Sen',
    companyName: 'Sen Infotech Pvt. Ltd.',
    email: 'alok.sen@seninfotech.com',
    phone: '+91 98300 44901',
    location: 'Kolkata, West Bengal',
    requirement: 'Helpdesk ticketing and asset allocation software for 200 staff',
    source: 'Website',
    campaign: 'Direct Inbound',
    createdAt: '2026-10-05T20:10:00Z',
    status: 'Pending Verification',
    score: 75,
    priority: 'Warm',
    estimatedValue: 270000,
    qualification: {
      validPhone: true,
      validEmail: true,
      companyIdentified: true,
      requirementAvailable: true,
      duplicateCheckPassed: true,
      locationAvailable: true
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
        id: 'act-200',
        type: 'Stage Change',
        title: 'Inbound Web Lead Received',
        description: 'Captured via pricing calculator inquiry',
        user: 'System Bot',
        timestamp: '2026-10-05T20:10:00Z'
      }
    ]
  },
  {
    id: 'LEAD-1022',
    name: 'Fatima Shaikh',
    companyName: 'Shaikh Jewellers Retail',
    email: 'fatima@shaikhjewels.in',
    phone: '+91 99300 77123',
    location: 'Surat, Gujarat',
    requirement: 'Hallmark gold weight accounting, diamond certificate vault & barcode billing',
    source: 'Instagram',
    campaign: 'IG Luxury Retail ERP',
    createdAt: '2026-10-03T18:00:00Z',
    assignedTo: 'Sneha Kulkarni',
    assignedBy: 'Priya Sharma',
    assignedAt: '2026-10-04T09:30:00Z',
    status: 'Negotiation',
    score: 92,
    priority: 'Hot',
    estimatedValue: 420000,
    qualification: {
      validPhone: true,
      validEmail: true,
      companyIdentified: true,
      requirementAvailable: true,
      duplicateCheckPassed: true,
      locationAvailable: true
    },
    verification: {
      phoneVerified: true,
      emailVerified: true,
      companyVerified: true,
      requirementVerified: true,
      duplicateChecked: true,
      notes: 'Well known high street jewellery brand with 3 retail stores in Surat.',
      verifiedBy: 'Sneha Kulkarni',
      verifiedAt: '2026-10-04T09:00:00Z',
      result: 'Genuine'
    },
    activities: [
      {
        id: 'act-210',
        type: 'Stage Change',
        title: 'Price Negotiation in Progress',
        description: 'Customer requested 5% discount on multi-store license fee',
        user: 'Sneha Kulkarni',
        timestamp: '2026-10-05T16:00:00Z'
      },
      {
        id: 'act-211',
        type: 'Follow-up',
        title: 'Call Fatima to finalize discount authorization',
        description: 'Offer waived cloud backup year 1 in lieu of cash discount',
        user: 'Sneha Kulkarni',
        timestamp: '2026-10-05T16:30:00Z',
        followUpDate: '2026-10-06',
        followUpTime: '01:00 PM',
        followUpType: 'Call',
        followUpCompleted: false
      }
    ]
  },
  {
    id: 'LEAD-1023',
    name: 'Girish Chandran',
    companyName: 'Chandran Auto Ancillaries',
    email: 'girish@chandranauto.com',
    phone: '+91 94440 99812',
    location: 'Coimbatore, Tamil Nadu',
    requirement: 'CNC machining cycle time logging, rejection rate dashboard',
    source: 'Manual Entry',
    campaign: 'Field Visit - Ambattur Industrial Estate',
    createdAt: '2026-10-01T15:00:00Z',
    assignedTo: 'Rohit Mehta',
    assignedBy: 'Priya Sharma',
    assignedAt: '2026-10-01T16:30:00Z',
    status: 'Meeting Scheduled',
    score: 86,
    priority: 'Hot',
    estimatedValue: 360000,
    qualification: {
      validPhone: true,
      validEmail: true,
      companyIdentified: true,
      requirementAvailable: true,
      duplicateCheckPassed: true,
      locationAvailable: true
    },
    verification: {
      phoneVerified: true,
      emailVerified: true,
      companyVerified: true,
      requirementVerified: true,
      duplicateChecked: true,
      notes: 'Tier 2 automotive vendor supplying to Hyundai & TVS.',
      verifiedBy: 'Priya Sharma',
      verifiedAt: '2026-10-01T16:00:00Z',
      result: 'Genuine'
    },
    activities: [
      {
        id: 'act-220',
        type: 'Meeting',
        title: 'Plant Visit & Technical Scoping',
        description: 'Visited factory floor and reviewed machine counter signals',
        user: 'Rohit Mehta',
        timestamp: '2026-10-04T10:00:00Z'
      }
    ]
  },
  {
    id: 'LEAD-1024',
    name: 'Meera Namboodiri',
    companyName: 'Heritage Ayurveda Health',
    email: 'meera@heritageayur.org',
    phone: '+91 94460 12398',
    location: 'Thrissur, Kerala',
    requirement: 'Ayurvedic medicine formulation batch tracker and GMP compliance logs',
    source: 'WhatsApp',
    campaign: 'Organic WhatsApp Chat',
    createdAt: '2026-10-05T11:20:00Z',
    status: 'Pending Verification',
    score: 79,
    priority: 'Warm',
    estimatedValue: 280000,
    qualification: {
      validPhone: true,
      validEmail: true,
      companyIdentified: true,
      requirementAvailable: true,
      duplicateCheckPassed: true,
      locationAvailable: true
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
        id: 'act-230',
        type: 'Stage Change',
        title: 'WhatsApp Inquiry Initiated',
        description: 'Client asked about GMP raw material batch certificates',
        user: 'System Bot',
        timestamp: '2026-10-05T11:20:00Z'
      }
    ]
  },
  {
    id: 'LEAD-1025',
    name: 'Deepak Chopra',
    companyName: 'Apex Logistics Movers',
    email: 'deepak.c@apexlogistics.net',
    phone: '+91 98110 88234',
    location: 'Gurugram, Haryana',
    requirement: 'Warehouse bin location mapping and pick & pack barcode scanner',
    source: 'Website',
    campaign: 'Google Ads - Warehouse WMS',
    createdAt: '2026-09-15T09:00:00Z',
    assignedTo: 'Amit Sharma',
    assignedBy: 'Priya Sharma',
    assignedAt: '2026-09-15T11:00:00Z',
    status: 'Won',
    score: 97,
    priority: 'Hot',
    estimatedValue: 510000,
    qualification: {
      validPhone: true,
      validEmail: true,
      companyIdentified: true,
      requirementAvailable: true,
      duplicateCheckPassed: true,
      locationAvailable: true
    },
    verification: {
      phoneVerified: true,
      emailVerified: true,
      companyVerified: true,
      requirementVerified: true,
      duplicateChecked: true,
      notes: 'Contract finalized for 2 distribution hubs in Bilaspur and Manesar.',
      verifiedBy: 'Priya Sharma',
      verifiedAt: '2026-09-15T10:30:00Z',
      result: 'Genuine'
    },
    activities: [
      {
        id: 'act-240',
        type: 'Stage Change',
        title: 'Contract Signed & Closed Won',
        description: 'Signed SLA for ₹5,10,000. Setup scheduled.',
        user: 'Amit Sharma',
        timestamp: '2026-09-28T15:00:00Z'
      }
    ]
  }
];
