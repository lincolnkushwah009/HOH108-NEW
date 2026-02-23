# CRM Workflow System Design Document

## Executive Summary
This document outlines a complete CRM workflow system with database schema enhancements, APIs, and state transitions for the HOH CRM platform.

---

## 1. Entity Relationship Diagram (Text-Based)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    COMPANY                                               │
│  (Mother/Subsidiary Structure - Multi-tenant)                                           │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                │
                │ has many
                ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                  DEPARTMENTS                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐               │
│  │  PRE-SALES  │    │    CRM      │    │   SALES     │    │   DESIGN    │               │
│  │             │    │             │    │             │    │             │               │
│  │ - Calling   │    │ - Lead Mgmt │    │ - Closure   │    │ - Iterations│               │
│  │ - Meetings  │    │ - Tracking  │    │ - Orders    │    │ - Approval  │               │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘               │
│                                                                                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                                  │
│  │ OPERATIONS  │    │   FINANCE   │    │   APPROVERS │                                  │
│  │             │    │             │    │             │                                  │
│  │ - Execution │    │ - Payments  │    │ - CVO       │                                  │
│  │ - Handover  │    │ - BOQ/BOM   │    │ - CEO       │                                  │
│  └─────────────┘    └─────────────┘    │ - Design HD │                                  │
│                                        └─────────────┘                                  │
└──────────────────────────────────────────────────────────────────────────────────────────┘
                │
                │ employs
                ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                      USERS                                                │
│  (Employees with Department Mapping & Role-Based Access)                                 │
└──────────────────────────────────────────────────────────────────────────────────────────┘
                │
                │ assigned to / manages
                ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                       LEAD                                                │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │  Lead ID ──────────────────────────────────────────────────────────────────────│    │
│  │     │                                                                          │    │
│  │     ├── Pre-Sales Assignment (Employee ID)                                     │    │
│  │     ├── CRM Assignment (Employee ID)                                           │    │
│  │     └── Sales Assignment (Employee ID)                                         │    │
│  │                                                                                │    │
│  │  Primary Status: [NEW] → [QUALIFIED] / [LOST] / [RNR] / [FUTURE_PROSPECT]     │    │
│  │  Secondary Status: [HOT] / [WARM] / [COLD] / [FUTURE] (after qualification)   │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────────────────┘
                │
                │ converts to (on qualification & closure)
                ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                              SALES ORDER                                                  │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │  Sales Order ID                                                                 │    │
│  │     │                                                                          │    │
│  │     ├── Linked Lead ID                                                         │    │
│  │     ├── Tentative BOQ/BOM                                                      │    │
│  │     ├── Tentative Cost Estimation                                              │    │
│  │     └── Generates → PROJECT ID                                                 │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────────────────┘
                │
                │ creates
                ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                PROJECT                                                    │
│  (Persistent ID across all departments)                                                  │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │  Project ID (Persistent) ──────────────────────────────────────────────────────│    │
│  │     │                                                                          │    │
│  │     ├── Customer ID (Generated/Linked)                                         │    │
│  │     ├── Design Team Assignment                                                 │    │
│  │     ├── Operations Assignment                                                  │    │
│  │     └── Project Manager Assignment                                             │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────────────────┘
                │
                │ requires (before operations handover)
                ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                              MASTER AGREEMENT                                             │
│                                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐    │
│  │  Agreement ID                                                                   │    │
│  │     │                                                                          │    │
│  │     ├── Material Quotation Approval                                            │    │
│  │     ├── Material Spend Sign-Off                                                │    │
│  │     ├── Payment Schedule Sign-Off                                              │    │
│  │     └── Schedule of Work Sign-Off                                              │    │
│  │                                                                                │    │
│  │  Approvers: CBO, CEO, Design Head                                              │    │
│  └─────────────────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Status Flow Diagrams

### 2.1 Lead Lifecycle Flow

```
                                    ┌─────────────────┐
                                    │   LEAD CREATED  │
                                    │   (New Status)  │
                                    └────────┬────────┘
                                             │
                                             │ Auto-assign to 3 departments
                                             ▼
                    ┌────────────────────────────────────────────────┐
                    │           DEPARTMENT MAPPING                    │
                    │                                                │
                    │  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
                    │  │Pre-Sales │  │   CRM    │  │  Sales   │     │
                    │  │ Emp ID   │  │ Emp ID   │  │ Emp ID   │     │
                    │  └──────────┘  └──────────┘  └──────────┘     │
                    └────────────────────────┬───────────────────────┘
                                             │
                                             ▼
                              ┌──────────────────────────┐
                              │    PRE-SALES WORKFLOW    │
                              │                          │
                              │  • Call Attempts         │
                              │  • Call Recordings       │
                              │  • Meeting Scheduling    │
                              └────────────┬─────────────┘
                                           │
              ┌────────────────────────────┼────────────────────────────┐
              │                            │                            │
              ▼                            ▼                            ▼
    ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
    │  Meeting Done   │         │   No Response   │         │Requirement Miss │
    │   ✓ Qualified   │         │      RNR        │         │ Future Prospect │
    └────────┬────────┘         └─────────────────┘         └─────────────────┘
             │                                                       │
             │                  ┌─────────────────┐                  │
             │                  │    Rejected     │                  │
             │                  │      LOST       │                  │
             │                  └─────────────────┘                  │
             │                                                       │
             ▼                                                       │
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │                         SALES QUALIFICATION STAGE                            │
    │                                                                             │
    │   Secondary Status Assignment:                                              │
    │   ┌───────┐  ┌───────┐  ┌───────┐  ┌────────┐                              │
    │   │  HOT  │  │ WARM  │  │ COLD  │  │ FUTURE │ ◄─────────────────────────────┤
    │   └───────┘  └───────┘  └───────┘  └────────┘                              │
    │                                                                             │
    │   • Lead assigned EXCLUSIVELY to Sales                                      │
    │   • Pre-Sales edits LOCKED                                                  │
    │   • Sales Employee takes ownership                                          │
    └────────────────────────────────┬────────────────────────────────────────────┘
                                     │
                                     │ Sales Closure
                                     ▼
                         ┌─────────────────────────┐
                         │     SALES ORDER         │
                         │                         │
                         │  • Tentative BOQ/BOM    │
                         │  • Cost Estimation      │
                         │  • Generate Project ID  │
                         └───────────┬─────────────┘
                                     │
                                     ▼
                              ┌─────────────┐
                              │   PROJECT   │
                              │  (Created)  │
                              └─────────────┘
```

