import mongoose from 'mongoose'
import dotenv from 'dotenv'
import KPIConfig from '../models/KPIConfig.js'
import KRA from '../models/KRA.js'
import RoleTemplate from '../models/RoleTemplate.js'
import Company from '../models/Company.js'

dotenv.config()

/**
 * Seed script for Sales & Presales KRA & KPI configurations
 *
 * Based on: KRA & KPI - Presales & Sales.pdf
 *
 * Creates:
 * - KPIs for Presales/Welcome Team
 * - KPIs for Sales Manager
 * - KRAs linked to KPIs
 * - Role Templates with competencies
 *
 * Roles covered:
 * 1. Presales Executive / Welcome Team (PSE)
 * 2. Sales Manager (SM)
 *
 * Usage: node scripts/seedSalesPresalesKRAKPI.js
 */

// =============================================================================
// KPI DEFINITIONS
// =============================================================================

const kpiDefinitions = [
  // -------------------------------------------------------------------------
  // Presales Executive / Welcome Team (PSE) - KPIs
  // -------------------------------------------------------------------------

  // Calling Productivity KPIs (25% weight)
  {
    kpiCode: 'PSE-CP-01',
    name: 'Daily Calls Count',
    description: 'Number of calls made per day. Target: 300 calls/day mandatory',
    category: 'sales',
    formula: {
      type: 'average',
      numerator: { entity: 'callActivities', field: 'count', filter: { type: 'outbound' } },
      aggregation: 'daily'
    },
    thresholds: { excellent: 300, good: 260, average: 220, poor: 180, critical: 150 },
    targets: { global: 300, byRole: [{ role: 'presales_executive', target: 300 }] },
    displayFormat: 'number',
    unit: 'calls',
    visibleToRoles: ['presales_executive', 'presales_head', 'sales_head', 'super_admin']
  },
  {
    kpiCode: 'PSE-CP-02',
    name: 'Call Quality Score',
    description: 'Quality score of calls based on script adherence and conversation quality',
    category: 'sales',
    formula: {
      type: 'average',
      numerator: { entity: 'callActivities', field: 'qualityScore' },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 4.5, good: 4.0, average: 3.5, poor: 3.0, critical: 2.5 },
    targets: { global: 4.0, byRole: [{ role: 'presales_executive', target: 4.0 }] },
    displayFormat: 'number',
    unit: '/5',
    precision: 1,
    visibleToRoles: ['presales_executive', 'presales_head', 'sales_head', 'super_admin']
  },

  // Qualified Showroom Meetings KPIs (30% weight)
  {
    kpiCode: 'PSE-QM-01',
    name: 'Qualified Showroom Meetings',
    description: 'Number of qualified showroom meetings scheduled per month. Target: 25/month',
    category: 'sales',
    formula: {
      type: 'count',
      numerator: { entity: 'meetings', field: '_id', filter: { type: 'showroom', qualified: true } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 30, good: 25, average: 20, poor: 15, critical: 10 },
    targets: { global: 25, byRole: [{ role: 'presales_executive', target: 25 }] },
    displayFormat: 'number',
    unit: '/month',
    visibleToRoles: ['presales_executive', 'presales_head', 'sales_head', 'super_admin']
  },
  {
    kpiCode: 'PSE-QM-02',
    name: 'Meeting SOP Compliance Rate',
    description: 'Percentage of meetings that meet SOP qualification criteria',
    category: 'sales',
    formula: {
      type: 'percentage',
      numerator: { entity: 'meetings', field: 'sopCompliance', filter: { sopCompliance: true } },
      denominator: { entity: 'meetings', field: '_id', filter: { type: 'showroom' } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 100, good: 95, average: 90, poor: 80, critical: 70 },
    targets: { global: 95, byRole: [{ role: 'presales_executive', target: 95 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['presales_executive', 'presales_head', 'sales_head', 'super_admin']
  },

  // Lead Quality & Conversion Readiness KPIs (20% weight)
  {
    kpiCode: 'PSE-LQ-01',
    name: 'Lead Data Completeness',
    description: 'Percentage of leads with proper budget, timeline, and property details',
    category: 'sales',
    formula: {
      type: 'percentage',
      numerator: { entity: 'leads', field: 'dataComplete', filter: { dataComplete: true } },
      denominator: { entity: 'leads', field: '_id' },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 100, good: 95, average: 90, poor: 80, critical: 70 },
    targets: { global: 95, byRole: [{ role: 'presales_executive', target: 95 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['presales_executive', 'presales_head', 'sales_head', 'super_admin']
  },
  {
    kpiCode: 'PSE-LQ-02',
    name: 'Sales Acceptance Rate',
    description: 'Percentage of leads accepted by sales team without rejection',
    category: 'sales',
    formula: {
      type: 'percentage',
      numerator: { entity: 'leads', field: 'salesAccepted', filter: { salesAccepted: true } },
      denominator: { entity: 'leads', field: '_id', filter: { handedToSales: true } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 95, good: 90, average: 85, poor: 75, critical: 60 },
    targets: { global: 90, byRole: [{ role: 'presales_executive', target: 90 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['presales_executive', 'presales_head', 'sales_head', 'super_admin']
  },
  {
    kpiCode: 'PSE-LQ-03',
    name: 'Lead Rejection Rate',
    description: 'Percentage of leads rejected by sales team',
    category: 'sales',
    formula: {
      type: 'percentage',
      numerator: { entity: 'leads', field: 'salesRejected', filter: { salesRejected: true } },
      denominator: { entity: 'leads', field: '_id', filter: { handedToSales: true } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 0, good: 5, average: 10, poor: 15, critical: 25 },
    targets: { global: 5, byRole: [{ role: 'presales_executive', target: 5 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['presales_executive', 'presales_head', 'sales_head', 'super_admin']
  },

  // Ownership, Follow-ups & SOP Compliance KPIs (15% weight)
  {
    kpiCode: 'PSE-SO-01',
    name: 'WhatsApp Group Creation Rate',
    description: 'Percentage of qualified leads with WhatsApp group created',
    category: 'sales',
    formula: {
      type: 'percentage',
      numerator: { entity: 'leads', field: 'whatsappGroup', filter: { whatsappGroup: true } },
      denominator: { entity: 'leads', field: '_id', filter: { qualified: true } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 100, good: 98, average: 95, poor: 90, critical: 80 },
    targets: { global: 100, byRole: [{ role: 'presales_executive', target: 100 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['presales_executive', 'presales_head', 'super_admin']
  },
  {
    kpiCode: 'PSE-SO-02',
    name: 'Meeting Attendance Rate',
    description: 'Percentage of meetings attended till quote delivery',
    category: 'sales',
    formula: {
      type: 'percentage',
      numerator: { entity: 'meetings', field: 'attendedTillQuote', filter: { attendedTillQuote: true } },
      denominator: { entity: 'meetings', field: '_id', filter: { type: 'showroom' } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 100, good: 98, average: 95, poor: 90, critical: 80 },
    targets: { global: 100, byRole: [{ role: 'presales_executive', target: 100 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['presales_executive', 'presales_head', 'super_admin']
  },
  {
    kpiCode: 'PSE-SO-03',
    name: 'CRM Accuracy Rate',
    description: 'Percentage of leads with accurate and complete CRM entries',
    category: 'sales',
    formula: {
      type: 'percentage',
      numerator: { entity: 'leads', field: 'crmAccurate', filter: { crmAccurate: true } },
      denominator: { entity: 'leads', field: '_id' },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 100, good: 98, average: 95, poor: 90, critical: 80 },
    targets: { global: 100, byRole: [{ role: 'presales_executive', target: 100 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['presales_executive', 'presales_head', 'super_admin']
  },
  {
    kpiCode: 'PSE-SO-04',
    name: 'SOP Violation Count',
    description: 'Number of SOP violations per month. Target: Zero',
    category: 'sales',
    formula: {
      type: 'count',
      numerator: { entity: 'violations', field: '_id', filter: { type: 'sop' } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 0, good: 1, average: 2, poor: 3, critical: 5 },
    targets: { global: 0, byRole: [{ role: 'presales_executive', target: 0 }] },
    displayFormat: 'number',
    unit: '',
    visibleToRoles: ['presales_executive', 'presales_head', 'super_admin']
  },

  // Professional Behaviour & Skill Development KPIs (10% weight)
  {
    kpiCode: 'PSE-PB-01',
    name: 'Conversation Quality Score',
    description: 'Quality rating of customer conversations',
    category: 'sales',
    formula: {
      type: 'average',
      numerator: { entity: 'callActivities', field: 'conversationScore' },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 4.5, good: 4.0, average: 3.5, poor: 3.0, critical: 2.5 },
    targets: { global: 4.0, byRole: [{ role: 'presales_executive', target: 4.0 }] },
    displayFormat: 'number',
    unit: '/5',
    precision: 1,
    visibleToRoles: ['presales_executive', 'presales_head', 'super_admin']
  },
  {
    kpiCode: 'PSE-PB-02',
    name: 'Training Completion Rate',
    description: 'Percentage of assigned training/scripts completed',
    category: 'team',
    formula: {
      type: 'percentage',
      numerator: { entity: 'training', field: 'completed', filter: { completed: true } },
      denominator: { entity: 'training', field: '_id', filter: { assigned: true } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 100, good: 95, average: 90, poor: 80, critical: 60 },
    targets: { global: 100, byRole: [{ role: 'presales_executive', target: 100 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['presales_executive', 'presales_head', 'hr_head', 'super_admin']
  },
  {
    kpiCode: 'PSE-PB-03',
    name: 'Leave Discipline Score',
    description: 'Score based on leave pattern and attendance discipline',
    category: 'team',
    formula: {
      type: 'percentage',
      numerator: { entity: 'attendance', field: 'presentDays' },
      denominator: { entity: 'attendance', field: 'workingDays' },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 98, good: 95, average: 90, poor: 85, critical: 75 },
    targets: { global: 95, byRole: [{ role: 'presales_executive', target: 95 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['presales_executive', 'presales_head', 'hr_head', 'super_admin']
  },

  // -------------------------------------------------------------------------
  // Sales Manager (SM) - KPIs
  // -------------------------------------------------------------------------

  // Revenue Achievement KPIs (35% weight)
  {
    kpiCode: 'SM-RA-01',
    name: 'Monthly Revenue Achievement',
    description: 'Revenue achieved vs target. Target: Rs 1 Cr per month',
    category: 'financial',
    formula: {
      type: 'percentage',
      numerator: { entity: 'salesOrders', field: 'revenue', filter: { status: 'confirmed' } },
      denominator: { entity: 'targets', field: 'revenueTarget' },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 110, good: 100, average: 90, poor: 80, critical: 60 },
    targets: { global: 10000000, byRole: [{ role: 'sales_manager', target: 10000000 }] },
    displayFormat: 'currency',
    unit: 'INR',
    visibleToRoles: ['sales_manager', 'sales_head', 'director', 'ceo', 'super_admin']
  },
  {
    kpiCode: 'SM-RA-02',
    name: 'Revenue Target Achievement Rate',
    description: 'Percentage of monthly revenue target achieved',
    category: 'financial',
    formula: {
      type: 'percentage',
      numerator: { entity: 'salesOrders', field: 'revenue', filter: { status: 'confirmed' } },
      denominator: { entity: 'targets', field: 'revenueTarget' },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 110, good: 100, average: 90, poor: 80, critical: 60 },
    targets: { global: 100, byRole: [{ role: 'sales_manager', target: 100 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['sales_manager', 'sales_head', 'director', 'ceo', 'super_admin']
  },
  {
    kpiCode: 'SM-RA-03',
    name: 'Average Order Value',
    description: 'Average value per order. Target: Rs 10-12 Lakhs minimum',
    category: 'financial',
    formula: {
      type: 'average',
      numerator: { entity: 'salesOrders', field: 'value', filter: { status: 'confirmed' } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 1500000, good: 1200000, average: 1000000, poor: 800000, critical: 500000 },
    targets: { global: 1000000, byRole: [{ role: 'sales_manager', target: 1000000 }] },
    displayFormat: 'currency',
    unit: 'INR',
    visibleToRoles: ['sales_manager', 'sales_head', 'director', 'super_admin']
  },

  // Conversion Efficiency KPIs (20% weight)
  {
    kpiCode: 'SM-CE-01',
    name: 'Lead Conversion Rate',
    description: 'Percentage of valid leads converted to orders. Benchmark: 35%',
    category: 'sales',
    formula: {
      type: 'percentage',
      numerator: { entity: 'leads', field: 'status', filter: { status: 'won' } },
      denominator: { entity: 'leads', field: '_id', filter: { qualified: true } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 40, good: 35, average: 30, poor: 25, critical: 15 },
    targets: { global: 35, byRole: [{ role: 'sales_manager', target: 35 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['sales_manager', 'sales_head', 'director', 'super_admin']
  },
  {
    kpiCode: 'SM-CE-02',
    name: 'Quote to Order Conversion',
    description: 'Percentage of quotes converted to confirmed orders',
    category: 'sales',
    formula: {
      type: 'percentage',
      numerator: { entity: 'quotations', field: 'status', filter: { status: 'accepted' } },
      denominator: { entity: 'quotations', field: '_id' },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 50, good: 40, average: 35, poor: 25, critical: 15 },
    targets: { global: 40, byRole: [{ role: 'sales_manager', target: 40 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['sales_manager', 'sales_head', 'director', 'super_admin']
  },

  // Funnel & Follow-up Discipline KPIs (15% weight)
  {
    kpiCode: 'SM-FD-01',
    name: 'Follow-up Completion Rate',
    description: 'Percentage of scheduled follow-ups completed on time',
    category: 'sales',
    formula: {
      type: 'percentage',
      numerator: { entity: 'followUps', field: 'status', filter: { status: 'completed', onTime: true } },
      denominator: { entity: 'followUps', field: '_id', filter: { scheduledDate: { $lte: new Date() } } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 100, good: 98, average: 95, poor: 90, critical: 80 },
    targets: { global: 100, byRole: [{ role: 'sales_manager', target: 100 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['sales_manager', 'sales_head', 'super_admin']
  },
  {
    kpiCode: 'SM-FD-02',
    name: 'Quote Delivery Timeliness',
    description: 'Percentage of quotes delivered within SLA (by EOD)',
    category: 'sales',
    formula: {
      type: 'percentage',
      numerator: { entity: 'quotations', field: 'deliveredOnTime', filter: { deliveredOnTime: true } },
      denominator: { entity: 'quotations', field: '_id' },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 100, good: 98, average: 95, poor: 90, critical: 80 },
    targets: { global: 100, byRole: [{ role: 'sales_manager', target: 100 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['sales_manager', 'sales_head', 'super_admin']
  },
  {
    kpiCode: 'SM-FD-03',
    name: 'CRM Update Compliance',
    description: 'Percentage of leads with clean and updated CRM entries',
    category: 'sales',
    formula: {
      type: 'percentage',
      numerator: { entity: 'leads', field: 'crmUpdated', filter: { crmUpdated: true } },
      denominator: { entity: 'leads', field: '_id', filter: { assignedTo: { $exists: true } } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 100, good: 98, average: 95, poor: 90, critical: 80 },
    targets: { global: 100, byRole: [{ role: 'sales_manager', target: 100 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['sales_manager', 'sales_head', 'super_admin']
  },

  // SOP & Process Compliance KPIs (10% weight)
  {
    kpiCode: 'SM-SP-01',
    name: 'WhatsApp Group Compliance',
    description: 'Percentage of deals with proper WhatsApp group usage',
    category: 'sales',
    formula: {
      type: 'percentage',
      numerator: { entity: 'leads', field: 'whatsappCompliance', filter: { whatsappCompliance: true } },
      denominator: { entity: 'leads', field: '_id', filter: { status: { $in: ['quoted', 'negotiation', 'won'] } } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 100, good: 98, average: 95, poor: 90, critical: 80 },
    targets: { global: 100, byRole: [{ role: 'sales_manager', target: 100 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['sales_manager', 'sales_head', 'super_admin']
  },
  {
    kpiCode: 'SM-SP-02',
    name: 'Email Approval Compliance',
    description: 'Percentage of deals with proper email approvals documented',
    category: 'sales',
    formula: {
      type: 'percentage',
      numerator: { entity: 'salesOrders', field: 'emailApproval', filter: { emailApproval: true } },
      denominator: { entity: 'salesOrders', field: '_id' },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 100, good: 98, average: 95, poor: 90, critical: 80 },
    targets: { global: 100, byRole: [{ role: 'sales_manager', target: 100 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['sales_manager', 'sales_head', 'super_admin']
  },
  {
    kpiCode: 'SM-SP-03',
    name: 'Handover Compliance Rate',
    description: 'Percentage of deals with proper handover to operations',
    category: 'sales',
    formula: {
      type: 'percentage',
      numerator: { entity: 'salesOrders', field: 'properHandover', filter: { properHandover: true } },
      denominator: { entity: 'salesOrders', field: '_id', filter: { status: 'confirmed' } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 100, good: 98, average: 95, poor: 90, critical: 80 },
    targets: { global: 100, byRole: [{ role: 'sales_manager', target: 100 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['sales_manager', 'sales_head', 'operations_head', 'super_admin']
  },

  // Ownership, Responsibility & Team Support KPIs (10% weight)
  {
    kpiCode: 'SM-OT-01',
    name: 'Deal Ownership Score',
    description: 'Score based on ownership of deals from start to close',
    category: 'sales',
    formula: {
      type: 'average',
      numerator: { entity: 'salesOrders', field: 'ownershipScore' },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 4.5, good: 4.0, average: 3.5, poor: 3.0, critical: 2.5 },
    targets: { global: 4.0, byRole: [{ role: 'sales_manager', target: 4.0 }] },
    displayFormat: 'number',
    unit: '/5',
    precision: 1,
    visibleToRoles: ['sales_manager', 'sales_head', 'super_admin']
  },
  {
    kpiCode: 'SM-OT-02',
    name: 'Team Collaboration Score',
    description: 'Score based on helping colleagues and team collaboration',
    category: 'team',
    formula: {
      type: 'average',
      numerator: { entity: 'feedback', field: 'collaborationScore', filter: { type: 'peer' } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 4.5, good: 4.0, average: 3.5, poor: 3.0, critical: 2.5 },
    targets: { global: 4.0, byRole: [{ role: 'sales_manager', target: 4.0 }] },
    displayFormat: 'number',
    unit: '/5',
    precision: 1,
    visibleToRoles: ['sales_manager', 'sales_head', 'super_admin']
  },
  {
    kpiCode: 'SM-OT-03',
    name: 'Client Handling Maturity Score',
    description: 'Score based on professional client handling and relationship management',
    category: 'customer',
    formula: {
      type: 'average',
      numerator: { entity: 'feedback', field: 'clientHandlingScore', filter: { type: 'client' } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 4.5, good: 4.0, average: 3.5, poor: 3.0, critical: 2.5 },
    targets: { global: 4.0, byRole: [{ role: 'sales_manager', target: 4.0 }] },
    displayFormat: 'number',
    unit: '/5',
    precision: 1,
    visibleToRoles: ['sales_manager', 'sales_head', 'super_admin']
  },

  // Professional Conduct & Attendance KPIs (10% weight)
  {
    kpiCode: 'SM-PC-01',
    name: 'Attendance Rate',
    description: 'Percentage of working days present',
    category: 'team',
    formula: {
      type: 'percentage',
      numerator: { entity: 'attendance', field: 'presentDays' },
      denominator: { entity: 'attendance', field: 'workingDays' },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 98, good: 95, average: 90, poor: 85, critical: 75 },
    targets: { global: 95, byRole: [{ role: 'sales_manager', target: 95 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['sales_manager', 'sales_head', 'hr_head', 'super_admin']
  },
  {
    kpiCode: 'SM-PC-02',
    name: 'Punctuality Score',
    description: 'Percentage of days with on-time arrival',
    category: 'team',
    formula: {
      type: 'percentage',
      numerator: { entity: 'attendance', field: 'onTimeDays' },
      denominator: { entity: 'attendance', field: 'presentDays' },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 100, good: 95, average: 90, poor: 85, critical: 75 },
    targets: { global: 95, byRole: [{ role: 'sales_manager', target: 95 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['sales_manager', 'sales_head', 'hr_head', 'super_admin']
  },
  {
    kpiCode: 'SM-PC-03',
    name: 'Customer Professionalism Score',
    description: 'Score based on professional conduct with customers',
    category: 'customer',
    formula: {
      type: 'average',
      numerator: { entity: 'feedback', field: 'professionalismScore', filter: { type: 'client' } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 4.5, good: 4.0, average: 3.5, poor: 3.0, critical: 2.5 },
    targets: { global: 4.0, byRole: [{ role: 'sales_manager', target: 4.0 }] },
    displayFormat: 'number',
    unit: '/5',
    precision: 1,
    visibleToRoles: ['sales_manager', 'sales_head', 'super_admin']
  }
]

// =============================================================================
// KRA DEFINITIONS
// =============================================================================

const kraDefinitions = [
  // -------------------------------------------------------------------------
  // Presales Executive / Welcome Team (5 KRAs)
  // -------------------------------------------------------------------------
  {
    kraCode: 'PSE-KRA-01',
    name: 'Calling Productivity',
    description: 'Consistent daily calling discipline with quality conversations',
    category: 'sales',
    weight: 25,
    linkedKPIs: ['PSE-CP-01', 'PSE-CP-02'],
    applicableTo: 'role',
    roles: ['presales_executive']
  },
  {
    kraCode: 'PSE-KRA-02',
    name: 'Quality Pipeline Creation',
    description: 'Generate qualified showroom meetings meeting SOP criteria',
    category: 'sales',
    weight: 30,
    linkedKPIs: ['PSE-QM-01', 'PSE-QM-02'],
    applicableTo: 'role',
    roles: ['presales_executive']
  },
  {
    kraCode: 'PSE-KRA-03',
    name: 'Lead Quality & Conversion Readiness',
    description: 'Pass sales-ready leads with proper qualification',
    category: 'sales',
    weight: 20,
    linkedKPIs: ['PSE-LQ-01', 'PSE-LQ-02', 'PSE-LQ-03'],
    applicableTo: 'role',
    roles: ['presales_executive']
  },
  {
    kraCode: 'PSE-KRA-04',
    name: 'SOP & Process Compliance',
    description: 'Follow process discipline with proper ownership and follow-ups',
    category: 'operations',
    weight: 15,
    linkedKPIs: ['PSE-SO-01', 'PSE-SO-02', 'PSE-SO-03', 'PSE-SO-04'],
    applicableTo: 'role',
    roles: ['presales_executive']
  },
  {
    kraCode: 'PSE-KRA-05',
    name: 'Professional Behaviour & Development',
    description: 'Maintain team culture, skill development, and attendance discipline',
    category: 'hr',
    weight: 10,
    linkedKPIs: ['PSE-PB-01', 'PSE-PB-02', 'PSE-PB-03'],
    applicableTo: 'role',
    roles: ['presales_executive']
  },

  // -------------------------------------------------------------------------
  // Sales Manager (6 KRAs)
  // -------------------------------------------------------------------------
  {
    kraCode: 'SM-KRA-01',
    name: 'Revenue Achievement',
    description: 'Deliver monthly revenue target of Rs 1 Cr with minimum order value of Rs 10-12 Lakhs',
    category: 'sales',
    weight: 35,
    linkedKPIs: ['SM-RA-01', 'SM-RA-02', 'SM-RA-03'],
    applicableTo: 'role',
    roles: ['sales_manager']
  },
  {
    kraCode: 'SM-KRA-02',
    name: 'Conversion Efficiency',
    description: 'Improve and maintain conversion rate from valid leads. Benchmark: 35%',
    category: 'sales',
    weight: 20,
    linkedKPIs: ['SM-CE-01', 'SM-CE-02'],
    applicableTo: 'role',
    roles: ['sales_manager']
  },
  {
    kraCode: 'SM-KRA-03',
    name: 'Funnel & Follow-up Discipline',
    description: 'Prevent leakage in sales funnel with timely follow-ups and quotes',
    category: 'sales',
    weight: 15,
    linkedKPIs: ['SM-FD-01', 'SM-FD-02', 'SM-FD-03'],
    applicableTo: 'role',
    roles: ['sales_manager']
  },
  {
    kraCode: 'SM-KRA-04',
    name: 'SOP & Process Compliance',
    description: 'Follow company SOP strictly - WhatsApp groups, quotes, approvals, handovers',
    category: 'operations',
    weight: 10,
    linkedKPIs: ['SM-SP-01', 'SM-SP-02', 'SM-SP-03'],
    applicableTo: 'role',
    roles: ['sales_manager']
  },
  {
    kraCode: 'SM-KRA-05',
    name: 'Ownership & Team Support',
    description: 'Act like a business owner with strong deal ownership and team collaboration',
    category: 'leadership',
    weight: 10,
    linkedKPIs: ['SM-OT-01', 'SM-OT-02', 'SM-OT-03'],
    applicableTo: 'role',
    roles: ['sales_manager']
  },
  {
    kraCode: 'SM-KRA-06',
    name: 'Professional Conduct & Attendance',
    description: 'Maintain reliability, discipline, punctuality, and customer professionalism',
    category: 'hr',
    weight: 10,
    linkedKPIs: ['SM-PC-01', 'SM-PC-02', 'SM-PC-03'],
    applicableTo: 'role',
    roles: ['sales_manager']
  }
]

// =============================================================================
// ROLE TEMPLATE DEFINITIONS
// =============================================================================

const roleTemplateDefinitions = [
  {
    templateCode: 'SLS-PSE',
    name: 'Presales Executive – Welcome Team',
    description: 'Front-line team member responsible for lead qualification, calling, and scheduling showroom meetings',
    department: 'sales',
    level: 'junior',
    linkedKRAs: ['PSE-KRA-01', 'PSE-KRA-02', 'PSE-KRA-03', 'PSE-KRA-04', 'PSE-KRA-05'],
    competencies: [
      { name: 'Communication', description: 'Excellent verbal communication and phone etiquette', requiredLevel: 4 },
      { name: 'Lead Qualification', description: 'Ability to identify and qualify potential customers', requiredLevel: 4 },
      { name: 'CRM Proficiency', description: 'Skill in using CRM systems for lead management', requiredLevel: 3 },
      { name: 'Script Adherence', description: 'Ability to follow call scripts while maintaining natural conversation', requiredLevel: 4 },
      { name: 'Time Management', description: 'Managing high call volumes efficiently', requiredLevel: 4 }
    ],
    responsibilities: [
      'Make 300+ calls per day to prospective customers',
      'Qualify leads based on budget, timeline, and property details',
      'Schedule showroom meetings for qualified prospects',
      'Create WhatsApp groups for qualified leads',
      'Maintain accurate CRM records for all interactions',
      'Follow up with prospects until meeting completion',
      'Hand over qualified leads to sales team',
      'Achieve monthly meeting targets',
      'Follow all SOPs and process guidelines',
      'Continuously improve calling skills and product knowledge'
    ],
    qualifications: [
      'Bachelor\'s degree in any discipline',
      '0-2 years of experience in telecalling or sales',
      'Excellent communication skills in English and Hindi',
      'Basic computer and CRM knowledge',
      'Positive attitude and willingness to learn'
    ],
    salaryRange: { min: 200000, max: 350000, currency: 'INR' }
  },
  {
    templateCode: 'SLS-SM',
    name: 'Sales Manager – Interiors',
    description: 'Responsible for converting qualified leads into sales orders, achieving revenue targets, and maintaining high conversion rates',
    department: 'sales',
    level: 'manager',
    linkedKRAs: ['SM-KRA-01', 'SM-KRA-02', 'SM-KRA-03', 'SM-KRA-04', 'SM-KRA-05', 'SM-KRA-06'],
    competencies: [
      { name: 'Sales Expertise', description: 'Strong consultative selling and negotiation skills', requiredLevel: 5 },
      { name: 'Product Knowledge', description: 'Deep understanding of interior products and solutions', requiredLevel: 4 },
      { name: 'Client Management', description: 'Ability to build and maintain client relationships', requiredLevel: 5 },
      { name: 'Presentation Skills', description: 'Effective presentation and proposal delivery', requiredLevel: 4 },
      { name: 'Commercial Acumen', description: 'Understanding of pricing, margins, and deal structuring', requiredLevel: 4 },
      { name: 'Process Discipline', description: 'Adherence to sales processes and SOP compliance', requiredLevel: 4 }
    ],
    responsibilities: [
      'Achieve monthly revenue target of Rs 1 Crore',
      'Maintain lead conversion rate of 35% or higher',
      'Conduct showroom meetings and client presentations',
      'Prepare and deliver quotations by EOD',
      'Follow up with all prospects systematically',
      'Maintain clean and updated CRM records',
      'Create and manage client WhatsApp groups',
      'Coordinate with design team for proposals',
      'Complete proper handover to operations team',
      'Support team members and share best practices',
      'Maintain professional conduct with all stakeholders'
    ],
    qualifications: [
      'Bachelor\'s degree in any discipline, MBA preferred',
      '3-5 years of experience in interior/home solutions sales',
      'Proven track record of achieving sales targets',
      'Excellent communication and presentation skills',
      'Strong negotiation and closing abilities',
      'Proficiency in CRM and MS Office'
    ],
    salaryRange: { min: 600000, max: 1000000, currency: 'INR' }
  }
]

// =============================================================================
// SEED FUNCTION
// =============================================================================

const seedSalesPresalesKRAKPI = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    // Get the company
    const company = await Company.findOne({ isActive: true })
    if (!company) {
      console.log('No active company found. Please create a company first.')
      process.exit(1)
    }

    console.log(`Using company: ${company.name} (${company.code})`)
    console.log('\n' + '='.repeat(60))
    console.log('SEEDING SALES & PRESALES KRA & KPI')
    console.log('='.repeat(60))

    // Track created KPIs for linking
    const kpiMap = new Map()

    // -------------------------------------------------------------------------
    // STEP 1: Create KPIs
    // -------------------------------------------------------------------------
    console.log(`\n--- Creating KPIs (${kpiDefinitions.length} total) ---\n`)

    let kpisCreated = 0
    let kpisUpdated = 0

    for (const kpiDef of kpiDefinitions) {
      const existing = await KPIConfig.findOne({
        company: company._id,
        kpiCode: kpiDef.kpiCode
      })

      if (existing) {
        // Update existing
        Object.assign(existing, kpiDef)
        existing.company = company._id
        await existing.save()
        kpiMap.set(kpiDef.kpiCode, existing._id)
        console.log(`  Updated: ${kpiDef.kpiCode} - ${kpiDef.name}`)
        kpisUpdated++
      } else {
        // Create new
        const kpi = await KPIConfig.create({
          ...kpiDef,
          company: company._id,
          isActive: true,
          showOnDashboard: true
        })
        kpiMap.set(kpiDef.kpiCode, kpi._id)
        console.log(`  Created: ${kpiDef.kpiCode} - ${kpiDef.name}`)
        kpisCreated++
      }
    }

    console.log(`\nKPIs Summary: Created=${kpisCreated}, Updated=${kpisUpdated}, Total=${kpiDefinitions.length}`)

    // -------------------------------------------------------------------------
    // STEP 2: Create KRAs with KPI links
    // -------------------------------------------------------------------------
    console.log(`\n--- Creating KRAs (${kraDefinitions.length} total) ---\n`)

    const kraMap = new Map()
    let krasCreated = 0
    let krasUpdated = 0

    for (const kraDef of kraDefinitions) {
      // Build KPI links
      const kpis = kraDef.linkedKPIs.map(kpiCode => {
        const kpiId = kpiMap.get(kpiCode)
        const kpiDef = kpiDefinitions.find(k => k.kpiCode === kpiCode)
        return {
          kpi: kpiId,
          kpiName: kpiDef?.name || kpiCode,
          weight: Math.floor(100 / kraDef.linkedKPIs.length)
        }
      }).filter(k => k.kpi)

      const existing = await KRA.findOne({
        company: company._id,
        kraCode: kraDef.kraCode
      })

      if (existing) {
        // Update existing
        existing.name = kraDef.name
        existing.description = kraDef.description
        existing.category = kraDef.category
        existing.weight = kraDef.weight
        existing.applicableTo = kraDef.applicableTo
        existing.roles = kraDef.roles
        existing.kpis = kpis
        existing.isSystem = true
        await existing.save()
        kraMap.set(kraDef.kraCode, existing._id)
        console.log(`  Updated: ${kraDef.kraCode} - ${kraDef.name}`)
        krasUpdated++
      } else {
        // Create new
        const kra = await KRA.create({
          company: company._id,
          kraCode: kraDef.kraCode,
          name: kraDef.name,
          description: kraDef.description,
          category: kraDef.category,
          weight: kraDef.weight,
          applicableTo: kraDef.applicableTo,
          roles: kraDef.roles,
          kpis,
          isActive: true,
          isSystem: true
        })
        kraMap.set(kraDef.kraCode, kra._id)
        console.log(`  Created: ${kraDef.kraCode} - ${kraDef.name}`)
        krasCreated++
      }
    }

    console.log(`\nKRAs Summary: Created=${krasCreated}, Updated=${krasUpdated}, Total=${kraDefinitions.length}`)

    // -------------------------------------------------------------------------
    // STEP 3: Create Role Templates with KRA links
    // -------------------------------------------------------------------------
    console.log(`\n--- Creating Role Templates (${roleTemplateDefinitions.length} total) ---\n`)

    let templatesCreated = 0
    let templatesUpdated = 0

    for (const templateDef of roleTemplateDefinitions) {
      // Build KRA links
      const kras = templateDef.linkedKRAs.map(kraCode => {
        const kraId = kraMap.get(kraCode)
        const kraDef = kraDefinitions.find(k => k.kraCode === kraCode)
        return {
          kra: kraId,
          kraName: kraDef?.name || kraCode,
          weight: kraDef?.weight || 10
        }
      }).filter(k => k.kra)

      const existing = await RoleTemplate.findOne({
        company: company._id,
        templateCode: templateDef.templateCode
      })

      if (existing) {
        // Update existing
        existing.name = templateDef.name
        existing.description = templateDef.description
        existing.department = templateDef.department
        existing.level = templateDef.level
        existing.kras = kras
        existing.competencies = templateDef.competencies
        existing.responsibilities = templateDef.responsibilities
        existing.qualifications = templateDef.qualifications
        existing.salaryRange = templateDef.salaryRange
        existing.isSystem = true
        await existing.save()
        console.log(`  Updated: ${templateDef.templateCode} - ${templateDef.name}`)
        templatesUpdated++
      } else {
        // Create new
        await RoleTemplate.create({
          company: company._id,
          templateCode: templateDef.templateCode,
          name: templateDef.name,
          description: templateDef.description,
          department: templateDef.department,
          level: templateDef.level,
          kras,
          competencies: templateDef.competencies,
          responsibilities: templateDef.responsibilities,
          qualifications: templateDef.qualifications,
          salaryRange: templateDef.salaryRange,
          isActive: true,
          isSystem: true
        })
        console.log(`  Created: ${templateDef.templateCode} - ${templateDef.name}`)
        templatesCreated++
      }
    }

    console.log(`\nRole Templates Summary: Created=${templatesCreated}, Updated=${templatesUpdated}, Total=${roleTemplateDefinitions.length}`)

    // -------------------------------------------------------------------------
    // FINAL SUMMARY
    // -------------------------------------------------------------------------
    console.log('\n' + '='.repeat(60))
    console.log('SEED COMPLETE')
    console.log('='.repeat(60))
    console.log(`
Summary:
  KPIs:           ${kpisCreated} created, ${kpisUpdated} updated (Total: ${kpiDefinitions.length})
  KRAs:           ${krasCreated} created, ${krasUpdated} updated (Total: ${kraDefinitions.length})
  Role Templates: ${templatesCreated} created, ${templatesUpdated} updated (Total: ${roleTemplateDefinitions.length})

Roles Configured:
  1. Presales Executive – Welcome Team (PSE) - 5 KRAs, 14 KPIs
     - Calling Productivity (25%)
     - Quality Pipeline Creation (30%)
     - Lead Quality & Conversion Readiness (20%)
     - SOP & Process Compliance (15%)
     - Professional Behaviour & Development (10%)

  2. Sales Manager – Interiors (SM) - 6 KRAs, 17 KPIs
     - Revenue Achievement (35%)
     - Conversion Efficiency (20%)
     - Funnel & Follow-up Discipline (15%)
     - SOP & Process Compliance (10%)
     - Ownership & Team Support (10%)
     - Professional Conduct & Attendance (10%)
`)

    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

// Run the seed
seedSalesPresalesKRAKPI()
