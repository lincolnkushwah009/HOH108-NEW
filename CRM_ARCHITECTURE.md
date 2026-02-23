# Hancet Globe CRM Architecture

## Enterprise-Grade Multi-Company CRM System

---

## 1. SYSTEM OVERVIEW

```
                    ┌─────────────────────────────────────┐
                    │         HANCET GLOBE (Mother)       │
                    │          Super Admin Access         │
                    └─────────────────┬───────────────────┘
                                      │
        ┌─────────────┬───────────────┼───────────────┬─────────────┐
        │             │               │               │             │
        ▼             ▼               ▼               ▼             ▼
   ┌─────────┐  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
   │Interior │  │Construct│    │Education│    │Renovation│   │  ODS    │
   │  Plus   │  │  Plus   │    │  Plus   │    │   Plus   │   │  Plus   │
   └────┬────┘  └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘
        │             │               │               │             │
        └─────────────┴───────────────┴───────────────┴─────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
               ┌─────────┐      ┌──────────┐      ┌─────────┐
               │  LEADS  │ ──▶  │ CUSTOMERS│ ──▶  │PROJECTS │
               └─────────┘      └──────────┘      └─────────┘
```

---

## 2. DATABASE SCHEMA

### 2.1 Companies Collection

```javascript
// companies
{
  _id: ObjectId,
  companyId: String,           // "HG", "IP", "CP", "EP", "RP", "OP"
  name: String,                // "Hancet Globe", "Interior Plus", etc.
  code: String,                // Unique 2-3 letter code
  type: Enum ['mother', 'subsidiary'],
  parentCompany: ObjectId,     // null for mother, ref to mother for subsidiaries

  // Company Details
  logo: String,
  email: String,
  phone: String,
  website: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String
  },

  // Business Settings
  services: [String],          // Services offered by this company
  defaultCurrency: String,
  fiscalYearStart: Number,     // Month (1-12)

  // Status Pipelines (customizable per company)
  leadStatuses: [{
    code: String,
    label: String,
    color: String,
    order: Number
  }],
  projectStages: [{
    code: String,
    label: String,
    color: String,
    order: Number
  }],

  // Metadata
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 2.2 Users Collection (Enhanced)

```javascript
// users
{
  _id: ObjectId,

  // Basic Info
  userId: String,              // Auto-generated: HG-U-001, IP-U-001
  name: String,
  email: String,
  phone: String,
  password: String,            // Hashed
  avatar: String,

  // Company Association
  company: ObjectId,           // Primary company (ref: companies)
  accessibleCompanies: [ObjectId], // For cross-company access

  // Role & Permissions
  role: Enum [
    'super_admin',      // Mother company - full access
    'company_admin',    // Subsidiary admin - full company access
    'sales_manager',    // Manage sales team, view all leads
    'sales_rep',        // Own leads only
    'project_manager',  // Manage projects
    'operations',       // View projects, update status
    'viewer'            // Read-only access
  ],

  permissions: {
    leads: {
      create: Boolean,
      read: Enum ['own', 'team', 'company', 'all'],
      update: Enum ['own', 'team', 'company', 'all'],
      delete: Boolean,
      assign: Boolean,
      convert: Boolean
    },
    customers: {
      create: Boolean,
      read: Enum ['own', 'team', 'company', 'all'],
      update: Enum ['own', 'team', 'company', 'all'],
      delete: Boolean
    },
    projects: {
      create: Boolean,
      read: Enum ['own', 'team', 'company', 'all'],
      update: Enum ['own', 'team', 'company', 'all'],
      delete: Boolean,
      changeStage: Boolean
    },
    users: {
      create: Boolean,
      read: Boolean,
      update: Boolean,
      delete: Boolean
    },
    reports: {
      viewCompany: Boolean,
      viewAll: Boolean,
      export: Boolean
    },
    settings: {
      companySettings: Boolean,
      systemSettings: Boolean
    }
  },

  // Team Hierarchy
  reportsTo: ObjectId,         // Manager
  team: [ObjectId],            // Direct reports

  // Status
  isActive: Boolean,
  lastLogin: Date,

  // Karma & Gamification
  karmaPoints: Number,

  // Metadata
  createdAt: Date,
  updatedAt: Date
}
```

### 2.3 Leads Collection (Enhanced)

```javascript
// leads
{
  _id: ObjectId,

  // Lead Identification
  leadId: String,              // Auto: IP-L-2024-00001
  company: ObjectId,           // Required (ref: companies)

  // Contact Information
  name: String,
  email: String,
  phone: String,
  alternatePhone: String,

  // Location
  location: {
    city: String,
    state: String,
    pincode: String,
    address: String
  },

  // Lead Details
  service: String,             // Service interested in
  propertyType: Enum ['apartment', 'villa', 'independent-house', 'commercial', 'office', 'plot', 'other'],
  budget: {
    min: Number,
    max: Number,
    currency: String
  },
  area: {
    value: Number,
    unit: Enum ['sqft', 'sqm']
  },
  requirements: String,        // Detailed requirements

  // Lead Source & Attribution
  source: Enum ['website', 'referral', 'social-media', 'google-ads', 'facebook-ads', 'walk-in', 'cold-call', 'event', 'partner', 'other'],
  sourceDetails: String,       // Campaign name, referrer name, etc.
  utmParams: {
    source: String,
    medium: String,
    campaign: String,
    term: String,
    content: String
  },
  websiteSource: String,       // Which website form

  // Lead Status & Pipeline
  status: String,              // Maps to company's leadStatuses
  subStatus: String,           // More granular status
  priority: Enum ['low', 'medium', 'high', 'urgent'],
  score: Number,               // Lead scoring (0-100)

  // Assignment
  assignedTo: ObjectId,        // Primary owner (ref: users)
  teamMembers: [{
    user: ObjectId,
    role: Enum ['owner', 'collaborator', 'viewer'],
    assignedAt: Date,
    assignedBy: ObjectId
  }],

  // Follow-up
  nextFollowUp: {
    date: Date,
    type: Enum ['call', 'email', 'meeting', 'site-visit'],
    notes: String
  },

  // Conversion
  isConverted: Boolean,
  convertedAt: Date,
  convertedBy: ObjectId,
  customer: ObjectId,          // ref: customers (after conversion)

  // Communication Log
  communications: [{
    type: Enum ['call', 'email', 'sms', 'whatsapp', 'meeting'],
    direction: Enum ['inbound', 'outbound'],
    summary: String,
    outcome: String,
    duration: Number,          // For calls (minutes)
    recordedBy: ObjectId,
    recordedAt: Date
  }],

  // Notes
  notes: [{
    content: String,
    addedBy: ObjectId,
    addedByName: String,
    addedAt: Date,
    isPinned: Boolean
  }],

  // Activity Timeline
  activities: [{
    action: String,
    description: String,
    performedBy: ObjectId,
    performedByName: String,
    oldValue: Mixed,
    newValue: Mixed,
    metadata: Mixed,
    createdAt: Date
  }],

  // Tags & Categories
  tags: [String],

  // Metadata
  lastActivityAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 2.4 Customers Collection (NEW)

```javascript
// customers
{
  _id: ObjectId,

  // Customer Identification
  customerId: String,          // Auto: IP-C-2024-00001
  company: ObjectId,           // Required (ref: companies)

  // Personal/Business Information
  type: Enum ['individual', 'business'],

  // For Individual
  name: String,
  email: String,
  phone: String,
  alternatePhone: String,
  dateOfBirth: Date,
  anniversary: Date,

  // For Business
  businessName: String,
  gstin: String,
  contactPerson: {
    name: String,
    designation: String,
    email: String,
    phone: String
  },

  // Address
  addresses: [{
    type: Enum ['billing', 'site', 'correspondence'],
    label: String,
    street: String,
    city: String,
    state: String,
    pincode: String,
    isDefault: Boolean
  }],

  // Customer Value
  totalProjects: Number,
  totalValue: Number,
  lifetimeValue: Number,
  averageProjectValue: Number,

  // Relationship
  accountManager: ObjectId,    // Primary relationship owner
  teamMembers: [{
    user: ObjectId,
    role: String,
    since: Date
  }],

  // Segmentation
  segment: Enum ['platinum', 'gold', 'silver', 'bronze', 'new'],
  category: String,            // Business category
  tags: [String],

  // Conversion Source
  originalLead: ObjectId,      // ref: leads
  convertedAt: Date,
  convertedBy: ObjectId,

  // Communication Preferences
  preferredContact: Enum ['email', 'phone', 'whatsapp'],
  marketingConsent: Boolean,

  // Notes & Documents
  notes: [{
    content: String,
    addedBy: ObjectId,
    addedAt: Date
  }],
  documents: [{
    name: String,
    type: String,
    url: String,
    uploadedBy: ObjectId,
    uploadedAt: Date
  }],

  // Status
  status: Enum ['active', 'inactive', 'churned'],

  // Metadata
  createdAt: Date,
  updatedAt: Date
}
```

### 2.5 Projects Collection (Enhanced)

```javascript
// projects
{
  _id: ObjectId,

  // Project Identification
  projectId: String,           // Auto: IP-P-2024-00001
  company: ObjectId,           // Required (ref: companies)

  // Relationships
  customer: ObjectId,          // Required (ref: customers)
  originalLead: ObjectId,      // ref: leads

  // Project Details
  name: String,
  description: String,
  type: Enum ['interior', 'construction', 'renovation', 'consultation', 'other'],
  category: String,            // Sub-category

  // Site Details
  siteAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  propertyType: String,
  area: {
    value: Number,
    unit: String
  },

  // Timeline
  timeline: {
    estimatedStart: Date,
    estimatedEnd: Date,
    actualStart: Date,
    actualEnd: Date,
    duration: Number,          // Days
  },

  // Financials
  financials: {
    estimatedCost: Number,
    quotedAmount: Number,
    agreedAmount: Number,
    currency: String,

    // Payment Schedule
    payments: [{
      milestone: String,
      percentage: Number,
      amount: Number,
      dueDate: Date,
      status: Enum ['pending', 'invoiced', 'paid', 'overdue'],
      paidAt: Date,
      invoiceNumber: String,
      receiptNumber: String
    }],

    totalPaid: Number,
    totalDue: Number,

    // Costs
    estimatedCosts: [{
      category: String,
      amount: Number
    }],
    actualCosts: [{
      category: String,
      amount: Number,
      date: Date,
      vendor: String,
      invoiceRef: String
    }]
  },

  // Project Stage & Status
  stage: String,               // Maps to company's projectStages
  status: Enum ['active', 'on-hold', 'completed', 'cancelled'],
  healthStatus: Enum ['on-track', 'at-risk', 'delayed', 'critical'],

  // Progress Tracking
  progress: {
    overall: Number,           // Percentage (0-100)
    phases: [{
      name: String,
      status: Enum ['pending', 'in-progress', 'completed', 'skipped'],
      progress: Number,
      startDate: Date,
      endDate: Date,
      notes: String
    }]
  },

  // Team
  projectManager: ObjectId,    // Primary PM
  teamMembers: [{
    user: ObjectId,
    role: Enum ['project_manager', 'designer', 'site_engineer', 'supervisor', 'coordinator'],
    assignedAt: Date,
    permissions: [String]
  }],

  // Vendors & Contractors
  vendors: [{
    name: String,
    type: String,
    contactPerson: String,
    phone: String,
    email: String,
    scope: String,
    contractValue: Number,
    status: Enum ['engaged', 'completed', 'terminated']
  }],

  // Documents
  documents: [{
    name: String,
    category: Enum ['contract', 'design', 'quotation', 'invoice', 'receipt', 'plan', 'photo', 'other'],
    url: String,
    version: Number,
    uploadedBy: ObjectId,
    uploadedAt: Date
  }],

  // Design & Plans
  designs: [{
    name: String,
    type: Enum ['2d', '3d', 'elevation', 'floor-plan', 'render'],
    url: String,
    status: Enum ['draft', 'shared', 'approved', 'revised'],
    version: Number,
    feedback: String,
    approvedBy: ObjectId,
    approvedAt: Date
  }],

  // Issues & Risks
  issues: [{
    title: String,
    description: String,
    severity: Enum ['low', 'medium', 'high', 'critical'],
    status: Enum ['open', 'in-progress', 'resolved', 'closed'],
    assignedTo: ObjectId,
    raisedBy: ObjectId,
    raisedAt: Date,
    resolvedAt: Date,
    resolution: String
  }],

  // Communication Log
  communications: [{
    type: String,
    summary: String,
    participants: [String],
    recordedBy: ObjectId,
    recordedAt: Date
  }],

  // Notes
  notes: [{
    content: String,
    type: Enum ['general', 'internal', 'client-shared'],
    addedBy: ObjectId,
    addedAt: Date
  }],

  // Activity Timeline
  activities: [{
    action: String,
    description: String,
    performedBy: ObjectId,
    performedByName: String,
    metadata: Mixed,
    createdAt: Date
  }],

  // Ratings & Feedback
  customerFeedback: {
    rating: Number,            // 1-5
    review: String,
    submittedAt: Date
  },

  // Tags
  tags: [String],

  // Portfolio Settings
  showInPortfolio: Boolean,
  portfolioData: {
    title: String,
    shortDescription: String,
    images: [{
      url: String,
      caption: String,
      isMain: Boolean
    }],
    features: [String]
  },

  // Metadata
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### 2.6 Activities Collection (Centralized)

```javascript
// activities
{
  _id: ObjectId,

  // Context
  company: ObjectId,           // ref: companies
  entityType: Enum ['lead', 'customer', 'project', 'user'],
  entityId: ObjectId,

  // Activity Details
  action: String,
  description: String,

  // Performer
  performedBy: ObjectId,
  performedByName: String,

  // Change Tracking
  changes: [{
    field: String,
    oldValue: Mixed,
    newValue: Mixed
  }],

  // Metadata
  metadata: Mixed,
  ipAddress: String,
  userAgent: String,

  createdAt: Date
}
```

---

## 3. CRM FLOW DIAGRAMS

### 3.1 Lead to Customer Conversion Flow

```
┌──────────────┐
│  NEW LEAD    │
│   Created    │
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐
│  CONTACTED   │────▶│  NOT         │
│              │     │  INTERESTED  │──▶ [LOST]
└──────┬───────┘     └──────────────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐
│  QUALIFIED   │────▶│  UNQUALIFIED │──▶ [LOST]
│              │     └──────────────┘
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  PROPOSAL    │
│    SENT      │
└──────┬───────┘
       │
       ├──────────────────────────┐
       │                          │
       ▼                          ▼
┌──────────────┐          ┌──────────────┐
│ NEGOTIATION  │          │   REJECTED   │──▶ [LOST]
└──────┬───────┘          └──────────────┘
       │
       ▼
┌──────────────┐
│     WON      │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────────┐
│           CONVERSION PROCESS            │
│  1. Create Customer Record              │
│  2. Link Lead to Customer               │
│  3. Create Project (optional)           │
│  4. Transfer team assignments           │
│  5. Log conversion activity             │
└──────┬──────────────────────────────────┘
       │
       ▼
┌──────────────┐      ┌──────────────┐
│   CUSTOMER   │─────▶│   PROJECT    │
│   Created    │      │   Created    │
└──────────────┘      └──────────────┘
```

### 3.2 Customer to Multiple Projects Flow

```
                    ┌──────────────┐
                    │   CUSTOMER   │
                    └──────┬───────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │  PROJECT 1   │ │  PROJECT 2   │ │  PROJECT N   │
    │   (Active)   │ │  (Completed) │ │   (Planned)  │
    └──────────────┘ └──────────────┘ └──────────────┘

Customer View:
┌────────────────────────────────────────────────────┐
│ Customer: ABC Enterprises                          │
├────────────────────────────────────────────────────┤
│ Segment: Gold    │ Lifetime Value: ₹45,00,000     │
├────────────────────────────────────────────────────┤
│ Projects (3):                                      │
│ ├── IP-P-2024-00045 | Interior | Completed | ₹15L │
│ ├── IP-P-2024-00078 | Interior | Active    | ₹20L │
│ └── IP-P-2025-00012 | Interior | Planning  | ₹10L │
└────────────────────────────────────────────────────┘
```

### 3.3 Project Lifecycle Stages

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PROJECT LIFECYCLE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐             │
│  │INITIATION │──▶│  DESIGN   │──▶│ APPROVAL  │──▶│PROCUREMENT│             │
│  │           │   │           │   │           │   │           │             │
│  │• Site     │   │• Concepts │   │• Client   │   │• Material │             │
│  │  Survey   │   │• 3D Views │   │  Sign-off │   │  Orders   │             │
│  │• Require- │   │• BOQ      │   │• Contract │   │• Vendor   │             │
│  │  ments    │   │• Estimate │   │• Payment  │   │  Booking  │             │
│  └───────────┘   └───────────┘   └───────────┘   └───────────┘             │
│                                                       │                      │
│       ┌──────────────────────────────────────────────┘                      │
│       │                                                                      │
│       ▼                                                                      │
│  ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐             │
│  │ EXECUTION │──▶│   QC &    │──▶│  HANDOVER │──▶│  CLOSURE  │             │
│  │           │   │  SNAG     │   │           │   │           │             │
│  │• Civil    │   │• Quality  │   │• Final    │   │• Feedback │             │
│  │  Work     │   │  Check    │   │  Walkthru │   │• Warranty │             │
│  │• Installa-│   │• Snag     │   │• Keys &   │   │• Payment  │             │
│  │  tions    │   │  Fixing   │   │  Docs     │   │  Closure  │             │
│  └───────────┘   └───────────┘   └───────────┘   └───────────┘             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. ROLE-BASED ACCESS CONTROL (RBAC)

### 4.1 Role Hierarchy

```
                    ┌─────────────────┐
                    │   SUPER ADMIN   │ ── Hancet Globe (Mother Company)
                    │   (Full Access) │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ COMPANY ADMIN │   │ COMPANY ADMIN │   │ COMPANY ADMIN │
│ (Interior+)   │   │ (Construct+)  │   │ (Education+)  │
└───────┬───────┘   └───────┬───────┘   └───────────────┘
        │                   │
        ├───────────────────┤
        │                   │
   ┌────┴────┐         ┌────┴────┐
   ▼         ▼         ▼         ▼
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│Sales │ │Project│ │Sales │ │Project│
│Mgr   │ │Mgr    │ │Mgr   │ │Mgr    │
└──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘
   │        │        │        │
   ▼        ▼        ▼        ▼
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│Sales │ │Ops   │ │Sales │ │Ops   │
│Rep   │ │Team  │ │Rep   │ │Team  │
└──────┘ └──────┘ └──────┘ └──────┘
```

### 4.2 Permission Matrix

| Permission          | Super Admin | Company Admin | Sales Mgr | Sales Rep | Project Mgr | Ops Team | Viewer |
|---------------------|:-----------:|:-------------:|:---------:|:---------:|:-----------:|:--------:|:------:|
| **LEADS**           |             |               |           |           |             |          |        |
| Create              | ✓           | ✓             | ✓         | ✓         | ✗           | ✗        | ✗      |
| View All Companies  | ✓           | ✗             | ✗         | ✗         | ✗           | ✗        | ✗      |
| View Company        | ✓           | ✓             | ✓         | ✗         | ✗           | ✗        | ✓      |
| View Own/Team       | ✓           | ✓             | ✓         | ✓         | ✗           | ✗        | ✓      |
| Update              | ✓           | ✓             | ✓         | Own       | ✗           | ✗        | ✗      |
| Delete              | ✓           | ✓             | ✗         | ✗         | ✗           | ✗        | ✗      |
| Assign              | ✓           | ✓             | ✓         | ✗         | ✗           | ✗        | ✗      |
| Convert             | ✓           | ✓             | ✓         | ✓         | ✗           | ✗        | ✗      |
| **CUSTOMERS**       |             |               |           |           |             |          |        |
| Create              | ✓           | ✓             | ✓         | ✓         | ✗           | ✗        | ✗      |
| View All Companies  | ✓           | ✗             | ✗         | ✗         | ✗           | ✗        | ✗      |
| View Company        | ✓           | ✓             | ✓         | Team      | ✓           | ✓        | ✓      |
| Update              | ✓           | ✓             | ✓         | Own       | ✗           | ✗        | ✗      |
| Delete              | ✓           | ✓             | ✗         | ✗         | ✗           | ✗        | ✗      |
| **PROJECTS**        |             |               |           |           |             |          |        |
| Create              | ✓           | ✓             | ✓         | ✗         | ✓           | ✗        | ✗      |
| View All Companies  | ✓           | ✗             | ✗         | ✗         | ✗           | ✗        | ✗      |
| View Company        | ✓           | ✓             | ✓         | ✗         | ✓           | ✓        | ✓      |
| Update              | ✓           | ✓             | ✗         | ✗         | Own/Assigned| ✗        | ✗      |
| Delete              | ✓           | ✓             | ✗         | ✗         | ✗           | ✗        | ✗      |
| Change Stage        | ✓           | ✓             | ✗         | ✗         | ✓           | ✓        | ✗      |
| Update Financials   | ✓           | ✓             | ✗         | ✗         | ✓           | ✗        | ✗      |
| **USERS**           |             |               |           |           |             |          |        |
| Create              | ✓           | Company       | ✗         | ✗         | ✗           | ✗        | ✗      |
| View                | ✓           | Company       | Team      | ✗         | Team        | ✗        | ✗      |
| Update              | ✓           | Company       | ✗         | Self      | ✗           | Self     | Self   |
| Delete              | ✓           | Company       | ✗         | ✗         | ✗           | ✗        | ✗      |
| **REPORTS**         |             |               |           |           |             |          |        |
| All Companies       | ✓           | ✗             | ✗         | ✗         | ✗           | ✗        | ✗      |
| Company Reports     | ✓           | ✓             | ✓         | ✗         | ✓           | ✗        | ✓      |
| Export              | ✓           | ✓             | ✓         | ✗         | ✓           | ✗        | ✗      |
| **SETTINGS**        |             |               |           |           |             |          |        |
| System Settings     | ✓           | ✗             | ✗         | ✗         | ✗           | ✗        | ✗      |
| Company Settings    | ✓           | ✓             | ✗         | ✗         | ✗           | ✗        | ✗      |

---

## 5. DASHBOARD STRUCTURE

### 5.1 Mother Company Dashboard (Super Admin)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        HANCET GLOBE - MASTER DASHBOARD                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │Total Leads  │ │Total        │ │Active       │ │Total        │           │
│  │   1,245     │ │Customers    │ │Projects     │ │Revenue      │           │
│  │ ↑12% MTD    │ │   523       │ │   89        │ │ ₹4.5 Cr     │           │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────┐     │
│  │                    COMPANY-WISE BREAKDOWN                          │     │
│  ├───────────────┬──────────┬───────────┬──────────┬─────────────────┤     │
│  │ Company       │ Leads    │ Customers │ Projects │ Revenue (MTD)   │     │
│  ├───────────────┼──────────┼───────────┼──────────┼─────────────────┤     │
│  │ Interior Plus │ 456      │ 234       │ 45       │ ₹1.8 Cr         │     │
│  │ Construct Plus│ 312      │ 145       │ 28       │ ₹1.5 Cr         │     │
│  │ Education Plus│ 234      │ 89        │ 12       │ ₹0.6 Cr         │     │
│  │ Renovation +  │ 178      │ 45        │ 4        │ ₹0.4 Cr         │     │
│  │ ODS Plus      │ 65       │ 10        │ 0        │ ₹0.2 Cr         │     │
│  └───────────────┴──────────┴───────────┴──────────┴─────────────────┘     │
│                                                                              │
│  ┌────────────────────────┐  ┌────────────────────────────────────────┐    │
│  │   LEAD FUNNEL (All)    │  │     REVENUE TREND (6 Months)           │    │
│  │   ┌─────────────┐      │  │     ₹ Cr                               │    │
│  │   │   NEW: 245  │      │  │     5 ┤    ╭─╮                         │    │
│  │   └──────┬──────┘      │  │     4 ┤  ╭─╯ ╰─╮                       │    │
│  │     ┌────┴────┐        │  │     3 ┤╭─╯     ╰─╮                     │    │
│  │     │QUAL: 156│        │  │     2 ┤╯         ╰─╮                   │    │
│  │     └────┬────┘        │  │     1 ┤            ╰                   │    │
│  │       ┌──┴──┐          │  │       └───────────────────────         │    │
│  │       │P: 89│          │  │        J  F  M  A  M  J                │    │
│  │       └──┬──┘          │  └────────────────────────────────────────┘    │
│  │        ┌─┴─┐           │                                                │
│  │        │W:45│          │                                                │
│  │        └───┘           │                                                │
│  └────────────────────────┘                                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Company Dashboard (Company Admin / Team)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      INTERIOR PLUS - COMPANY DASHBOARD                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ New Leads   │ │ Conversion  │ │ Active      │ │ This Month  │           │
│  │ Today: 12   │ │ Rate: 32%   │ │ Projects: 45│ │ ₹78L        │           │
│  │ MTD: 156    │ │ ↑5% vs LM   │ │ Pipeline:₹2Cr│ │ Target: ₹1Cr│           │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                                              │
│  ┌──────────────────────────────┐  ┌──────────────────────────────────┐    │
│  │      LEAD PIPELINE           │  │      PROJECT PROGRESS            │    │
│  ├──────────────────────────────┤  ├──────────────────────────────────┤    │
│  │ New        ████████████ 45   │  │ Initiation  ████          8      │    │
│  │ Contacted  ████████     32   │  │ Design      ████████     15      │    │
│  │ Qualified  ██████       24   │  │ Execution   ██████████   18      │    │
│  │ Proposal   ████         15   │  │ Handover    ██            4      │    │
│  │ Negotiation██            8   │  │ Completed   ████████████ 22      │    │
│  └──────────────────────────────┘  └──────────────────────────────────┘    │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                     TODAY'S FOLLOW-UPS (8)                            │  │
│  ├───────────────┬─────────────────┬──────────┬─────────────────────────┤  │
│  │ Lead/Customer │ Type            │ Time     │ Assigned To             │  │
│  ├───────────────┼─────────────────┼──────────┼─────────────────────────┤  │
│  │ Rahul Sharma  │ Site Visit      │ 10:00 AM │ Priya Singh             │  │
│  │ ABC Corp      │ Proposal Review │ 11:30 AM │ Amit Kumar              │  │
│  │ Neha Gupta    │ Follow-up Call  │ 02:00 PM │ Rahul Verma             │  │
│  └───────────────┴─────────────────┴──────────┴─────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. API / SERVICE ARCHITECTURE

### 6.1 API Structure

```
/api/v1
│
├── /auth
│   ├── POST   /login
│   ├── POST   /logout
│   ├── POST   /refresh-token
│   ├── GET    /me
│   └── PUT    /update-password
│
├── /companies
│   ├── GET    /                      # List all (super_admin only)
│   ├── GET    /:id                   # Get company details
│   ├── POST   /                      # Create company (super_admin)
│   ├── PUT    /:id                   # Update company
│   └── GET    /:id/stats             # Company statistics
│
├── /leads
│   ├── GET    /                      # List leads (company-scoped)
│   ├── GET    /:id                   # Get lead details
│   ├── POST   /                      # Create lead
│   ├── PUT    /:id                   # Update lead
│   ├── DELETE /:id                   # Delete lead
│   ├── PUT    /:id/status            # Update status
│   ├── PUT    /:id/assign            # Assign lead
│   ├── POST   /:id/notes             # Add note
│   ├── POST   /:id/activities        # Log activity
│   ├── GET    /:id/journey           # Get timeline
│   ├── POST   /:id/convert           # Convert to customer
│   └── POST   /bulk                  # Bulk import
│
├── /customers
│   ├── GET    /                      # List customers (company-scoped)
│   ├── GET    /:id                   # Get customer details
│   ├── POST   /                      # Create customer
│   ├── PUT    /:id                   # Update customer
│   ├── DELETE /:id                   # Delete customer
│   ├── GET    /:id/projects          # Customer's projects
│   ├── GET    /:id/history           # Full history
│   └── POST   /:id/notes             # Add note
│
├── /projects
│   ├── GET    /                      # List projects (company-scoped)
│   ├── GET    /:id                   # Get project details
│   ├── POST   /                      # Create project
│   ├── PUT    /:id                   # Update project
│   ├── DELETE /:id                   # Delete project
│   ├── PUT    /:id/stage             # Update stage
│   ├── PUT    /:id/progress          # Update progress
│   ├── POST   /:id/payments          # Add payment
│   ├── POST   /:id/documents         # Upload document
│   ├── POST   /:id/issues            # Report issue
│   ├── GET    /:id/timeline          # Activity timeline
│   └── POST   /:id/notes             # Add note
│
├── /users
│   ├── GET    /                      # List users (scoped)
│   ├── GET    /:id                   # Get user details
│   ├── POST   /                      # Create user
│   ├── PUT    /:id                   # Update user
│   ├── DELETE /:id                   # Delete/deactivate user
│   ├── PUT    /:id/role              # Change role
│   └── GET    /:id/activity          # User activity log
│
├── /dashboard
│   ├── GET    /stats                 # Overall stats
│   ├── GET    /company/:id/stats     # Company stats
│   ├── GET    /leads/funnel          # Lead funnel
│   ├── GET    /projects/pipeline     # Project pipeline
│   ├── GET    /revenue               # Revenue analytics
│   └── GET    /activity              # Recent activity
│
├── /reports
│   ├── GET    /leads                 # Lead reports
│   ├── GET    /customers             # Customer reports
│   ├── GET    /projects              # Project reports
│   ├── GET    /revenue               # Revenue reports
│   ├── GET    /team-performance      # Team reports
│   └── POST   /export                # Export report
│
└── /settings
    ├── GET    /company               # Company settings
    ├── PUT    /company               # Update settings
    ├── GET    /pipelines             # Status pipelines
    └── PUT    /pipelines             # Update pipelines
```

### 6.2 Middleware Stack

```javascript
// Request Flow
Request
  │
  ├── Rate Limiter
  │
  ├── CORS
  │
  ├── Body Parser
  │
  ├── Authentication (JWT Verify)
  │     └── Extract user from token
  │
  ├── Company Context
  │     └── Set company from user or header
  │
  ├── Authorization (RBAC)
  │     ├── Check role permissions
  │     └── Check data access scope
  │
  ├── Request Validation
  │     └── Validate body/params/query
  │
  ├── Controller / Handler
  │
  ├── Response Formatter
  │
  └── Error Handler
```

---

## 7. ID NAMING CONVENTIONS

### 7.1 ID Patterns

| Entity    | Pattern                  | Example           |
|-----------|--------------------------|-------------------|
| Company   | `{CODE}`                 | `HG`, `IP`, `CP`  |
| User      | `{CO}-U-{SEQ}`           | `IP-U-001`        |
| Lead      | `{CO}-L-{YYYY}-{SEQ}`    | `IP-L-2024-00045` |
| Customer  | `{CO}-C-{YYYY}-{SEQ}`    | `IP-C-2024-00123` |
| Project   | `{CO}-P-{YYYY}-{SEQ}`    | `IP-P-2024-00089` |

### 7.2 Status Enums

```javascript
// Lead Statuses (Customizable per company)
LEAD_STATUS = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  PROPOSAL_SENT: 'proposal_sent',
  NEGOTIATION: 'negotiation',
  WON: 'won',
  LOST: 'lost',
  ON_HOLD: 'on_hold'
}