### 2.2 Project Lifecycle Flow

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                              PROJECT LIFECYCLE                                        │
└──────────────────────────────────────────────────────────────────────────────────────┘

     SALES ORDER                    DESIGN                      APPROVAL
         │                            │                            │
         ▼                            ▼                            ▼
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   INITIATION    │────────▶│     DESIGN      │────────▶│   APPROVALS     │
│                 │         │                 │         │                 │
│ • Project ID    │         │ • Iterations    │         │ • 4 Sign-offs   │
│ • Customer ID   │         │ • Tracking      │         │ • Email Notify  │
│ • Team Assign   │         │ • Approval Logs │         │ • Dashboard     │
└─────────────────┘         └─────────────────┘         └────────┬────────┘
                                                                 │
                                                                 │ All Approvals Complete
                                                                 ▼
                                                        ┌─────────────────┐
                                                        │    HANDOVER     │
                                                        │   (CBO → Ops)   │
                                                        │                 │
                                                        │ • Same Project  │
                                                        │   ID continues  │
                                                        └────────┬────────┘
                                                                 │
                                                                 ▼
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│    EXECUTION    │◀────────│   PROCUREMENT   │◀────────│   OPERATIONS    │
│                 │         │                 │         │                 │
│ • PM Assigned   │         │ • Material Order│         │ • PM Takes Over │
│ • Site Work     │         │ • Vendor Mgmt   │         │ • Team Assigned │
└────────┬────────┘         └─────────────────┘         └─────────────────┘
         │
         ▼
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│    QC & SNAG    │────────▶│    HANDOVER     │────────▶│    CLOSURE      │
│                 │         │                 │         │                 │
│ • Quality Check │         │ • Customer Sign │         │ • Project Done  │
│ • Snag List     │         │ • Documentation │         │ • Warranty      │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

### 2.3 Approval Workflow Flow

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                           MASTER AGREEMENT APPROVAL FLOW                              │
└──────────────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────────┐
                    │     MASTER AGREEMENT CREATED        │
                    │                                     │
                    │  Triggers 4 Parallel Approvals:     │
                    └───────────────────┬─────────────────┘
                                        │
        ┌───────────────┬───────────────┼───────────────┬───────────────┐
        ▼               ▼               ▼               ▼               │
┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ │
│  Material     │ │  Material     │ │  Payment      │ │  Schedule of  │ │
│  Quotation    │ │  Spend        │ │  Schedule     │ │  Work         │ │
│  Approval     │ │  Sign-Off     │ │  Schedule     │ │  Sign-Off     │ │
└───────┬───────┘ └───────┬───────┘ └───────┬───────┘ └───────┬───────┘ │
        │                 │                 │                 │         │
        └─────────────────┴─────────────────┴─────────────────┘         │
                                    │                                   │
                                    ▼                                   │
                    ┌─────────────────────────────────────┐             │
                    │      SEND TO APPROVERS              │             │
                    │                                     │             │
                    │  ┌─────┐  ┌─────┐  ┌────────────┐  │             │
                    │  │ CBO │  │ CEO │  │ Design Head│  │             │
                    │  └──┬──┘  └──┬──┘  └─────┬──────┘  │             │
                    └─────┼───────┼───────────┼─────────┘             │
                          │       │           │                        │
                          ▼       ▼           ▼                        │
                    ┌─────────────────────────────────────┐             │
                    │      AUTO EMAIL NOTIFICATIONS       │             │
                    │                                     │             │
                    │  • Approval Link (Email)            │             │
                    │  • Dashboard Notification           │             │
                    │  • Unique Token per Approver        │             │
                    └───────────────────┬─────────────────┘             │
                                        │                               │
                                        ▼                               │
                    ┌─────────────────────────────────────┐             │
                    │      APPROVER ACTIONS               │             │
                    │                                     │             │
                    │  Via Email:                         │             │
                    │  • Click Approve/Reject Link        │             │
                    │  • Add Remarks                      │             │
                    │                                     │             │
                    │  Via Dashboard:                     │             │
                    │  • Review Documents                 │             │
                    │  • Approve/Reject/Request Changes   │             │
                    │  • Add Comments                     │             │
                    └───────────────────┬─────────────────┘             │
                                        │                               │
                                        ▼                               │
                    ┌─────────────────────────────────────┐             │
                    │      TRACK APPROVAL STATUS          │             │
                    │                                     │             │
                    │  • Timestamp                        │             │
                    │  • Approver ID                      │             │
                    │  • Remarks/Comments                 │             │
                    │  • Status (Pending/Approved/        │             │
                    │           Rejected/Changes Req)     │             │
                    └───────────────────┬─────────────────┘             │
                                        │                               │
                    ┌───────────────────┴───────────────────┐           │
                    │                                       │           │
                    ▼                                       ▼           │
          ┌─────────────────┐                    ┌─────────────────┐    │
          │  ALL APPROVED   │                    │ ANY REJECTED    │    │
          │                 │                    │                 │    │
          │ → Proceed to    │                    │ → Return to     │    │
          │   Operations    │                    │   Design/Sales  │    │
          │   Handover      │                    │   for Revision  │    │
          └─────────────────┘                    └─────────────────┘    │
