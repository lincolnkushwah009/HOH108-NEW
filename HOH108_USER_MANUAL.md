# HOH108 CRM/ERP System -- Complete Desktop Procedure & User Manual

**System**: HOH108 Enterprise Resource Planning System
**Company**: Interior Plus (Interior Design & Construction)
**Domain**: https://hoh108.com
**Version**: 2.0 | **Effective Date**: March 2026
**Locations**: Bengaluru, Mysuru, Hyderabad
**Brand Color**: #C59C82 | **Font**: Raleway / Oswald

---

# TABLE OF CONTENTS

1. [System Overview & Architecture](#1-system-overview--architecture)
2. [Login Procedures](#2-login-procedures)
3. [Navigation Guide](#3-navigation-guide)
4. [Role-Based Access Control (RBAC)](#4-role-based-access-control-rbac)
5. [Dashboard](#5-dashboard)
6. [Sales & CRM](#6-sales--crm)
7. [Procurement](#7-procurement)
8. [Inventory](#8-inventory)
9. [Projects](#9-projects)
10. [Production / PPC](#10-production--ppc)
11. [HR Management](#11-hr-management)
12. [Performance Management](#12-performance-management)
13. [Finance](#13-finance)
14. [Analytics](#14-analytics)
15. [Compliance](#15-compliance)
16. [Support Tickets](#16-support-tickets)
17. [Notifications & Approvals](#17-notifications--approvals)
18. [Marketing](#18-marketing)
19. [Settings & Administration](#19-settings--administration)
20. [Customer Portal](#20-customer-portal)
21. [Vendor Portal](#21-vendor-portal)
22. [Project Wallet & P&L](#22-project-wallet--pl)
23. [Onboarding Checklist](#23-onboarding-checklist-for-new-employees)
24. [KYC Verification Process](#24-kyc-verification-process)
25. [PhonePe Payment Flow](#25-phonepe-payment-flow)
26. [IT/TDS Compliance Checklist](#26-ittds-compliance-checklist)
27. [Round-Robin Lead Assignment](#27-round-robin-lead-assignment-rules)
28. [Employee Cost Allocation](#28-employee-cost-allocation-methodology)
29. [Notification System (45 Events)](#29-notification-system-overview-45-events)
30. [Material Master Codes](#30-material-master-codes-ip-mat-001-to-ip-mat-080)
31. [Approval Workflows](#31-approval-workflows)
32. [Report Generation Guide](#32-report-generation-guide)
33. [Common Errors & Troubleshooting](#33-common-errors--troubleshooting)
34. [Glossary](#34-glossary)

---

# 1. System Overview & Architecture

## 1.1 Purpose

HOH108 is a unified CRM/ERP platform purpose-built for Interior Plus, an interior design and construction company operating across Bengaluru, Mysuru, and Hyderabad. The system manages the complete business lifecycle: lead capture through project delivery, procurement, production, finance, HR, compliance, and analytics.

## 1.2 Architecture

```
+---------------------------------------------------------------------+
|                        CLIENT TIER                                   |
|  +-------------------+  +-------------------+  +------------------+  |
|  |  Admin Panel      |  |  Customer Portal  |  |  Vendor Portal   |  |
|  |  (React + Vite)   |  |  (React + Vite)   |  |  (React + Vite)  |  |
|  |  /admin/*          |  |  /user/*           |  |  /vendor/*       |  |
|  +-------------------+  +-------------------+  +------------------+  |
|  +-------------------+                                               |
|  |  Mobile App       |                                               |
|  |  (Capacitor/Android)|                                             |
|  +-------------------+                                               |
+---------------------------------------------------------------------+
                              |  HTTPS
+---------------------------------------------------------------------+
|                        SERVER TIER                                    |
|  +-------------------+  +-------------------+                        |
|  |  Nginx            |  |  Node.js Backend  |                        |
|  |  Reverse Proxy    |->|  (Express + PM2)  |                        |
|  |  SSL Termination  |  |  Port 5001        |                        |
|  +-------------------+  +-------------------+                        |
+---------------------------------------------------------------------+
                              |
+---------------------------------------------------------------------+
|                        DATA TIER                                     |
|  +-------------------+  +-------------------+  +------------------+  |
|  |  MongoDB           |  |  File Storage     |  |  Redis (Cache)   |  |
|  |  (Primary DB)      |  |  (Uploads/Docs)   |  |  (Sessions)      |  |
|  +-------------------+  +-------------------+  +------------------+  |
+---------------------------------------------------------------------+
                              |
+---------------------------------------------------------------------+
|                     EXTERNAL INTEGRATIONS                             |
|  +------------+  +-----------+  +----------+  +-------------------+  |
|  | Callyzer   |  | PhonePe   |  | GST/E-Inv|  | Email (SMTP)     |  |
|  | Call Logs  |  | Payments  |  | Compliance|  | Notifications    |  |
|  +------------+  +-----------+  +----------+  +-------------------+  |
+---------------------------------------------------------------------+
```

## 1.3 Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Lucide Icons, Raleway/Oswald fonts |
| Mobile | Capacitor (Android wrapper) |
| Backend | Node.js v23.6, Express.js, PM2 process manager |
| Database | MongoDB (Mongoose ODM) |
| Server | Ubuntu Linux, Nginx, Let's Encrypt SSL |
| Hosting | VPS at 88.222.215.4 |
| Authentication | JWT tokens (stored in localStorage as `hoh108_admin_token`) |
| Integrations | Callyzer API v2.1, PhonePe Payment Gateway |

## 1.4 System Requirements

| Requirement | Specification |
|-------------|--------------|
| Browser | Chrome 90+, Firefox 88+, Safari 15+, Edge 90+ |
| Screen Resolution | Minimum 1366x768; recommended 1920x1080 |
| Internet | Minimum 2 Mbps stable connection |
| Mobile | Android 8.0+ for Capacitor app |
| JavaScript | Must be enabled |
| Cookies | Must be enabled (for JWT storage) |

## 1.5 Data Model Summary

The system uses a multi-tenant architecture keyed on `company` ID. Interior Plus company ID: `6967b34f1496c6c6e553fd1e`. Every document in the database is scoped to this company ID, ensuring data isolation.

---

# 2. Login Procedures

## 2.1 Admin Panel Login

**URL**: `https://hoh108.com/admin/login`

### Step-by-Step Procedure

1. Open browser and navigate to `https://hoh108.com/admin/login`.
2. Enter **Email Address** in the email field.
   - Format: valid email (e.g., `john@interiorplus.in`)
   - Validation: required, must be valid email format
3. Enter **Password** in the password field.
   - Validation: required, minimum 6 characters
4. Click **Sign In** button.
5. System authenticates against the backend `/api/auth/login` endpoint.
6. On success:
   - JWT token stored in `localStorage` as `hoh108_admin_token`
   - Active company ID stored as `hoh108_active_company`
   - User redirected to `/admin/dashboard`
7. On failure:
   - Error message displayed: "Invalid email or password"
   - No lockout policy by default (configurable in Settings)

### MFA (Multi-Factor Authentication)

If MFA is enabled for the user's account (see Settings > MFA):
1. After entering email/password, a 6-digit OTP is sent to registered mobile/email.
2. Enter OTP in the verification field.
3. Click **Verify**.
4. OTP expires in 5 minutes.

### Session Management

- Token does not expire automatically on the client side.
- If the backend returns HTTP 401, the token is cleared and user is redirected to login.
- Manual logout: Click user avatar in sidebar bottom, then click **Logout**.

### Business Rules

- Only users with `isActive: true` can log in.
- Users must belong to an active company.
- Password is hashed using bcrypt on the server.

## 2.2 Customer Portal Login

**URL**: `https://hoh108.com/user`

1. Navigate to `https://hoh108.com/user`.
2. Enter registered **Mobile Number** or **Email**.
3. Enter **Password** (set during customer onboarding or KYC).
4. Click **Login**.
5. Redirected to Customer Dashboard showing active projects, payments, designs.

### Customer Portal Features

- Dashboard, Projects, Orders, Deliveries, Quotes, Consultations, Rewards, Designs, Support, Documents
- Mobile-responsive layout with dedicated mobile views (MobileDashboard, MobileOrders, MobileRewards, MobileServices, MobileProjects)
- Project Lifecycle tracking

## 2.3 Vendor Portal Login

**URL**: `https://hoh108.com/vendor`

1. Navigate to `https://hoh108.com/vendor`.
2. Enter registered **Email** or **Vendor Code**.
3. Enter **Password**.
4. Click **Login**.
5. Redirected to Vendor Dashboard.

### Vendor Portal Features

- Dashboard, Materials catalog, RFQ/Quotations, Purchase Orders, GRN Status, Invoices, Payments

---

# 3. Navigation Guide

## 3.1 Sidebar Navigation

The sidebar is the primary navigation element. It appears as a dark vertical panel on the left side with:

- **Logo Area**: HOH108 logo with "ERP System" subtitle
- **Navigation Menu**: Grouped by module with expandable sub-menus
- **User Card**: Bottom of sidebar showing logged-in user name, role, and logout button

### Sidebar Behavior

| Feature | Description |
|---------|-------------|
| Collapsed Mode | Sidebar shrinks to 80px showing only icons |
| Expanded Mode | Sidebar is 264px showing icons + labels |
| Active Indicator | White background with brand color (#C59C82) text |
| Sub-menu | Items indented under parent, opened by clicking parent |
| Mobile | Sidebar appears as overlay; close by clicking outside |

### Visual Indicators

- **Active page**: White background, #C59C82 text color, subtle shadow
- **Active group**: Parent item highlighted when any child is active
- **Hover**: Subtle background brightening on non-active items
- **Sub-items**: Slightly transparent white text, becomes fully white when active

## 3.2 Top-Level Navigation Structure

```
Dashboard
Sales & CRM
  +-- Leads
  +-- Call Activities
  +-- Customers
  +-- Sales Orders
  +-- Quotations
  +-- BOQ Generator
  +-- Dispatches
  +-- Lead Scoring
  +-- Surveys
  +-- Approvals
  +-- Design Iterations
  +-- Channel Partners
Procurement
  +-- Vendors
  +-- Purchase Requisitions
  +-- Purchase Orders
  +-- GRN (Goods Receipt Notes)
  +-- Vendor Invoices
  +-- Vendor Milestones
  +-- RFQ
  +-- Vendor Performance
Inventory
  +-- Materials
  +-- Stock Management
  +-- Stock Movements
Projects
  +-- All Projects
  +-- Gantt Chart
  +-- Budget & Costing
  +-- Timeline
  +-- P2P Tracker
  +-- QC Master
  +-- Change Orders
  +-- Risk Register
  +-- Stock Takes
Production / PPC
  +-- Dashboard
  +-- Work Orders
  +-- BOM (Bill of Materials)
  +-- MRP (Material Requirements Planning)
  +-- Material Issues
  +-- Labor Tracking
  +-- Daily Progress
  +-- Production Costs
HR Management
  +-- Employees
  +-- Departments
  +-- Attendance
  +-- Leaves
  +-- Reimbursements
  +-- Advance Requests
  +-- Salary
  +-- Payroll
  +-- Employee Letters
  +-- Assets
  +-- Skill Matrix
  +-- Exit Management
Performance
  +-- KRA Master
  +-- KPI Master
  +-- Role Templates
  +-- Reviews
  +-- Review Cycles
Finance
  +-- Customer Invoices
  +-- Payments
  +-- Accounts Receivable (AR)
  +-- Accounts Payable (AP)
  +-- Bank Reconciliation
  +-- Budget & Forecast
  +-- Credit/Debit Notes
  +-- Ledger Master
  +-- Ledger Mapping
  +-- Aging Dashboard
  +-- Project P&L
Analytics
  +-- Overview
  +-- Sales
  +-- Finance
  +-- Projects
  +-- HR
Compliance
  +-- Dashboard
  +-- DPDP Consent
  +-- Data Requests
  +-- E-Invoicing
  +-- GST Returns
  +-- SoD Review
  +-- Access Reviews
Support Tickets
Notifications & Approvals
Marketing
  +-- Mail Templates
  +-- Game Entries
Settings
  +-- Users
  +-- Roles & Permissions
  +-- Approval Matrix
  +-- Profile
  +-- Audit Trail
  +-- MDM (Master Data Management)
  +-- Callyzer
  +-- Documents
  +-- MFA
  +-- Configuration Master
  +-- Company Master
```

## 3.3 Page Layout Structure

Every admin page follows this layout:

```
+------------------------------------------------------------------+
| Sidebar (264px)  |  Main Content Area                            |
|                  |  +------------------------------------------+ |
|  [Logo]          |  |  Page Header (title + breadcrumb + actions)| |
|                  |  +------------------------------------------+ |
|  [Nav Items]     |  |  Content Body                             | |
|                  |  |  (Tables, Forms, Cards, Charts)           | |
|                  |  |                                           | |
|  [User Card]     |  |  [Pagination / Footer]                   | |
|                  |  +------------------------------------------+ |
+------------------------------------------------------------------+
```

## 3.4 Common UI Components

| Component | Description | Notes |
|-----------|-------------|-------|
| Card | Container with rounded corners and shadow | `Card.Content` only accepts `style` prop; `className` is ignored |
| Button | Primary (#C59C82), Secondary (gray), Danger (red) | All use inline styles |
| Input | Text field with label, placeholder, validation | Inline styles only |
| Select | Dropdown selector | Inline styles only |
| Table | Paginated data table with sorting | Includes search, filters, bulk actions |
| Modal | Overlay dialog for forms and confirmations | Centered, backdrop blur |
| Badge | Status indicator (colored pill) | Colors vary by status |
| Tabs | Horizontal tab navigation within a page | Underline style |
| Toast | Notification popup (top-right) | Auto-dismiss after 5 seconds |
| StatCard | KPI display card with icon and value | Used on dashboards |
| Pagination | Page navigation for large datasets | Shows page count and per-page selector |
| Avatar | User/entity profile image with fallback initials | Gradient fallback |
| SearchInput | Search field with icon | Debounced 300ms |
| EmptyState | Illustrated placeholder when no data exists | Custom icon and message |
| LoadingSpinner | Animated loading indicator | Brand color spinner |

---

# 4. Role-Based Access Control (RBAC)

## 4.1 Role Definitions

The system uses the `getFilteredNavigation(role)` function to dynamically show/hide menu items based on the user's role. Navigation items are filtered server-side AND client-side.

| Role | Code | Description | Typical Access |
|------|------|-------------|---------------|
| Super Admin | `super_admin` | Full system access across all companies | All modules, all actions, system configuration |
| Company Admin | `company_admin` | Full access within their company | All modules within company scope |
| IT Admin | `it_admin` | Technical administration | Settings, Users, Audit Trail, MFA, Configuration |
| Sales Manager | `sales_manager` | Sales team oversight | CRM (full), Analytics (Sales), Reports |
| Sales Executive | `sales_executive` | Individual sales operations | Leads (own), Quotations, Sales Orders |
| Pre-Sales | `pre_sales` | Lead qualification and initial engagement | Leads, Call Activities, Surveys |
| AGM (Sales) | `agm_sales` | Assistant General Manager - Sales | CRM (full), Analytics, Team management |
| AGM (Business) | `agm_business` | Assistant General Manager - Business | Cross-module read, Approvals, Analytics |
| AGM (Operations) | `agm_operations` | Assistant General Manager - Operations | Projects, Procurement, Inventory, Production |
| Project Manager | `project_manager` | Project execution leadership | Projects (own/assigned), Budget, Timeline, Change Orders |
| Site Engineer | `site_engineer` | On-site project execution | Projects (assigned), Daily Progress, Material Issues, QC |
| Designer | `designer` | Design creation and iteration | Design Iterations, BOQ Generator, Projects (design phase) |
| Architect | `architect` | Architectural planning | Projects, Design Iterations, BOQ Generator |
| Operations | `operations` | Day-to-day operations management | Projects, Procurement, Inventory, Production |
| Finance | `finance` | Financial operations | Finance (full), Analytics (Finance) |
| HR | `hr` | Human resources operations | HR Management (full), Performance |
| HR Head | `hr_head` | HR department leadership | HR (full), Performance, Analytics (HR), Salary/Payroll |
| Manager | `manager` | General departmental management | Department-specific access, Approvals |
| Community Manager | `community_manager` | Customer community engagement | Customer data (read), Surveys, Support Tickets |
| DRM | `drm` | Design Resource Manager | Design Iterations, Designer allocation |
| MMT Technician | `mmt_technician` | Measurement and technical team | Projects (assigned), Measurements |
| Channel Partner Manager | `channel_partner_manager` | Partner relationship management | Channel Partners, Leads (partner-sourced) |
| Procurement Manager | `procurement_manager` | Procurement operations | Procurement (full), Inventory, Vendor management |
| Quality Controller | `quality_controller` | Quality assurance | QC Master, Projects (QC tasks), GRN inspection |

## 4.2 Permission Matrix

### Legend: C = Create, R = Read, U = Update, D = Delete, A = Approve, O = Own records only

| Module | Super Admin | Company Admin | Sales Manager | Sales Executive | Project Manager | Finance | HR |
|--------|:-----------:|:------------:|:-------------:|:--------------:|:--------------:|:-------:|:--:|
| Dashboard | R | R | R | R | R | R | R |
| Leads | CRUD | CRUD | CRUD | CRU-O | R | R | - |
| Call Activities | CRUD | CRUD | CRUD | CRU-O | R | - | - |
| Customers | CRUD | CRUD | CRUD | R | R | R | - |
| Sales Orders | CRUDA | CRUDA | CRUDA | CRU-O | R | R | - |
| Quotations | CRUDA | CRUDA | CRUDA | CRU-O | R | R | - |
| BOQ Generator | CRUD | CRUD | CRUD | CRU | CRUD | R | - |
| Dispatches | CRUD | CRUD | CRU | R | CRU | R | - |
| Lead Scoring | CRUD | CRUD | CRUD | R | - | - | - |
| Surveys | CRUD | CRUD | CRUD | CRU | R | - | - |
| CRM Approvals | A | A | A | R | R | - | - |
| Design Iterations | CRUD | CRUD | R | R | CRU | - | - |
| Channel Partners | CRUD | CRUD | CRUD | R | - | R | - |
| Vendors | CRUD | CRUD | - | - | R | R | - |
| Purchase Requisitions | CRUDA | CRUDA | - | - | CRU | R | - |
| Purchase Orders | CRUDA | CRUDA | - | - | R | R | - |
| GRN | CRUD | CRUD | - | - | CRU | R | - |
| Vendor Invoices | CRUD | CRUD | - | - | R | CRUD | - |
| Materials | CRUD | CRUD | R | - | R | - | - |
| Stock Management | CRUD | CRUD | - | - | CRU | - | - |
| Stock Movements | CRUD | CRUD | - | - | R | - | - |
| Projects | CRUD | CRUD | R | R | CRUD-O | R | - |
| Gantt Chart | R | R | R | - | RU-O | - | - |
| Budget & Costing | CRUD | CRUD | R | - | RU-O | CRUD | - |
| Work Orders | CRUD | CRUD | - | - | CRU | - | - |
| BOM | CRUD | CRUD | - | - | CRU | R | - |
| MRP | CRUD | CRUD | - | - | R | R | - |
| Employees | CRUD | CRUD | R | R | R | R | CRUD |
| Departments | CRUD | CRUD | - | - | - | - | CRUD |
| Attendance | CRUD | CRUD | R-O | R-O | R-O | R-O | CRUD |
| Leaves | CRUDA | CRUDA | CRU-O | CRU-O | CRU-O | CRU-O | CRUDA |
| Salary | CRUD | CRUD | - | - | - | CRUD | CRUD |
| Payroll | CRUD | CRUD | - | - | - | CRUD | CRUD |
| KRA/KPI Master | CRUD | CRUD | R | R | R | R | CRUD |
| Reviews | CRUDA | CRUDA | CRU | R | CRU | R | CRUDA |
| Customer Invoices | CRUD | CRUD | R | R | R | CRUD | - |
| Payments | CRUD | CRUD | R | R | R | CRUD | - |
| AR/AP | R | R | - | - | - | CRUD | - |
| Bank Reconciliation | CRUD | CRUD | - | - | - | CRUD | - |
| Analytics | R | R | R | R-O | R-O | R | R |
| Compliance | CRUD | CRUD | - | - | - | R | R |
| Support Tickets | CRUD | CRUD | CRU | CRU | CRU | CRU | CRU |
| Settings | CRUD | CRUD | R | - | - | - | R |
| Users | CRUD | CRUD | - | - | - | - | - |
| Roles & Permissions | CRUD | CRUD | - | - | - | - | - |
| Audit Trail | R | R | - | - | - | - | - |

## 4.3 Data Scoping Rules

1. **Super Admin**: Sees data across all companies.
2. **Company Admin**: Sees all data within their company (filtered by `company` field).
3. **Managers (Sales Manager, HR Head, etc.)**: See their team's data plus their own.
4. **Individual Contributors (Sales Executive, Site Engineer, etc.)**: See only their own records (filtered by `assignedTo` or `createdBy`).
5. **Cross-functional roles (Operations, AGM)**: See records from multiple departments but may not edit.

---

# 5. Dashboard

## 5.1 Overview

The Dashboard is the landing page after login. It provides a real-time summary of key metrics across the business.

**URL**: `/admin/dashboard`
**Access**: All authenticated roles

## 5.2 Dashboard Widgets

### KPI Summary Cards (Top Row)

| Card | Metric | Data Source | Refresh |
|------|--------|-------------|---------|
| Total Leads | Count of active leads this month | Leads collection | Real-time |
| Open Quotations | Quotations in Draft/Sent status | Quotations collection | Real-time |
| Active Projects | Projects in In-Progress status | Projects collection | Real-time |
| Revenue This Month | Sum of paid invoices this month | Payments collection | Real-time |
| Pending Approvals | Items awaiting current user's approval | Approvals collection | Real-time |
| Overdue Tasks | Tasks past due date | Tasks collection | Real-time |

### Charts and Graphs

| Chart | Type | Description |
|-------|------|-------------|
| Sales Pipeline | Funnel | Lead > Qualified > Quoted > Won by count and value |
| Revenue Trend | Line | Monthly revenue for last 12 months |
| Project Status | Donut | Distribution of projects by status |
| Lead Sources | Bar | Lead count by source channel |
| Team Performance | Bar | Sales by team member |
| Upcoming Milestones | List | Next 10 project milestones |

### Recent Activity Feed

Displays the last 20 system activities (lead created, order approved, payment received, etc.) with timestamp and user name.

## 5.3 Role-Specific Dashboard Views

| Role | Additional Widgets |
|------|-------------------|
| Sales Manager | Team pipeline, conversion rates, call activity summary |
| Project Manager | My projects progress, upcoming deadlines, budget utilization |
| Finance | Cash flow, outstanding AR/AP, bank balance |
| HR | Attendance today, pending leaves, upcoming reviews |
| Site Engineer | Today's tasks, material requests status, daily progress pending |

## 5.4 Business Rules

- Dashboard data is scoped by the user's role and data access level.
- Sales Executives see only their own pipeline metrics.
- Managers see aggregated team metrics.
- All monetary values displayed in INR (Indian Rupees).
- Date range defaults to current month; can be changed via date picker.

---

# 6. Sales & CRM

## 6.1 Leads

### 6.1.1 Overview

The Leads module captures and manages prospective clients from initial contact through qualification to conversion. Leads can be created manually, imported from Callyzer call logs, or generated through the Customer Portal.

**URL**: `/admin/crm` (CRM Dashboard with leads view)
**Access**: Sales Manager (full), Sales Executive (own), Pre-Sales (full), AGM Sales (full), Channel Partner Manager (partner leads)

### 6.1.2 Lead Fields

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| Lead ID | Auto-generated | Yes | `IP-LD-YYYYMMDD-XXXX` | Unique lead identifier |
| First Name | Text | Yes | Min 2, Max 50 chars | Prospect's first name |
| Last Name | Text | Yes | Min 1, Max 50 chars | Prospect's last name |
| Email | Email | No | Valid email format | Contact email |
| Phone | Phone | Yes | 10-digit Indian mobile | Primary contact number |
| Alternate Phone | Phone | No | 10-digit | Secondary contact |
| Source | Select | Yes | See dropdown options | How the lead was acquired |
| Status | Select | Yes | See status workflow | Current lead status |
| Assigned To | Select (User) | Yes | Must be active sales user | Sales person responsible |
| City | Select | Yes | Bengaluru/Mysuru/Hyderabad | Lead's city |
| Location/Area | Text | No | Max 100 chars | Specific locality |
| Property Type | Select | Yes | See dropdown options | Type of property |
| Budget Range | Select | Yes | See dropdown options | Client's stated budget |
| Requirement | Textarea | No | Max 500 chars | Description of client needs |
| Lead Score | Number | Auto | 0-100, calculated | Automated lead quality score |
| Next Follow-up | Date | No | Must be future date | Scheduled follow-up date |
| Tags | Multi-select | No | Max 10 tags | Custom categorization |
| Channel Partner | Select | No | Active partner | If referred by partner |
| Created By | Auto | Yes | Logged-in user | Who created the lead |
| Created Date | Auto | Yes | Current timestamp | When lead was created |
| Last Modified | Auto | Yes | Updated on save | Last update timestamp |

### 6.1.3 Lead Source Dropdown Options

| Value | Description |
|-------|-------------|
| Website | Lead from hoh108.com contact form |
| Walk-in | Client visited showroom/office |
| Referral | Referred by existing client |
| Channel Partner | Referred by registered channel partner |
| Google Ads | Google PPC campaign |
| Facebook | Facebook/Instagram ad or organic |
| JustDial | JustDial listing inquiry |
| IndiaMART | IndiaMART inquiry |
| Sulekha | Sulekha listing |
| HomeLane | HomeLane partnership leads |
| Callyzer | Imported from Callyzer call logs |
| Exhibition | Trade show or exhibition |
| Newspaper | Print media response |
| Other | Other source (specify in notes) |

### 6.1.4 Lead Status Workflow

```
New --> Contacted --> Qualified --> Site Visit Scheduled --> Site Visit Done
                                        |
                                        v
                        Proposal Sent --> Negotiation --> Won --> Convert to Customer
                                                          |
                                                          v
                                                        Lost --> Lost Reason Captured
                                                          |
                                                          v
                                                     Reactivated (back to Contacted)
```

| Status | Description | Next Possible Statuses |
|--------|-------------|----------------------|
| New | Freshly created, not yet contacted | Contacted, Lost |
| Contacted | First call/email made | Qualified, Lost |
| Qualified | Need confirmed, budget validated | Site Visit Scheduled, Lost |
| Site Visit Scheduled | Appointment set for site measurement | Site Visit Done, Lost |
| Site Visit Done | Measurement and consultation complete | Proposal Sent, Lost |
| Proposal Sent | Quotation/BOQ shared with client | Negotiation, Lost |
| Negotiation | Price/scope discussion in progress | Won, Lost |
| Won | Client accepted; ready for conversion | (Convert to Customer) |
| Lost | Lead did not convert | Reactivated |
| Reactivated | Previously lost lead being re-engaged | Contacted |

### 6.1.5 Procedures

#### Create a New Lead

1. Navigate to **Sales & CRM > Leads**.
2. Click **+ New Lead** button (top-right).
3. A modal or form opens with all lead fields.
4. Fill in required fields: First Name, Last Name, Phone, Source, City, Property Type, Budget Range.
5. Select **Assigned To** (defaults to current user for Sales Executives).
6. Click **Save**.
7. System generates Lead ID and sets status to "New".
8. If round-robin assignment is enabled, the system auto-assigns based on rotation rules.
9. Notification sent to assigned sales person.

#### Edit a Lead

1. Click on any lead in the list to open detail view.
2. Click **Edit** button.
3. Modify desired fields.
4. Click **Save**.
5. System records change in audit trail.
6. If status changed, workflow rules execute (notifications, etc.).

#### Convert a Lead to Customer

1. Open a lead with status "Won".
2. Click **Convert to Customer**.
3. System creates a Customer record pre-filled with lead data.
4. Optionally create a linked Project.
5. Lead status changes to "Converted".
6. Lead record is archived but remains searchable.

#### Import Leads from Callyzer

1. Navigate to **Settings > Callyzer**.
2. System syncs call logs via Callyzer API v2.1.
3. New numbers not in the system are auto-created as leads with Source = "Callyzer".
4. Existing contacts are linked to their call activities.
5. **API Details**: POST to `api1.callyzer.co/api/v2.1/call-log/summary` with `call_from` and `call_to` as UNIX timestamps.

#### Delete a Lead

1. Only Super Admin and Company Admin can delete leads.
2. Open lead detail view.
3. Click **Delete** (red button).
4. Confirm in modal: "Are you sure? This action cannot be undone."
5. Lead is soft-deleted (marked `isDeleted: true`, not purged from database).

#### Bulk Operations

- **Bulk Assign**: Select multiple leads via checkboxes, click "Assign To", select user.
- **Bulk Status Update**: Select leads, click "Update Status", choose new status.
- **Export**: Click Export button to download leads as CSV/Excel.
- **Filter**: By status, source, city, assigned user, date range, budget range.

### 6.1.6 Business Rules

1. A lead cannot skip statuses (must follow the workflow sequence).
2. "Lost" status requires a mandatory **Lost Reason** (dropdown: Budget, Timeline, Competition, No Response, Not Interested, Other).
3. Leads older than 30 days with status "New" are auto-flagged as "Stale".
4. Round-robin assignment distributes leads equally among active sales executives (see Section 27).
5. Lead Score is auto-calculated based on scoring rules (see Section 6.8).
6. Duplicate detection: System warns if a lead with the same phone number already exists.
7. Phone number format: Must be 10 digits, auto-stripped of +91/0 prefix.

### 6.1.7 Tips and Best Practices

- Always log the lead source accurately for marketing ROI tracking.
- Set follow-up dates for every active lead to prevent leads going cold.
- Use tags to segment leads (e.g., "High Value", "Renovation", "New Build").
- Check the CRM Dashboard daily for stale leads that need attention.
- Convert won leads to customers promptly to start the project workflow.

---

## 6.2 Call Activities

### 6.2.1 Overview

Call Activities logs all phone interactions with leads and customers. Integrates with Callyzer for automatic call recording import.

**URL**: `/admin/crm` (Call Activities tab)
**Access**: Sales Manager, Sales Executive, Pre-Sales, AGM Sales

### 6.2.2 Call Activity Fields

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| Activity ID | Auto | Yes | System-generated | Unique identifier |
| Lead/Customer | Reference | Yes | Must exist in system | Linked contact |
| Call Type | Select | Yes | Inbound/Outbound/Missed | Direction of call |
| Call Date | Date | Yes | Cannot be future | When the call occurred |
| Call Time | Time | Yes | Valid time format | Time of the call |
| Duration | Number | Yes | In seconds, min 0 | Call length |
| Call Outcome | Select | Yes | See options | Result of the call |
| Notes | Textarea | No | Max 1000 chars | Summary of discussion |
| Recording URL | URL | Auto | From Callyzer | Link to call recording |
| Called By | Reference | Yes | Active user | Who made/received the call |

### 6.2.3 Call Outcome Options

| Value | Description |
|-------|-------------|
| Connected - Interested | Spoke with prospect, showed interest |
| Connected - Not Interested | Spoke with prospect, declined |
| Connected - Follow-up | Spoke, agreed to next steps |
| Connected - Wrong Number | Number does not belong to prospect |
| Not Answered | Call was not picked up |
| Busy | Line was busy |
| Switched Off | Phone was switched off |
| DND | Number is on Do Not Disturb registry |
| Voicemail | Left a voicemail message |

### 6.2.4 Callyzer Integration Details

- **Sandbox API**: `sandbox.api.callyzer.co/api/v2.1`
- **Production API**: `api1.callyzer.co/api/v2.1`
- **API Key**: Configured in Settings > Callyzer
- **Sync Method**: All endpoints use POST method (not GET)
- **Date Parameters**: `call_from` and `call_to` as UNIX timestamps (seconds)
- **Response Format**: `{ result: [...], message, total_records, page_no, page_size }`
- **Key fields**: `emp_number`, `emp_name`, `call_date`, `call_time`, `call_recording_url`
- **Sync Frequency**: Configurable (default: every 30 minutes)

### 6.2.5 Procedures

#### Log a Manual Call Activity

1. Navigate to **Sales & CRM > Call Activities**.
2. Click **+ Log Call**.
3. Search and select the Lead or Customer.
4. Select Call Type (Inbound/Outbound/Missed).
5. Enter Date, Time, Duration.
6. Select Outcome.
7. Add notes summarizing the conversation.
8. Click **Save**.

#### View Callyzer Synced Calls

1. Calls synced from Callyzer appear automatically in the list.
2. They are marked with a "Callyzer" badge.
3. Click the recording icon to play the call recording.
4. System auto-matches calls to leads/customers by phone number.

---

## 6.3 Customers

### 6.3.1 Overview

Customers are converted leads with active or completed projects. The Customer record is the central entity linking projects, invoices, payments, and communications.

**URL**: `/admin/crm` (Customers tab)
**Access**: Sales Manager (full), Sales Executive (read), Project Manager (read), Finance (read)

### 6.3.2 Customer Fields

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| Customer ID | Auto | Yes | `IP-CUST-XXXX` | Unique identifier |
| Name | Text | Yes | Min 2, Max 100 | Full name |
| Email | Email | Yes | Valid email | Primary email |
| Phone | Phone | Yes | 10-digit | Primary phone |
| Alternate Phone | Phone | No | 10-digit | Secondary phone |
| Address | Textarea | Yes | Max 500 | Full address |
| City | Select | Yes | Bengaluru/Mysuru/Hyderabad | City |
| PIN Code | Text | No | 6-digit | Postal code |
| PAN | Text | No | AAAAA9999A format | PAN number (for TDS) |
| GST Number | Text | No | 15-char GST format | If registered |
| Property Type | Select | Yes | Villa/Apartment/Penthouse/Commercial/Bungalow | Property category |
| Source Lead | Reference | Auto | Original lead ID | Linked lead |
| Assigned Sales | Reference | Yes | Active sales user | Account owner |
| Assigned PM | Reference | No | Active PM | Project manager |
| KYC Status | Select | Auto | Pending/Verified/Rejected | KYC verification status |
| Portal Access | Boolean | No | true/false | Customer portal enabled |
| Total Project Value | Currency | Auto | Calculated | Sum of all project values |
| Total Paid | Currency | Auto | Calculated | Sum of all payments |
| Outstanding | Currency | Auto | Calculated | Total Value - Total Paid |
| Status | Select | Yes | Active/Inactive/Completed | Customer status |

### 6.3.3 Procedures

#### Create a Customer (Manual)

1. Navigate to **Sales & CRM > Customers**.
2. Click **+ New Customer**.
3. Fill all required fields.
4. Click **Save**.
5. Optionally enable Portal Access and send credentials via email.

#### Create a Customer (from Lead Conversion)

1. This is the preferred method (see Section 6.1.5 - Convert a Lead).
2. All lead data auto-populates into the customer record.
3. Additional fields (PAN, GST, address details) must be filled manually.

---

## 6.4 Sales Orders

### 6.4.1 Overview

Sales Orders formalize the commercial agreement between Interior Plus and the customer. They reference approved quotations and serve as the basis for project creation, invoicing, and procurement.

**URL**: `/admin/sales-orders`
**Access**: Sales Manager (CRUD + Approve), Sales Executive (Create/Read/Update own), Finance (Read), Project Manager (Read)

### 6.4.2 Sales Order Fields

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| SO Number | Auto | Yes | `IP-SO-YYYYMM-XXXX` | Unique identifier |
| Customer | Reference | Yes | Active customer | Customer for this order |
| Quotation Ref | Reference | No | Approved quotation | Linked quotation |
| Order Date | Date | Yes | Cannot be future | Date of order |
| Delivery Date | Date | Yes | Must be after order date | Expected delivery |
| Project Type | Select | Yes | Full Interior/Modular Kitchen/Wardrobe/Renovation/Civil/Turnkey | Scope type |
| City | Select | Yes | Bengaluru/Mysuru/Hyderabad | Project city |
| Site Address | Textarea | Yes | Max 500 | Project site location |
| Line Items | Array | Yes | Min 1 item | Items/services in this order |
| Subtotal | Currency | Auto | Sum of line items | Before tax |
| GST Rate | Select | Yes | 0%/5%/12%/18%/28% | Applicable GST |
| GST Amount | Currency | Auto | Subtotal x GST% | Tax amount |
| Discount | Currency | No | Max 20% of subtotal | Negotiated discount |
| Grand Total | Currency | Auto | Subtotal + GST - Discount | Final order value |
| Payment Terms | Select | Yes | See options | Payment schedule |
| Status | Select | Auto | Draft/Pending Approval/Approved/In Progress/Completed/Cancelled | Order lifecycle |
| Approved By | Reference | Auto | Manager/Admin | Who approved |
| Notes | Textarea | No | Max 1000 | Internal notes |

### 6.4.3 Line Item Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Item Description | Text | Yes | What is being delivered |
| Category | Select | Yes | Furniture/Civil/Electrical/Plumbing/Painting/False Ceiling/Flooring/Kitchen/Wardrobe/Other |
| Quantity | Number | Yes | Min 1 |
| Unit | Select | Yes | Nos/SqFt/RFt/Lump Sum/Set |
| Unit Price | Currency | Yes | Price per unit |
| Amount | Currency | Auto | Qty x Unit Price |

### 6.4.4 Payment Terms Options

| Term | Description |
|------|-------------|
| 50-40-10 | 50% advance, 40% at site, 10% on completion |
| 40-30-20-10 | 40% advance, 30% production, 20% installation, 10% handover |
| 30-30-30-10 | Equal thirds plus retention |
| Custom | Custom milestone-based terms |
| 100% Advance | Full payment upfront |

### 6.4.5 Sales Order Status Workflow

```
Draft --> Pending Approval --> Approved --> In Progress --> Completed
    \                            |                             |
     --> Cancelled           Rejected (back to Draft)      Cancelled
```

### 6.4.6 Procedures

#### Create a Sales Order

1. Navigate to **Sales & CRM > Sales Orders**.
2. Click **+ New Sales Order**.
3. Select Customer (search by name or ID).
4. Optionally link an approved Quotation (auto-fills line items).
5. Set Order Date and Expected Delivery Date.
6. Select Project Type and enter Site Address.
7. Add Line Items:
   a. Click **+ Add Item**.
   b. Enter Description, Category, Quantity, Unit, Unit Price.
   c. Amount auto-calculates.
   d. Repeat for all items.
8. Select GST Rate. GST Amount auto-calculates.
9. Enter Discount if applicable.
10. Select Payment Terms.
11. Add Notes (optional).
12. Click **Save as Draft** or **Submit for Approval**.

#### Approve a Sales Order

1. Sales Manager or Company Admin receives notification.
2. Navigate to **Sales & CRM > Sales Orders** or **Notifications & Approvals**.
3. Open the pending order.
4. Review all details, line items, pricing.
5. Click **Approve** or **Reject** (with reason).
6. On approval: Status changes to "Approved", customer is notified, project can be created.

---

## 6.5 Quotations

### 6.5.1 Overview

Quotations are formal price proposals sent to prospective clients. They can be generated from BOQ or created manually. Quotations go through an approval workflow before being sent to the client.

**URL**: `/admin/quotations`
**Access**: Sales Manager, Sales Executive, Designer, Architect

### 6.5.2 Quotation Fields

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| Quote Number | Auto | Yes | `IP-QT-YYYYMM-XXXX` | Unique identifier |
| Lead/Customer | Reference | Yes | Existing record | Who this quote is for |
| Quote Date | Date | Yes | Current date default | Date of creation |
| Valid Until | Date | Yes | Must be after quote date, default +30 days | Expiry date |
| Project Type | Select | Yes | Same as Sales Order | Scope type |
| Property Type | Select | Yes | Villa/Apartment/etc. | Property category |
| City | Select | Yes | Bengaluru/Mysuru/Hyderabad | Location |
| Carpet Area | Number | No | In sq.ft., min 100 | Property size |
| Line Items | Array | Yes | Min 1 item | Quoted items |
| Subtotal | Currency | Auto | Calculated | Pre-tax total |
| GST | Currency | Auto | Calculated | Tax amount |
| Grand Total | Currency | Auto | Calculated | Final quoted value |
| Discount % | Number | No | 0-20% | Discount offered |
| Terms & Conditions | Textarea | No | Max 2000 | Standard T&C |
| Status | Select | Auto | Draft/Pending Approval/Approved/Sent/Accepted/Rejected/Expired | Lifecycle |
| Version | Number | Auto | Starts at 1, increments | Revision number |
| PDF URL | URL | Auto | Generated | Downloadable PDF |

### 6.5.3 Procedures

#### Create a Quotation

1. Navigate to **Sales & CRM > Quotations**.
2. Click **+ New Quotation**.
3. Select Lead or Customer.
4. Fill property details (Type, City, Area).
5. Add line items manually or import from BOQ Generator.
6. Review pricing and totals.
7. Add Terms & Conditions.
8. Click **Save as Draft**.
9. Click **Submit for Approval** when ready.

#### Revise a Quotation

1. Open an existing quotation.
2. Click **Create Revision**.
3. System creates a new version (v2, v3, etc.) with all data copied.
4. Modify pricing, items, or terms.
5. Save and submit for approval.
6. Previous versions remain accessible for audit trail.

#### Send Quotation to Client

1. After approval, click **Send to Client**.
2. System generates a PDF quotation.
3. Email is sent to client with PDF attachment.
4. If Customer Portal is enabled, quotation appears in client's portal.
5. Status changes to "Sent".

---

## 6.6 BOQ Generator

### 6.6.1 Overview

The Bill of Quantities (BOQ) Generator creates detailed room-wise material and labor estimates. It serves as the foundation for accurate quotations and project budgets.

**URL**: `/admin/crm` (BOQ Generator tab)
**Access**: Designer, Architect, Sales Manager, Project Manager

### 6.6.2 BOQ Structure

```
BOQ
 +-- Room 1 (e.g., Master Bedroom)
 |    +-- Category 1 (e.g., Furniture)
 |    |    +-- Item 1 (e.g., King Size Bed - Teak)
 |    |    +-- Item 2 (e.g., Side Table x 2)
 |    +-- Category 2 (e.g., Electrical)
 |         +-- Item 3 (e.g., LED Panel Lights x 4)
 +-- Room 2 (e.g., Living Room)
 |    +-- ...
 +-- Common Areas
      +-- ...
```

### 6.6.3 BOQ Item Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Room | Select/Text | Yes | Room name (Master Bedroom, Living Room, Kitchen, etc.) |
| Category | Select | Yes | Furniture/Civil/Electrical/Plumbing/Painting/False Ceiling/Flooring |
| Item Name | Text | Yes | Specific item description |
| Material | Reference | No | Link to Materials master |
| Specification | Text | No | Dimensions, finish, grade |
| Quantity | Number | Yes | Count or measurement |
| Unit | Select | Yes | Nos/SqFt/RFt/Lump Sum |
| Material Cost | Currency | Yes | Material cost per unit |
| Labor Cost | Currency | Yes | Labor cost per unit |
| Total | Currency | Auto | (Material + Labor) x Qty |
| Markup % | Number | No | Profit margin (default 20%) |
| Client Price | Currency | Auto | Total x (1 + Markup%) |

### 6.6.4 Procedures

#### Create a BOQ

1. Navigate to **Sales & CRM > BOQ Generator**.
2. Click **+ New BOQ**.
3. Select the Lead/Customer and Property Type.
4. Enter Carpet Area.
5. Click **+ Add Room**.
6. Name the room (or select from preset: Master Bedroom, Guest Bedroom, Living Room, Dining, Kitchen, Bathroom 1, Bathroom 2, Balcony, Utility, Pooja Room, Study, Home Theater).
7. For each room, click **+ Add Item**.
8. Fill item details: Category, Name, Spec, Qty, Unit, Material Cost, Labor Cost.
9. Set Markup % (company default or custom).
10. Repeat for all rooms.
11. Review Summary tab showing total material, labor, markup, and grand total.
12. Click **Save**.
13. Click **Generate Quotation** to auto-create a Quotation from the BOQ.

---

## 6.7 Dispatches

### 6.7.1 Overview

Dispatches track the delivery of materials and finished products from workshop/warehouse to project sites.

**URL**: `/admin/crm` (Dispatches tab)
**Access**: Operations (CRUD), Project Manager (CRU), Sales Manager (Read)

### 6.7.2 Dispatch Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Dispatch ID | Auto | Yes | `IP-DSP-YYYYMMDD-XXXX` |
| Project | Reference | Yes | Linked project |
| Customer | Auto | Yes | From project |
| Dispatch Date | Date | Yes | Planned/actual dispatch date |
| Items | Array | Yes | Materials/products being dispatched |
| Vehicle Number | Text | No | Transport vehicle registration |
| Driver Name | Text | No | Driver contact info |
| Driver Phone | Phone | No | 10-digit |
| Dispatch From | Select | Yes | Workshop/Warehouse/Vendor Direct |
| Status | Select | Yes | Planned/Dispatched/In Transit/Delivered/Partial |
| Delivery Proof | File | No | Photo/signature on delivery |
| Notes | Textarea | No | Special instructions |

---

## 6.8 Lead Scoring

### 6.8.1 Overview

Lead Scoring automatically ranks leads based on predefined criteria to help sales teams prioritize high-value prospects.

**URL**: `/admin/crm` (Lead Scoring tab)
**Access**: Sales Manager, Company Admin

### 6.8.2 Scoring Criteria

| Criterion | Points | Condition |
|-----------|--------|-----------|
| Budget > 50L | +25 | High-value prospect |
| Budget 25-50L | +20 | Medium-high value |
| Budget 10-25L | +15 | Medium value |
| Budget 5-10L | +10 | Entry-level project |
| Budget < 5L | +5 | Small project |
| Source = Referral | +15 | High-quality lead source |
| Source = Walk-in | +10 | Showed initiative |
| Source = Website | +8 | Organic interest |
| Source = Google Ads | +5 | Paid acquisition |
| Property = Villa | +10 | Larger scope typically |
| Property = Apartment | +5 | Standard scope |
| City = Bengaluru | +5 | Primary market |
| Responded to call | +10 | Engaged prospect |
| Site visit completed | +15 | Serious buyer |
| Multiple interactions | +5 per interaction | Max +20 |
| Days since creation > 30 | -10 | Aging penalty |
| Days since creation > 60 | -20 | Stale penalty |
| No response to 3+ calls | -15 | Unresponsive |

### 6.8.3 Score Interpretation

| Score Range | Label | Color | Action |
|-------------|-------|-------|--------|
| 80-100 | Hot | Red | Immediate attention, senior exec engagement |
| 60-79 | Warm | Orange | Priority follow-up within 24 hours |
| 40-59 | Moderate | Yellow | Regular follow-up cycle |
| 20-39 | Cool | Blue | Nurture through content/emails |
| 0-19 | Cold | Gray | Low priority, automated nurture only |

---

## 6.9 Surveys

### 6.9.1 Overview

Surveys collect structured feedback from leads (post-site-visit) and customers (post-delivery, satisfaction).

**Access**: Sales Manager, Pre-Sales, Community Manager

### 6.9.2 Survey Types

| Type | Trigger | Fields |
|------|---------|--------|
| Post-Site Visit | After site visit status | Design preference, budget confirmation, timeline, competitor quotes |
| Post-Design | After design presentation | Design satisfaction (1-5), change requests, preferred style |
| Mid-Project | 50% project completion | Communication rating, quality rating, issues faced |
| Post-Handover | After project completion | Overall satisfaction (1-10), NPS score, referral willingness |
| Lost Lead | When lead marked as Lost | Reason for loss, competitor chosen, feedback |

---

## 6.10 CRM Approvals

### 6.10.1 Overview

CRM Approvals manage the review and authorization workflow for quotations, sales orders, discounts, and price overrides.

**URL**: `/admin/crm/approvals`
**Access**: Sales Manager (Approve), Company Admin (Approve), AGM Sales (Approve)

### 6.10.2 Approval Types

| Type | Trigger | Approver | SLA |
|------|---------|----------|-----|
| Quotation | Submit for approval | Sales Manager | 24 hours |
| Sales Order | Submit for approval | Sales Manager/Company Admin | 24 hours |
| Discount > 10% | Discount applied on quotation | Company Admin | 12 hours |
| Discount > 15% | Higher discount | Super Admin | 12 hours |
| Credit Note | Refund/adjustment request | Finance + Company Admin | 48 hours |

---

## 6.11 Design Iterations

### 6.11.1 Overview

Design Iterations tracks the design process from concept to final approval. Designers upload 2D/3D renders, clients provide feedback via portal, and revisions are tracked.

**URL**: `/admin/crm/design-iterations`
**Access**: Designer, Architect, DRM, Project Manager, Sales Manager (read)

### 6.11.2 Design Iteration Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Iteration ID | Auto | Yes | `IP-DES-XXXX` |
| Project | Reference | Yes | Linked project |
| Customer | Auto | Yes | From project |
| Room | Select | Yes | Room being designed |
| Version | Number | Auto | Increments with each revision |
| Design Type | Select | Yes | 2D Layout/3D Render/Material Board/Elevation/Working Drawing |
| Designer | Reference | Yes | Assigned designer |
| Upload | File(s) | Yes | Image/PDF files |
| Client Feedback | Textarea | No | From customer portal |
| Feedback Status | Select | Auto | Pending Review/Approved/Changes Requested/Final |
| Changes Requested | Textarea | No | Specific change details |
| Approved By | Reference | Auto | Customer or PM |
| Due Date | Date | Yes | Design deadline |

### 6.11.3 Design Workflow

```
Concept Upload --> Client Review --> Changes Requested?
                                        |
                                    Yes: Revision Upload --> Client Review (loop)
                                    No: Approved --> Lock Design --> Production
```

---

## 6.12 Channel Partners

### 6.12.1 Overview

Channel Partners are external referral agents, brokers, or businesses who send leads to Interior Plus in exchange for commission.

**Access**: Channel Partner Manager, Sales Manager, Company Admin

### 6.12.2 Channel Partner Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Partner ID | Auto | Yes | `IP-CP-XXXX` |
| Name/Company | Text | Yes | Partner name |
| Contact Person | Text | Yes | Primary contact |
| Phone | Phone | Yes | 10-digit |
| Email | Email | Yes | Valid email |
| City | Select | Yes | Operating city |
| Type | Select | Yes | Broker/Builder/Architect/Interior Designer/Corporate/Individual |
| Commission % | Number | Yes | 1-10% of project value |
| Commission Type | Select | Yes | On Booking/On Payment/On Completion |
| PAN | Text | Yes | For TDS compliance |
| Bank Details | Object | Yes | Account, IFSC, Name |
| Status | Select | Yes | Active/Inactive/Blacklisted |
| Total Leads | Number | Auto | Count of referred leads |
| Converted Leads | Number | Auto | Count of won leads |
| Total Commission Earned | Currency | Auto | Calculated |
| Total Commission Paid | Currency | Auto | Calculated |

---

# 7. Procurement

## 7.1 Vendors

### 7.1.1 Overview

The Vendors module manages supplier relationships, registration, and performance tracking.

**URL**: `/admin/procurement` (Vendors tab)
**Access**: Procurement Manager (full), Operations (CRUD), Finance (read), Company Admin (full)

### 7.1.2 Vendor Fields

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| Vendor ID | Auto | Yes | `IP-VND-XXXX` | Unique identifier |
| Company Name | Text | Yes | Min 3, Max 200 | Vendor business name |
| Contact Person | Text | Yes | Min 2, Max 100 | Primary contact |
| Phone | Phone | Yes | 10-digit | Primary phone |
| Email | Email | Yes | Valid email | Primary email |
| Address | Textarea | Yes | Max 500 | Business address |
| City | Text | Yes | Max 50 | Vendor city |
| State | Select | Yes | Indian states | State |
| PIN Code | Text | No | 6-digit | Postal code |
| GST Number | Text | Yes | 15-char format | GSTIN |
| PAN | Text | Yes | AAAAA9999A | PAN for TDS |
| Bank Name | Text | Yes | Max 100 | Bank name |
| Account Number | Text | Yes | Numeric, 9-18 digits | Bank account |
| IFSC Code | Text | Yes | 11-char format | Branch code |
| Category | Multi-select | Yes | See options | Material categories supplied |
| Rating | Number | Auto | 0-5, calculated | Performance rating |
| Payment Terms | Select | Yes | Advance/15 Days/30 Days/45 Days/60 Days/On Delivery | Standard terms |
| Status | Select | Yes | Active/Inactive/Blacklisted/Pending Approval | Vendor status |
| Portal Access | Boolean | No | true/false | Vendor portal enabled |
| TDS Rate | Select | Yes | 0%/1%/2%/10% | Applicable TDS |
| MSME Registered | Boolean | No | true/false | MSME certification |

### 7.1.3 Vendor Category Options

| Category | Examples |
|----------|----------|
| Plywood & Laminates | Century, Greenply, Merino |
| Hardware & Fittings | Hettich, Hafele, Godrej |
| Countertops & Stone | Granite, Quartz, Marble |
| Electrical | Wires, Switches, MCBs, LED |
| Plumbing | Pipes, Fittings, CP Fittings |
| Paint & Finishes | Asian Paints, Berger, Nippon |
| Glass & Mirror | Toughened glass, mirrors |
| Flooring | Tiles, Vitrified, Wood, Vinyl |
| Modular Components | Kitchen modules, wardrobe systems |
| Civil Materials | Cement, Sand, Bricks, Steel |
| False Ceiling | Gypsum, POP, Grid |
| Fabric & Upholstery | Curtains, sofa fabric |
| Appliances | Kitchen appliances, geysers |
| Transport | Logistics and delivery services |

### 7.1.4 Procedures

#### Register a New Vendor

1. Navigate to **Procurement > Vendors**.
2. Click **+ New Vendor**.
3. Fill all required fields including GST, PAN, bank details.
4. Select applicable material Categories.
5. Set Payment Terms.
6. Click **Save**.
7. Vendor status is set to "Pending Approval".
8. Procurement Manager/Admin approves the vendor.
9. Once approved, vendor can receive Purchase Orders.
10. Optionally enable Portal Access for self-service.

---

## 7.2 Purchase Requisitions

### 7.2.1 Overview

Purchase Requisitions (PR) are internal requests for materials needed for projects. They initiate the procurement workflow.

**URL**: `/admin/procurement` (Purchase Requisitions tab)
**Access**: Project Manager (create), Site Engineer (create), Procurement Manager (full), Company Admin (full)

### 7.2.2 PR Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| PR Number | Auto | Yes | `IP-PR-YYYYMM-XXXX` |
| Project | Reference | Yes | Linked project |
| Requested By | Auto | Yes | Logged-in user |
| Request Date | Date | Auto | Current date |
| Required By Date | Date | Yes | When materials are needed |
| Priority | Select | Yes | Low/Medium/High/Urgent |
| Items | Array | Yes | Materials requested |
| Total Estimated Cost | Currency | Auto | Sum of item estimates |
| Status | Select | Auto | Draft/Submitted/Approved/Partially Ordered/Fully Ordered/Rejected |
| Approved By | Reference | Auto | Approver |
| Approval Date | Date | Auto | When approved |
| Notes | Textarea | No | Special requirements |

### 7.2.3 PR Item Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Material | Reference | Yes | From Materials master |
| Material Code | Auto | Yes | e.g., IP-MAT-001 |
| Description | Text | Yes | Specification details |
| Quantity | Number | Yes | Required quantity |
| Unit | Select | Yes | From material master |
| Estimated Unit Cost | Currency | No | Approximate price |
| Preferred Vendor | Reference | No | Suggested vendor |

### 7.2.4 PR Workflow

```
Draft --> Submitted --> Under Review --> Approved --> PO Created
                            |                          |
                         Rejected              Partially Ordered
                      (back to Draft              |
                       with comments)        Fully Ordered
```

### 7.2.5 Procedures

#### Create a Purchase Requisition

1. Navigate to **Procurement > Purchase Requisitions**.
2. Click **+ New Requisition**.
3. Select the Project.
4. Set Required By Date and Priority.
5. Click **+ Add Item**.
6. Search material from Materials master (auto-fills code and unit).
7. Enter Quantity and optional estimated cost.
8. Optionally select preferred vendor.
9. Repeat for all needed materials.
10. Click **Save as Draft** or **Submit**.
11. On Submit, notification goes to Procurement Manager for approval.

#### Edit a Purchase Requisition

1. Navigate to the PR detail page (click PR Number in list).
2. Click **Edit** (only available when Status is Draft or Rejected).
3. Modify items, quantities, or dates.
4. Click **Save** or **Re-submit**.

---

## 7.3 Purchase Orders

### 7.3.1 Overview

Purchase Orders (PO) are formal orders sent to vendors for materials. They reference approved Purchase Requisitions.

**URL**: `/admin/procurement` (Purchase Orders tab)
**Access**: Procurement Manager (full), Finance (read), Company Admin (full)

### 7.3.2 PO Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| PO Number | Auto | Yes | `IP-PO-YYYYMM-XXXX` |
| Vendor | Reference | Yes | Registered vendor |
| PR Reference(s) | Reference(s) | No | Linked PRs |
| Project | Reference | Yes | Linked project |
| PO Date | Date | Yes | Order date |
| Delivery Date | Date | Yes | Expected delivery |
| Delivery Address | Textarea | Yes | Site or warehouse address |
| Line Items | Array | Yes | Ordered items |
| Subtotal | Currency | Auto | Before tax |
| GST % | Select | Yes | 0/5/12/18/28% |
| GST Amount | Currency | Auto | Calculated |
| Total | Currency | Auto | Subtotal + GST |
| Payment Terms | Select | Yes | Advance/On Delivery/15/30/45/60 Days |
| Status | Select | Auto | Draft/Sent/Acknowledged/Partially Received/Fully Received/Cancelled |
| Approved By | Reference | Auto | Approver |

### 7.3.3 PO Approval Thresholds

| Amount | Approver | SLA |
|--------|----------|-----|
| Up to 50,000 | Procurement Manager | 12 hours |
| 50,001 - 2,00,000 | Operations Manager | 24 hours |
| 2,00,001 - 5,00,000 | AGM Operations | 24 hours |
| Above 5,00,000 | Company Admin | 48 hours |

### 7.3.4 Procedures

#### Create a Purchase Order

1. Navigate to **Procurement > Purchase Orders**.
2. Click **+ New Purchase Order**.
3. Select Vendor.
4. Select Project.
5. Optionally link to approved PR(s).
6. Add Line Items: Material, Qty, Unit, Rate.
7. Select GST rate.
8. Set Delivery Date and Address.
9. Select Payment Terms.
10. Click **Save as Draft**.
11. Click **Submit for Approval** (routes based on PO amount thresholds).
12. After approval, click **Send to Vendor** (email + vendor portal).

#### Edit a Purchase Order

1. Open PO from list view.
2. Click **Edit** (only available in Draft/Rejected status).
3. Modify details in the edit page.
4. Click **Save**.

---

## 7.4 Goods Receipt Notes (GRN)

### 7.4.1 Overview

GRN records the receipt and inspection of materials delivered against Purchase Orders.

**URL**: `/admin/procurement` (GRN tab)
**Access**: Site Engineer (create), Procurement Manager (full), Quality Controller (inspect)

### 7.4.2 GRN Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| GRN Number | Auto | Yes | `IP-GRN-YYYYMMDD-XXXX` |
| PO Reference | Reference | Yes | Linked PO |
| Vendor | Auto | Yes | From PO |
| Project | Auto | Yes | From PO |
| Receipt Date | Date | Yes | Date materials received |
| Received By | Auto | Yes | Logged-in user |
| Items | Array | Yes | Materials received |
| Inspection Status | Select | Yes | Pending/Passed/Failed/Partial |
| Quality Notes | Textarea | No | Inspection observations |
| Photos | File(s) | No | Evidence of receipt/damage |
| Status | Select | Auto | Draft/Submitted/Verified |

### 7.4.3 GRN Item Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Material | Auto | Yes | From PO |
| Ordered Qty | Auto | Yes | From PO line item |
| Received Qty | Number | Yes | Actually received |
| Accepted Qty | Number | Yes | After inspection |
| Rejected Qty | Number | Auto | Received - Accepted |
| Rejection Reason | Select | No | Damaged/Wrong Item/Short Qty/Quality Issue |

### 7.4.4 Procedures

#### Create a GRN

1. Navigate to **Procurement > GRN**.
2. Click **+ New GRN**.
3. Select PO Reference (auto-fills vendor, project, and items).
4. Enter Receipt Date.
5. For each item: Enter Received Qty and Accepted Qty.
6. If items rejected, select Rejection Reason.
7. Upload photos if applicable.
8. Add quality notes.
9. Click **Save**.
10. Stock automatically updated in Inventory for accepted quantities.
11. If Received Qty < Ordered Qty, PO status becomes "Partially Received".

---

## 7.5 Vendor Invoices

### 7.5.1 Overview

Vendor Invoices record bills received from vendors against POs and GRNs.

**URL**: `/admin/procurement/vendor-invoices`
**Access**: Procurement Manager, Finance (full), Company Admin

### 7.5.2 Vendor Invoice Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Invoice Number | Text | Yes | Vendor's invoice number |
| Vendor | Reference | Yes | Issuing vendor |
| PO Reference | Reference | Yes | Linked PO |
| GRN Reference | Reference | No | Linked GRN |
| Invoice Date | Date | Yes | Date on vendor invoice |
| Due Date | Date | Yes | Payment due date |
| Line Items | Array | Yes | Invoice items |
| Subtotal | Currency | Auto | Before tax |
| CGST | Currency | Auto | Central GST |
| SGST | Currency | Auto | State GST |
| IGST | Currency | Auto | Integrated GST (interstate) |
| TDS Amount | Currency | Auto | Based on vendor TDS rate |
| Total | Currency | Auto | Subtotal + GST - TDS |
| Status | Select | Auto | Received/Verified/Approved/Paid/Partially Paid/Disputed |
| Upload | File | Yes | Scanned invoice image/PDF |
| Three-Way Match | Auto | Auto | PO-GRN-Invoice match status |

### 7.5.3 Three-Way Matching

The system automatically performs three-way matching:
1. **PO Check**: Invoice items match PO items (quantity, rate).
2. **GRN Check**: Invoice quantities match accepted quantities in GRN.
3. **Rate Check**: Invoice rates match PO-agreed rates.

| Match Status | Description | Action |
|-------------|-------------|--------|
| Full Match | All three match perfectly | Auto-route for payment |
| Partial Match | Minor variances (<5%) | Flag for manual review |
| Mismatch | Significant discrepancies | Route to Procurement Manager for resolution |

---

## 7.6 Vendor Milestones

### 7.6.1 Overview

Vendor Milestones track progress-based payment triggers for long-duration vendor engagements (e.g., civil contractors, furniture fabricators).

### 7.6.2 Milestone Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Milestone Name | Text | Yes | Description of deliverable |
| Vendor | Reference | Yes | Linked vendor |
| PO Reference | Reference | Yes | Linked PO |
| Percentage | Number | Yes | % of PO value for this milestone |
| Amount | Currency | Auto | PO Total x Percentage |
| Due Date | Date | Yes | Expected completion |
| Status | Select | Yes | Pending/In Progress/Completed/Verified/Paid |
| Verified By | Reference | No | PM or QC who verified completion |
| Verification Date | Date | No | When verified |
| Payment Date | Date | No | When payment released |

---

## 7.7 RFQ (Request for Quotation)

### 7.7.1 Overview

RFQ allows procurement to request price quotes from multiple vendors for comparison.

**Access**: Procurement Manager, Company Admin

### 7.7.2 RFQ Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| RFQ Number | Auto | Yes | `IP-RFQ-YYYYMM-XXXX` |
| Title | Text | Yes | Brief description |
| Items | Array | Yes | Materials needed with specs |
| Vendors Invited | References | Yes | Min 2 vendors, max 10 |
| Response Deadline | Date | Yes | Must be at least 3 days out |
| Status | Select | Auto | Open/Closed/Awarded |
| Responses | Array | Auto | Vendor quotation responses |
| Awarded To | Reference | No | Selected vendor |

### 7.7.3 Procedures

#### Create an RFQ

1. Navigate to **Procurement > RFQ**.
2. Click **+ New RFQ**.
3. Enter Title and add Items (material, spec, quantity, unit).
4. Select Vendors to invite (minimum 2 for comparison).
5. Set Response Deadline.
6. Click **Send RFQ**.
7. Vendors receive email and notification in Vendor Portal.
8. Vendors submit their quoted prices and terms.
9. After deadline, review comparison matrix.
10. Select best vendor and click **Award**.
11. System auto-creates a PO for the awarded vendor.

---

## 7.8 Vendor Performance

### 7.8.1 Overview

Vendor Performance tracks and rates vendors on quality, delivery, and pricing.

### 7.8.2 Performance Metrics

| Metric | Weight | Measurement |
|--------|--------|-------------|
| On-time Delivery | 30% | % of POs delivered on/before due date |
| Quality Acceptance | 30% | % of GRN items accepted vs received |
| Price Competitiveness | 20% | How vendor pricing compares to market/RFQ |
| Communication | 10% | Response time and clarity |
| Invoice Accuracy | 10% | % of invoices matching PO/GRN |

### 7.8.3 Rating Scale

| Score | Rating | Action |
|-------|--------|--------|
| 4.5-5.0 | Excellent | Preferred vendor status |
| 3.5-4.4 | Good | Continue engagement |
| 2.5-3.4 | Average | Performance improvement notice |
| 1.5-2.4 | Poor | Probation, reduce orders |
| 0-1.4 | Critical | Consider blacklisting |

---

# 8. Inventory

## 8.1 Materials

### 8.1.1 Overview

The Materials module is the master catalog of all materials used across projects. Each material has a unique code (IP-MAT-XXX format) and standardized specifications.

**URL**: `/admin/inventory` (Materials tab)
**Access**: Procurement Manager (full), Project Manager (read), Operations (full), Company Admin (full)

### 8.1.2 Material Fields

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| Material Code | Auto/Manual | Yes | `IP-MAT-XXX` format | Unique code |
| Name | Text | Yes | Min 3, Max 200 | Material name |
| Category | Select | Yes | See categories below | Material category |
| Sub-Category | Select | No | Based on category | Further classification |
| Unit of Measure | Select | Yes | Nos/SqFt/RFt/Kg/Ltr/Bag/Bundle/Sheet/Box | Standard UOM |
| HSN Code | Text | Yes | Numeric, 4-8 digits | For GST classification |
| GST Rate | Select | Yes | 0/5/12/18/28% | Applicable GST |
| Standard Rate | Currency | No | Min 0 | Typical purchase price |
| Minimum Stock | Number | No | Min 0 | Reorder level |
| Maximum Stock | Number | No | > Min stock | Overstock threshold |
| Reorder Quantity | Number | No | Min 1 | Default order qty |
| Specifications | Textarea | No | Max 500 | Size, grade, finish |
| Preferred Vendor | Reference | No | Active vendor | Default vendor |
| Status | Select | Yes | Active/Inactive/Discontinued | Material status |
| Image | File | No | JPEG/PNG, max 5MB | Product image |

### 8.1.3 Material Categories

| Category | Sub-Categories |
|----------|---------------|
| Plywood | BWR, Marine, Commercial, MDF, Particle Board, HDF |
| Laminates | Matte, Glossy, Textured, Anti-Fingerprint, Compact |
| Hardware | Hinges, Channels, Handles, Locks, Drawer Systems, Lift Systems |
| Countertop | Granite, Quartz, Corian, Marble, Solid Surface |
| Electrical | Wiring, Switches, MCBs, LED Lights, Fans, Panels |
| Plumbing | PVC Pipes, CPVC, CP Fittings, Sinks, Faucets |
| Paint | Interior, Exterior, Primer, Putty, Wood Finish |
| Tiles & Flooring | Ceramic, Vitrified, Porcelain, Wood, Vinyl, Marble |
| Glass | Toughened, Frosted, Mirror, Lacquered |
| Civil | Cement, Sand, Aggregate, Steel, Bricks, AAC Blocks |
| False Ceiling | Gypsum Board, POP, Metal Grid, Wooden |
| Adhesives | Fevicol, PU Adhesive, Tile Adhesive, Silicone |
| Edge Band | PVC, ABS, Acrylic |
| Accessories | Baskets, Hooks, Curtain Tracks, Organizers |

---

## 8.2 Stock Management

### 8.2.1 Overview

Stock Management tracks current inventory levels across locations (warehouse, project sites, workshop).

**URL**: `/admin/inventory/stock-management`
**Access**: Operations (full), Project Manager (read/update), Procurement Manager (read)

### 8.2.2 Stock Fields

| Field | Type | Description |
|-------|------|-------------|
| Material | Reference | Linked to Materials master |
| Location | Select | Warehouse/Workshop/Site-[ProjectName] |
| Available Qty | Number | Current free stock |
| Reserved Qty | Number | Allocated to work orders |
| On-Order Qty | Number | In approved POs not yet received |
| Total Qty | Auto | Available + Reserved |
| Last Updated | Date | Last stock update timestamp |
| Valuation Method | Select | FIFO/Weighted Average |
| Unit Cost | Currency | Current valuation per unit |
| Total Value | Currency | Total Qty x Unit Cost |

### 8.2.3 Stock Alert Rules

| Alert | Condition | Notification To |
|-------|-----------|----------------|
| Low Stock | Available Qty < Minimum Stock | Procurement Manager, Operations |
| Overstock | Total Qty > Maximum Stock | Procurement Manager |
| Negative Stock | Available Qty < 0 (data error) | IT Admin |
| No Movement 90 days | No transactions in 90 days | Operations |

---

## 8.3 Stock Movements

### 8.3.1 Overview

Stock Movements records every transaction that changes stock quantity.

**URL**: `/admin/inventory/stock-movements`
**Access**: Operations, Procurement Manager (read), Finance (read)

### 8.3.2 Movement Types

| Type | Description | Stock Effect |
|------|-------------|-------------|
| GRN Receipt | Materials received from vendor | +Qty at location |
| Issue to Project | Materials sent to project site | -Qty at source, +Qty at site |
| Return from Site | Unused materials returned | -Qty at site, +Qty at warehouse |
| Inter-Location Transfer | Move between locations | -Source, +Destination |
| Write-off | Damaged or lost materials | -Qty, logged as loss |
| Adjustment | Physical count correction | +/- Qty |
| Production Issue | Issued to work order | -Qty, linked to WO |

### 8.3.3 Movement Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Movement ID | Auto | Yes | `IP-SM-YYYYMMDD-XXXX` |
| Type | Select | Yes | See movement types |
| Material | Reference | Yes | What is moving |
| From Location | Select | Conditional | Source location |
| To Location | Select | Conditional | Destination |
| Quantity | Number | Yes | Amount being moved |
| Reference Document | Reference | No | PO/GRN/WO/PR number |
| Performed By | Auto | Yes | Logged-in user |
| Date | Date | Yes | Transaction date |
| Notes | Text | No | Reason or context |

---

# 9. Projects

## 9.1 All Projects

### 9.1.1 Overview

The Projects module is the operational heart of the system. Each project represents a client engagement from design through construction to handover.

**URL**: `/admin/projects`
**Access**: Project Manager (own/assigned), Site Engineer (assigned), Operations (all), Finance (read), Company Admin (all)

### 9.1.2 Project Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Project ID | Auto | Yes | `IP-PRJ-YYYYMM-XXXX` |
| Project Name | Text | Yes | Client name + Property |
| Customer | Reference | Yes | Linked customer |
| Sales Order | Reference | Yes | Linked SO |
| Project Type | Select | Yes | Full Interior/Modular Kitchen/Wardrobe/Renovation/Civil/Turnkey |
| City | Select | Yes | Bengaluru/Mysuru/Hyderabad |
| Site Address | Textarea | Yes | Complete site address |
| Carpet Area | Number | No | In sq.ft. |
| Project Manager | Reference | Yes | Assigned PM |
| Site Engineer | Reference | No | Assigned SE |
| Designer | Reference | No | Assigned designer |
| Start Date | Date | Yes | Project commencement |
| Target End Date | Date | Yes | Planned completion |
| Actual End Date | Date | No | When actually completed |
| Project Value | Currency | Auto | From Sales Order |
| Status | Select | Yes | See workflow |
| Progress % | Number | Auto | Calculated from milestones |
| Phase | Select | Auto | Design/Procurement/Production/Installation/Finishing/Handover |
| Priority | Select | Yes | Low/Medium/High/Critical |
| Tags | Multi-select | No | Custom tags |

### 9.1.3 Project Status Workflow

```
Planning --> Design Phase --> Procurement --> Production --> Installation
                                                              |
                                                         --> Finishing --> Punch List --> Handover --> Completed
                                                                                                        |
                                                                                                    Warranty
At any point:
 --> On Hold (with reason)
 --> Cancelled (with reason, approval required)
```

| Status | Description |
|--------|-------------|
| Planning | Initial setup, scope definition |
| Design Phase | Design iterations in progress |
| Procurement | Materials being ordered |
| Production | Workshop fabrication underway |
| Installation | On-site installation |
| Finishing | Final touches, painting, cleaning |
| Punch List | Snag list items being resolved |
| Handover | Final inspection and handover |
| Completed | Project delivered |
| On Hold | Paused (reason required) |
| Cancelled | Terminated (approval required) |
| Warranty | Post-completion warranty period |

### 9.1.4 Procedures

#### Create a New Project

1. Navigate to **Projects > All Projects**.
2. Click **+ New Project**.
3. Select Customer and Sales Order.
4. Enter Project Name, Type, Site Address, Area.
5. Assign Project Manager, Site Engineer, Designer.
6. Set Start Date and Target End Date.
7. Select Priority.
8. Click **Save**.
9. Project Wallet is auto-created with budget equal to Project Value.
10. Customer is notified via portal and email.

---

## 9.2 Gantt Chart

### 9.2.1 Overview

The Gantt Chart provides a visual timeline of project phases, tasks, and milestones.

**URL**: `/admin/projects/gantt`
**Access**: Project Manager, Operations, Company Admin

### 9.2.2 Features

- Drag-and-drop task scheduling
- Task dependencies (Finish-to-Start, Start-to-Start)
- Milestone markers (diamonds)
- Critical path highlighting (red)
- Resource allocation view
- Zoom levels: Day, Week, Month, Quarter
- Export to PDF/PNG

### 9.2.3 Task Fields in Gantt

| Field | Type | Description |
|-------|------|-------------|
| Task Name | Text | Activity description |
| Start Date | Date | Planned start |
| End Date | Date | Planned end |
| Duration | Auto | Days between start and end |
| Predecessor | Reference | Dependent task |
| Assigned To | Reference | Responsible person |
| Progress % | Number | Completion percentage |
| Type | Select | Task/Milestone/Phase |

---

## 9.3 Budget & Costing

### 9.3.1 Overview

Budget & Costing provides real-time financial tracking for each project, comparing planned budget vs. actual costs.

**URL**: `/admin/projects/budget`
**Access**: Project Manager (own), Finance (all), Company Admin (all)

### 9.3.2 Budget Categories

| Category | Description | Source |
|----------|-------------|--------|
| Material Cost | Direct material purchases | POs and Vendor Invoices |
| Labor Cost | Worker wages and contractor payments | Labor Tracking entries |
| Overhead | Allocated company overheads | Cost allocation formula |
| Design Cost | Designer time allocation | Employee cost allocation |
| Transport | Logistics and delivery | Dispatch records |
| Contingency | Buffer for unforeseen costs | Typically 5-10% of budget |

### 9.3.3 Budget vs. Actual Display

| Column | Description |
|--------|-------------|
| Budgeted | Planned amount from BOQ/SO |
| Committed | Amount in approved POs |
| Actual | Amount in verified invoices/payments |
| Variance | Budget - Actual |
| Variance % | (Variance / Budget) x 100 |
| Forecast | Projected total cost at completion |

---

## 9.4 Timeline

### 9.4.1 Overview

Timeline provides a linear progress view of project milestones and key dates.

**URL**: `/admin/projects/timeline`
**Access**: Project Manager, Customer (via portal)

---

## 9.5 P2P Tracker (Procure to Pay)

### 9.5.1 Overview

P2P Tracker provides end-to-end visibility of the procurement lifecycle for a project: PR -> PO -> GRN -> Invoice -> Payment.

### 9.5.2 P2P Pipeline Display

```
PR Created --> PO Raised --> Material Received (GRN) --> Invoice Received --> Payment Made
   [Date]       [Date]           [Date]                     [Date]              [Date]
   [Amount]     [Amount]         [Qty]                      [Amount]            [Amount]
```

---

## 9.6 QC Master

### 9.6.1 Overview

Quality Control (QC) Master defines inspection checklists and records quality checks at various project stages.

**Access**: Quality Controller, Project Manager, Site Engineer

### 9.6.2 QC Checklist Categories

| Stage | Checklist Items |
|-------|----------------|
| Civil Foundation | Level check, plumb check, measurements, rebar placement |
| Electrical Rough | Conduit placement, wire gauge, junction boxes, earth |
| Plumbing Rough | Pipe pressure test, alignment, slope, joint integrity |
| Carpentry | Material quality, edge banding, alignment, hardware function |
| Paint Preparation | Surface prep, putty smoothness, primer coat |
| Paint Final | Finish quality, uniform color, no drips/marks |
| Tile Work | Level, grout lines, pattern alignment, edge cuts |
| False Ceiling | Level, frame strength, finish quality |
| Modular Kitchen | Alignment, hardware function, countertop level, backsplash |
| Electrical Final | Switch function, socket test, MCB trip test |
| Plumbing Final | Leak test, flow test, hot/cold cross-check |
| Deep Cleaning | Surface clean, glass, fixtures, floor |
| Final Inspection | Punch list generation, all systems check, client walkthrough |

### 9.6.3 QC Entry Fields

| Field | Type | Description |
|-------|------|-------------|
| Project | Reference | Linked project |
| Stage | Select | From categories above |
| Checklist Item | Text | Specific check |
| Result | Select | Pass/Fail/NA |
| Remarks | Text | Observations |
| Photo | File | Evidence |
| Inspected By | Auto | QC person |
| Inspection Date | Date | When checked |
| Rectification Required | Boolean | If failed, needs fix |
| Rectification Date | Date | When fix completed |
| Re-inspection Result | Select | Pass/Fail |

---

## 9.7 Change Orders

### 9.7.1 Overview

Change Orders document scope changes requested by the client or necessitated by site conditions, with cost impact.

### 9.7.2 Change Order Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| CO Number | Auto | Yes | `IP-CO-XXXX` |
| Project | Reference | Yes | Linked project |
| Requested By | Select | Yes | Client/Internal/Site Condition |
| Description | Textarea | Yes | What is changing |
| Impact on Cost | Currency | Yes | Additional/reduced cost |
| Impact on Timeline | Number | Yes | Days added/reduced |
| New Items | Array | No | Additional scope items |
| Removed Items | Array | No | Deleted scope items |
| Status | Select | Auto | Proposed/Client Approved/Internal Approved/Implemented/Rejected |
| Client Approval | File | No | Signed approval document |

### 9.7.3 Business Rules

1. Change Orders require client approval for scope additions.
2. Cost increases update the Project Wallet budget.
3. A revised quotation may be generated for significant changes.
4. Timeline extensions require PM and Company Admin approval.

---

## 9.8 Risk Register

### 9.8.1 Overview

Risk Register identifies and tracks project risks with mitigation plans.

### 9.8.2 Risk Fields

| Field | Type | Description |
|-------|------|-------------|
| Risk ID | Auto | Unique identifier |
| Project | Reference | Linked project |
| Risk Description | Text | What could go wrong |
| Category | Select | Material Delay/Labor Shortage/Design Change/Weather/Budget Overrun/Quality/Client Decision/Regulatory |
| Probability | Select | Low/Medium/High |
| Impact | Select | Low/Medium/High/Critical |
| Risk Score | Auto | Probability x Impact matrix |
| Mitigation Plan | Textarea | How to prevent or reduce |
| Owner | Reference | Responsible person |
| Status | Select | Identified/Monitoring/Mitigating/Closed |
| Trigger | Text | Early warning signs |

---

## 9.9 Stock Takes

### 9.9.1 Overview

Stock Takes are physical inventory counts at project sites to reconcile system stock with actual quantities.

### 9.9.2 Procedure

1. Navigate to **Projects > Stock Takes**.
2. Select Project and Location.
3. System displays expected stock (from system records).
4. Enter actual counted quantities for each material.
5. System calculates variance.
6. Variances above 5% are flagged for investigation.
7. After review, click **Reconcile** to adjust system stock.
8. Write-off entries created for unaccounted shortages.

---

# 10. Production / PPC

## 10.1 PPC Dashboard

### 10.1.1 Overview

The Production Planning and Control (PPC) Dashboard provides an overview of workshop/factory operations.

**URL**: `/admin/ppc`
**Access**: Operations, Project Manager, Company Admin

### 10.1.2 Dashboard Metrics

| Metric | Description |
|--------|-------------|
| Active Work Orders | Currently in production |
| Pending Material Issues | WOs waiting for materials |
| Production Capacity | % utilization of workshop capacity |
| On-time Completion Rate | % of WOs completed by target date |
| Daily Progress Summary | Units completed today |
| Labor Utilization | Hours logged vs. available |

---

## 10.2 Work Orders

### 10.2.1 Overview

Work Orders (WO) authorize the production/fabrication of items for a project.

**URL**: `/admin/ppc/work-orders`
**Access**: Operations (full), Project Manager (create/read), Site Engineer (read)

### 10.2.2 Work Order Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| WO Number | Auto | Yes | `IP-WO-YYYYMM-XXXX` |
| Project | Reference | Yes | Linked project |
| Item Description | Text | Yes | What is being produced |
| Category | Select | Yes | Furniture/Kitchen/Wardrobe/Door/Window/Custom |
| BOM Reference | Reference | No | Bill of Materials |
| Quantity | Number | Yes | Units to produce |
| Start Date | Date | Yes | Production start |
| Target Date | Date | Yes | Expected completion |
| Assigned Workers | References | No | Production team |
| Priority | Select | Yes | Low/Normal/High/Urgent |
| Status | Select | Auto | Created/Material Pending/In Production/Quality Check/Completed/On Hold |
| Progress % | Number | Manual | Updated during production |
| Actual Completion | Date | Auto | When marked complete |

### 10.2.3 Work Order Workflow

```
Created --> Material Issued --> In Production --> Quality Check --> Completed --> Dispatched
              |                      |                |
        Material Pending       On Hold           QC Failed (rework)
```

---

## 10.3 Bill of Materials (BOM)

### 10.3.1 Overview

BOM defines the materials and quantities required to produce a finished item.

**URL**: `/admin/ppc/bom`
**Access**: Operations, Project Manager, Procurement Manager (read)

### 10.3.2 BOM Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| BOM ID | Auto | Yes | `IP-BOM-XXXX` |
| Product Name | Text | Yes | Finished item name |
| Category | Select | Yes | Same as WO categories |
| Version | Number | Auto | Increments on revision |
| Components | Array | Yes | Materials needed |
| Labor Hours | Number | No | Estimated production hours |
| Instructions | Textarea | No | Production instructions |
| Drawing | File | No | Technical drawing |

### 10.3.3 BOM Component Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Material | Reference | Yes | From Materials master |
| Quantity | Number | Yes | Required per unit |
| Unit | Auto | Yes | From material |
| Wastage % | Number | No | Expected waste (default 5%) |
| Effective Qty | Auto | Yes | Qty x (1 + Wastage%) |
| Unit Cost | Auto | Yes | From material rate |
| Component Cost | Auto | Yes | Effective Qty x Unit Cost |

---

## 10.4 MRP (Material Requirements Planning)

### 10.4.1 Overview

MRP calculates the materials needed across all active work orders and compares against available stock to generate purchase recommendations.

**URL**: `/admin/ppc/mrp`
**Access**: Operations, Procurement Manager

### 10.4.2 MRP Calculation

```
For each material:
  Gross Requirement = Sum(BOM Qty x WO Qty) for all active WOs
  Available Stock = Current stock at relevant locations
  On-Order = Open PO quantities
  Net Requirement = Gross - Available - On Order
  If Net > 0: Generate Purchase Recommendation
```

### 10.4.3 MRP Output

| Column | Description |
|--------|-------------|
| Material | Material name and code |
| Gross Requirement | Total needed |
| Available Stock | Current inventory |
| On-Order | Expected receipts |
| Net Requirement | Shortfall amount |
| Recommended Action | Create PR / No Action / Expedite PO |
| Lead Time | Vendor delivery days |
| Required By | Earliest WO need date |

---

## 10.5 Material Issues

### 10.5.1 Overview

Material Issues record the issuance of materials from inventory to specific work orders.

**URL**: `/admin/ppc/material-issues`
**Access**: Operations (full), Project Manager (create)

### 10.5.2 Material Issue Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Issue Number | Auto | Yes | `IP-MI-YYYYMMDD-XXXX` |
| Work Order | Reference | Yes | Linked WO |
| Issued By | Auto | Yes | Logged-in user |
| Issue Date | Date | Yes | Date of issue |
| Items | Array | Yes | Materials being issued |
| From Location | Select | Yes | Warehouse/Workshop stock |
| Status | Select | Auto | Issued/Partially Returned/Fully Returned |

---

## 10.6 Labor Tracking

### 10.6.1 Overview

Labor Tracking records worker hours against projects and work orders for cost allocation.

**URL**: `/admin/ppc/labor-entries`
**Access**: Operations, Site Engineer, Project Manager

### 10.6.2 Labor Entry Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Entry ID | Auto | Yes | System-generated |
| Worker Name | Text | Yes | Worker/contractor name |
| Worker Type | Select | Yes | Carpenter/Painter/Electrician/Plumber/Mason/Helper/Supervisor |
| Project | Reference | Yes | Linked project |
| Work Order | Reference | No | Specific WO |
| Date | Date | Yes | Work date |
| Hours | Number | Yes | Hours worked (0.5 increments) |
| Hourly Rate | Currency | Yes | Worker rate per hour |
| Total | Currency | Auto | Hours x Rate |
| Task Description | Text | No | What was done |
| Overtime Hours | Number | No | Hours beyond 8 |
| Overtime Rate | Currency | Auto | 1.5x hourly rate |

---

## 10.7 Daily Progress Reports

### 10.7.1 Overview

Daily Progress Reports (DPR) are submitted by Site Engineers and PMs to document on-site activities.

**URL**: `/admin/ppc/daily-progress`
**Access**: Site Engineer (create), Project Manager (create/review), Operations (review)

### 10.7.2 DPR Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| DPR ID | Auto | Yes | System-generated |
| Project | Reference | Yes | Linked project |
| Date | Date | Yes | Report date |
| Submitted By | Auto | Yes | Logged-in user |
| Weather | Select | No | Clear/Rainy/Hot/Cold |
| Activities | Array | Yes | Work done today |
| Manpower | Array | Yes | Workers on site by trade |
| Materials Used | Array | No | Materials consumed |
| Issues/Delays | Textarea | No | Problems encountered |
| Photos | File(s) | Yes | Min 2 site photos |
| Safety Incidents | Textarea | No | Any safety issues |
| Tomorrow's Plan | Textarea | No | Planned activities |

---

## 10.8 Production Costs

### 10.8.1 Overview

Production Costs aggregates all costs (material, labor, overhead) for each work order and project.

**URL**: `/admin/ppc/production-costs`
**Access**: Operations, Finance, Company Admin

### 10.8.2 Cost Breakdown

| Cost Type | Source | Description |
|-----------|--------|-------------|
| Direct Material | Material Issues | Materials consumed by WO |
| Direct Labor | Labor Tracking | Worker hours on WO |
| Machine Cost | Manual entry | Equipment usage |
| Subcontractor | Vendor invoices | Third-party production |
| Overhead Allocation | Formula | Rent, utilities, supervision |

---

# 11. HR Management

## 11.1 Employees

### 11.1.1 Overview

The Employees module maintains complete records of all staff members.

**URL**: `/admin/hr` (Employees tab)
**Access**: HR (full), HR Head (full), Company Admin (full), Managers (read team)

### 11.1.2 Employee Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Employee ID | Auto | Yes | `IP-EMP-XXXX` |
| Full Name | Text | Yes | Legal full name |
| Email | Email | Yes | Official email |
| Phone | Phone | Yes | 10-digit |
| Personal Email | Email | No | Personal email |
| Date of Birth | Date | Yes | For age verification |
| Gender | Select | Yes | Male/Female/Other |
| Blood Group | Select | No | A+/A-/B+/B-/O+/O-/AB+/AB- |
| Department | Reference | Yes | Linked department |
| Designation | Text | Yes | Job title |
| Role | Select | Yes | System role (for access) |
| Reporting To | Reference | Yes | Manager |
| Date of Joining | Date | Yes | Employment start date |
| Employment Type | Select | Yes | Full-time/Part-time/Contract/Intern |
| Probation End | Date | No | If applicable |
| City | Select | Yes | Work location |
| Address | Textarea | Yes | Current address |
| Permanent Address | Textarea | No | Permanent address |
| Aadhaar | Text | No | 12-digit (encrypted) |
| PAN | Text | Yes | For TDS computation |
| UAN | Text | No | Universal Account Number (PF) |
| Bank Name | Text | Yes | Salary bank |
| Account Number | Text | Yes | Salary account |
| IFSC Code | Text | Yes | Branch IFSC |
| Emergency Contact | Text | Yes | Name and phone |
| Photo | File | No | Profile photo |
| Status | Select | Yes | Active/Inactive/On Notice/Relieved |
| CTC | Currency | Yes | Cost to Company (annual) |
| Basic Salary | Currency | Yes | Monthly basic |
| HRA | Currency | Yes | Monthly HRA |
| Special Allowance | Currency | No | Other allowances |

### 11.1.3 Procedures

#### Onboard a New Employee

1. Navigate to **HR Management > Employees**.
2. Click **+ New Employee**.
3. Fill all mandatory fields (personal, department, compensation).
4. Assign Department, Role, and Reporting Manager.
5. Enter compensation details (CTC breakdown).
6. Click **Save**.
7. System generates Employee ID.
8. Create user account: Navigate to **Settings > Users > + New User**.
9. Link user to employee record with appropriate role.
10. Send welcome email with login credentials.
11. Complete the 30-item onboarding checklist (see Section 23).

---

## 11.2 Departments

### 11.2.1 Overview

Departments organize the company structure.

**Access**: HR (full), Company Admin (full)

### 11.2.2 Department Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Department Name | Text | Yes | Unique name |
| Department Code | Text | Yes | Short code (e.g., SALES, OPS, FIN) |
| Head | Reference | Yes | Department head (employee) |
| Parent Department | Reference | No | For hierarchy |
| Status | Select | Yes | Active/Inactive |
| Employee Count | Auto | Yes | Number of active employees |

### 11.2.3 Standard Departments

| Department | Code | Typical Head Role |
|------------|------|------------------|
| Sales & Marketing | SALES | AGM Sales |
| Design | DESIGN | DRM |
| Projects | PROJ | AGM Operations |
| Operations | OPS | AGM Operations |
| Production | PROD | Operations Manager |
| Procurement | PROC | Procurement Manager |
| Finance & Accounts | FIN | Finance Manager |
| Human Resources | HR | HR Head |
| IT & Systems | IT | IT Admin |
| Quality Control | QC | Quality Controller |
| Administration | ADMIN | Admin Manager |

---

## 11.3 Attendance

### 11.3.1 Overview

Attendance tracks daily employee check-in/check-out with location and work hours.

**URL**: `/admin/hr/attendance`
**Access**: HR (full), Managers (team view), Employees (own via self-service)

### 11.3.2 Attendance Fields

| Field | Type | Description |
|-------|------|-------------|
| Employee | Reference | Employee record |
| Date | Date | Attendance date |
| Check-in Time | Time | Start of work |
| Check-out Time | Time | End of work |
| Total Hours | Auto | Check-out - Check-in |
| Status | Select | Present/Absent/Half Day/Work from Home/On Leave/Holiday/Weekend |
| Late | Boolean | Auto if check-in after 10:00 AM |
| Early Out | Boolean | Auto if check-out before 6:00 PM |
| Location | Text | GPS or office location |
| Regularization | Textarea | If manually corrected |

### 11.3.3 Business Rules

- Standard work hours: 9:30 AM to 6:30 PM (9 hours including 30-min lunch).
- Late arrival: After 10:00 AM.
- Half day: Less than 4.5 hours.
- 3 late arrivals in a month = 0.5 leave deducted.
- Attendance regularization requests require manager approval.

---

## 11.4 Leaves

### 11.4.1 Overview

Leave management handles applications, approvals, and balance tracking.

**URL**: `/admin/hr/leaves`
**Access**: HR (full), Employees (own), Managers (team approval)

### 11.4.2 Leave Types

| Type | Annual Quota | Carry Forward | Encashment | Description |
|------|-------------|---------------|------------|-------------|
| Earned Leave (EL) | 12 | Max 12 | Yes (at exit) | Planned leave, apply 7 days in advance |
| Casual Leave (CL) | 6 | No | No | Short notice leave, max 3 consecutive |
| Sick Leave (SL) | 6 | No | No | Medical leave, certificate if > 2 days |
| Maternity Leave | 182 days | NA | NA | Female employees, after 80 working days |
| Paternity Leave | 5 days | No | No | Male employees, around delivery |
| Compensatory Off | Earned | No | No | For working on holidays/weekends |
| Loss of Pay (LOP) | NA | NA | NA | When leave balance exhausted |
| Work From Home | Per policy | NA | NA | Remote work days |

### 11.4.3 Leave Application Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Employee | Auto | Yes | Applicant |
| Leave Type | Select | Yes | From leave types |
| From Date | Date | Yes | Start of leave |
| To Date | Date | Yes | End of leave |
| Duration | Auto | Yes | Working days count |
| Half Day | Boolean | No | If taking half day |
| Reason | Textarea | Yes | Min 10 characters |
| Attachment | File | No | Medical cert for SL > 2 days |
| Status | Select | Auto | Applied/Approved/Rejected/Cancelled |
| Approved By | Reference | Auto | Manager |

### 11.4.4 Leave Approval Workflow

```
Employee Applies --> Manager Receives Notification --> Reviews
   |                                                     |
   |                                             Approve / Reject
   |                                                     |
   +--- If EL applied < 7 days in advance: Auto-flag for review
   +--- If SL > 2 days without certificate: Auto-flag
   +--- If balance insufficient: Show LOP warning
```

---

## 11.5 Reimbursements

### 11.5.1 Overview

Reimbursements process employee expense claims for business-related spending.

**URL**: `/admin/hr/reimbursements`
**Access**: HR (full), All employees (own), Managers (team approval)

### 11.5.2 Reimbursement Categories

| Category | Max Limit | Requires Receipt | Description |
|----------|-----------|-------------------|-------------|
| Travel - Local | 5,000/month | Yes | City travel for work |
| Travel - Outstation | As per policy | Yes | Inter-city travel |
| Fuel | 3,000/month | Yes | Vehicle fuel for work travel |
| Mobile | 500/month | Yes | Business call recharges |
| Food & Entertainment | 2,000/month | Yes | Client meetings |
| Office Supplies | 1,000/claim | Yes | Stationery, small tools |
| Medical | As per policy | Yes | Not covered by insurance |
| Training | Pre-approved | Yes | Courses, certifications |
| Other | Per approval | Yes | Miscellaneous |

### 11.5.3 Reimbursement Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Claim ID | Auto | Yes | `IP-RMB-YYYYMM-XXXX` |
| Employee | Auto | Yes | Claimant |
| Category | Select | Yes | From categories |
| Expense Date | Date | Yes | When expense incurred |
| Amount | Currency | Yes | Claimed amount |
| Description | Text | Yes | What the expense was for |
| Receipt | File | Yes | Photo/scan of bill |
| Project | Reference | No | If project-related |
| Status | Select | Auto | Submitted/Under Review/Approved/Rejected/Paid |
| Approved Amount | Currency | No | May differ from claimed |
| Rejection Reason | Text | No | If partially/fully rejected |

---

## 11.6 Advance Requests

### 11.6.1 Overview

Advance Requests allow employees to request salary advances or project-related cash advances.

**URL**: `/admin/hr/advance-requests`
**Access**: HR (full), All employees (own), Managers (team approval)

### 11.6.2 Advance Types

| Type | Max Amount | Repayment | Approval |
|------|-----------|-----------|----------|
| Salary Advance | 1 month basic | Deducted in next payroll | HR Head |
| Project Cash Advance | Per PO value | Settled against bills | Finance + PM |
| Emergency Advance | 50,000 | 3-month EMI deduction | HR Head + Company Admin |
| Travel Advance | Estimated cost | Settled post-trip | Manager + HR |

---

## 11.7 Salary

### 11.7.1 Overview

Salary management defines compensation structure for each employee.

**Access**: HR Head, Finance, Company Admin

### 11.7.2 Salary Components

| Component | Type | Calculation | Taxable |
|-----------|------|------------|---------|
| Basic Salary | Fixed | 40-50% of CTC | Yes |
| HRA | Fixed | 40-50% of Basic | Partially exempt |
| Special Allowance | Fixed | Balancing figure | Yes |
| PF (Employee) | Deduction | 12% of Basic (max 1,800) | Exempt up to limit |
| PF (Employer) | Company cost | 12% of Basic (max 1,800) | NA |
| ESI (Employee) | Deduction | 0.75% of Gross (if < 21,000/month) | Exempt |
| Professional Tax | Deduction | Per state slab (max 200/month) | Yes |
| TDS | Deduction | Per income tax slabs | NA |
| Performance Bonus | Variable | Per review cycle | Yes |
| Overtime | Variable | Per labor tracking | Yes |

---

## 11.8 Payroll

### 11.8.1 Overview

Payroll generates monthly salary computation for all employees.

**URL**: `/admin/hr/payroll`
**Access**: HR Head, Finance, Company Admin

### 11.8.2 Payroll Processing Steps

1. Navigate to **HR > Payroll**.
2. Select Month and Year.
3. Click **Generate Payroll**.
4. System computes:
   - Attendance days (from attendance records)
   - Leave deductions (LOP days)
   - Advance deductions
   - Reimbursement additions
   - Statutory deductions (PF, ESI, PT, TDS)
5. Review payslip for each employee.
6. Adjust if needed (overtime, bonuses, corrections).
7. Click **Approve Payroll** (requires HR Head or Company Admin).
8. Click **Process Payment** to initiate bank transfers.
9. Payslips auto-generated and emailed to employees.

### 11.8.3 Payslip Fields

| Section | Components |
|---------|-----------|
| Earnings | Basic, HRA, Special Allowance, Overtime, Bonus, Reimbursements |
| Deductions | PF, ESI, PT, TDS, LOP Deduction, Advance Recovery, Other |
| Summary | Gross Earnings, Total Deductions, Net Pay |

---

## 11.9 Employee Letters

### 11.9.1 Overview

Generate standardized HR letters from templates.

**URL**: `/admin/hr/employee-letters`
**Access**: HR (full), Company Admin

### 11.9.2 Letter Types

| Letter | When Used | Auto-populated Fields |
|--------|-----------|----------------------|
| Offer Letter | Before joining | Name, Designation, CTC, DOJ |
| Appointment Letter | On joining | Name, Designation, CTC, DOJ, Terms |
| Confirmation Letter | After probation | Name, Designation, Confirmation Date |
| Increment Letter | After appraisal | Name, Old CTC, New CTC, Effective Date |
| Warning Letter | Disciplinary | Name, Incident, Date, Action |
| Experience Letter | On exit | Name, DOJ, Last Working Day, Designation |
| Relieving Letter | On exit | Name, DOJ, Last Working Day |
| Transfer Letter | Location change | Name, Old/New Location, Effective Date |
| Address Proof | On request | Name, Address, DOJ |

---

## 11.10 Assets

### 11.10.1 Overview

Track company assets assigned to employees (laptops, phones, ID cards, tools).

### 11.10.2 Asset Fields

| Field | Type | Description |
|-------|------|-------------|
| Asset ID | Auto | `IP-AST-XXXX` |
| Asset Name | Text | Description |
| Category | Select | Laptop/Phone/ID Card/Key/Vehicle/Tool/Uniform |
| Serial Number | Text | Manufacturer serial |
| Purchase Date | Date | When acquired |
| Purchase Cost | Currency | Cost |
| Assigned To | Reference | Employee |
| Assignment Date | Date | When given |
| Return Date | Date | When returned (if returned) |
| Condition | Select | New/Good/Fair/Damaged/Written Off |
| Status | Select | Available/Assigned/Under Repair/Written Off |

---

## 11.11 Skill Matrix

### 11.11.1 Overview

Skill Matrix maps employee skills and proficiency for workforce planning.

### 11.11.2 Skill Entry Fields

| Field | Type | Description |
|-------|------|-------------|
| Employee | Reference | Employee |
| Skill | Text | Skill name (e.g., AutoCAD, Project Management) |
| Category | Select | Technical/Soft/Domain/Tool/Certification |
| Proficiency | Select | Beginner/Intermediate/Advanced/Expert |
| Certified | Boolean | Has external certification |
| Certification Name | Text | If certified |
| Expiry Date | Date | Certification validity |
| Last Assessed | Date | When last evaluated |

---

## 11.12 Exit Management

### 11.12.1 Overview

Exit Management handles the employee separation process from resignation to final settlement.

### 11.12.2 Exit Workflow

```
Resignation Submitted --> Manager Acknowledgment --> Notice Period -->
   Handover Initiation --> Asset Return --> IT Access Revocation -->
   Knowledge Transfer --> Final Settlement Calculation -->
   Experience/Relieving Letter --> Exit Interview --> Account Closure
```

### 11.12.3 Exit Checklist

| Item | Owner | Description |
|------|-------|-------------|
| Resignation acceptance | Manager | Approve/negotiate |
| Notice period calculation | HR | Per employment terms |
| Handover plan | Employee + Manager | Document knowledge transfer |
| Project reassignment | PM/Manager | Reassign active projects |
| Asset return | IT/Admin | Laptop, phone, ID, keys |
| Email/system access | IT Admin | Deactivate accounts |
| Leave encashment | HR + Finance | Calculate EL balance |
| Full & final settlement | Finance | Pending salary, reimbursements, deductions |
| PF withdrawal/transfer | HR | Initiate PF process |
| Gratuity (if eligible) | HR + Finance | 5+ years of service |
| Experience letter | HR | Generate from template |
| Relieving letter | HR | Generate from template |
| Exit interview | HR | Feedback collection |
| NDAs and IP | Legal | Remind of obligations |

---

# 12. Performance Management

## 12.1 KRA Master

### 12.1.1 Overview

Key Result Areas (KRA) define the broad responsibility areas for each role.

**URL**: `/admin/performance` (KRA Master tab)
**Access**: HR Head (full), Company Admin (full), Managers (read)

### 12.1.2 KRA Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| KRA Name | Text | Yes | Area of responsibility |
| Description | Textarea | Yes | Detailed description |
| Department | Reference | Yes | Applicable department |
| Weight | Number | Yes | Percentage weight (all KRAs for a role must sum to 100%) |
| Status | Select | Yes | Active/Inactive |

### 12.1.3 Sample KRAs by Role

| Role | KRA | Weight |
|------|-----|--------|
| Sales Executive | Lead Conversion | 30% |
| Sales Executive | Revenue Achievement | 40% |
| Sales Executive | Customer Satisfaction | 15% |
| Sales Executive | CRM Compliance | 15% |
| Project Manager | On-time Delivery | 30% |
| Project Manager | Budget Adherence | 25% |
| Project Manager | Client Satisfaction | 25% |
| Project Manager | Team Management | 20% |
| Site Engineer | Work Quality | 35% |
| Site Engineer | Daily Reporting | 20% |
| Site Engineer | Safety Compliance | 25% |
| Site Engineer | Material Management | 20% |

---

## 12.2 KPI Master

### 12.2.1 Overview

Key Performance Indicators (KPI) are measurable metrics within each KRA.

### 12.2.2 KPI Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| KPI Name | Text | Yes | Specific metric |
| KRA | Reference | Yes | Parent KRA |
| Unit | Select | Yes | Number/%/Currency/Rating |
| Target | Number | Yes | Expected achievement |
| Threshold | Number | No | Minimum acceptable |
| Stretch | Number | No | Aspirational target |
| Measurement Method | Text | Yes | How to measure |
| Frequency | Select | Yes | Monthly/Quarterly/Annual |
| Data Source | Text | No | Where data comes from |

---

## 12.3 Role Templates

### 12.3.1 Overview

Role Templates pre-configure KRA-KPI combinations for common roles for quick assignment.

---

## 12.4 Reviews

### 12.4.1 Overview

Performance Reviews document the evaluation of employees against their KRA/KPI targets.

**URL**: `/admin/performance/reviews`
**Access**: HR Head (full), Managers (own team), Employees (own, read-only)

### 12.4.2 Review Fields

| Field | Type | Description |
|-------|------|-------------|
| Review ID | Auto | System-generated |
| Employee | Reference | Being reviewed |
| Reviewer | Reference | Manager conducting review |
| Review Cycle | Reference | Linked cycle |
| Period | Date Range | Review period |
| KRA Scores | Array | Score for each KRA |
| KPI Actuals | Array | Actual achievement for each KPI |
| Self-Assessment | Textarea | Employee's self-evaluation |
| Manager Assessment | Textarea | Manager's evaluation |
| Overall Rating | Select | Outstanding/Exceeds/Meets/Below/Unsatisfactory |
| Strengths | Textarea | Positive observations |
| Improvement Areas | Textarea | Areas to develop |
| Goals for Next Period | Textarea | Future objectives |
| Recommended Action | Select | Promotion/Increment/PIP/Retain/No Change |
| Status | Select | Draft/Self-Review/Manager Review/HR Review/Completed |

### 12.4.3 Rating Scale

| Rating | Score | Description |
|--------|-------|-------------|
| Outstanding | 5 | Exceptional performance (top 10%) |
| Exceeds Expectations | 4 | Consistently above targets |
| Meets Expectations | 3 | Achieves all targets satisfactorily |
| Below Expectations | 2 | Misses some targets, needs improvement |
| Unsatisfactory | 1 | Significant underperformance |

---

## 12.5 Review Cycles

### 12.5.1 Overview

Review Cycles define the schedule and parameters for periodic performance evaluations.

**URL**: `/admin/performance/review-cycles`
**Access**: HR Head, Company Admin

### 12.5.2 Cycle Fields

| Field | Type | Description |
|-------|------|-------------|
| Cycle Name | Text | e.g., "FY 2025-26 Annual Review" |
| Type | Select | Quarterly/Half-Yearly/Annual |
| Period From | Date | Start of review period |
| Period To | Date | End of review period |
| Self-Review Deadline | Date | Employee self-review due |
| Manager Review Deadline | Date | Manager review due |
| HR Review Deadline | Date | HR calibration due |
| Applicable To | Select | All/Department/Custom |
| Departments | References | If department-specific |
| Status | Select | Draft/Active/Self-Review/Manager Review/HR Review/Completed |

---

# 13. Finance

## 13.1 Customer Invoices

### 13.1.1 Overview

Customer Invoices are generated against Sales Orders and project milestones.

**URL**: `/admin/finance/customer-invoices`
**Access**: Finance (full), Company Admin (full), Sales Manager (read), Project Manager (read)

### 13.1.2 Invoice Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Invoice Number | Auto | Yes | `IP-INV-YYYYMM-XXXX` |
| Customer | Reference | Yes | Billed customer |
| Sales Order | Reference | Yes | Linked SO |
| Project | Reference | No | Linked project |
| Invoice Date | Date | Yes | Billing date |
| Due Date | Date | Yes | Payment deadline |
| Milestone | Select | No | Which payment milestone |
| Line Items | Array | Yes | Billed items |
| Subtotal | Currency | Auto | Pre-tax total |
| CGST | Currency | Auto | Central GST |
| SGST | Currency | Auto | State GST |
| IGST | Currency | Auto | Interstate GST |
| TDS Deductible | Currency | Auto | If customer deducts TDS |
| Grand Total | Currency | Auto | Final amount due |
| Amount Paid | Currency | Auto | From payment records |
| Balance Due | Currency | Auto | Total - Paid |
| Status | Select | Auto | Draft/Sent/Partially Paid/Paid/Overdue/Cancelled |
| E-Invoice | Boolean | Auto | If e-invoicing applicable |
| IRN | Text | Auto | Invoice Reference Number (from GST portal) |
| QR Code | Image | Auto | Generated for e-invoice |
| PDF | File | Auto | Downloadable invoice PDF |

### 13.1.3 Invoice Generation Procedure

1. Navigate to **Finance > Customer Invoices**.
2. Click **+ New Invoice**.
3. Select Customer and Sales Order.
4. System auto-fills line items from SO.
5. Select Milestone (if milestone-based billing).
6. Verify amounts and tax rates.
7. Click **Save as Draft**.
8. Review and click **Finalize**.
9. Click **Send to Customer** (email + Customer Portal).
10. If e-invoicing applicable, system auto-generates IRN and QR code.

---

## 13.2 Payments

### 13.2.1 Overview

Payments records all money received from customers against invoices.

**Access**: Finance (full), Company Admin

### 13.2.2 Payment Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Payment ID | Auto | Yes | `IP-PAY-YYYYMMDD-XXXX` |
| Customer | Reference | Yes | Paying customer |
| Invoice(s) | Reference(s) | Yes | Applied against which invoice(s) |
| Payment Date | Date | Yes | When received |
| Amount | Currency | Yes | Amount received |
| Payment Mode | Select | Yes | Bank Transfer/Cheque/Cash/UPI/PhonePe/Card/DD |
| Reference Number | Text | No | Transaction/cheque number |
| Bank | Text | No | Receiving bank/account |
| TDS Deducted | Currency | No | If customer deducted TDS |
| TDS Certificate | File | No | Form 16A |
| Status | Select | Auto | Received/Cleared/Bounced/Reversed |
| Notes | Text | No | Additional info |

---

## 13.3 Accounts Receivable (AR)

### 13.3.1 Overview

AR dashboard shows all outstanding customer balances.

### 13.3.2 AR Aging Buckets

| Bucket | Description |
|--------|-------------|
| Current | Not yet due |
| 1-30 Days | Overdue up to 30 days |
| 31-60 Days | Overdue 31-60 days |
| 61-90 Days | Overdue 61-90 days |
| 90+ Days | Severely overdue |

---

## 13.4 Accounts Payable (AP)

### 13.4.1 Overview

AP dashboard shows all outstanding vendor payments.

### 13.4.2 AP Aging Buckets

Same as AR aging structure but for vendor invoices.

---

## 13.5 Bank Reconciliation

### 13.5.1 Overview

Bank Reconciliation matches system transactions with actual bank statement entries.

### 13.5.2 Procedure

1. Navigate to **Finance > Bank Reconciliation**.
2. Upload bank statement (CSV/Excel/PDF).
3. System auto-matches transactions by amount and date.
4. Review unmatched entries.
5. Manually match or create new entries for unreconciled items.
6. Click **Reconcile** to finalize.
7. Generate reconciliation report showing matched, unmatched, and variance.

---

## 13.6 Budget & Forecast

### 13.6.1 Overview

Budget & Forecast manages company-level and department-level annual budgets.

### 13.6.2 Budget Fields

| Field | Type | Description |
|-------|------|-------------|
| Budget Period | Date Range | Fiscal year |
| Department | Reference | Department budget |
| Category | Select | Revenue/COGS/OpEx/CapEx |
| Planned Amount | Currency | Budgeted amount |
| Actual Amount | Currency | Real spending (auto from transactions) |
| Variance | Currency | Planned - Actual |
| Forecast | Currency | Revised estimate |

---

## 13.7 Credit/Debit Notes

### 13.7.1 Overview

Credit Notes (refunds/adjustments to customers) and Debit Notes (additional charges or returns from vendors).

### 13.7.2 Credit Note Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| CN Number | Auto | Yes | `IP-CN-YYYYMM-XXXX` |
| Customer/Vendor | Reference | Yes | Issued to |
| Original Invoice | Reference | Yes | Against which invoice |
| Reason | Select | Yes | Overcharge/Return/Quality Issue/Discount/Scope Reduction/Other |
| Amount | Currency | Yes | Credit/debit amount |
| Tax Adjustment | Currency | Auto | GST impact |
| Status | Select | Auto | Draft/Approved/Applied |
| Approved By | Reference | Auto | Finance + Admin |

---

## 13.8 Ledger Master

### 13.8.1 Overview

Ledger Master maintains the chart of accounts for double-entry bookkeeping.

### 13.8.2 Account Groups

| Group | Type | Examples |
|-------|------|---------|
| Assets | Debit | Bank, Cash, Inventory, Fixed Assets, Receivables |
| Liabilities | Credit | Payables, Loans, GST Payable, TDS Payable |
| Income | Credit | Sales Revenue, Interest Income, Other Income |
| Expenses | Debit | Material Cost, Labor, Rent, Salaries, Utilities |
| Equity | Credit | Capital, Retained Earnings |

---

## 13.9 Ledger Mapping

### 13.9.1 Overview

Ledger Mapping links system transactions to appropriate ledger accounts for automatic posting.

| Transaction Type | Default Ledger | Description |
|-----------------|---------------|-------------|
| Customer Invoice | Sales Revenue + GST Payable + Accounts Receivable | Revenue recognition |
| Customer Payment | Bank + Accounts Receivable | Cash receipt |
| Vendor Invoice | Expense/Inventory + GST Input + Accounts Payable | Cost recording |
| Vendor Payment | Accounts Payable + Bank | Cash disbursement |
| Salary | Salary Expense + PF/ESI/TDS Payable + Bank | Payroll posting |

---

## 13.10 Aging Dashboard

### 13.10.1 Overview

Visual dashboard showing AR and AP aging with drill-down by customer/vendor.

---

## 13.11 Project P&L

### 13.11.1 Overview

Project P&L provides profit and loss statement for each project.

### 13.11.2 P&L Structure

| Line Item | Source |
|-----------|--------|
| **Revenue** | Customer invoices for the project |
| (-) Material Cost | Vendor invoices + material issues |
| (-) Labor Cost | Labor tracking entries |
| (-) Subcontractor Cost | Vendor invoices (contractor category) |
| (-) Transport | Dispatch costs |
| (-) Overhead Allocation | Company overhead formula |
| **= Gross Profit** | Revenue - Direct Costs |
| (-) Sales Commission | If channel partner involved |
| (-) Design Cost | Designer time allocation |
| (-) PM Cost | Project manager time allocation |
| **= Net Profit** | Gross Profit - Indirect Costs |
| **Net Margin %** | Net Profit / Revenue x 100 |

---

# 14. Analytics

## 14.1 Overview Dashboard

**URL**: `/admin/analytics`
**Access**: Company Admin, AGMs, Department Managers

Provides cross-functional KPIs: Revenue, Active Projects, Employee Count, Customer Satisfaction.

## 14.2 Sales Analytics

| Report | Description |
|--------|-------------|
| Pipeline Value | Total value in each sales stage |
| Conversion Funnel | Lead to Customer conversion rates |
| Revenue by Month | Monthly revenue trend |
| Revenue by City | Bengaluru vs Mysuru vs Hyderabad |
| Revenue by Source | Which lead sources generate most revenue |
| Sales by Executive | Individual performance ranking |
| Average Deal Size | Mean project value |
| Sales Cycle Duration | Average days from lead to booking |
| Quotation Win Rate | Accepted / Total quotations |
| Channel Partner ROI | Commission paid vs revenue generated |

## 14.3 Finance Analytics

| Report | Description |
|--------|-------------|
| Revenue vs Collections | Invoiced vs received |
| AR Aging Summary | Outstanding by age bucket |
| AP Aging Summary | Vendor payables by age |
| Cash Flow | Monthly inflows vs outflows |
| Expense Breakdown | Cost categories pie chart |
| Profitability Trend | Monthly/quarterly margin |
| TDS Summary | Tax deducted and deposited |
| GST Summary | Input vs Output tax |

## 14.4 Projects Analytics

| Report | Description |
|--------|-------------|
| Projects by Status | Distribution across statuses |
| On-time vs Delayed | % of projects meeting deadlines |
| Budget Adherence | % within budget |
| Average Duration by Type | Days by project type |
| Resource Utilization | PM/SE workload |
| Change Order Frequency | Average COs per project |
| Quality Metrics | QC pass rates |
| Client Satisfaction | From survey data |

## 14.5 HR Analytics

| Report | Description |
|--------|-------------|
| Headcount | Total and by department |
| Attrition Rate | Monthly/annual turnover |
| Attendance Summary | Present/Absent/Late distribution |
| Leave Utilization | Leave type usage |
| Salary Distribution | CTC ranges by role |
| Skill Coverage | Skills matrix heatmap |
| Performance Distribution | Review rating curve |
| Training Needs | From skill gaps |

---

# 15. Compliance

## 15.1 Compliance Dashboard

**URL**: `/admin/compliance`
**Access**: Company Admin, Finance, IT Admin

Overview of all compliance statuses and upcoming deadlines.

## 15.2 DPDP Consent

### Overview

Digital Personal Data Protection Act consent management. Tracks customer and employee consent for data collection, processing, and storage.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| Person | Reference | Customer or Employee |
| Person Type | Select | Customer/Employee/Vendor |
| Consent Purpose | Select | Marketing/Operations/HR/Analytics |
| Consent Status | Select | Granted/Withdrawn/Pending |
| Consent Date | Date | When granted |
| Withdrawal Date | Date | If withdrawn |
| Method | Select | Digital/Paper/Email |

## 15.3 Data Requests

Handles data subject requests under DPDP Act: access requests, correction requests, deletion requests (right to be forgotten).

## 15.4 E-Invoicing

Manages generation and registration of e-invoices on the GST portal. For invoices to B2B customers above the threshold, an Invoice Reference Number (IRN) is auto-generated and a QR code is embedded on the invoice.

## 15.5 GST Returns

Track GST return filing status and deadlines.

| Return | Frequency | Due Date | Description |
|--------|-----------|----------|-------------|
| GSTR-1 | Monthly | 11th of next month | Outward supplies |
| GSTR-3B | Monthly | 20th of next month | Summary return |
| GSTR-9 | Annual | 31st December | Annual return |
| GSTR-2B | Monthly | Auto | Input tax credit |

## 15.6 Segregation of Duties (SoD) Review

Ensures no single user has conflicting access (e.g., both create PO and approve PO). The system flags SoD conflicts for review.

## 15.7 Access Reviews

Periodic review of user access rights to ensure compliance. Generates reports of who has access to what, flags inactive users and excessive privileges.

---

# 16. Support Tickets

### 16.1 Overview

Support Tickets handle internal and customer-facing issues, complaints, and requests.

**URL**: `/admin/tickets`
**Access**: All roles (create), assigned team (resolve), Company Admin (full)

### 16.2 Ticket Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Ticket ID | Auto | Yes | `IP-TKT-YYYYMMDD-XXXX` |
| Title | Text | Yes | Short description of issue |
| Description | Textarea | Yes | Detailed explanation |
| Category | Select | Yes | Project Issue/Quality Complaint/Payment Query/IT Issue/HR Query/General |
| Priority | Select | Yes | Low/Medium/High/Critical |
| Source | Select | Yes | Internal/Customer Portal/Email/Phone |
| Raised By | Auto/Reference | Yes | Who raised the ticket |
| Assigned To | Reference | No | Responsible resolver |
| Project | Reference | No | If project-related |
| Customer | Reference | No | If customer-related |
| Status | Select | Auto | Open/In Progress/Pending Info/Resolved/Closed/Reopened |
| Resolution | Textarea | No | How it was resolved |
| Attachments | File(s) | No | Supporting documents/photos |
| SLA Deadline | Date | Auto | Based on priority |
| Created | Date | Auto | Submission timestamp |
| Resolved | Date | Auto | Resolution timestamp |

### 16.3 SLA Definitions

| Priority | Response Time | Resolution Time |
|----------|-------------|-----------------|
| Critical | 1 hour | 4 hours |
| High | 4 hours | 24 hours |
| Medium | 8 hours | 48 hours |
| Low | 24 hours | 72 hours |

### 16.4 Procedures

#### Create a Ticket

1. Navigate to **Support Tickets**.
2. Click **+ New Ticket**.
3. Fill Title, Description, Category, Priority.
4. Link to Project/Customer if applicable.
5. Attach files if needed.
6. Click **Submit**.
7. System auto-assigns based on category routing rules.
8. SLA clock starts.

#### Resolve a Ticket

1. Open the assigned ticket.
2. Update Status to "In Progress".
3. Add comments and investigation notes.
4. If resolution found, enter Resolution text.
5. Change Status to "Resolved".
6. Customer/requester is notified.
7. If no feedback in 48 hours, auto-closes.
8. Requester can "Reopen" if not satisfied.

---

# 17. Notifications & Approvals

### 17.1 Overview

Centralized hub for all system notifications and pending approvals.

**URL**: `/admin/approvals`
**Access**: All authenticated roles (own notifications), Approvers (approval items)

### 17.2 Approval Types

| Approval Type | Triggered By | Default Approver |
|--------------|-------------|------------------|
| Quotation | Submit for approval | Sales Manager |
| Sales Order | Submit for approval | Sales Manager/Admin |
| Purchase Requisition | Submit | Procurement Manager |
| Purchase Order | Submit | Based on amount thresholds |
| Vendor Invoice | Received/verified | Finance Manager |
| Leave Request | Employee applies | Reporting Manager |
| Reimbursement | Employee submits | Reporting Manager + HR |
| Advance Request | Employee applies | HR Head/Finance |
| Change Order | PM proposes | Company Admin |
| Credit Note | Finance creates | Company Admin |
| Payroll | HR generates | HR Head + Finance |
| Vendor Registration | New vendor added | Procurement Manager |

### 17.3 Approval Actions

For each pending approval, the approver can:
1. **Approve**: Accept as-is.
2. **Reject**: Decline with mandatory reason.
3. **Send Back**: Return to submitter for modifications.
4. **Escalate**: Forward to higher authority.
5. **Delegate**: Assign to another authorized approver.

### 17.4 Notification Bell

The notification bell icon (top-right or sidebar) shows:
- Unread count (red badge)
- Click to expand notification dropdown
- List of recent notifications with timestamps
- Click to navigate to the relevant record
- Mark as read / Mark all as read

---

# 18. Marketing

## 18.1 Mail Templates

### 18.1.1 Overview

Mail Templates manage email templates for various system-generated communications.

**URL**: `/admin/marketing/mail-templates`
**Access**: Company Admin, Sales Manager, Marketing

### 18.1.2 Template Categories

| Category | Templates |
|----------|----------|
| Lead Nurture | Welcome email, follow-up sequences, site visit invite |
| Quotation | Quote email, revised quote, quote acceptance confirmation |
| Project | Project kickoff, milestone update, completion, handover |
| Payment | Invoice, payment reminder, overdue notice, receipt |
| HR | Offer letter email, welcome aboard, policy updates |
| Portal | Portal credentials, password reset, verification |
| Marketing | Newsletter, promotions, festival greetings, referral program |
| Feedback | Survey invitation, review request, NPS follow-up |

### 18.1.3 Template Fields

| Field | Type | Description |
|-------|------|-------------|
| Template Name | Text | Internal identifier |
| Subject | Text | Email subject line (supports variables) |
| Body | Rich Text | Email content with variable placeholders |
| Variables | Auto | Available merge fields (e.g., {{customer_name}}, {{project_id}}) |
| Category | Select | From categories above |
| Status | Select | Active/Inactive |

## 18.2 Game Entries

### 18.2.1 Overview

Game Entries manages promotional gamification activities (spin-the-wheel, scratch cards) for exhibitions and events.

**URL**: `/admin/marketing/game-entries`
**Access**: Sales Manager, Marketing, Company Admin

### 18.2.2 Game Entry Fields

| Field | Type | Description |
|-------|------|-------------|
| Entry ID | Auto | System-generated |
| Participant Name | Text | Person playing |
| Phone | Phone | Contact number |
| Email | Email | Contact email |
| Event/Campaign | Select | Which promotion |
| Prize Won | Select | Discount coupon/Consultation/Gift/No prize |
| Prize Value | Currency | If applicable |
| Redeemed | Boolean | Whether prize was claimed |
| Date | Date | Entry date |
| Lead Created | Boolean | If converted to lead |
| Lead Reference | Reference | Linked lead (if created) |

---

# 19. Settings & Administration

## 19.1 Users

### 19.1.1 Overview

User management for creating, editing, and deactivating system accounts.

**URL**: `/admin/settings/users`
**Access**: Super Admin, Company Admin, IT Admin

### 19.1.2 User Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Name | Text | Yes | Full name |
| Email | Email | Yes | Login email (unique) |
| Password | Password | Yes | Min 6 characters |
| Role | Select | Yes | System role |
| Employee | Reference | No | Linked employee record |
| Company | Reference | Yes | Company assignment |
| Status | Select | Yes | Active/Inactive/Locked |
| MFA Enabled | Boolean | No | Two-factor authentication |
| Last Login | Date | Auto | Most recent login |
| Created | Date | Auto | Account creation date |

### 19.1.3 Procedures

#### Create a New User

1. Navigate to **Settings > Users**.
2. Click **+ New User**.
3. Enter Name, Email, Password.
4. Select Role.
5. Link to Employee record (if applicable).
6. Click **Save**.
7. User receives welcome email with credentials.

#### Deactivate a User

1. Open user from the list.
2. Click **Edit**.
3. Change Status to "Inactive".
4. Click **Save**.
5. User can no longer log in.
6. All their data remains intact.

---

## 19.2 Roles & Permissions

### 19.2.1 Overview

Configure role-based permissions. See Section 4 for the complete RBAC matrix.

### 19.2.2 Permission Structure

Each permission is a combination of:
- **Module**: Which module (e.g., Leads, Projects, Finance)
- **Action**: What can be done (Create, Read, Update, Delete, Approve, Export)
- **Scope**: Data visibility (All, Department, Own)

---

## 19.3 Approval Matrix

### 19.3.1 Overview

Configures the routing rules for approvals.

**URL**: `/admin/settings/approval-matrix`
**Access**: Company Admin, IT Admin

### 19.3.2 Matrix Fields

| Field | Type | Description |
|-------|------|-------------|
| Approval Type | Select | Document type requiring approval |
| Level | Number | Sequential level (1, 2, 3...) |
| Condition | Text | When this level applies (e.g., "amount > 100000") |
| Approver Role | Select | Which role can approve |
| Specific User | Reference | Or a specific user |
| SLA Hours | Number | Time to approve |
| Auto-Escalation | Boolean | Escalate if SLA breached |
| Escalate To | Reference | Who receives escalation |

---

## 19.4 Profile

User's own profile settings: change password, update phone, notification preferences.

## 19.5 Audit Trail

### 19.5.1 Overview

Audit Trail logs every significant action in the system.

**URL**: `/admin/settings/audit-trail`
**Access**: Super Admin, Company Admin, IT Admin (read-only)

### 19.5.2 Audit Log Fields

| Field | Type | Description |
|-------|------|-------------|
| Timestamp | DateTime | When action occurred |
| User | Reference | Who performed the action |
| Action | Select | Create/Update/Delete/Login/Logout/Approve/Reject/Export/Import |
| Module | Text | Which module |
| Record | Reference | Which specific record |
| Old Values | JSON | Previous field values (for updates) |
| New Values | JSON | New field values |
| IP Address | Text | User's IP |
| User Agent | Text | Browser/device info |

### 19.5.3 Audit Retention

- Audit logs are retained for 7 years (compliance requirement).
- Logs cannot be deleted or modified.
- Exportable as CSV for external audit.

---

## 19.6 Master Data Management (MDM)

Centralized configuration for dropdown options, codes, and reference data used across the system.

### 19.6.1 MDM Categories

| Category | Examples |
|----------|---------|
| Lead Sources | Website, Walk-in, Referral, etc. |
| Property Types | Villa, Apartment, Penthouse, etc. |
| Budget Ranges | Below 5L, 5-10L, 10-25L, etc. |
| Project Types | Full Interior, Modular Kitchen, etc. |
| Cities | Bengaluru, Mysuru, Hyderabad |
| UOMs | Nos, SqFt, RFt, Kg, Ltr, etc. |
| Material Categories | Plywood, Hardware, Electrical, etc. |
| Expense Categories | Travel, Food, Stationery, etc. |
| Document Types | PAN, Aadhaar, GST, etc. |
| Leave Types | EL, CL, SL, etc. |

---

## 19.7 Callyzer Settings

Configure the Callyzer integration for automatic call log synchronization.

| Setting | Value | Description |
|---------|-------|-------------|
| API Mode | Sandbox/Production | Environment |
| API Key | 829fcba0-... | Authentication key |
| Sync Interval | 30 minutes | Auto-sync frequency |
| Employee Mapping | User-to-CallyzerID | Map system users to Callyzer employees |
| Auto-Create Leads | Yes/No | Create leads from unknown numbers |

---

## 19.8 Documents

Document template management and company letterhead configuration.

## 19.9 MFA (Multi-Factor Authentication)

Enable/disable MFA for roles or individual users. MFA sends a 6-digit OTP to registered mobile/email on login.

## 19.10 Configuration Master

System-wide configuration settings.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Company Logo | File | Interior Plus logo | Used in PDFs and emails |
| Company Name | Text | Interior Plus | Legal entity name |
| GST Number | Text | - | Company GSTIN |
| Financial Year Start | Select | April | FY start month |
| Currency | Select | INR | Base currency |
| Date Format | Select | DD/MM/YYYY | Display format |
| Default GST Rate | Number | 18% | For new items |
| Quotation Validity | Number | 30 days | Default validity |
| Lead Stale Days | Number | 30 | When leads flagged stale |
| Attendance Start Time | Time | 09:30 | Standard work start |
| Late Threshold | Time | 10:00 | Late marking time |
| Work End Time | Time | 18:30 | Standard work end |
| Leave Year Start | Select | January | Leave balance reset |

## 19.11 Company Master

Manages company details for multi-company setup. Interior Plus (ID: `6967b34f1496c6c6e553fd1e`) details:
- Company Name, Legal Name, CIN, PAN, GST
- Registered Address, Branch Addresses (Bengaluru, Mysuru, Hyderabad)
- Bank Accounts
- Authorized Signatories
- Logo and Letterhead

---

# 20. Customer Portal

## 20.1 Login

**URL**: `https://hoh108.com/user`

1. Customer enters mobile number or email + password.
2. Redirected to Customer Dashboard.
3. First-time login may require password change.

## 20.2 Dashboard

Shows:
- Active project(s) with progress bar
- Upcoming milestones
- Recent payment history
- Quick actions: View Designs, Make Payment, Raise Ticket

## 20.3 Projects

- View all projects (active and completed)
- Project Lifecycle tracking: Design > Procurement > Production > Installation > Handover
- Phase-by-phase progress with dates
- Photo gallery of site progress

## 20.4 Payments

- View all invoices and payment history
- Outstanding balance
- Make payment via PhonePe (see Section 25)
- Download payment receipts

## 20.5 Designs

- View all design iterations uploaded by the design team
- Provide feedback (approve or request changes)
- View material boards and 3D renders
- Download design files

## 20.6 Timeline

Visual timeline of project milestones with past/current/future status.

## 20.7 KYC

Customer can upload/update KYC documents:
- PAN Card
- Aadhaar Card
- Address Proof
- Property Documents
- GST Certificate (if applicable)

## 20.8 PhonePe Payment

See Section 25 for the complete payment flow.

## 20.9 Additional Portal Pages

- **Orders**: View and track sales orders
- **Deliveries**: Track dispatches and deliveries
- **Quotes**: View received quotations, accept/reject
- **Consultations**: Book and manage consultation appointments
- **Rewards**: View referral rewards and loyalty points
- **Support**: Raise and track support tickets
- **Documents**: Access shared project documents

## 20.10 Mobile Views

The Customer Portal has dedicated mobile-optimized views:
- MobileDashboard, MobileOrders, MobileRewards, MobileServices, MobileProjects
- Responsive design that switches based on screen width (<768px)
- Touch-optimized navigation and interactions

---

# 21. Vendor Portal

## 21.1 Login

**URL**: `https://hoh108.com/vendor`

1. Vendor enters email + password.
2. Credentials provided by Procurement team during registration.
3. Redirected to Vendor Dashboard.

## 21.2 Dashboard

Shows:
- Open Purchase Orders count and value
- Pending Deliveries
- Invoice Status summary
- Payment Status summary

## 21.3 Materials

- View materials catalog with their products listed
- Update pricing and availability

## 21.4 RFQ/Quotations

- View received RFQs
- Submit quotation responses with pricing
- Track RFQ status (Open/Closed/Awarded)

## 21.5 Purchase Orders

- View POs issued to them
- Acknowledge receipt of PO
- Update delivery status
- Download PO PDF

## 21.6 GRN Status

- View GRN records for their deliveries
- See accepted/rejected quantities
- Track quality check results

## 21.7 Invoices

- Upload invoices against POs
- Track invoice verification status
- View three-way match results

## 21.8 Payments

- View payment status for all invoices
- Download payment advices
- Track TDS deductions
- Download TDS certificates (Form 16A)

---

# 22. Project Wallet & P&L

## 22.1 Project Wallet

### 22.1.1 Concept

Every project has a "wallet" that represents the total budget (from the Sales Order value). All project expenditures are deducted from this wallet, providing real-time visibility into budget utilization.

### 22.1.2 Wallet Structure

```
Project Wallet
 |
 +-- Budget (Total Project Value from SO)
 |    +-- Original Budget
 |    +-- Change Orders (+/-)
 |    = Revised Budget
 |
 +-- Committed (Approved POs)
 |    +-- Material POs
 |    +-- Subcontractor POs
 |
 +-- Spent (Actual Payments Made)
 |    +-- Vendor Payments
 |    +-- Labor Payments
 |    +-- Transport Costs
 |    +-- Miscellaneous
 |
 +-- Available = Revised Budget - Committed
 +-- Utilization % = Spent / Revised Budget x 100
```

### 22.1.3 Wallet Rules

1. No PO can be raised if it would exceed the Available wallet balance.
2. A warning is issued at 80% utilization.
3. At 90% utilization, all POs require Company Admin approval regardless of amount.
4. Change Orders increase or decrease the wallet automatically.
5. Wallet is read-only for Project Managers; only Finance/Admin can adjust.

## 22.2 Project P&L

### 22.2.1 Detailed P&L Calculation

```
A. REVENUE
   A1. Customer Invoice Total (from Finance)
   A2. Change Order Revenue
   A3. Total Revenue = A1 + A2

B. DIRECT COSTS
   B1. Material Cost (POs + Direct Issues)
   B2. Direct Labor (On-site workers)
   B3. Subcontractor Cost (Third-party contractors)
   B4. Transport & Logistics (Dispatches)
   B5. Total Direct Cost = B1 + B2 + B3 + B4

C. GROSS PROFIT = A3 - B5
   C1. Gross Margin % = C / A3 x 100

D. INDIRECT COSTS
   D1. Design Cost (Designer hours x hourly rate)
   D2. PM Cost (PM hours x hourly rate)
   D3. Sales Commission (Channel Partner %)
   D4. Overhead Allocation (Company formula)
   D5. Total Indirect Cost = D1 + D2 + D3 + D4

E. NET PROFIT = C - D5
   E1. Net Margin % = E / A3 x 100
```

### 22.2.2 Target Margins

| Project Type | Target Gross Margin | Target Net Margin |
|-------------|--------------------|--------------------|
| Full Interior | 35-45% | 20-30% |
| Modular Kitchen | 30-40% | 18-25% |
| Wardrobe | 35-45% | 22-30% |
| Renovation | 25-35% | 15-22% |
| Civil/Turnkey | 20-30% | 12-18% |

---

# 23. Onboarding Checklist for New Employees

## 30-Item Comprehensive Checklist

### Pre-Joining (Items 1-8)

| # | Item | Owner | Timeline |
|---|------|-------|----------|
| 1 | Send Offer Letter via HOH108 Employee Letters | HR | On selection |
| 2 | Collect signed offer acceptance | HR | Within 3 days |
| 3 | Send onboarding document checklist (PAN, Aadhaar, Bank, Photos, Educational Certificates, Experience Letters) | HR | 7 days before joining |
| 4 | Create Employee record in HOH108 | HR | 3 days before joining |
| 5 | Assign Department, Role, and Reporting Manager | HR + Dept Head | 3 days before joining |
| 6 | Prepare workstation (laptop, desk, chair, stationery) | IT + Admin | 1 day before joining |
| 7 | Create email account (name@interiorplus.in) | IT Admin | 1 day before joining |
| 8 | Create HOH108 user account with appropriate role | IT Admin | 1 day before joining |

### Day 1 (Items 9-18)

| # | Item | Owner | Timeline |
|---|------|-------|----------|
| 9 | Generate and issue Appointment Letter via HOH108 | HR | Day 1 morning |
| 10 | Collect all original documents for verification | HR | Day 1 morning |
| 11 | Complete DPDP consent form in Compliance module | HR | Day 1 morning |
| 12 | Set up bank account details in Employee record | HR | Day 1 morning |
| 13 | Enroll in PF/ESI (if applicable) | HR | Day 1 |
| 14 | Issue company assets (laptop, phone, ID card) - record in Assets module | IT + Admin | Day 1 |
| 15 | HOH108 system login and password setup | IT Admin | Day 1 |
| 16 | Enable MFA if required by role | IT Admin | Day 1 |
| 17 | Office tour and team introduction | Reporting Manager | Day 1 |
| 18 | Share Employee Handbook and company policies | HR | Day 1 |

### Week 1 (Items 19-25)

| # | Item | Owner | Timeline |
|---|------|-------|----------|
| 19 | HOH108 system training - Module walkthrough (this manual) | IT/Dept Head | Days 2-3 |
| 20 | Role-specific module deep-dive training | Dept Head | Days 3-4 |
| 21 | Set up KRA/KPI in Performance module | Reporting Manager | Day 4 |
| 22 | Assign Skill Matrix baseline assessment | HR | Day 4 |
| 23 | Add to department WhatsApp/communication groups | Team Lead | Day 2 |
| 24 | Callyzer setup (for sales roles) - map phone to HOH108 | IT Admin | Day 2 |
| 25 | Assign to a buddy/mentor | Reporting Manager | Day 2 |

### Month 1 (Items 26-30)

| # | Item | Owner | Timeline |
|---|------|-------|----------|
| 26 | Complete all pending document submissions | HR | By Week 2 |
| 27 | First 1-on-1 review with Reporting Manager | Reporting Manager | Week 2 |
| 28 | Shadow experienced colleague on 2-3 projects/tasks | Dept Head | Weeks 2-3 |
| 29 | Mid-probation check-in (informal performance review) | HR + Manager | Day 30 |
| 30 | Verify all system access is correct and sufficient | IT Admin + Employee | Day 30 |

---

# 24. KYC Verification Process

## 24.1 Customer KYC

### 24.1.1 Required Documents

| Document | Required | Purpose |
|----------|----------|---------|
| PAN Card | Yes | TDS compliance, identity verification |
| Aadhaar Card | Yes | Address and identity verification |
| Property Document | Yes | Proof of property ownership/rental |
| GST Certificate | Conditional | Required if customer is GST-registered |
| Passport-size Photo | Yes | Customer record |
| Cancelled Cheque | Recommended | For refund/credit processing |

### 24.1.2 KYC Verification Workflow

```
Customer Uploads Documents (Portal or Office)
    |
    v
Sales Executive / Pre-Sales Reviews
    |
    v
Document Authenticity Check
    |
    +-- All Valid --> Status: "Verified" --> Proceed with Project
    |
    +-- Issues Found --> Status: "Rejected" (with reason) -->
        Customer Notified --> Re-upload Requested
    |
    +-- Partial --> Status: "Pending" (specific documents flagged)
```

### 24.1.3 KYC Verification Steps

1. Customer submits documents via Customer Portal (Documents section) or hands over to Sales Executive.
2. If submitted offline, Sales Executive uploads to HOH108 against the customer record.
3. Authorized verifier (Sales Manager/Pre-Sales) reviews each document:
   - Name matches across documents
   - Address is valid
   - PAN format is correct (AAAAA9999A)
   - Documents are not expired
   - Photos are clear and legible
4. Verifier marks status: Verified, Rejected (with reason), or Pending.
5. If Verified: Green checkmark on customer profile, project can proceed.
6. If Rejected: Customer receives notification with specific requirements.
7. KYC status is visible across all modules (Sales, Projects, Finance).

### 24.1.4 Business Rules

- No customer invoice > INR 2,50,000 can be generated without PAN verification.
- TDS (Section 194C) at 1% is deducted on all contractor payments where PAN is provided; 20% if PAN is missing.
- KYC expiry: Review every 12 months for ongoing projects.

---

# 25. PhonePe Payment Flow

## 25.1 Overview

Customers can make payments via PhonePe payment gateway directly from the Customer Portal.

## 25.2 Payment Flow

```
Step 1: Customer logs into Portal
    |
Step 2: Navigate to Payments section
    |
Step 3: Click "Make Payment" against an invoice
    |
Step 4: Enter Amount (pre-filled from invoice balance)
    |  - Can make partial payment (minimum INR 1,000)
    |  - Can make full payment
    |
Step 5: Click "Pay with PhonePe"
    |
Step 6: Redirected to PhonePe gateway
    |  - Options: UPI, Credit/Debit Card, Net Banking, PhonePe Wallet
    |
Step 7: Complete Payment on PhonePe
    |
Step 8: Redirect back to HOH108
    |  +-- Success:
    |  |   - Payment recorded in Finance > Payments
    |  |   - Invoice status updated (Partially Paid/Paid)
    |  |   - Receipt generated and emailed
    |  |   - Project Wallet updated
    |  |   - Notification to Finance team
    |  |
    |  +-- Failure:
    |  |   - Error displayed to customer
    |  |   - Retry option shown
    |  |   - No payment recorded
    |  |
    |  +-- Pending:
    |      - Status shown as "Payment Processing"
    |      - Backend webhook listener for final status
    |      - Auto-resolves within 30 minutes
    |      - If still pending, manual verification by Finance
```

## 25.3 PhonePe Integration Details

| Parameter | Description |
|-----------|-------------|
| Merchant ID | Configured in system settings |
| Salt Key | Server-side only, encrypted |
| Environment | Production (live payments) |
| Callback URL | `https://hoh108.com/api/payments/phonepe/callback` |
| Redirect URL | `https://hoh108.com/user/payments` |
| Supported Methods | UPI, Cards, Net Banking, PhonePe Wallet |
| Currency | INR only |
| Min Amount | INR 1,000 |
| Max Amount | INR 50,00,000 |

## 25.4 Reconciliation

1. PhonePe sends webhook callbacks for payment status updates.
2. System auto-matches callbacks to pending transactions.
3. Finance team reviews daily reconciliation report.
4. Any mismatches are flagged for manual investigation.

---

# 26. IT/TDS Compliance Checklist

## 26.1 TDS Deduction Requirements

| Section | Nature of Payment | Rate (with PAN) | Rate (without PAN) | Threshold |
|---------|------------------|-----------------|--------------------:|----------:|
| 194C | Contractor Payment | 1% (Individual/HUF), 2% (Others) | 20% | 30,000 single / 1,00,000 aggregate |
| 194J | Professional Fees | 10% | 20% | 30,000 |
| 194H | Commission/Brokerage | 5% | 20% | 15,000 |
| 194I | Rent (Land/Building) | 10% | 20% | 2,40,000 |
| 194I | Rent (P&M) | 2% | 20% | 2,40,000 |
| 192 | Salary | As per slab | NA | Basic exemption |
| 194Q | Purchase of Goods | 0.1% | 5% | 50,00,000 |

## 26.2 Monthly TDS Compliance Checklist

| # | Item | Due Date | Responsibility |
|---|------|----------|---------------|
| 1 | Calculate TDS on all applicable vendor payments | Before payment | Finance |
| 2 | Deduct TDS at applicable rate | At time of payment | Finance |
| 3 | Record TDS in HOH108 (Vendor Invoice and Payment modules) | At time of payment | Finance |
| 4 | Deposit TDS to government via challan | 7th of next month | Finance |
| 5 | File TDS return (Form 24Q - Salary, 26Q - Non-salary) | Quarterly | Finance |
| 6 | Issue TDS certificates (Form 16A) to vendors | 15 days from filing | Finance |
| 7 | Upload TDS certificates in HOH108 | After issuance | Finance |
| 8 | Verify TDS credit in 26AS/AIS of deductees | Quarterly | Finance |
| 9 | Reconcile TDS deducted vs deposited | Monthly | Finance |
| 10 | Update vendor PAN records if missing | Ongoing | Procurement + Finance |

## 26.3 GST Compliance Checklist

| # | Item | Frequency | Due Date |
|---|------|-----------|----------|
| 1 | Generate e-invoices for B2B invoices | Per invoice | Before delivery |
| 2 | Reconcile e-invoice IRN with GST portal | Weekly | - |
| 3 | File GSTR-1 (outward supplies) | Monthly | 11th |
| 4 | Reconcile GSTR-2B (input credit) | Monthly | By 14th |
| 5 | File GSTR-3B (summary return) | Monthly | 20th |
| 6 | Reconcile Input Tax Credit | Monthly | Before GSTR-3B |
| 7 | HSN code validation for all materials | Quarterly | - |
| 8 | Annual return GSTR-9 | Annual | 31st December |
| 9 | Audit (GSTR-9C) if turnover > 5 Cr | Annual | 31st December |
| 10 | E-way bill for dispatches > 50,000 | Per dispatch | Before dispatch |

---

# 27. Round-Robin Lead Assignment Rules

## 27.1 Concept

Round-robin assignment distributes new leads equally among active sales executives to ensure fair workload distribution.

## 27.2 Assignment Algorithm

```
1. System maintains a pointer to the LAST ASSIGNED sales executive.
2. When a new lead arrives (from any source):
   a. Get list of ACTIVE sales executives in the relevant city.
   b. Filter out executives who are:
      - On leave today
      - At maximum capacity (configurable, default 50 active leads)
      - Inactive or deactivated
   c. From remaining, select the NEXT executive in rotation order.
   d. Assign lead to selected executive.
   e. Update pointer to this executive.
   f. Send notification to assigned executive.
3. Rotation order is by Employee ID (alphabetical or creation order).
4. If all executives are at capacity: assign to Sales Manager with alert.
```

## 27.3 Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| Enabled | Yes | Turn round-robin on/off |
| Scope | Per City | Separate rotation per city |
| Max Active Leads | 50 | Capacity per executive |
| Include Pre-Sales | No | Whether Pre-Sales role is included |
| Exclude on Leave | Yes | Skip executives on leave |
| Override Sources | Channel Partner | Leads from specific sources go to specific people |
| Fallback | Sales Manager | Who gets leads when all are at capacity |

## 27.4 Override Rules

| Condition | Assignment Rule |
|-----------|----------------|
| Source = Channel Partner | Assign to Channel Partner Manager |
| Source = Walk-in + City = Bengaluru | Assign to Bengaluru showroom executive |
| Budget > 50L | Assign to Senior Sales Executive or AGM |
| Repeat Customer | Assign to original Sales Executive |
| Callyzer import | Assign to the exec whose phone received the call |

---

# 28. Employee Cost Allocation Methodology

## 28.1 Purpose

Employee cost allocation distributes employee-related costs to specific projects for accurate Project P&L calculation.

## 28.2 Direct Allocation

Employees whose time is directly attributable to specific projects:

| Role | Allocation Method | Data Source |
|------|------------------|-------------|
| Site Engineer | 100% to assigned project | Project assignment |
| Carpenter/Painter/Worker | Hours logged per project | Labor Tracking module |
| Subcontractor | PO amount per project | Vendor Invoices |

## 28.3 Indirect Allocation (Time-Based)

Employees working across multiple projects:

| Role | Allocation Method | Data Source |
|------|------------------|-------------|
| Project Manager | Proportional to hours logged per project | Timesheet / Labor Tracking |
| Designer | Based on design iterations per project | Design Iterations module |
| Procurement Manager | Proportional to PO value per project | PO records |

### Calculation Formula

```
Employee Monthly Cost = (CTC / 12) x (1 + Overhead Factor)
  where Overhead Factor = 0.15 (accounts for PF, ESI, benefits)

Project Allocation = Employee Monthly Cost x (Hours on Project / Total Hours in Month)
```

## 28.4 Overhead Allocation

Company overheads not directly attributable to any project:

| Overhead | Allocation Basis | Formula |
|----------|-----------------|---------|
| Office Rent | Project revenue proportion | Rent x (Project Revenue / Total Revenue) |
| Utilities | Equal distribution | Total Utility / Active Project Count |
| Admin Staff | Project revenue proportion | Admin Cost x (Project Revenue / Total Revenue) |
| Marketing | Lead source attribution | Marketing Spend x (Leads from source / Total Leads) |
| IT Infrastructure | Headcount proportion | IT Cost x (Project Team / Total Headcount) |

## 28.5 Hourly Rate Calculation

```
Hourly Rate = (Annual CTC x (1 + Overhead Factor)) / (Working Days per Year x 8 hours)
  Working Days = 260 (52 weeks x 5 days)
  Example: CTC 6,00,000 => (6,00,000 x 1.15) / (260 x 8) = INR 331/hour
```

---

# 29. Notification System Overview (45 Events)

## 29.1 Notification Channels

| Channel | Description | When Used |
|---------|-------------|-----------|
| In-App | Bell icon notification in HOH108 | All events |
| Email | Email to registered address | Configurable per event |
| SMS | Text message to phone | Critical events only |
| WhatsApp | WhatsApp message | Customer-facing events |

## 29.2 Complete Event List

### Sales & CRM Events (Events 1-10)

| # | Event | Trigger | Recipients | Channels |
|---|-------|---------|------------|----------|
| 1 | New Lead Created | Lead saved | Assigned Sales Exec | In-App, Email |
| 2 | Lead Assigned | Round-robin or manual assign | Assigned Sales Exec | In-App, Email |
| 3 | Lead Status Changed | Status field updated | Assigned Sales Exec, Sales Manager | In-App |
| 4 | Lead Stale Warning | Lead > 30 days without progress | Assigned Sales Exec, Sales Manager | In-App, Email |
| 5 | Quotation Submitted | Quote submitted for approval | Sales Manager | In-App, Email |
| 6 | Quotation Approved | Manager approves quote | Sales Exec, Customer | In-App, Email |
| 7 | Quotation Rejected | Manager rejects quote | Sales Exec | In-App, Email |
| 8 | Sales Order Created | SO finalized | Finance, PM, Customer | In-App, Email |
| 9 | Design Iteration Uploaded | New design uploaded | Customer, PM | In-App, Email, WhatsApp |
| 10 | Design Feedback Received | Customer provides feedback | Designer, PM | In-App, Email |

### Project Events (Events 11-20)

| # | Event | Trigger | Recipients | Channels |
|---|-------|---------|------------|----------|
| 11 | Project Created | New project saved | PM, SE, Designer, Customer | In-App, Email |
| 12 | Project Status Changed | Status updated | PM, Customer, Sales | In-App, Email |
| 13 | Milestone Reached | Phase completed | Customer, PM, Finance | In-App, Email, WhatsApp |
| 14 | Project Delayed | Target date passed | PM, AGM Ops, Customer | In-App, Email |
| 15 | Budget Warning (80%) | 80% wallet utilized | PM, Finance | In-App, Email |
| 16 | Budget Critical (90%) | 90% wallet utilized | PM, Finance, Admin | In-App, Email |
| 17 | Change Order Proposed | CO created | Customer, PM, Admin | In-App, Email |
| 18 | QC Failed | QC check failure | PM, SE, Quality Controller | In-App |
| 19 | Daily Progress Submitted | DPR submitted | PM | In-App |
| 20 | Project Handover | Handover complete | Customer, Finance, Sales | In-App, Email, WhatsApp |

### Procurement Events (Events 21-28)

| # | Event | Trigger | Recipients | Channels |
|---|-------|---------|------------|----------|
| 21 | PR Submitted | Purchase requisition submitted | Procurement Manager | In-App, Email |
| 22 | PR Approved | PR approved | Requester | In-App |
| 23 | PO Created | PO finalized | Vendor, Finance | In-App, Email |
| 24 | GRN Created | Materials received | PM, Procurement | In-App |
| 25 | GRN Quality Issue | Rejected items in GRN | Vendor, Procurement | In-App, Email |
| 26 | Vendor Invoice Received | Invoice uploaded | Finance | In-App |
| 27 | RFQ Response | Vendor submits quote | Procurement | In-App, Email |
| 28 | PO Delivery Overdue | Past expected delivery | Procurement, PM | In-App, Email |

### Finance Events (Events 29-35)

| # | Event | Trigger | Recipients | Channels |
|---|-------|---------|------------|----------|
| 29 | Invoice Generated | Customer invoice created | Customer, Sales | In-App, Email |
| 30 | Payment Received | Customer payment recorded | Finance, PM, Sales | In-App, Email |
| 31 | Payment Overdue | Invoice past due date | Customer, Finance, Sales | In-App, Email, WhatsApp |
| 32 | Vendor Payment Due | AP approaching due date | Finance | In-App |
| 33 | TDS Deposit Reminder | 5th of month | Finance | In-App, Email |
| 34 | GST Filing Reminder | 8th of month | Finance | In-App, Email |
| 35 | PhonePe Payment Received | Online payment success | Finance, Customer | In-App, Email |

### HR Events (Events 36-42)

| # | Event | Trigger | Recipients | Channels |
|---|-------|---------|------------|----------|
| 36 | Leave Applied | Employee submits leave | Reporting Manager | In-App, Email |
| 37 | Leave Approved/Rejected | Manager acts on leave | Employee | In-App, Email |
| 38 | Reimbursement Submitted | Expense claim submitted | Reporting Manager, HR | In-App |
| 39 | Payroll Generated | Monthly payroll ready | HR Head, Finance | In-App, Email |
| 40 | Payslip Available | After payroll processing | All employees | In-App, Email |
| 41 | Attendance Regularization | Employee requests correction | Reporting Manager | In-App |
| 42 | Review Cycle Started | Performance cycle activated | All applicable employees | In-App, Email |

### System Events (Events 43-45)

| # | Event | Trigger | Recipients | Channels |
|---|-------|---------|------------|----------|
| 43 | Approval SLA Breach | Approval not acted within SLA | Escalation approver | In-App, Email |
| 44 | Low Stock Alert | Stock below minimum | Procurement, Operations | In-App, Email |
| 45 | System Login from New Device | Unrecognized device | User, IT Admin | In-App, Email |

---

# 30. Material Master Codes (IP-MAT-001 to IP-MAT-080)

## 30.1 Material Code Structure

Format: `IP-MAT-XXX` where XXX is a sequential 3-digit number.

## 30.2 Complete Material Master List

| Code | Material Name | Category | UOM | HSN Code | GST % |
|------|-------------|----------|-----|----------|-------|
| IP-MAT-001 | BWR Plywood 18mm | Plywood | Sheet | 4412 | 18% |
| IP-MAT-002 | BWR Plywood 12mm | Plywood | Sheet | 4412 | 18% |
| IP-MAT-003 | BWR Plywood 8mm | Plywood | Sheet | 4412 | 18% |
| IP-MAT-004 | BWR Plywood 6mm | Plywood | Sheet | 4412 | 18% |
| IP-MAT-005 | Marine Plywood 19mm | Plywood | Sheet | 4412 | 18% |
| IP-MAT-006 | MDF Board 18mm | Plywood | Sheet | 4411 | 18% |
| IP-MAT-007 | MDF Board 8mm | Plywood | Sheet | 4411 | 18% |
| IP-MAT-008 | HDF Board 3mm | Plywood | Sheet | 4411 | 18% |
| IP-MAT-009 | Particle Board 18mm | Plywood | Sheet | 4410 | 18% |
| IP-MAT-010 | Pre-Laminated Particle Board | Plywood | Sheet | 4410 | 18% |
| IP-MAT-011 | Laminate Sheet 1mm (Matte) | Laminates | Sheet | 4811 | 18% |
| IP-MAT-012 | Laminate Sheet 1mm (Glossy) | Laminates | Sheet | 4811 | 18% |
| IP-MAT-013 | Laminate Sheet 1mm (Textured) | Laminates | Sheet | 4811 | 18% |
| IP-MAT-014 | Laminate Sheet 0.8mm | Laminates | Sheet | 4811 | 18% |
| IP-MAT-015 | Compact Laminate 6mm | Laminates | Sheet | 4811 | 18% |
| IP-MAT-016 | Acrylic Sheet 1mm | Laminates | Sheet | 3920 | 18% |
| IP-MAT-017 | PVC Edge Band 2mm | Edge Band | RFt | 3920 | 18% |
| IP-MAT-018 | ABS Edge Band 1mm | Edge Band | RFt | 3920 | 18% |
| IP-MAT-019 | Acrylic Edge Band 1mm | Edge Band | RFt | 3920 | 18% |
| IP-MAT-020 | Soft Close Hinge (Hettich) | Hardware | Nos | 8302 | 18% |
| IP-MAT-021 | Soft Close Hinge (Hafele) | Hardware | Nos | 8302 | 18% |
| IP-MAT-022 | Drawer Channel 18" (Hettich) | Hardware | Pair | 8302 | 18% |
| IP-MAT-023 | Drawer Channel 20" (Hettich) | Hardware | Pair | 8302 | 18% |
| IP-MAT-024 | Tandem Box (Hettich) | Hardware | Set | 8302 | 18% |
| IP-MAT-025 | Cabinet Handle (SS) | Hardware | Nos | 8302 | 18% |
| IP-MAT-026 | Cabinet Handle (Aluminium) | Hardware | Nos | 8302 | 18% |
| IP-MAT-027 | Profile Handle (Gola) | Hardware | RFt | 8302 | 18% |
| IP-MAT-028 | Lift-up System (Hafele) | Hardware | Set | 8302 | 18% |
| IP-MAT-029 | Gas Lift (Hydraulic) | Hardware | Nos | 8302 | 18% |
| IP-MAT-030 | Multi-purpose Lock | Hardware | Nos | 8301 | 18% |
| IP-MAT-031 | Wardrobe Lock | Hardware | Nos | 8301 | 18% |
| IP-MAT-032 | Telescopic Channel 22" | Hardware | Pair | 8302 | 18% |
| IP-MAT-033 | Corner Carousel (Lazy Susan) | Hardware | Set | 8302 | 18% |
| IP-MAT-034 | Tall Unit Pull-out | Hardware | Set | 8302 | 18% |
| IP-MAT-035 | Bottle Pull-out | Hardware | Set | 8302 | 18% |
| IP-MAT-036 | Cutlery Organizer | Hardware | Set | 8302 | 18% |
| IP-MAT-037 | Waste Bin (Pull-out) | Hardware | Set | 8302 | 18% |
| IP-MAT-038 | Granite Countertop (Black) | Countertop | SqFt | 6802 | 18% |
| IP-MAT-039 | Granite Countertop (White) | Countertop | SqFt | 6802 | 18% |
| IP-MAT-040 | Quartz Countertop | Countertop | SqFt | 6810 | 18% |
| IP-MAT-041 | Corian Countertop | Countertop | SqFt | 6810 | 18% |
| IP-MAT-042 | Marble Slab | Countertop | SqFt | 6802 | 18% |
| IP-MAT-043 | Stainless Steel Sink (Single) | Plumbing | Nos | 7324 | 18% |
| IP-MAT-044 | Stainless Steel Sink (Double) | Plumbing | Nos | 7324 | 18% |
| IP-MAT-045 | Kitchen Faucet (Single Lever) | Plumbing | Nos | 8481 | 18% |
| IP-MAT-046 | CP Fittings Set (Bathroom) | Plumbing | Set | 8481 | 18% |
| IP-MAT-047 | PVC Pipe 4" | Plumbing | RFt | 3917 | 18% |
| IP-MAT-048 | CPVC Pipe 1/2" | Plumbing | RFt | 3917 | 18% |
| IP-MAT-049 | LED Panel Light (6W Round) | Electrical | Nos | 9405 | 18% |
| IP-MAT-050 | LED Panel Light (12W Round) | Electrical | Nos | 9405 | 18% |
| IP-MAT-051 | LED Panel Light (18W Square) | Electrical | Nos | 9405 | 18% |
| IP-MAT-052 | LED Strip Light (per meter) | Electrical | RFt | 9405 | 18% |
| IP-MAT-053 | Modular Switch Plate (4 Module) | Electrical | Nos | 8536 | 18% |
| IP-MAT-054 | Modular Switch Plate (8 Module) | Electrical | Nos | 8536 | 18% |
| IP-MAT-055 | MCB 32A Single Pole | Electrical | Nos | 8536 | 18% |
| IP-MAT-056 | Copper Wire 1.5 sqmm | Electrical | RFt | 8544 | 18% |
| IP-MAT-057 | Copper Wire 2.5 sqmm | Electrical | RFt | 8544 | 18% |
| IP-MAT-058 | Gypsum Board 12.5mm | False Ceiling | Sheet | 6809 | 18% |
| IP-MAT-059 | Gypsum Board 9.5mm | False Ceiling | Sheet | 6809 | 18% |
| IP-MAT-060 | Ceiling Channel (Main) | False Ceiling | RFt | 7308 | 18% |
| IP-MAT-061 | Ceiling Channel (Furring) | False Ceiling | RFt | 7308 | 18% |
| IP-MAT-062 | GI Wire (for ceiling) | False Ceiling | Kg | 7217 | 18% |
| IP-MAT-063 | Wall Putty (20Kg Bag) | Paint | Bag | 3214 | 18% |
| IP-MAT-064 | Primer (Interior, 1L) | Paint | Ltr | 3208 | 18% |
| IP-MAT-065 | Interior Emulsion (1L) | Paint | Ltr | 3209 | 18% |
| IP-MAT-066 | Interior Emulsion (4L) | Paint | Ltr | 3209 | 18% |
| IP-MAT-067 | Exterior Emulsion (1L) | Paint | Ltr | 3209 | 18% |
| IP-MAT-068 | Wood Polish (Melamine) | Paint | Ltr | 3208 | 18% |
| IP-MAT-069 | PU Finish (Wood) | Paint | Ltr | 3208 | 18% |
| IP-MAT-070 | Vitrified Tile 600x600mm | Tiles & Flooring | SqFt | 6907 | 18% |
| IP-MAT-071 | Vitrified Tile 800x800mm | Tiles & Flooring | SqFt | 6907 | 18% |
| IP-MAT-072 | Porcelain Tile 600x1200mm | Tiles & Flooring | SqFt | 6907 | 18% |
| IP-MAT-073 | Wooden Flooring (Engineered) | Tiles & Flooring | SqFt | 4412 | 18% |
| IP-MAT-074 | Vinyl Flooring | Tiles & Flooring | SqFt | 3918 | 18% |
| IP-MAT-075 | Fevicol SR (5Kg) | Adhesives | Nos | 3506 | 18% |
| IP-MAT-076 | PU Adhesive (500g) | Adhesives | Nos | 3506 | 18% |
| IP-MAT-077 | Silicone Sealant (Clear) | Adhesives | Nos | 3214 | 18% |
| IP-MAT-078 | Toughened Glass 12mm | Glass | SqFt | 7007 | 18% |
| IP-MAT-079 | Mirror 5mm (Plain) | Glass | SqFt | 7009 | 18% |
| IP-MAT-080 | Lacquered Glass 4mm | Glass | SqFt | 7003 | 18% |

---

# 31. Approval Workflows

## 31.1 Workflow Diagram Legend

```
[Action] --> {Decision} --> [Next Step]
  |
  +--> [Rejection Path]
```

## 31.2 Quotation Approval Workflow

```
Sales Exec creates Quotation
   |
   v
[Submit for Approval]
   |
   v
{Discount > 10%?}
   |         |
  No        Yes --> {Discount > 15%?}
   |                   |         |
   v                  No        Yes
[Sales Manager]   [Company    [Super Admin
 Reviews]          Admin       Reviews]
   |               Reviews]       |
   v                  |           v
{Approve?}            v        {Approve?}
  |     |          {Approve?}    |     |
 Yes   No           |     |    Yes   No
  |     |           Yes   No    |     |
  v     v            |     |    v     v
[Approved] [Rejected] v    v  [Approved] [Rejected]
                  [Approved] [Rejected]
```

## 31.3 Purchase Order Approval Workflow

```
Procurement creates PO
   |
   v
[Submit for Approval]
   |
   v
{Amount <= 50K?} --> Yes --> [Procurement Manager Approves]
   |
   No
   |
{Amount <= 2L?} --> Yes --> [Operations Manager Approves]
   |
   No
   |
{Amount <= 5L?} --> Yes --> [AGM Operations Approves]
   |
   No
   |
[Company Admin Approves]
   |
   v
{Approve?}
  |     |
 Yes   No
  |     |
  v     v
[Send to Vendor] [Return to Procurement with comments]
```

## 31.4 Leave Approval Workflow

```
Employee applies for leave
   |
   v
{Balance sufficient?}
   |          |
  Yes        No --> [Show LOP warning, confirm?]
   |                    |
   v                    v
[Route to Reporting Manager]
   |
   v
{Approve?}
  |     |     |
 Yes   No   Send Back
  |     |     |
  v     v     v
[Leave  [Rejected, [Return with
Granted] reason    comments]
         required]
```

## 31.5 Vendor Invoice Approval Workflow

```
Vendor Invoice Received
   |
   v
[Three-Way Match Check (PO + GRN + Invoice)]
   |
   v
{Full Match?}
   |        |
  Yes      No --> [Flag for Procurement Manager Review]
   |               |
   v               v
[Auto-route     {Resolve discrepancy}
 to Finance]       |
   |               v
   v            [Route to Finance]
{Finance Approval}
   |     |
  Yes   No --> [Dispute with Vendor]
   |
   v
[Schedule Payment per terms]
```

## 31.6 Payroll Approval Workflow

```
HR generates monthly payroll
   |
   v
[Review payslips for all employees]
   |
   v
[HR Head reviews and approves]
   |
   v
[Finance verifies fund availability]
   |
   v
[Company Admin final approval]
   |
   v
[Process bank transfers]
   |
   v
[Generate and email payslips]
```

---

# 32. Report Generation Guide

## 32.1 How to Generate Reports

1. Navigate to the relevant module (e.g., Sales, Finance, HR).
2. Apply desired filters (date range, status, city, assigned user, etc.).
3. Click the **Export** button (typically top-right of list view).
4. Select format:
   - **CSV**: Raw data for spreadsheet analysis
   - **Excel (.xlsx)**: Formatted with headers
   - **PDF**: Formatted report for printing/sharing
5. Report downloads to your browser's download folder.

## 32.2 Available Reports by Module

### Sales Reports

| Report | Description | Filters |
|--------|-------------|---------|
| Lead Register | All leads with details | Date, Status, Source, City, Assigned |
| Pipeline Summary | Leads by stage with values | Date, City |
| Conversion Report | Lead-to-customer rates | Date, Source, Executive |
| Quotation Register | All quotations | Date, Status, Customer |
| Sales Order Register | All SOs | Date, Status, City, Customer |
| Channel Partner Report | Partner performance | Partner, Date |
| Call Activity Report | Call logs and outcomes | Date, Executive, Outcome |

### Finance Reports

| Report | Description | Filters |
|--------|-------------|---------|
| Invoice Register | All customer invoices | Date, Status, Customer |
| Payment Register | All payments received | Date, Mode, Customer |
| AR Aging Report | Outstanding by age bucket | As-of Date, Customer |
| AP Aging Report | Vendor payables by age | As-of Date, Vendor |
| TDS Report | Tax deducted and deposited | Quarter, Section |
| GST Summary | Input/Output tax summary | Month, Return type |
| P&L by Project | Profit/loss per project | Project, Date |
| Cash Flow Statement | Inflows and outflows | Date range |
| Bank Reconciliation | Matched/unmatched items | Bank, Date |

### Procurement Reports

| Report | Description | Filters |
|--------|-------------|---------|
| PR Register | All purchase requisitions | Date, Project, Status |
| PO Register | All purchase orders | Date, Vendor, Status |
| GRN Register | All goods receipts | Date, Vendor, Project |
| Vendor Ledger | Transaction history per vendor | Vendor, Date |
| Vendor Performance | Rating and metrics | Vendor, Period |
| Material Price List | Current rates by vendor | Category, Vendor |

### HR Reports

| Report | Description | Filters |
|--------|-------------|---------|
| Employee Register | All employees with details | Department, Status, City |
| Attendance Summary | Monthly attendance stats | Month, Department, Employee |
| Leave Balance | Leave balances by type | Employee, Leave type |
| Payroll Summary | Monthly payroll breakdown | Month, Department |
| Reimbursement Register | All claims | Date, Category, Status |
| Headcount Report | Staff count by dept/city | Date, Department, City |
| Attrition Report | Exits and trends | Date range, Department |

### Project Reports

| Report | Description | Filters |
|--------|-------------|---------|
| Project Register | All projects with status | Status, City, PM, Date |
| Budget Utilization | Budget vs actual by project | Project, Date |
| Timeline Variance | Planned vs actual dates | Project, Status |
| QC Summary | Quality check results | Project, Stage |
| Change Order Log | All change orders | Project, Status |
| Resource Allocation | PM/SE assignments | Date, Role |

---

# 33. Common Errors & Troubleshooting

## 33.1 Login Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| "Invalid email or password" | Wrong credentials | Check email spelling, reset password if forgotten |
| Page shows blank after login | JavaScript blocked | Enable JavaScript, clear browser cache |
| Redirect loop | Token corruption | Clear localStorage: Developer Tools > Application > Clear |
| "Session expired" message | Token invalidated on server | Log in again; if persistent, contact IT Admin |
| MFA OTP not received | Phone/email issue | Check spam folder, verify registered number, retry after 2 minutes |

## 33.2 Data Entry Errors

| Problem | Cause | Solution |
|---------|-------|----------|
| "This field is required" | Mandatory field empty | Fill all fields marked with asterisk (*) |
| "Invalid phone number" | Wrong format | Enter 10-digit number without +91 or 0 prefix |
| "Duplicate entry" | Record with same identifier exists | Search for existing record first |
| "Amount exceeds budget" | PO exceeds project wallet | Request budget revision or Change Order |
| Form not saving | Validation error not visible | Scroll through entire form, check for red-highlighted fields |
| Dropdown not loading | API timeout | Refresh page; if persistent, check internet connection |

## 33.3 Module-Specific Issues

| Problem | Module | Solution |
|---------|--------|----------|
| Lead not appearing after creation | CRM | Check assigned city filter; clear filters |
| Quotation PDF not generating | Sales | Ensure all required fields are filled; retry |
| GRN not updating stock | Inventory | Verify GRN status is "Submitted" not "Draft" |
| Payroll showing wrong salary | HR | Check attendance records and leave deductions |
| Callyzer calls not syncing | CRM | Verify API key, check sync schedule in Settings |
| PhonePe payment stuck on "Processing" | Finance | Wait 30 min; contact Finance for manual verification |
| Approval not routing | Approvals | Check Approval Matrix configuration |
| Email not received | All | Check spam folder; verify email in user profile |
| Export/PDF generation fails | All | Try a smaller date range; clear browser cache |
| Slow page loading | All | Clear browser cache, reduce filter scope, check network |

## 33.4 Technical Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| Port 5001 conflict (dev) | Another process on same port | Kill process: `lsof -ti:5001 \| xargs kill -9` |
| Dropdown items not clickable | Event propagation issue | Known fix applied; report to IT if recurs |
| Card content not styled | className used on Card.Content | Use inline `style` prop instead of `className` |
| Mobile layout broken | Screen width detection | Rotate device or resize window; clear cache |
| File upload fails | File too large | Max file size: 10MB (images), 25MB (documents) |

## 33.5 Who to Contact

| Issue Type | Contact | Channel |
|-----------|---------|---------|
| Login/Access | IT Admin | Support Ticket (category: IT Issue) |
| Data correction | Module owner (HR for HR data, Finance for Finance, etc.) | Support Ticket |
| Bug/System error | IT Admin | Support Ticket (category: IT Issue) with screenshot |
| Feature request | Company Admin | Email with description |
| Urgent system down | IT Admin | Phone call + Support Ticket |

---

# 34. Glossary

| Term | Definition |
|------|------------|
| **AR** | Accounts Receivable -- money owed to Interior Plus by customers |
| **AP** | Accounts Payable -- money Interior Plus owes to vendors |
| **AGM** | Assistant General Manager |
| **BOM** | Bill of Materials -- list of components needed to produce a product |
| **BOQ** | Bill of Quantities -- detailed estimate of materials and costs for a project |
| **BWR** | Boiling Water Resistant (plywood grade) |
| **CGST** | Central Goods and Services Tax |
| **CO** | Change Order -- formal scope change document |
| **CP** | Chrome Plated (plumbing fittings) OR Channel Partner |
| **CRM** | Customer Relationship Management |
| **CTC** | Cost to Company -- total annual compensation |
| **DPDP** | Digital Personal Data Protection Act 2023 |
| **DPR** | Daily Progress Report |
| **DRM** | Design Resource Manager |
| **EL** | Earned Leave |
| **ERP** | Enterprise Resource Planning |
| **ESI** | Employee State Insurance |
| **FIFO** | First In, First Out (inventory valuation method) |
| **GRN** | Goods Receipt Note -- document confirming material receipt |
| **GST** | Goods and Services Tax |
| **GSTR** | GST Return (GSTR-1, GSTR-3B, GSTR-9, etc.) |
| **HDF** | High Density Fibreboard |
| **HRA** | House Rent Allowance |
| **HSN** | Harmonized System of Nomenclature (product classification code) |
| **IFSC** | Indian Financial System Code (bank branch identifier) |
| **IGST** | Integrated Goods and Services Tax |
| **IRN** | Invoice Reference Number (e-invoicing) |
| **JWT** | JSON Web Token (authentication mechanism) |
| **KPI** | Key Performance Indicator -- measurable performance metric |
| **KRA** | Key Result Area -- broad area of responsibility |
| **KYC** | Know Your Customer -- identity and document verification |
| **LOP** | Loss of Pay -- unpaid leave |
| **MDF** | Medium Density Fibreboard |
| **MDM** | Master Data Management |
| **MFA** | Multi-Factor Authentication |
| **MI** | Material Issue -- issuance of materials from inventory |
| **MMT** | Measurement and Technical Team |
| **MRP** | Material Requirements Planning |
| **NPS** | Net Promoter Score -- customer satisfaction metric |
| **P&L** | Profit and Loss statement |
| **P2P** | Procure to Pay -- end-to-end procurement lifecycle |
| **PAN** | Permanent Account Number (income tax identifier) |
| **PF** | Provident Fund |
| **PIP** | Performance Improvement Plan |
| **PM** | Project Manager |
| **PO** | Purchase Order |
| **PPC** | Production Planning and Control |
| **PR** | Purchase Requisition |
| **PT** | Professional Tax |
| **QC** | Quality Control |
| **RBAC** | Role-Based Access Control |
| **RFQ** | Request for Quotation |
| **SE** | Site Engineer |
| **SGST** | State Goods and Services Tax |
| **SLA** | Service Level Agreement -- agreed response/resolution time |
| **SO** | Sales Order |
| **SoD** | Segregation of Duties -- compliance control |
| **TDS** | Tax Deducted at Source |
| **UAN** | Universal Account Number (PF) |
| **UOM** | Unit of Measure |
| **UPI** | Unified Payments Interface |
| **WO** | Work Order -- production authorization |

---

# Document Control

| Detail | Value |
|--------|-------|
| Document Title | HOH108 CRM/ERP System -- Complete Desktop Procedure & User Manual |
| Version | 2.0 |
| Created Date | March 23, 2026 |
| Company | Interior Plus |
| System URL | https://hoh108.com |
| Classification | Internal -- Confidential |
| Distribution | All Interior Plus employees (85+) |
| Owner | IT Admin / Company Admin |
| Review Frequency | Quarterly or on major system update |

---

*END OF DOCUMENT*