// Project Stages
PROJECT_STAGE = {
  INITIATION: 'initiation',
  DESIGN: 'design',
  APPROVAL: 'approval',
  PROCUREMENT: 'procurement',
  EXECUTION: 'execution',
  QC_SNAG: 'qc_snag',
  HANDOVER: 'handover',
  CLOSURE: 'closure'
}

// Project Status
PROJECT_STATUS = {
  ACTIVE: 'active',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}

// Customer Segment
CUSTOMER_SEGMENT = {
  PLATINUM: 'platinum',  // >50L lifetime value
  GOLD: 'gold',          // 25-50L
  SILVER: 'silver',      // 10-25L
  BRONZE: 'bronze',      // <10L
  NEW: 'new'             // First project
}
```

---

## 8. SECURITY CONSIDERATIONS

### 8.1 Data Isolation

```javascript
// Every query MUST include company filter
// Middleware enforces this automatically

// Example: Fetching leads
const getLeads = async (req, res) => {
  const query = {
    company: req.company._id,  // Automatically injected
    ...buildFilters(req.query)
  };

  // Super admin can override with ?company=all
  if (req.user.role === 'super_admin' && req.query.company === 'all') {
    delete query.company;
  }

  const leads = await Lead.find(query);
  return res.json(leads);
};
```

### 8.2 Authentication Strategy

```javascript
// JWT Token Structure
{
  userId: ObjectId,
  email: String,
  role: String,
  company: ObjectId,
  accessibleCompanies: [ObjectId],
  permissions: Object,
  iat: Number,
  exp: Number
}