```

---

## 3. Enhanced Database Schema

### 3.1 New Models Required

#### 3.1.1 CallActivity Model (New)

```javascript
// backend/models/CallActivity.js
const callActivitySchema = new mongoose.Schema({
  activityId: { type: String, unique: true }, // AUTO: IP-CA-2024-00001

  company: { type: ObjectId, ref: 'Company', required: true },
  lead: { type: ObjectId, ref: 'Lead', required: true },

  // Call Details
  callType: {
    type: String,
    enum: ['outbound', 'inbound', 'follow_up', 'scheduled'],
    default: 'outbound'
  },

  attemptNumber: { type: Number, default: 1 }, // Call frequency count

  calledBy: { type: ObjectId, ref: 'User', required: true },
  calledByName: String,
  calledByDepartment: {
    type: String,
    enum: ['pre_sales', 'crm', 'sales'],
    required: true
  },

  // Call Timing
  scheduledAt: Date,
  startedAt: Date,
  endedAt: Date,
  duration: Number, // in seconds

  // Call Outcome
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'no_answer', 'busy', 'voicemail', 'wrong_number', 'cancelled'],
    default: 'scheduled'
  },

  outcome: {
    type: String,
    enum: [
      'interested', 'not_interested', 'callback_requested',
      'meeting_scheduled', 'information_shared', 'wrong_number',
      'rnr', 'future_prospect', 'qualified', 'lost'
    ]
  },

  // Recording
  recording: {
    url: String,
    duration: Number,
    uploadedAt: Date,
    transcription: String // Optional: AI transcription
  },

  // Notes
  notes: String,
  nextAction: {
    type: { type: String, enum: ['call', 'meeting', 'email', 'site_visit'] },
    scheduledAt: Date,
    notes: String
  },

  // Meeting Details (if scheduled)
  meetingScheduled: {
    isScheduled: { type: Boolean, default: false },
    scheduledDate: Date,
    location: String,
    attendees: [{ type: ObjectId, ref: 'User' }],
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show'],
      default: 'scheduled'
    },
    outcome: String,
    notes: String
  }
}, { timestamps: true });
```

#### 3.1.2 SalesOrder Model (New)

```javascript
// backend/models/SalesOrder.js
const salesOrderSchema = new mongoose.Schema({
  salesOrderId: { type: String, unique: true }, // AUTO: IP-SO-2024-00001

  company: { type: ObjectId, ref: 'Company', required: true },
  lead: { type: ObjectId, ref: 'Lead', required: true },
  customer: { type: ObjectId, ref: 'Customer' }, // Created on order
  project: { type: ObjectId, ref: 'Project' }, // Created after order

  // Sales Info
  salesPerson: { type: ObjectId, ref: 'User', required: true },
  salesPersonName: String,
  closedDate: { type: Date, default: Date.now },

  // Order Details
  title: { type: String, required: true },
  description: String,
  category: {
    type: String,
    enum: ['interior', 'construction', 'renovation', 'education', 'ods', 'other']
  },

  // Tentative BOQ/BOM
  boq: [{
    itemCode: String,
    description: String,
    category: String,
    unit: String,
    quantity: Number,
    unitRate: Number,
    amount: Number,
    remarks: String,
    isTentative: { type: Boolean, default: true }
  }],

  bom: [{
    materialCode: String,
    description: String,
    category: String,
    unit: String,
    quantity: Number,
    estimatedRate: Number,
    estimatedAmount: Number,
    vendor: String,
    remarks: String,
    isTentative: { type: Boolean, default: true }
  }],

  // Cost Estimation
  costEstimation: {
    materialCost: { type: Number, default: 0 },
    laborCost: { type: Number, default: 0 },
    overheadCost: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    taxes: { type: Number, default: 0 },
    totalEstimate: { type: Number, default: 0 },
    quotedAmount: { type: Number, default: 0 },
    discountPercentage: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    finalAmount: { type: Number, default: 0 },
    isTentative: { type: Boolean, default: true }
  },

  // Status
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'project_created', 'cancelled'],
    default: 'draft'
  },

  // Audit
  activities: [activitySchema],
  createdBy: { type: ObjectId, ref: 'User' }
}, { timestamps: true });
```

#### 3.1.3 MasterAgreement Model (New)

```javascript
// backend/models/MasterAgreement.js
const approvalItemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['material_quotation', 'material_spend', 'payment_schedule', 'schedule_of_work'],
    required: true
  },

  title: String,
  description: String,

  // Document Reference
  document: {
    url: String,
    name: String,
    uploadedAt: Date,
    uploadedBy: { type: ObjectId, ref: 'User' }
  },

  // Approval Status per Approver
  approvals: [{
    approver: { type: ObjectId, ref: 'User', required: true },
    approverName: String,
    approverRole: String, // CVO, CEO, Design Head

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'changes_requested'],
      default: 'pending'
    },

    remarks: String,

    // Approval via Email
    emailToken: String,
    emailSentAt: Date,

    // Action timestamps
    viewedAt: Date,
    actionTakenAt: Date,

    // IP/Device Info
    approvedVia: {
      type: String,
      enum: ['email', 'dashboard', 'mobile'],
      default: 'dashboard'
    },
    ipAddress: String,
    userAgent: String
  }],

  // Overall Status
  overallStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'changes_requested'],
    default: 'pending'
  },

  approvedAt: Date,
  rejectedAt: Date
});

const masterAgreementSchema = new mongoose.Schema({
  agreementId: { type: String, unique: true }, // AUTO: IP-MA-2024-00001

  company: { type: ObjectId, ref: 'Company', required: true },
  project: { type: ObjectId, ref: 'Project', required: true },
  customer: { type: ObjectId, ref: 'Customer', required: true },

  // Agreement Details
  title: String,
  version: { type: Number, default: 1 },

  // 4 Approval Items
  approvalItems: [approvalItemSchema],

  // Approver Configuration
  approvers: [{
    user: { type: ObjectId, ref: 'User', required: true },
    role: {
      type: String,
      enum: ['cbo', 'ceo', 'design_head', 'operations_head'],
      required: true
    },
    order: Number, // For sequential approvals if needed
    isMandatory: { type: Boolean, default: true }
  }],

  // Overall Status
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'partially_approved', 'approved', 'rejected', 'changes_requested'],
    default: 'draft'
  },

  // Operations Handover
  handover: {
    isCompleted: { type: Boolean, default: false },
    handedOverBy: { type: ObjectId, ref: 'User' }, // CBO
    handedOverTo: { type: ObjectId, ref: 'User' }, // Operations/PM
    handoverDate: Date,
    handoverNotes: String,
    projectManager: { type: ObjectId, ref: 'User' }
  },

  // Notifications Log
  notifications: [{
    type: { type: String, enum: ['email', 'push', 'sms'] },
    recipient: { type: ObjectId, ref: 'User' },
    sentAt: Date,
    status: { type: String, enum: ['sent', 'delivered', 'failed', 'opened'] },
    messageId: String
  }],

  // Audit Trail
  activities: [activitySchema],
  createdBy: { type: ObjectId, ref: 'User' }
}, { timestamps: true });
```

#### 3.1.4 DesignIteration Model (New)

```javascript
// backend/models/DesignIteration.js
const designIterationSchema = new mongoose.Schema({
  iterationId: { type: String, unique: true }, // AUTO: IP-DI-2024-00001

  company: { type: ObjectId, ref: 'Company', required: true },
  project: { type: ObjectId, ref: 'Project', required: true },
  customer: { type: ObjectId, ref: 'Customer', required: true },

  // Iteration Info
  version: { type: Number, default: 1 },
  title: String,
  description: String,

  // Designer
  designer: { type: ObjectId, ref: 'User', required: true },
  designerName: String,

  // Design Files
  files: [{
    type: {
      type: String,
      enum: ['2d_plan', '3d_render', 'elevation', 'section', 'detail', 'material_board', 'other']
    },
    name: String,
    url: String,
    thumbnail: String,
    format: String, // pdf, dwg, skp, max, jpg
    uploadedAt: Date,
    uploadedBy: { type: ObjectId, ref: 'User' }
  }],

  // Client Feedback
  feedback: [{
    feedbackBy: { type: ObjectId, ref: 'User' },
    feedbackByName: String,
    isClient: { type: Boolean, default: false },
    comments: String,
    markedAreas: [{ x: Number, y: Number, comment: String }], // For image annotations
    givenAt: Date
  }],

  // Status
  status: {
    type: String,
    enum: ['in_progress', 'submitted', 'under_review', 'changes_requested', 'approved', 'rejected'],
    default: 'in_progress'
  },

  // Approval
  approvedBy: { type: ObjectId, ref: 'User' },
  approvedByName: String,
  approvedAt: Date,
  approvalRemarks: String,

  // Timeline
  startedAt: Date,
  submittedAt: Date,
  reviewedAt: Date,
  completedAt: Date,

  // Activities
  activities: [activitySchema]
}, { timestamps: true });
```

### 3.2 Lead Model Enhancements

```javascript
// Add to existing Lead model
{
  // Department Mapping (NEW)
  departmentAssignments: {
    preSales: {
      employee: { type: ObjectId, ref: 'User' },
      employeeName: String,
      assignedAt: Date,
      assignedBy: { type: ObjectId, ref: 'User' },
      isActive: { type: Boolean, default: true }
    },
    crm: {
      employee: { type: ObjectId, ref: 'User' },
      employeeName: String,
      assignedAt: Date,
      assignedBy: { type: ObjectId, ref: 'User' },
      isActive: { type: Boolean, default: true }
    },
    sales: {
      employee: { type: ObjectId, ref: 'User' },
      employeeName: String,
      assignedAt: Date,
      assignedBy: { type: ObjectId, ref: 'User' },
      isActive: { type: Boolean, default: true },
      isExclusive: { type: Boolean, default: false } // True after qualification
    }
  },

  // Primary Status (NEW - per requirements)
  primaryStatus: {
    type: String,
    enum: ['new', 'in_progress', 'qualified', 'lost', 'rnr', 'future_prospect'],
    default: 'new'
  },

  // Secondary Status (after qualification)
  secondaryStatus: {
    type: String,
    enum: ['hot', 'warm', 'cold', 'future'],
    default: null
  },

  // Pre-Sales Lock (after qualification)
  preSalesLocked: { type: Boolean, default: false },
  lockedAt: Date,
  lockedBy: { type: ObjectId, ref: 'User' },

  // Call Activity Summary
  callSummary: {
    totalAttempts: { type: Number, default: 0 },
    successfulCalls: { type: Number, default: 0 },
    lastCallDate: Date,
    lastCallOutcome: String,
    meetingsScheduled: { type: Number, default: 0 },
    meetingsCompleted: { type: Number, default: 0 }
  },

  // RNR Tracking
  rnrTracking: {
    rnrCount: { type: Number, default: 0 },
    lastRnrDate: Date,
    reactivatedFrom: {
      type: String,
      enum: ['rnr', 'future_prospect', 'lost'],
      default: null
    },
    reactivatedAt: Date,
    reactivatedBy: { type: ObjectId, ref: 'User' }
  },

  // Sales Order Reference
  salesOrder: { type: ObjectId, ref: 'SalesOrder' }
}
```

### 3.3 Project Model Enhancements

```javascript
// Add to existing Project model
{
  // Sales Order Reference
  salesOrder: { type: ObjectId, ref: 'SalesOrder' },

  // Master Agreement Reference
  masterAgreement: { type: ObjectId, ref: 'MasterAgreement' },

  // Design Iterations
  designIterations: [{ type: ObjectId, ref: 'DesignIteration' }],
  currentDesignVersion: { type: Number, default: 0 },

  // Department Assignments (Persistent)
  departmentAssignments: {
    design: {
      team: [{
        user: { type: ObjectId, ref: 'User' },
        role: String,
        assignedAt: Date
      }],
      lead: { type: ObjectId, ref: 'User' }
    },
    operations: {
      team: [{
        user: { type: ObjectId, ref: 'User' },
        role: String,
        assignedAt: Date
      }],
      lead: { type: ObjectId, ref: 'User' }
    }
  },

  // Handover Tracking
  handovers: [{
    from: {
      department: String,
      user: { type: ObjectId, ref: 'User' },
      userName: String
    },
    to: {
      department: String,
      user: { type: ObjectId, ref: 'User' },
      userName: String
    },
    handoverDate: Date,
    notes: String,
    documents: [String],
    activities: [activitySchema]
  }],

  // Approval Status
  approvalStatus: {
    materialQuotation: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    materialSpend: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    paymentSchedule: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    scheduleOfWork: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    allApproved: { type: Boolean, default: false },
    approvedAt: Date
  }
}
```

### 3.4 User Model Enhancements

```javascript
// Add to existing User model
{
  // Enhanced Department (for CRM workflow)
  departmentRef: { type: ObjectId, ref: 'Department' },

  subDepartment: {
    type: String,
    enum: ['pre_sales', 'crm', 'sales_closure', 'design', 'operations', 'finance', 'management']
  },

  // Approval Authority (for Master Agreement)
  approvalAuthority: {
    isApprover: { type: Boolean, default: false },
    approverRole: {
      type: String,
      enum: ['cbo', 'ceo', 'design_head', 'operations_head', 'finance_head']
    },
    canApprove: [{
      type: String,
      enum: ['material_quotation', 'material_spend', 'payment_schedule', 'schedule_of_work']
    }],
    approvalLimit: Number // Max amount they can approve
  },

  // Lead Assignment Capacity
  leadCapacity: {
    maxActive: { type: Number, default: 50 },
    currentActive: { type: Number, default: 0 }
  }
}
```

---

## 4. API Endpoints

### 4.1 Lead Workflow APIs

```
# Lead Creation & Mapping
POST   /api/leads                         # Create lead with auto department mapping
GET    /api/leads/:id                     # Get lead with full mapping details
PUT    /api/leads/:id/assign-departments  # Assign/reassign to departments
GET    /api/leads/:id/department-history  # Get department assignment history

# Pre-Sales Activities
POST   /api/leads/:id/calls               # Log a call attempt
GET    /api/leads/:id/calls               # Get all call activities
PUT    /api/leads/:id/calls/:callId       # Update call details
POST   /api/leads/:id/calls/:callId/recording  # Upload call recording