// Token Expiry
ACCESS_TOKEN_EXPIRY = '15m'
REFRESH_TOKEN_EXPIRY = '7d'

// Security Headers
helmet()
cors({ origin: whitelist })
rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })
```

### 8.3 Audit Trail

```javascript
// All CRUD operations are logged
{
  action: 'UPDATE',
  entity: 'lead',
  entityId: ObjectId,
  company: ObjectId,
  performedBy: ObjectId,
  changes: [
    { field: 'status', oldValue: 'new', newValue: 'contacted' }
  ],
  ipAddress: String,
  userAgent: String,
  timestamp: Date
}
```

---

## 9. SCALABILITY CONSIDERATIONS

### 9.1 Database Indexing

```javascript
// Leads Collection Indexes
leads.createIndex({ company: 1, status: 1 })
leads.createIndex({ company: 1, assignedTo: 1 })
leads.createIndex({ company: 1, createdAt: -1 })
leads.createIndex({ company: 1, 'nextFollowUp.date': 1 })

// Customers Collection Indexes
customers.createIndex({ company: 1, status: 1 })
customers.createIndex({ company: 1, accountManager: 1 })
customers.createIndex({ company: 1, segment: 1 })

// Projects Collection Indexes
projects.createIndex({ company: 1, stage: 1 })
projects.createIndex({ company: 1, customer: 1 })
projects.createIndex({ company: 1, projectManager: 1 })
projects.createIndex({ company: 1, status: 1, 'timeline.estimatedEnd': 1 })
```

### 9.2 Caching Strategy

```javascript
// Redis Caching
CACHE_KEYS = {
  COMPANY_SETTINGS: 'company:{id}:settings',     // TTL: 1 hour
  USER_PERMISSIONS: 'user:{id}:permissions',     // TTL: 5 min
  DASHBOARD_STATS: 'company:{id}:dashboard',     // TTL: 5 min
  LEAD_COUNTS: 'company:{id}:leads:counts',      // TTL: 1 min
}
```

### 9.3 Pagination

```javascript
// Standard pagination response
{
  data: [...],
  pagination: {
    page: 1,
    limit: 20,
    total: 245,
    totalPages: 13,
    hasNext: true,
    hasPrev: false
  }
}
```

---

## 10. FUTURE ENHANCEMENTS

1. **Multi-tenant Whitelabeling** - Custom branding per company
2. **Mobile App** - React Native app for field teams
3. **AI Lead Scoring** - ML-based lead prioritization
4. **Document Generation** - Auto-generate quotations, contracts
5. **Email/SMS Integration** - Automated communication
6. **Calendar Integration** - Google/Outlook sync
7. **Payment Gateway** - Online payment collection
8. **Inventory Management** - For construction materials
9. **Vendor Portal** - Self-service for vendors
10. **Customer Portal** - Project tracking for customers

---

*Architecture Version: 1.0*
*Last Updated: December 2024*
*Author: CRM Architecture Team*