# Meeting Management
POST   /api/leads/:id/meetings            # Schedule a meeting
PUT    /api/leads/:id/meetings/:meetingId # Update meeting (done, cancelled, etc.)
GET    /api/leads/:id/meetings            # Get all meetings

# Status Updates
PUT    /api/leads/:id/qualify             # Mark as Qualified (locks Pre-Sales)
PUT    /api/leads/:id/mark-rnr            # Mark as RNR
PUT    /api/leads/:id/mark-future         # Mark as Future Prospect
PUT    /api/leads/:id/mark-lost           # Mark as Lost
PUT    /api/leads/:id/reactivate          # Reactivate from RNR/Future/Lost

# Sales Qualification
PUT    /api/leads/:id/secondary-status    # Set Hot/Warm/Cold/Future
PUT    /api/leads/:id/assign-sales        # Exclusive assignment to Sales
GET    /api/leads/:id/can-edit            # Check if user can edit (Pre-Sales lock check)
```

### 4.2 Sales Order APIs

```
# Sales Order Management
POST   /api/sales-orders                  # Create sales order from qualified lead
GET    /api/sales-orders                  # List all sales orders
GET    /api/sales-orders/:id              # Get sales order details
PUT    /api/sales-orders/:id              # Update sales order

# BOQ/BOM Management
PUT    /api/sales-orders/:id/boq          # Update BOQ
PUT    /api/sales-orders/:id/bom          # Update BOM
GET    /api/sales-orders/:id/cost-summary # Get cost estimation

# Order Actions
POST   /api/sales-orders/:id/submit       # Submit for approval
POST   /api/sales-orders/:id/approve      # Approve and create project
POST   /api/sales-orders/:id/create-project  # Generate Project from Sales Order
```

### 4.3 Project Workflow APIs

```
# Project Management
POST   /api/projects                      # Create project (from Sales Order)
GET    /api/projects/:id                  # Get project with all references
PUT    /api/projects/:id                  # Update project
GET    /api/projects/:id/timeline         # Get complete project timeline

# Design Team APIs
POST   /api/projects/:id/design/assign    # Assign design team
GET    /api/projects/:id/design/iterations  # Get all design iterations
POST   /api/projects/:id/design/iterations  # Create new iteration
PUT    /api/projects/:id/design/iterations/:iterationId  # Update iteration
POST   /api/projects/:id/design/iterations/:iterationId/approve  # Approve design

# Handover APIs
POST   /api/projects/:id/handover/design-to-approval  # Design complete, start approvals
POST   /api/projects/:id/handover/to-operations       # CBO hands over to Operations
GET    /api/projects/:id/handover/history             # Get handover history
```

### 4.4 Master Agreement & Approval APIs

```
# Master Agreement
POST   /api/master-agreements                    # Create master agreement
GET    /api/master-agreements/:id                # Get agreement details
PUT    /api/master-agreements/:id                # Update agreement

# Approval Items
POST   /api/master-agreements/:id/items          # Add approval item
PUT    /api/master-agreements/:id/items/:itemId  # Update item
POST   /api/master-agreements/:id/items/:itemId/document  # Upload document

# Approval Workflow
POST   /api/master-agreements/:id/submit         # Submit for approval (triggers emails)
POST   /api/master-agreements/:id/send-reminders # Send reminder emails

# Approver Actions (Dashboard)
GET    /api/approvals/pending                    # Get pending approvals for current user
POST   /api/approvals/:agreementId/:itemId/approve   # Approve item
POST   /api/approvals/:agreementId/:itemId/reject    # Reject item
POST   /api/approvals/:agreementId/:itemId/request-changes  # Request changes

# Email Approval (Public endpoint with token)
GET    /api/approvals/email/:token               # Validate email token & show details
POST   /api/approvals/email/:token/approve       # Approve via email
POST   /api/approvals/email/:token/reject        # Reject via email

# Notification Management
GET    /api/master-agreements/:id/notifications  # Get notification history
POST   /api/master-agreements/:id/notifications/resend  # Resend notifications
```

### 4.5 Operations & PM APIs

```
# Operations Assignment
POST   /api/projects/:id/operations/assign-pm      # Assign Project Manager
POST   /api/projects/:id/operations/assign-team    # Assign operations team
GET    /api/projects/:id/operations/dashboard      # PM Dashboard

# Execution Tracking
PUT    /api/projects/:id/stage                     # Update project stage
POST   /api/projects/:id/milestones                # Add milestone
PUT    /api/projects/:id/milestones/:milestoneId   # Update milestone
```

### 4.6 Audit & Activity APIs

```
# Activity Logs
GET    /api/leads/:id/activities                   # Lead activity log
GET    /api/projects/:id/activities                # Project activity log
GET    /api/master-agreements/:id/activities       # Agreement activity log
GET    /api/audit/entity/:type/:id                 # Generic audit log

# Department Activity
GET    /api/departments/:id/activities             # Department-level activities
GET    /api/users/:id/activities                   # User-level activities
```

---

## 5. Role-Based Access Control (RBAC)

### 5.1 New Permissions to Add

```javascript
// Add to existing PERMISSIONS object in User.js
{
  // Pre-Sales Permissions
  PRESALES_VIEW: 'presales:view',
  PRESALES_CALL: 'presales:call',
  PRESALES_SCHEDULE_MEETING: 'presales:schedule_meeting',
  PRESALES_UPDATE_STATUS: 'presales:update_status',

  // CRM Permissions
  CRM_VIEW_ALL_LEADS: 'crm:view_all_leads',
  CRM_REASSIGN: 'crm:reassign',
  CRM_REPORTS: 'crm:reports',

  // Sales Permissions
  SALES_VIEW_QUALIFIED: 'sales:view_qualified',
  SALES_CREATE_ORDER: 'sales:create_order',
  SALES_CLOSE_DEAL: 'sales:close_deal',

  // Design Permissions
  DESIGN_VIEW: 'design:view',
  DESIGN_CREATE_ITERATION: 'design:create_iteration',
  DESIGN_APPROVE: 'design:approve',

  // Approval Permissions
  APPROVAL_VIEW: 'approval:view',
  APPROVAL_APPROVE_MATERIAL_QUOTATION: 'approval:material_quotation',
  APPROVAL_APPROVE_MATERIAL_SPEND: 'approval:material_spend',
  APPROVAL_APPROVE_PAYMENT_SCHEDULE: 'approval:payment_schedule',
  APPROVAL_APPROVE_SCHEDULE_OF_WORK: 'approval:schedule_of_work',

  // Operations Permissions
  OPERATIONS_VIEW: 'operations:view',
  OPERATIONS_HANDOVER: 'operations:handover',
  OPERATIONS_MANAGE_PM: 'operations:manage_pm'
}
```

### 5.2 New Role Definitions

```javascript
// Add to ROLE_PERMISSIONS
{
  pre_sales_executive: [
    PERMISSIONS.LEADS_VIEW, PERMISSIONS.LEADS_VIEW_ASSIGNED,
    PERMISSIONS.PRESALES_VIEW, PERMISSIONS.PRESALES_CALL,
    PERMISSIONS.PRESALES_SCHEDULE_MEETING, PERMISSIONS.PRESALES_UPDATE_STATUS,
    PERMISSIONS.DASHBOARD_VIEW
  ],

  pre_sales_manager: [
    // All pre_sales_executive permissions plus:
    PERMISSIONS.LEADS_VIEW_ALL, PERMISSIONS.LEADS_ASSIGN,
    PERMISSIONS.CRM_VIEW_ALL_LEADS, PERMISSIONS.CRM_REASSIGN,
    PERMISSIONS.REPORTS_VIEW
  ],

  crm_manager: [
    PERMISSIONS.CRM_VIEW_ALL_LEADS, PERMISSIONS.CRM_REASSIGN, PERMISSIONS.CRM_REPORTS,
    PERMISSIONS.LEADS_VIEW_ALL, PERMISSIONS.LEADS_ASSIGN,
    PERMISSIONS.CUSTOMERS_VIEW_ALL,
    PERMISSIONS.REPORTS_VIEW, PERMISSIONS.ANALYTICS_VIEW
  ],

  sales_closure: [
    PERMISSIONS.SALES_VIEW_QUALIFIED, PERMISSIONS.SALES_CREATE_ORDER, PERMISSIONS.SALES_CLOSE_DEAL,
    PERMISSIONS.LEADS_VIEW_ASSIGNED, PERMISSIONS.LEADS_EDIT,
    PERMISSIONS.CUSTOMERS_CREATE, PERMISSIONS.CUSTOMERS_EDIT,
    PERMISSIONS.PROJECTS_CREATE
  ],

  design_team: [
    PERMISSIONS.DESIGN_VIEW, PERMISSIONS.DESIGN_CREATE_ITERATION,
    PERMISSIONS.PROJECTS_VIEW_ASSIGNED, PERMISSIONS.PROJECTS_EDIT
  ],

  design_head: [
    // All design_team permissions plus:
    PERMISSIONS.DESIGN_APPROVE,
    PERMISSIONS.APPROVAL_VIEW, PERMISSIONS.APPROVAL_APPROVE_MATERIAL_QUOTATION,
    PERMISSIONS.PROJECTS_VIEW_ALL
  ],

  ceo: [
    PERMISSIONS.APPROVAL_VIEW,
    PERMISSIONS.APPROVAL_APPROVE_MATERIAL_QUOTATION,
    PERMISSIONS.APPROVAL_APPROVE_MATERIAL_SPEND,
    PERMISSIONS.APPROVAL_APPROVE_PAYMENT_SCHEDULE,
    PERMISSIONS.APPROVAL_APPROVE_SCHEDULE_OF_WORK,
    PERMISSIONS.PROJECTS_VIEW_ALL, PERMISSIONS.REPORTS_VIEW, PERMISSIONS.ANALYTICS_VIEW
  ],

  cbo: [
    PERMISSIONS.OPERATIONS_VIEW, PERMISSIONS.OPERATIONS_HANDOVER,
    PERMISSIONS.APPROVAL_VIEW,
    PERMISSIONS.APPROVAL_APPROVE_MATERIAL_QUOTATION,
    PERMISSIONS.APPROVAL_APPROVE_MATERIAL_SPEND,
    PERMISSIONS.APPROVAL_APPROVE_PAYMENT_SCHEDULE,
    PERMISSIONS.APPROVAL_APPROVE_SCHEDULE_OF_WORK,
    PERMISSIONS.PROJECTS_VIEW_ALL, PERMISSIONS.PROJECTS_EDIT,
    PERMISSIONS.REPORTS_VIEW, PERMISSIONS.ANALYTICS_VIEW
  ],

  operations_manager: [
    PERMISSIONS.OPERATIONS_VIEW, PERMISSIONS.OPERATIONS_MANAGE_PM,
    PERMISSIONS.PROJECTS_VIEW_ALL, PERMISSIONS.PROJECTS_EDIT,
    PERMISSIONS.PROJECTS_MANAGE_TEAM
  ]
}
```

### 5.3 Edit Lock Rules

```javascript
// Middleware: checkEditPermission
const checkLeadEditPermission = async (req, res, next) => {
  const lead = await Lead.findById(req.params.id);

  // Check if Pre-Sales is locked
  if (lead.preSalesLocked) {
    const userDept = req.user.subDepartment;

    // Only Sales can edit after qualification
    if (userDept === 'pre_sales' || userDept === 'crm') {
      return res.status(403).json({
        success: false,
        message: 'Lead is locked. Only Sales can edit after qualification.'
      });
    }
  }

  // Check exclusive assignment
  if (lead.departmentAssignments.sales.isExclusive) {
    const salesEmployee = lead.departmentAssignments.sales.employee;
    if (!salesEmployee.equals(req.user._id) && req.user.role !== 'sales_manager') {
      return res.status(403).json({
        success: false,
        message: 'Lead is exclusively assigned to another sales person.'
      });
    }
  }

  next();
};
```

---

## 6. Validation Rules

### 6.1 Lead Status Transitions

```javascript
const VALID_STATUS_TRANSITIONS = {
  new: ['in_progress', 'qualified', 'lost', 'rnr', 'future_prospect'],
  in_progress: ['qualified', 'lost', 'rnr', 'future_prospect'],
  qualified: ['lost'], // Can only go to lost after qualification
  lost: ['in_progress'], // Can be reactivated
  rnr: ['in_progress', 'lost'], // Can be reactivated or marked lost
  future_prospect: ['in_progress', 'qualified', 'lost'] // Can be reactivated
};

const validateStatusTransition = (currentStatus, newStatus) => {
  const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  return validTransitions.includes(newStatus);
};
```

### 6.2 Qualification Requirements

```javascript
const canQualifyLead = (lead) => {
  const errors = [];

  // Must have at least one successful call
  if (lead.callSummary.successfulCalls === 0) {
    errors.push('At least one successful call is required');
  }

  // Must have a completed meeting
  if (lead.callSummary.meetingsCompleted === 0) {
    errors.push('At least one completed meeting is required');
  }

  // Must be assigned to Pre-Sales
  if (!lead.departmentAssignments.preSales.employee) {
    errors.push('Lead must be assigned to Pre-Sales');
  }

  return {
    canQualify: errors.length === 0,
    errors
  };
};
```

### 6.3 Sales Order Creation Requirements

```javascript
const canCreateSalesOrder = (lead) => {
  const errors = [];

  // Must be qualified
  if (lead.primaryStatus !== 'qualified') {
    errors.push('Lead must be qualified before creating sales order');
  }

  // Must have secondary status
  if (!lead.secondaryStatus) {
    errors.push('Secondary status (Hot/Warm/Cold/Future) must be set');
  }

  // Must be exclusively assigned to Sales
  if (!lead.departmentAssignments.sales.isExclusive) {
    errors.push('Lead must be exclusively assigned to Sales');
  }

  // Basic info required
  if (!lead.name || !lead.phone) {
    errors.push('Lead must have name and phone');
  }

  return {
    canCreate: errors.length === 0,
    errors
  };
};
```

### 6.4 Approval Requirements

```javascript
const canSubmitForApproval = (masterAgreement) => {
  const errors = [];

  // All 4 approval items must be added
  const requiredTypes = ['material_quotation', 'material_spend', 'payment_schedule', 'schedule_of_work'];
  const existingTypes = masterAgreement.approvalItems.map(item => item.type);

  requiredTypes.forEach(type => {
    if (!existingTypes.includes(type)) {
      errors.push(`Missing approval item: ${type}`);
    }
  });

  // All items must have documents
  masterAgreement.approvalItems.forEach(item => {
    if (!item.document || !item.document.url) {
      errors.push(`Document missing for: ${item.type}`);
    }
  });

  // Approvers must be configured
  if (masterAgreement.approvers.length === 0) {
    errors.push('At least one approver must be configured');
  }

  return {
    canSubmit: errors.length === 0,
    errors
  };
};
```

### 6.5 Handover Requirements

```javascript
const canHandoverToOperations = (project, masterAgreement) => {
  const errors = [];

  // All approvals must be complete
  if (!masterAgreement || masterAgreement.status !== 'approved') {
    errors.push('All Master Agreement approvals must be complete');
  }

  // Design must be approved
  const latestDesign = project.designIterations[project.designIterations.length - 1];
  if (!latestDesign || latestDesign.status !== 'approved') {
    errors.push('Latest design iteration must be approved');
  }

  // Project Manager must be assigned
  if (!project.projectManager) {
    errors.push('Project Manager must be assigned before handover');
  }

  return {
    canHandover: errors.length === 0,
    errors
  };
};
```

---

## 7. Edge Cases Handling

### 7.1 RNR Loop Prevention

```javascript
// Maximum RNR attempts before auto-marking as Lost
const MAX_RNR_ATTEMPTS = 5;
const RNR_COOLDOWN_DAYS = 7;

const handleRNR = async (lead, userId) => {
  lead.rnrTracking.rnrCount += 1;
  lead.rnrTracking.lastRnrDate = new Date();

  // Auto-mark as Lost after max attempts
  if (lead.rnrTracking.rnrCount >= MAX_RNR_ATTEMPTS) {
    lead.primaryStatus = 'lost';
    lead.activities.push({
      action: 'status_changed',
      description: `Auto-marked as Lost after ${MAX_RNR_ATTEMPTS} RNR attempts`,
      performedBy: userId,
      metadata: { reason: 'max_rnr_attempts' }
    });
  } else {
    lead.primaryStatus = 'rnr';

    // Schedule next follow-up after cooldown
    lead.nextFollowUp = {
      date: new Date(Date.now() + RNR_COOLDOWN_DAYS * 24 * 60 * 60 * 1000),
      type: 'call',
      notes: `RNR attempt ${lead.rnrTracking.rnrCount}. Auto-scheduled follow-up.`
    };
  }

  return lead.save();
};
```

### 7.2 Future Prospect Reactivation

```javascript
// Auto-create tasks for future prospect follow-ups
const FUTURE_PROSPECT_FOLLOW_UP_DAYS = 30;

const handleFutureProspect = async (lead, userId, expectedDate) => {
  lead.primaryStatus = 'future_prospect';

  // Set follow-up date
  const followUpDate = expectedDate || new Date(Date.now() + FUTURE_PROSPECT_FOLLOW_UP_DAYS * 24 * 60 * 60 * 1000);

  lead.nextFollowUp = {
    date: followUpDate,
    type: 'call',
    notes: 'Future prospect follow-up'
  };

  // Create scheduled task/notification
  await Notification.create({
    company: lead.company,
    user: lead.departmentAssignments.preSales.employee,
    type: 'task',
    title: 'Future Prospect Follow-up',
    message: `Follow up with ${lead.name}`,
    scheduledFor: followUpDate,
    relatedEntity: { type: 'Lead', id: lead._id }
  });

  return lead.save();
};

// Reactivation from Future Prospect
const reactivateLead = async (lead, userId, fromStatus) => {
  lead.rnrTracking.reactivatedFrom = fromStatus;
  lead.rnrTracking.reactivatedAt = new Date();
  lead.rnrTracking.reactivatedBy = userId;

  lead.primaryStatus = 'in_progress';

  // Reset RNR count if reactivating from RNR
  if (fromStatus === 'rnr') {
    lead.rnrTracking.rnrCount = 0;
  }

  lead.activities.push({
    action: 'status_changed',
    description: `Lead reactivated from ${fromStatus}`,
    performedBy: userId,
    oldValue: fromStatus,
    newValue: 'in_progress'
  });

  return lead.save();
};
```

### 7.3 Approval Timeout Handling

```javascript
// Approval escalation after timeout
const APPROVAL_TIMEOUT_HOURS = 48;
const ESCALATION_LEVELS = ['design_head', 'ceo', 'cbo'];

const checkApprovalTimeout = async () => {
  const pendingApprovals = await MasterAgreement.find({
    status: 'pending_approval',
    'approvalItems.approvals': {
      $elemMatch: {
        status: 'pending',
        emailSentAt: { $lt: new Date(Date.now() - APPROVAL_TIMEOUT_HOURS * 60 * 60 * 1000) }
      }
    }
  });

  for (const agreement of pendingApprovals) {
    // Send reminder
    await sendApprovalReminder(agreement);

    // Escalate if second timeout
    const hoursSinceEmail = (Date.now() - agreement.approvalItems[0].approvals[0].emailSentAt) / (1000 * 60 * 60);

    if (hoursSinceEmail > APPROVAL_TIMEOUT_HOURS * 2) {
      await escalateApproval(agreement);
    }
  }
};

const escalateApproval = async (agreement) => {
  // Find next level approver
  const currentApprovers = agreement.approvers.map(a => a.role);
  const nextLevel = ESCALATION_LEVELS.find(level => !currentApprovers.includes(level));

  if (nextLevel) {
    const escalationUser = await User.findOne({
      company: agreement.company,
      'approvalAuthority.approverRole': nextLevel
    });

    if (escalationUser) {
      agreement.approvers.push({
        user: escalationUser._id,
        role: nextLevel,
        isMandatory: false
      });

      await sendApprovalEmail(agreement, escalationUser);

      agreement.activities.push({
        action: 'escalated',
        description: `Approval escalated to ${nextLevel}`,
        metadata: { escalatedTo: escalationUser._id }
      });

      await agreement.save();
    }
  }
};
```

### 7.4 Concurrent Edit Handling

```javascript
// Optimistic locking for concurrent edits
const updateLeadWithLock = async (leadId, updates, userId, expectedVersion) => {
  const result = await Lead.findOneAndUpdate(
    {
      _id: leadId,
      __v: expectedVersion // Version check
    },
    {
      ...updates,
      $inc: { __v: 1 }
    },
    { new: true }
  );

  if (!result) {
    // Version mismatch - concurrent edit detected
    const currentLead = await Lead.findById(leadId);

    throw new ConcurrentEditError({
      message: 'Lead was modified by another user',
      currentVersion: currentLead.__v,
      lastModifiedBy: currentLead.activities[currentLead.activities.length - 1]?.performedBy
    });
  }

  return result;
};
```

### 7.5 Department Transition Edge Cases

```javascript
// Handle employee leaving mid-workflow
const handleEmployeeDeparture = async (employeeId) => {
  // Find all active leads assigned to this employee
  const assignedLeads = await Lead.find({
    $or: [
      { 'departmentAssignments.preSales.employee': employeeId, 'departmentAssignments.preSales.isActive': true },
      { 'departmentAssignments.crm.employee': employeeId, 'departmentAssignments.crm.isActive': true },
      { 'departmentAssignments.sales.employee': employeeId, 'departmentAssignments.sales.isActive': true }
    ]
  });

  // Notify managers
  const managers = await User.find({
    company: assignedLeads[0]?.company,
    role: { $in: ['pre_sales_manager', 'sales_manager', 'crm_manager'] }
  });

  for (const manager of managers) {
    await Notification.create({
      user: manager._id,
      type: 'alert',
      title: 'Employee Departure - Lead Reassignment Required',
      message: `${assignedLeads.length} leads need reassignment`,
      priority: 'high'
    });
  }

  // Mark assignments as inactive (not delete, for audit)
  await Lead.updateMany(
    { 'departmentAssignments.preSales.employee': employeeId },
    { 'departmentAssignments.preSales.isActive': false }
  );

  // Similar for other departments...
};
```

---

## 8. Notification System

### 8.1 Email Templates Required

```javascript
const EMAIL_TEMPLATES = {
  APPROVAL_REQUEST: 'approval_request',
  APPROVAL_REMINDER: 'approval_reminder',
  APPROVAL_ESCALATION: 'approval_escalation',
  LEAD_ASSIGNED: 'lead_assigned',
  MEETING_SCHEDULED: 'meeting_scheduled',
  PROJECT_HANDOVER: 'project_handover',
  RNR_FOLLOW_UP: 'rnr_follow_up',
  FUTURE_PROSPECT_REMINDER: 'future_prospect_reminder'
};
```

### 8.2 Approval Email Structure

```javascript
const generateApprovalEmail = (agreement, approver, item) => {
  const approveToken = generateSecureToken();
  const rejectToken = generateSecureToken();

  return {
    to: approver.email,
    subject: `[Action Required] ${item.type} Approval - ${agreement.project.title}`,
    template: 'approval_request',
    data: {
      approverName: approver.name,
      projectTitle: agreement.project.title,
      itemType: item.type,
      itemDescription: item.description,
      documentUrl: item.document.url,
      approveUrl: `${BASE_URL}/api/approvals/email/${approveToken}/approve`,
      rejectUrl: `${BASE_URL}/api/approvals/email/${rejectToken}/reject`,
      dashboardUrl: `${BASE_URL}/admin/approvals/${agreement._id}`,
      expiresIn: '48 hours'
    }
  };
};
```

---

## 9. Implementation Priority

### Phase 1: Core Lead Workflow (Week 1-2)
1. Enhance Lead model with department assignments
2. Create CallActivity model
3. Implement Pre-Sales workflow APIs
4. Add status transition validation

### Phase 2: Sales & Order Creation (Week 3-4)
1. Create SalesOrder model
2. Implement qualification workflow
3. Add BOQ/BOM management
4. Create Project from Sales Order

### Phase 3: Design & Approval (Week 5-6)
1. Create DesignIteration model
2. Create MasterAgreement model
3. Implement approval workflow
4. Add email notification system

### Phase 4: Operations & Handover (Week 7-8)
1. Implement handover workflow
2. Add PM assignment
3. Create audit trail system
4. Add edge case handling

### Phase 5: UI & Integration (Week 9-10)
1. Build Kanban views for each stage
2. Create approval dashboard
3. Add notification center
4. Implement reports & analytics

---

## 10. Appendix: Database Indexes

```javascript
// Performance-critical indexes
Lead.index({ 'departmentAssignments.preSales.employee': 1, primaryStatus: 1 });
Lead.index({ 'departmentAssignments.sales.employee': 1, secondaryStatus: 1 });
Lead.index({ company: 1, primaryStatus: 1, createdAt: -1 });

CallActivity.index({ lead: 1, createdAt: -1 });
CallActivity.index({ calledBy: 1, scheduledAt: 1 });

SalesOrder.index({ company: 1, status: 1 });
SalesOrder.index({ lead: 1 });
SalesOrder.index({ salesPerson: 1, createdAt: -1 });

MasterAgreement.index({ project: 1 });
MasterAgreement.index({ status: 1, 'approvalItems.approvals.status': 1 });
MasterAgreement.index({ 'approvers.user': 1, status: 1 });

DesignIteration.index({ project: 1, version: -1 });
DesignIteration.index({ designer: 1, status: 1 });
```

---

*Document Version: 1.0*
*Last Updated: January 2026*
*Author: System Architect*
