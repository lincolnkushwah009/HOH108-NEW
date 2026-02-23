import mongoose from 'mongoose'
import dotenv from 'dotenv'
import KPIConfig from '../models/KPIConfig.js'
import KRA from '../models/KRA.js'
import RoleTemplate from '../models/RoleTemplate.js'
import Company from '../models/Company.js'

dotenv.config()

/**
 * Seed script for Interior Operations KRA & KPI configurations
 *
 * Creates:
 * - 44 KPIs for 5 Interior Operations roles
 * - 32 KRAs linked to KPIs
 * - 5 Role Templates with competencies
 *
 * Roles covered:
 * 1. Head of Operations – Interiors (HOO)
 * 2. Project Manager – Interiors (PM)
 * 3. Measurement Executive – Interiors (ME)
 * 4. CSR – Interiors (CSR)
 * 5. Factory Coordinator – Interiors (FC)
 *
 * Usage: node scripts/seedInteriorOpsKRAKPI.js
 */

// =============================================================================
// KPI DEFINITIONS (44 Total)
// =============================================================================

const kpiDefinitions = [
  // -------------------------------------------------------------------------
  // Head of Operations (HOO) - 10 KPIs
  // -------------------------------------------------------------------------
  {
    kpiCode: 'HOO-PD-01',
    name: 'On-Time Delivery Rate',
    description: 'Percentage of projects delivered on or before the scheduled completion date',
    category: 'projects',
    formula: {
      type: 'percentage',
      numerator: { entity: 'projects', field: 'status', filter: { status: 'completed', onTime: true } },
      denominator: { entity: 'projects', field: 'status', filter: { status: 'completed' } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 95, good: 90, average: 85, poor: 75, critical: 60 },
    targets: { global: 90, byRole: [{ role: 'head_of_operations', target: 90 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['head_of_operations', 'director', 'ceo', 'super_admin']
  },
  {
    kpiCode: 'HOO-PD-02',
    name: 'Average Project Delay',
    description: 'Average number of days projects are delayed beyond scheduled completion',
    category: 'projects',
    formula: {
      type: 'average',
      numerator: { entity: 'projects', field: 'delayDays', filter: { status: 'completed' } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 0, good: 3, average: 5, poor: 10, critical: 15 },
    targets: { global: 5, byRole: [{ role: 'head_of_operations', target: 5 }] },
    displayFormat: 'number',
    unit: 'days',
    visibleToRoles: ['head_of_operations', 'director', 'ceo', 'super_admin']
  },
  {
    kpiCode: 'HOO-CC-01',
    name: 'Budget Variance',
    description: 'Percentage variance between budgeted and actual project costs',
    category: 'financial',
    formula: {
      type: 'percentage',
      numerator: { entity: 'projects', field: 'financials.variance' },
      denominator: { entity: 'projects', field: 'financials.budget' },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 0, good: 3, average: 5, poor: 8, critical: 10 },
    targets: { global: 5, byRole: [{ role: 'head_of_operations', target: 5 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['head_of_operations', 'finance_head', 'director', 'ceo', 'super_admin']
  },
  {
    kpiCode: 'HOO-CC-02',
    name: 'Cost Savings Achieved',
    description: 'Percentage of cost savings achieved through optimization and negotiation',
    category: 'financial',
    formula: {
      type: 'percentage',
      numerator: { entity: 'projects', field: 'financials.savings' },
      denominator: { entity: 'projects', field: 'financials.budget' },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 10, good: 7, average: 5, poor: 3, critical: 0 },
    targets: { global: 5, byRole: [{ role: 'head_of_operations', target: 5 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['head_of_operations', 'finance_head', 'director', 'ceo', 'super_admin']
  },
  {
    kpiCode: 'HOO-QA-01',
    name: 'Snag Rate',
    description: 'Percentage of deliverables with quality snags reported',
    category: 'projects',
    formula: {
      type: 'percentage',
      numerator: { entity: 'projects', field: 'snagList', filter: { 'snagList.0': { $exists: true } } },
      denominator: { entity: 'projects', field: '_id', filter: { status: 'completed' } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 0, good: 2, average: 3, poor: 5, critical: 10 },
    targets: { global: 3, byRole: [{ role: 'head_of_operations', target: 3 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['head_of_operations', 'project_manager', 'quality_head', 'super_admin']
  },
  {
    kpiCode: 'HOO-QA-02',
    name: 'First-Time Right Rate',
    description: 'Percentage of deliverables accepted without rework on first submission',
    category: 'projects',
    formula: {
      type: 'percentage',
      numerator: { entity: 'tasks', field: 'qcStatus', filter: { qcStatus: 'passed', reworkCount: 0 } },
      denominator: { entity: 'tasks', field: '_id', filter: { qcStatus: { $exists: true } } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 95, good: 90, average: 85, poor: 75, critical: 60 },
    targets: { global: 85, byRole: [{ role: 'head_of_operations', target: 85 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['head_of_operations', 'project_manager', 'quality_head', 'super_admin']
  },
  {
    kpiCode: 'HOO-TM-01',
    name: 'Team Utilization',
    description: 'Percentage of team capacity utilized across projects',
    category: 'team',
    formula: {
      type: 'percentage',
      numerator: { entity: 'users', field: 'activeProjects' },
      denominator: { entity: 'users', field: 'capacity' },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 90, good: 85, average: 80, poor: 70, critical: 50 },
    targets: { global: 80, byRole: [{ role: 'head_of_operations', target: 80 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['head_of_operations', 'hr_head', 'director', 'super_admin']
  },
  {
    kpiCode: 'HOO-TM-02',
    name: 'Training Completion Rate',
    description: 'Percentage of mandatory training completed by team members',
    category: 'team',
    formula: {
      type: 'percentage',
      numerator: { entity: 'training', field: 'completedCount' },
      denominator: { entity: 'training', field: 'totalRequired' },
      aggregation: 'quarterly'
    },
    thresholds: { excellent: 100, good: 95, average: 90, poor: 80, critical: 60 },
    targets: { global: 100, byRole: [{ role: 'head_of_operations', target: 100 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['head_of_operations', 'hr_head', 'director', 'super_admin']
  },
  {
    kpiCode: 'HOO-CS-01',
    name: 'Client Satisfaction Score',
    description: 'Average client satisfaction rating on completed projects',
    category: 'customer',
    formula: {
      type: 'average',
      numerator: { entity: 'projects', field: 'clientSatisfactionScore', filter: { status: 'completed' } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 4.8, good: 4.5, average: 4.0, poor: 3.5, critical: 3.0 },
    targets: { global: 4.5, byRole: [{ role: 'head_of_operations', target: 4.5 }] },
    displayFormat: 'number',
    unit: '/5',
    precision: 1,
    visibleToRoles: ['head_of_operations', 'director', 'ceo', 'super_admin']
  },
  {
    kpiCode: 'HOO-CF-01',
    name: 'Cross-Functional Issue Resolution',
    description: 'Average time to resolve cross-functional issues',
    category: 'team',
    formula: {
      type: 'average',
      numerator: { entity: 'tickets', field: 'resolutionTime', filter: { type: 'cross_functional' } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 12, good: 18, average: 24, poor: 36, critical: 48 },
    targets: { global: 24, byRole: [{ role: 'head_of_operations', target: 24 }] },
    displayFormat: 'duration',
    unit: 'hrs',
    visibleToRoles: ['head_of_operations', 'director', 'super_admin']
  },

  // -------------------------------------------------------------------------
  // Project Manager (PM) - 9 KPIs
  // -------------------------------------------------------------------------
  {
    kpiCode: 'PM-SE-01',
    name: 'Site Milestone Completion Rate',
    description: 'Percentage of site milestones completed as scheduled',
    category: 'projects',
    formula: {
      type: 'percentage',
      numerator: { entity: 'milestones', field: 'status', filter: { status: 'completed', onTime: true } },
      denominator: { entity: 'milestones', field: '_id', filter: { dueDate: { $lte: new Date() } } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 100, good: 97, average: 95, poor: 90, critical: 80 },
    targets: { global: 95, byRole: [{ role: 'project_manager', target: 95 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['project_manager', 'head_of_operations', 'director', 'super_admin']
  },
  {
    kpiCode: 'PM-TL-01',
    name: 'Timeline Adherence',
    description: 'Percentage of projects meeting their planned timelines',
    category: 'projects',
    formula: {
      type: 'percentage',
      numerator: { entity: 'projects', field: 'timeline', filter: { 'timeline.onTrack': true } },
      denominator: { entity: 'projects', field: '_id', filter: { status: { $in: ['in_progress', 'completed'] } } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 95, good: 92, average: 90, poor: 85, critical: 75 },
    targets: { global: 90, byRole: [{ role: 'project_manager', target: 90 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['project_manager', 'head_of_operations', 'director', 'super_admin']
  },
  {
    kpiCode: 'PM-TL-02',
    name: 'Phase Completion Rate',
    description: 'Percentage of project phases completed on schedule',
    category: 'projects',
    formula: {
      type: 'percentage',
      numerator: { entity: 'phases', field: 'status', filter: { status: 'completed', onTime: true } },
      denominator: { entity: 'phases', field: '_id', filter: { status: 'completed' } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 95, good: 92, average: 90, poor: 85, critical: 75 },
    targets: { global: 90, byRole: [{ role: 'project_manager', target: 90 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['project_manager', 'head_of_operations', 'super_admin']
  },
  {
    kpiCode: 'PM-QC-01',
    name: 'Quality Check Pass Rate',
    description: 'Percentage of quality checks passed on first attempt',
    category: 'projects',
    formula: {
      type: 'percentage',
      numerator: { entity: 'tasks', field: 'qcStatus', filter: { qcStatus: 'passed' } },
      denominator: { entity: 'tasks', field: '_id', filter: { qcStatus: { $exists: true } } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 98, good: 97, average: 95, poor: 90, critical: 80 },
    targets: { global: 95, byRole: [{ role: 'project_manager', target: 95 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['project_manager', 'head_of_operations', 'quality_head', 'super_admin']
  },
  {
    kpiCode: 'PM-QC-02',
    name: 'Rework Percentage',
    description: 'Percentage of tasks requiring rework due to quality issues',
    category: 'projects',
    formula: {
      type: 'percentage',
      numerator: { entity: 'tasks', field: 'reworkCount', filter: { reworkCount: { $gt: 0 } } },
      denominator: { entity: 'tasks', field: '_id', filter: { status: 'completed' } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 0, good: 3, average: 5, poor: 8, critical: 15 },
    targets: { global: 5, byRole: [{ role: 'project_manager', target: 5 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['project_manager', 'head_of_operations', 'quality_head', 'super_admin']
  },
  {
    kpiCode: 'PM-DV-01',
    name: 'Design Error Detection Rate',
    description: 'Percentage of design errors detected before execution',
    category: 'projects',
    formula: {
      type: 'percentage',
      numerator: { entity: 'designErrors', field: 'detectedPhase', filter: { detectedPhase: 'pre_execution' } },
      denominator: { entity: 'designErrors', field: '_id' },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 95, good: 92, average: 90, poor: 85, critical: 75 },
    targets: { global: 90, byRole: [{ role: 'project_manager', target: 90 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['project_manager', 'design_head', 'head_of_operations', 'super_admin']
  },
  {
    kpiCode: 'PM-MC-01',
    name: 'Material Delay Incidents',
    description: 'Number of project delays caused by material unavailability',
    category: 'projects',
    formula: {
      type: 'count',
      numerator: { entity: 'delays', field: '_id', filter: { reason: 'material_unavailable' } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 0, good: 1, average: 2, poor: 4, critical: 6 },
    targets: { global: 2, byRole: [{ role: 'project_manager', target: 2 }] },
    displayFormat: 'number',
    unit: '/month',
    visibleToRoles: ['project_manager', 'procurement_head', 'head_of_operations', 'super_admin']
  },
  {
    kpiCode: 'PM-RP-01',
    name: 'Report Submission Timeliness',
    description: 'Percentage of progress reports submitted on time',
    category: 'projects',
    formula: {
      type: 'percentage',
      numerator: { entity: 'reports', field: 'submittedAt', filter: { onTime: true } },
      denominator: { entity: 'reports', field: '_id', filter: { dueDate: { $lte: new Date() } } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 100, good: 98, average: 95, poor: 90, critical: 80 },
    targets: { global: 100, byRole: [{ role: 'project_manager', target: 100 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['project_manager', 'head_of_operations', 'super_admin']
  },
  {
    kpiCode: 'PM-CH-01',
    name: 'Client Escalation Rate',
    description: 'Percentage of projects with client escalations',
    category: 'customer',
    formula: {
      type: 'percentage',
      numerator: { entity: 'projects', field: 'escalations', filter: { 'escalations.type': 'client' } },
      denominator: { entity: 'projects', field: '_id', filter: { status: { $in: ['in_progress', 'completed'] } } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 0, good: 2, average: 5, poor: 8, critical: 15 },
    targets: { global: 5, byRole: [{ role: 'project_manager', target: 5 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['project_manager', 'head_of_operations', 'csr', 'super_admin']
  },

  // -------------------------------------------------------------------------
  // Measurement Executive (ME) - 5 KPIs
  // -------------------------------------------------------------------------
  {
    kpiCode: 'ME-MA-01',
    name: 'Measurement Accuracy Rate',
    description: 'Percentage of measurements within acceptable tolerance',
    category: 'projects',
    formula: {
      type: 'percentage',
      numerator: { entity: 'measurements', field: 'accuracy', filter: { accuracy: 'within_tolerance' } },
      denominator: { entity: 'measurements', field: '_id' },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 100, good: 99, average: 98, poor: 95, critical: 90 },
    targets: { global: 98, byRole: [{ role: 'measurement_executive', target: 98 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['measurement_executive', 'project_manager', 'head_of_operations', 'super_admin']
  },
  {
    kpiCode: 'ME-TD-01',
    name: 'Measurement Turnaround Time',
    description: 'Average time to complete and submit measurements after site visit',
    category: 'projects',
    formula: {
      type: 'average',
      numerator: { entity: 'measurements', field: 'turnaroundHours' },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 12, good: 18, average: 24, poor: 36, critical: 48 },
    targets: { global: 24, byRole: [{ role: 'measurement_executive', target: 24 }] },
    displayFormat: 'duration',
    unit: 'hrs',
    visibleToRoles: ['measurement_executive', 'project_manager', 'head_of_operations', 'super_admin']
  },
  {
    kpiCode: 'ME-DQ-01',
    name: 'Documentation Completeness',
    description: 'Percentage of measurement documents with all required fields',
    category: 'projects',
    formula: {
      type: 'percentage',
      numerator: { entity: 'measurements', field: 'documentStatus', filter: { documentStatus: 'complete' } },
      denominator: { entity: 'measurements', field: '_id' },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 100, good: 98, average: 95, poor: 90, critical: 80 },
    targets: { global: 100, byRole: [{ role: 'measurement_executive', target: 100 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['measurement_executive', 'project_manager', 'super_admin']
  },
  {
    kpiCode: 'ME-SC-01',
    name: 'Site Visit Completion Rate',
    description: 'Percentage of scheduled site visits completed',
    category: 'projects',
    formula: {
      type: 'percentage',
      numerator: { entity: 'siteVisits', field: 'status', filter: { status: 'completed' } },
      denominator: { entity: 'siteVisits', field: '_id', filter: { scheduledDate: { $lte: new Date() } } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 100, good: 98, average: 95, poor: 90, critical: 80 },
    targets: { global: 100, byRole: [{ role: 'measurement_executive', target: 100 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['measurement_executive', 'project_manager', 'head_of_operations', 'super_admin']
  },
  {
    kpiCode: 'ME-SP-01',
    name: 'SOP Compliance Rate',
    description: 'Percentage of measurements following standard operating procedures',
    category: 'projects',
    formula: {
      type: 'percentage',
      numerator: { entity: 'measurements', field: 'sopCompliance', filter: { sopCompliance: true } },
      denominator: { entity: 'measurements', field: '_id' },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 100, good: 98, average: 95, poor: 90, critical: 80 },
    targets: { global: 100, byRole: [{ role: 'measurement_executive', target: 100 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['measurement_executive', 'project_manager', 'quality_head', 'super_admin']
  },

  // -------------------------------------------------------------------------
  // CSR – Interiors (CSR) - 7 KPIs
  // -------------------------------------------------------------------------
  {
    kpiCode: 'CSR-CM-01',
    name: 'Collection Rate',
    description: 'Percentage of due payments collected within the payment period',
    category: 'financial',
    formula: {
      type: 'percentage',
      numerator: { entity: 'paymentMilestones', field: 'paidAmount', filter: { status: 'paid' } },
      denominator: { entity: 'paymentMilestones', field: 'amount', filter: { dueDate: { $lte: new Date() } } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 100, good: 97, average: 95, poor: 90, critical: 80 },
    targets: { global: 95, byRole: [{ role: 'csr', target: 95 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['csr', 'finance_head', 'head_of_operations', 'super_admin']
  },
  {
    kpiCode: 'CSR-CM-02',
    name: 'Payment Milestone Achievement',
    description: 'Percentage of payment milestones achieved on schedule',
    category: 'financial',
    formula: {
      type: 'percentage',
      numerator: { entity: 'paymentMilestones', field: 'status', filter: { status: 'paid', onTime: true } },
      denominator: { entity: 'paymentMilestones', field: '_id', filter: { dueDate: { $lte: new Date() } } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 95, good: 92, average: 90, poor: 85, critical: 75 },
    targets: { global: 90, byRole: [{ role: 'csr', target: 90 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['csr', 'finance_head', 'project_manager', 'super_admin']
  },
  {
    kpiCode: 'CSR-FU-01',
    name: 'Follow-up Completion Rate',
    description: 'Percentage of scheduled follow-ups completed',
    category: 'customer',
    formula: {
      type: 'percentage',
      numerator: { entity: 'followUps', field: 'status', filter: { status: 'completed' } },
      denominator: { entity: 'followUps', field: '_id', filter: { scheduledDate: { $lte: new Date() } } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 100, good: 98, average: 95, poor: 90, critical: 80 },
    targets: { global: 100, byRole: [{ role: 'csr', target: 100 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['csr', 'project_manager', 'head_of_operations', 'super_admin']
  },
  {
    kpiCode: 'CSR-FU-02',
    name: 'Average Days to Collection',
    description: 'Average number of days to collect payment after milestone completion',
    category: 'financial',
    formula: {
      type: 'average',
      numerator: { entity: 'paymentMilestones', field: 'collectionDays', filter: { status: 'paid' } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 3, good: 5, average: 7, poor: 14, critical: 30 },
    targets: { global: 7, byRole: [{ role: 'csr', target: 7 }] },
    displayFormat: 'number',
    unit: 'days',
    visibleToRoles: ['csr', 'finance_head', 'head_of_operations', 'super_admin']
  },
  {
    kpiCode: 'CSR-EH-01',
    name: 'Escalation Resolution Rate',
    description: 'Percentage of client escalations resolved satisfactorily',
    category: 'customer',
    formula: {
      type: 'percentage',
      numerator: { entity: 'escalations', field: 'status', filter: { status: 'resolved', satisfaction: { $gte: 4 } } },
      denominator: { entity: 'escalations', field: '_id', filter: { type: 'client' } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 100, good: 97, average: 95, poor: 90, critical: 80 },
    targets: { global: 95, byRole: [{ role: 'csr', target: 95 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['csr', 'project_manager', 'head_of_operations', 'super_admin']
  },
  {
    kpiCode: 'CSR-CO-01',
    name: 'Cross-Team Coordination Score',
    description: 'Average coordination effectiveness score from team feedback',
    category: 'team',
    formula: {
      type: 'average',
      numerator: { entity: 'feedback', field: 'coordinationScore', filter: { type: 'cross_team' } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 4.8, good: 4.5, average: 4.0, poor: 3.5, critical: 3.0 },
    targets: { global: 4.0, byRole: [{ role: 'csr', target: 4.0 }] },
    displayFormat: 'number',
    unit: '/5',
    precision: 1,
    visibleToRoles: ['csr', 'project_manager', 'head_of_operations', 'super_admin']
  },
  {
    kpiCode: 'CSR-PT-01',
    name: 'Progress Update Timeliness',
    description: 'Percentage of client progress updates sent on schedule',
    category: 'customer',
    formula: {
      type: 'percentage',
      numerator: { entity: 'progressUpdates', field: 'sentAt', filter: { onTime: true } },
      denominator: { entity: 'progressUpdates', field: '_id', filter: { dueDate: { $lte: new Date() } } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 100, good: 98, average: 95, poor: 90, critical: 80 },
    targets: { global: 100, byRole: [{ role: 'csr', target: 100 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['csr', 'project_manager', 'head_of_operations', 'super_admin']
  },

  // -------------------------------------------------------------------------
  // Factory Coordinator (FC) - 12 KPIs
  // -------------------------------------------------------------------------
  {
    kpiCode: 'FC-PP-01',
    name: 'Production Plan Adherence',
    description: 'Percentage of production tasks completed as per plan',
    category: 'projects',
    formula: {
      type: 'percentage',
      numerator: { entity: 'productionTasks', field: 'status', filter: { status: 'completed', onPlan: true } },
      denominator: { entity: 'productionTasks', field: '_id', filter: { status: 'completed' } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 98, good: 97, average: 95, poor: 90, critical: 80 },
    targets: { global: 95, byRole: [{ role: 'factory_coordinator', target: 95 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['factory_coordinator', 'production_head', 'head_of_operations', 'super_admin']
  },
  {
    kpiCode: 'FC-PP-02',
    name: 'Production Delay Rate',
    description: 'Percentage of production orders delayed beyond schedule',
    category: 'projects',
    formula: {
      type: 'percentage',
      numerator: { entity: 'productionOrders', field: 'status', filter: { delayed: true } },
      denominator: { entity: 'productionOrders', field: '_id' },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 0, good: 2, average: 5, poor: 8, critical: 15 },
    targets: { global: 5, byRole: [{ role: 'factory_coordinator', target: 5 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['factory_coordinator', 'production_head', 'head_of_operations', 'super_admin']
  },
  {
    kpiCode: 'FC-QC-01',
    name: 'Factory QC Pass Rate',
    description: 'Percentage of items passing factory quality control on first check',
    category: 'projects',
    formula: {
      type: 'percentage',
      numerator: { entity: 'qcChecks', field: 'result', filter: { result: 'pass', attempt: 1 } },
      denominator: { entity: 'qcChecks', field: '_id', filter: { type: 'factory' } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 100, good: 99, average: 98, poor: 95, critical: 90 },
    targets: { global: 98, byRole: [{ role: 'factory_coordinator', target: 98 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['factory_coordinator', 'quality_head', 'head_of_operations', 'super_admin']
  },
  {
    kpiCode: 'FC-QC-02',
    name: 'Defect Rate',
    description: 'Percentage of production items with defects',
    category: 'projects',
    formula: {
      type: 'percentage',
      numerator: { entity: 'productionItems', field: 'defects', filter: { 'defects.0': { $exists: true } } },
      denominator: { entity: 'productionItems', field: '_id' },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 0, good: 1, average: 2, poor: 3, critical: 5 },
    targets: { global: 2, byRole: [{ role: 'factory_coordinator', target: 2 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['factory_coordinator', 'quality_head', 'production_head', 'super_admin']
  },
  {
    kpiCode: 'FC-DE-01',
    name: 'Design Error Resolution Time',
    description: 'Average time to resolve design errors identified during production',
    category: 'projects',
    formula: {
      type: 'average',
      numerator: { entity: 'designErrors', field: 'resolutionHours', filter: { detectedPhase: 'production' } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 2, good: 3, average: 4, poor: 6, critical: 8 },
    targets: { global: 4, byRole: [{ role: 'factory_coordinator', target: 4 }] },
    displayFormat: 'duration',
    unit: 'hrs',
    visibleToRoles: ['factory_coordinator', 'design_head', 'production_head', 'super_admin']
  },
  {
    kpiCode: 'FC-CL-01',
    name: 'Cut List Accuracy',
    description: 'Percentage of cut lists without errors',
    category: 'projects',
    formula: {
      type: 'percentage',
      numerator: { entity: 'cutLists', field: 'accuracy', filter: { errors: 0 } },
      denominator: { entity: 'cutLists', field: '_id' },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 100, good: 99.5, average: 99, poor: 98, critical: 95 },
    targets: { global: 99, byRole: [{ role: 'factory_coordinator', target: 99 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['factory_coordinator', 'production_head', 'head_of_operations', 'super_admin']
  },
  {
    kpiCode: 'FC-MR-01',
    name: 'Material Readiness Rate',
    description: 'Percentage of required materials available when needed for production',
    category: 'projects',
    formula: {
      type: 'percentage',
      numerator: { entity: 'materialRequirements', field: 'status', filter: { status: 'ready' } },
      denominator: { entity: 'materialRequirements', field: '_id', filter: { requiredDate: { $lte: new Date() } } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 100, good: 99, average: 98, poor: 95, critical: 90 },
    targets: { global: 98, byRole: [{ role: 'factory_coordinator', target: 98 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['factory_coordinator', 'procurement_head', 'production_head', 'super_admin']
  },
  {
    kpiCode: 'FC-MR-02',
    name: 'Material Shortage Incidents',
    description: 'Number of production delays due to material shortage',
    category: 'projects',
    formula: {
      type: 'count',
      numerator: { entity: 'productionDelays', field: '_id', filter: { reason: 'material_shortage' } },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 0, good: 0, average: 1, poor: 2, critical: 5 },
    targets: { global: 0, byRole: [{ role: 'factory_coordinator', target: 0 }] },
    displayFormat: 'number',
    unit: '',
    visibleToRoles: ['factory_coordinator', 'procurement_head', 'production_head', 'super_admin']
  },
  {
    kpiCode: 'FC-DS-01',
    name: 'On-Time Dispatch Rate',
    description: 'Percentage of dispatches made on scheduled date',
    category: 'projects',
    formula: {
      type: 'percentage',
      numerator: { entity: 'dispatches', field: 'status', filter: { onTime: true } },
      denominator: { entity: 'dispatches', field: '_id' },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 98, good: 97, average: 95, poor: 90, critical: 80 },
    targets: { global: 95, byRole: [{ role: 'factory_coordinator', target: 95 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['factory_coordinator', 'logistics_head', 'head_of_operations', 'super_admin']
  },
  {
    kpiCode: 'FC-RM-01',
    name: 'Rate Negotiation Savings',
    description: 'Percentage savings achieved through rate negotiations with vendors',
    category: 'financial',
    formula: {
      type: 'percentage',
      numerator: { entity: 'negotiations', field: 'savings' },
      denominator: { entity: 'negotiations', field: 'originalAmount' },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 10, good: 7, average: 5, poor: 3, critical: 0 },
    targets: { global: 5, byRole: [{ role: 'factory_coordinator', target: 5 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['factory_coordinator', 'procurement_head', 'finance_head', 'super_admin']
  },
  {
    kpiCode: 'FC-VM-01',
    name: 'Vendor Performance Score',
    description: 'Average performance rating of managed vendors',
    category: 'projects',
    formula: {
      type: 'average',
      numerator: { entity: 'vendorPerformance', field: 'score' },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 4.8, good: 4.5, average: 4.0, poor: 3.5, critical: 3.0 },
    targets: { global: 4.0, byRole: [{ role: 'factory_coordinator', target: 4.0 }] },
    displayFormat: 'number',
    unit: '/5',
    precision: 1,
    visibleToRoles: ['factory_coordinator', 'procurement_head', 'head_of_operations', 'super_admin']
  },
  {
    kpiCode: 'FC-CG-01',
    name: 'COGS Variance',
    description: 'Variance between estimated and actual cost of goods sold',
    category: 'financial',
    formula: {
      type: 'percentage',
      numerator: { entity: 'productionCosts', field: 'variance' },
      denominator: { entity: 'productionCosts', field: 'estimatedCOGS' },
      aggregation: 'monthly'
    },
    thresholds: { excellent: 0, good: 2, average: 3, poor: 5, critical: 10 },
    targets: { global: 3, byRole: [{ role: 'factory_coordinator', target: 3 }] },
    displayFormat: 'percentage',
    unit: '%',
    visibleToRoles: ['factory_coordinator', 'finance_head', 'head_of_operations', 'super_admin']
  }
]

// =============================================================================
// KRA DEFINITIONS (32 Total)
// =============================================================================

const kraDefinitions = [
  // -------------------------------------------------------------------------
  // Head of Operations (6 KRAs)
  // -------------------------------------------------------------------------
  {
    kraCode: 'HOO-KRA-01',
    name: 'Project Delivery Excellence',
    description: 'Ensure all projects are delivered on time with minimal delays',
    category: 'operations',
    weight: 25,
    linkedKPIs: ['HOO-PD-01', 'HOO-PD-02'],
    applicableTo: 'role',
    roles: ['head_of_operations']
  },
  {
    kraCode: 'HOO-KRA-02',
    name: 'Cost Control & Optimization',
    description: 'Maintain budget adherence and achieve cost savings through process optimization',
    category: 'finance',
    weight: 20,
    linkedKPIs: ['HOO-CC-01', 'HOO-CC-02'],
    applicableTo: 'role',
    roles: ['head_of_operations']
  },
  {
    kraCode: 'HOO-KRA-03',
    name: 'Quality Assurance',
    description: 'Maintain high quality standards with minimal snags and rework',
    category: 'technical',
    weight: 20,
    linkedKPIs: ['HOO-QA-01', 'HOO-QA-02'],
    applicableTo: 'role',
    roles: ['head_of_operations']
  },
  {
    kraCode: 'HOO-KRA-04',
    name: 'Team Management',
    description: 'Optimize team utilization and ensure continuous skill development',
    category: 'leadership',
    weight: 15,
    linkedKPIs: ['HOO-TM-01', 'HOO-TM-02'],
    applicableTo: 'role',
    roles: ['head_of_operations']
  },
  {
    kraCode: 'HOO-KRA-05',
    name: 'Client Satisfaction',
    description: 'Maintain high client satisfaction scores across all projects',
    category: 'customer',
    weight: 10,
    linkedKPIs: ['HOO-CS-01'],
    applicableTo: 'role',
    roles: ['head_of_operations']
  },
  {
    kraCode: 'HOO-KRA-06',
    name: 'Cross-Functional Coordination',
    description: 'Enable smooth collaboration between departments with quick issue resolution',
    category: 'operations',
    weight: 10,
    linkedKPIs: ['HOO-CF-01'],
    applicableTo: 'role',
    roles: ['head_of_operations']
  },

  // -------------------------------------------------------------------------
  // Project Manager (7 KRAs)
  // -------------------------------------------------------------------------
  {
    kraCode: 'PM-KRA-01',
    name: 'Site Execution',
    description: 'Achieve all site milestones as per schedule',
    category: 'operations',
    weight: 20,
    linkedKPIs: ['PM-SE-01'],
    applicableTo: 'role',
    roles: ['project_manager']
  },
  {
    kraCode: 'PM-KRA-02',
    name: 'Timeline Management',
    description: 'Ensure project timelines and phase completions are on track',
    category: 'operations',
    weight: 20,
    linkedKPIs: ['PM-TL-01', 'PM-TL-02'],
    applicableTo: 'role',
    roles: ['project_manager']
  },
  {
    kraCode: 'PM-KRA-03',
    name: 'Quality Control',
    description: 'Maintain quality standards with high pass rates and minimal rework',
    category: 'technical',
    weight: 15,
    linkedKPIs: ['PM-QC-01', 'PM-QC-02'],
    applicableTo: 'role',
    roles: ['project_manager']
  },
  {
    kraCode: 'PM-KRA-04',
    name: 'Design Validation',
    description: 'Detect and address design errors before execution phase',
    category: 'technical',
    weight: 10,
    linkedKPIs: ['PM-DV-01'],
    applicableTo: 'role',
    roles: ['project_manager']
  },
  {
    kraCode: 'PM-KRA-05',
    name: 'Material Coordination',
    description: 'Ensure material availability to prevent project delays',
    category: 'operations',
    weight: 15,
    linkedKPIs: ['PM-MC-01'],
    applicableTo: 'role',
    roles: ['project_manager']
  },
  {
    kraCode: 'PM-KRA-06',
    name: 'Reporting & Documentation',
    description: 'Submit all progress reports on time with accurate information',
    category: 'operations',
    weight: 10,
    linkedKPIs: ['PM-RP-01'],
    applicableTo: 'role',
    roles: ['project_manager']
  },
  {
    kraCode: 'PM-KRA-07',
    name: 'Client Handling',
    description: 'Minimize client escalations through proactive communication',
    category: 'customer',
    weight: 10,
    linkedKPIs: ['PM-CH-01'],
    applicableTo: 'role',
    roles: ['project_manager']
  },

  // -------------------------------------------------------------------------
  // Measurement Executive (5 KRAs)
  // -------------------------------------------------------------------------
  {
    kraCode: 'ME-KRA-01',
    name: 'Measurement Accuracy',
    description: 'Ensure all measurements are accurate within tolerance',
    category: 'technical',
    weight: 30,
    linkedKPIs: ['ME-MA-01'],
    applicableTo: 'role',
    roles: ['measurement_executive']
  },
  {
    kraCode: 'ME-KRA-02',
    name: 'Timely Delivery',
    description: 'Complete and submit measurements within SLA',
    category: 'operations',
    weight: 25,
    linkedKPIs: ['ME-TD-01'],
    applicableTo: 'role',
    roles: ['measurement_executive']
  },
  {
    kraCode: 'ME-KRA-03',
    name: 'Documentation Quality',
    description: 'Ensure all measurement documents are complete and accurate',
    category: 'operations',
    weight: 20,
    linkedKPIs: ['ME-DQ-01'],
    applicableTo: 'role',
    roles: ['measurement_executive']
  },
  {
    kraCode: 'ME-KRA-04',
    name: 'Site Coordination',
    description: 'Complete all scheduled site visits as planned',
    category: 'operations',
    weight: 15,
    linkedKPIs: ['ME-SC-01'],
    applicableTo: 'role',
    roles: ['measurement_executive']
  },
  {
    kraCode: 'ME-KRA-05',
    name: 'SOP Adherence',
    description: 'Follow standard operating procedures for all measurements',
    category: 'operations',
    weight: 10,
    linkedKPIs: ['ME-SP-01'],
    applicableTo: 'role',
    roles: ['measurement_executive']
  },

  // -------------------------------------------------------------------------
  // CSR – Interiors (5 KRAs)
  // -------------------------------------------------------------------------
  {
    kraCode: 'CSR-KRA-01',
    name: 'Collection Management',
    description: 'Achieve collection targets and payment milestone completions',
    category: 'finance',
    weight: 30,
    linkedKPIs: ['CSR-CM-01', 'CSR-CM-02'],
    applicableTo: 'role',
    roles: ['csr']
  },
  {
    kraCode: 'CSR-KRA-02',
    name: 'Follow-up Efficiency',
    description: 'Complete all follow-ups and minimize collection days',
    category: 'operations',
    weight: 25,
    linkedKPIs: ['CSR-FU-01', 'CSR-FU-02'],
    applicableTo: 'role',
    roles: ['csr']
  },
  {
    kraCode: 'CSR-KRA-03',
    name: 'Escalation Handling',
    description: 'Resolve client escalations effectively with high satisfaction',
    category: 'customer',
    weight: 20,
    linkedKPIs: ['CSR-EH-01'],
    applicableTo: 'role',
    roles: ['csr']
  },
  {
    kraCode: 'CSR-KRA-04',
    name: 'Cross-Team Coordination',
    description: 'Maintain effective coordination with project and operations teams',
    category: 'operations',
    weight: 15,
    linkedKPIs: ['CSR-CO-01'],
    applicableTo: 'role',
    roles: ['csr']
  },
  {
    kraCode: 'CSR-KRA-05',
    name: 'Progress Tracking',
    description: 'Send timely progress updates to clients',
    category: 'customer',
    weight: 10,
    linkedKPIs: ['CSR-PT-01'],
    applicableTo: 'role',
    roles: ['csr']
  },

  // -------------------------------------------------------------------------
  // Factory Coordinator (9 KRAs)
  // -------------------------------------------------------------------------
  {
    kraCode: 'FC-KRA-01',
    name: 'Production Planning',
    description: 'Ensure production plans are adhered to with minimal delays',
    category: 'operations',
    weight: 15,
    linkedKPIs: ['FC-PP-01', 'FC-PP-02'],
    applicableTo: 'role',
    roles: ['factory_coordinator']
  },
  {
    kraCode: 'FC-KRA-02',
    name: 'Factory QC',
    description: 'Maintain high quality standards with minimal defects',
    category: 'technical',
    weight: 15,
    linkedKPIs: ['FC-QC-01', 'FC-QC-02'],
    applicableTo: 'role',
    roles: ['factory_coordinator']
  },
  {
    kraCode: 'FC-KRA-03',
    name: 'Design Error Management',
    description: 'Quickly resolve design errors during production',
    category: 'technical',
    weight: 10,
    linkedKPIs: ['FC-DE-01'],
    applicableTo: 'role',
    roles: ['factory_coordinator']
  },
  {
    kraCode: 'FC-KRA-04',
    name: 'Cut List Accuracy',
    description: 'Ensure cut lists are accurate with zero errors',
    category: 'technical',
    weight: 10,
    linkedKPIs: ['FC-CL-01'],
    applicableTo: 'role',
    roles: ['factory_coordinator']
  },
  {
    kraCode: 'FC-KRA-05',
    name: 'Material Readiness',
    description: 'Ensure materials are ready when needed with no shortages',
    category: 'operations',
    weight: 10,
    linkedKPIs: ['FC-MR-01', 'FC-MR-02'],
    applicableTo: 'role',
    roles: ['factory_coordinator']
  },
  {
    kraCode: 'FC-KRA-06',
    name: 'Dispatch Management',
    description: 'Ensure on-time dispatches from factory',
    category: 'operations',
    weight: 10,
    linkedKPIs: ['FC-DS-01'],
    applicableTo: 'role',
    roles: ['factory_coordinator']
  },
  {
    kraCode: 'FC-KRA-07',
    name: 'Rate Management',
    description: 'Achieve savings through effective rate negotiations',
    category: 'finance',
    weight: 10,
    linkedKPIs: ['FC-RM-01'],
    applicableTo: 'role',
    roles: ['factory_coordinator']
  },
  {
    kraCode: 'FC-KRA-08',
    name: 'Vendor Management',
    description: 'Maintain high vendor performance standards',
    category: 'operations',
    weight: 10,
    linkedKPIs: ['FC-VM-01'],
    applicableTo: 'role',
    roles: ['factory_coordinator']
  },
  {
    kraCode: 'FC-KRA-09',
    name: 'COGS Control',
    description: 'Maintain cost of goods sold within budget variance',
    category: 'finance',
    weight: 10,
    linkedKPIs: ['FC-CG-01'],
    applicableTo: 'role',
    roles: ['factory_coordinator']
  }
]

// =============================================================================
// ROLE TEMPLATE DEFINITIONS (5 Total)
// =============================================================================

const roleTemplateDefinitions = [
  {
    templateCode: 'INT-OPS-HOO',
    name: 'Head of Operations – Interiors',
    description: 'Senior leadership role responsible for overall interior operations management, project delivery, team coordination, and cost optimization',
    department: 'operations',
    level: 'director',
    linkedKRAs: ['HOO-KRA-01', 'HOO-KRA-02', 'HOO-KRA-03', 'HOO-KRA-04', 'HOO-KRA-05', 'HOO-KRA-06'],
    competencies: [
      { name: 'Strategic Planning', description: 'Ability to develop and execute operational strategies aligned with business goals', requiredLevel: 5 },
      { name: 'Leadership', description: 'Strong leadership skills to manage and motivate large teams', requiredLevel: 5 },
      { name: 'Financial Acumen', description: 'Understanding of budgeting, cost management, and financial analysis', requiredLevel: 4 },
      { name: 'Quality Management', description: 'Expertise in quality control processes and standards', requiredLevel: 4 }
    ],
    responsibilities: [
      'Oversee all interior operations projects from initiation to completion',
      'Develop and implement operational strategies to improve efficiency',
      'Manage department budget and ensure cost optimization',
      'Lead, mentor, and develop the operations team',
      'Ensure quality standards are maintained across all projects',
      'Coordinate with other departments for smooth project execution',
      'Handle escalations and resolve complex issues',
      'Report to senior management on operations performance'
    ],
    qualifications: [
      'Bachelor\'s degree in Interior Design, Architecture, or related field',
      '10+ years of experience in interior operations',
      '5+ years in leadership/management roles',
      'Strong project management skills',
      'Excellent communication and interpersonal skills'
    ],
    salaryRange: { min: 1500000, max: 2500000, currency: 'INR' }
  },
  {
    templateCode: 'INT-OPS-PM',
    name: 'Project Manager – Interiors',
    description: 'Responsible for end-to-end project management of interior projects including site execution, timeline management, quality control, and client coordination',
    department: 'operations',
    level: 'manager',
    linkedKRAs: ['PM-KRA-01', 'PM-KRA-02', 'PM-KRA-03', 'PM-KRA-04', 'PM-KRA-05', 'PM-KRA-06', 'PM-KRA-07'],
    competencies: [
      { name: 'Project Management', description: 'Strong project planning, execution, and monitoring skills', requiredLevel: 5 },
      { name: 'Technical Knowledge', description: 'Understanding of interior design, materials, and construction processes', requiredLevel: 4 },
      { name: 'Communication', description: 'Excellent verbal and written communication with stakeholders', requiredLevel: 4 },
      { name: 'Problem Solving', description: 'Ability to identify and resolve project issues quickly', requiredLevel: 4 }
    ],
    responsibilities: [
      'Plan and execute interior projects within timeline and budget',
      'Manage site activities and coordinate with contractors',
      'Ensure quality standards through regular inspections',
      'Validate designs before execution and flag errors',
      'Coordinate material requirements with procurement',
      'Prepare and submit progress reports on time',
      'Handle client communications and manage expectations',
      'Resolve on-site issues and prevent escalations'
    ],
    qualifications: [
      'Bachelor\'s degree in Interior Design, Architecture, or Civil Engineering',
      '5+ years of experience in interior project management',
      'PMP certification preferred',
      'Proficiency in project management tools',
      'Strong analytical and organizational skills'
    ],
    salaryRange: { min: 800000, max: 1400000, currency: 'INR' }
  },
  {
    templateCode: 'INT-OPS-ME',
    name: 'Measurement Executive – Interiors',
    description: 'Responsible for accurate site measurements, documentation, and coordination for interior projects',
    department: 'operations',
    level: 'mid',
    linkedKRAs: ['ME-KRA-01', 'ME-KRA-02', 'ME-KRA-03', 'ME-KRA-04', 'ME-KRA-05'],
    competencies: [
      { name: 'Technical Precision', description: 'High accuracy in measurements and attention to detail', requiredLevel: 5 },
      { name: 'Documentation', description: 'Ability to create clear and complete measurement documents', requiredLevel: 4 },
      { name: 'Site Management', description: 'Skill in coordinating site visits and managing field work', requiredLevel: 3 }
    ],
    responsibilities: [
      'Conduct accurate site measurements for interior projects',
      'Prepare detailed measurement documents and drawings',
      'Complete site visits as per schedule',
      'Follow SOPs for all measurement activities',
      'Coordinate with design and project teams',
      'Submit measurements within turnaround time SLA',
      'Maintain measurement tools and equipment',
      'Flag any site issues or discrepancies'
    ],
    qualifications: [
      'Diploma or Bachelor\'s degree in Interior Design or related field',
      '2+ years of experience in site measurements',
      'Proficiency in measurement tools and AutoCAD',
      'Good communication skills',
      'Willingness to travel to project sites'
    ],
    salaryRange: { min: 300000, max: 500000, currency: 'INR' }
  },
  {
    templateCode: 'INT-OPS-CSR',
    name: 'CSR – Interiors',
    description: 'Customer Service Representative responsible for payment collection, client coordination, and progress communication for interior projects',
    department: 'operations',
    level: 'mid',
    linkedKRAs: ['CSR-KRA-01', 'CSR-KRA-02', 'CSR-KRA-03', 'CSR-KRA-04', 'CSR-KRA-05'],
    competencies: [
      { name: 'Communication', description: 'Excellent verbal and written communication skills', requiredLevel: 5 },
      { name: 'Negotiation', description: 'Ability to negotiate payment terms and resolve disputes', requiredLevel: 4 },
      { name: 'Follow-up', description: 'Persistent and organized follow-up on pending items', requiredLevel: 4 },
      { name: 'Customer Service', description: 'Strong customer orientation and service mindset', requiredLevel: 4 }
    ],
    responsibilities: [
      'Collect payments as per milestone schedule',
      'Follow up on pending payments and escalations',
      'Coordinate between clients and project teams',
      'Send regular progress updates to clients',
      'Handle and resolve client complaints',
      'Maintain client communication records',
      'Coordinate with finance for invoicing',
      'Support project managers with client requirements'
    ],
    qualifications: [
      'Bachelor\'s degree in any discipline',
      '2+ years of experience in customer service or collections',
      'Experience in interior/construction industry preferred',
      'Excellent communication skills in English and local language',
      'Proficiency in MS Office and CRM tools'
    ],
    salaryRange: { min: 350000, max: 550000, currency: 'INR' }
  },
  {
    templateCode: 'INT-OPS-FC',
    name: 'Factory Coordinator – Interiors',
    description: 'Responsible for production coordination, quality control, material management, and vendor coordination at the factory',
    department: 'production',
    level: 'mid',
    linkedKRAs: ['FC-KRA-01', 'FC-KRA-02', 'FC-KRA-03', 'FC-KRA-04', 'FC-KRA-05', 'FC-KRA-06', 'FC-KRA-07', 'FC-KRA-08', 'FC-KRA-09'],
    competencies: [
      { name: 'Production Planning', description: 'Ability to plan and coordinate production activities', requiredLevel: 4 },
      { name: 'Quality Control', description: 'Knowledge of QC processes and defect identification', requiredLevel: 4 },
      { name: 'Vendor Management', description: 'Skill in managing vendor relationships and negotiations', requiredLevel: 4 },
      { name: 'Cost Management', description: 'Understanding of COGS and cost optimization', requiredLevel: 3 }
    ],
    responsibilities: [
      'Coordinate production activities as per project schedule',
      'Ensure quality control checks are completed',
      'Resolve design errors identified during production',
      'Verify cut list accuracy before production',
      'Ensure material readiness for production',
      'Coordinate dispatches to project sites',
      'Negotiate rates with vendors and suppliers',
      'Monitor vendor performance and maintain relationships',
      'Track COGS and flag variances'
    ],
    qualifications: [
      'Diploma or Bachelor\'s degree in Production, Engineering, or related field',
      '3+ years of experience in production/factory coordination',
      'Experience in furniture/interior manufacturing preferred',
      'Strong organizational and coordination skills',
      'Knowledge of production planning tools'
    ],
    salaryRange: { min: 400000, max: 650000, currency: 'INR' }
  }
]

// =============================================================================
// SEED FUNCTION
// =============================================================================

const seedInteriorOpsKRAKPI = async () => {
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
    console.log('SEEDING INTERIOR OPERATIONS KRA & KPI')
    console.log('='.repeat(60))

    // Track created KPIs for linking
    const kpiMap = new Map()

    // -------------------------------------------------------------------------
    // STEP 1: Create KPIs
    // -------------------------------------------------------------------------
    console.log('\n--- Creating KPIs (44 total) ---\n')

    let kpisCreated = 0
    let kpisUpdated = 0
    let kpisSkipped = 0

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
    console.log('\n--- Creating KRAs (32 total) ---\n')

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
          weight: Math.floor(100 / kraDef.linkedKPIs.length) // Equal weight distribution
        }
      }).filter(k => k.kpi) // Only include KPIs that exist

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
    console.log('\n--- Creating Role Templates (5 total) ---\n')

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
      }).filter(k => k.kra) // Only include KRAs that exist

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
  1. Head of Operations – Interiors (HOO) - 6 KRAs, 10 KPIs
  2. Project Manager – Interiors (PM) - 7 KRAs, 9 KPIs
  3. Measurement Executive – Interiors (ME) - 5 KRAs, 5 KPIs
  4. CSR – Interiors (CSR) - 5 KRAs, 7 KPIs
  5. Factory Coordinator – Interiors (FC) - 9 KRAs, 12 KPIs

Collections:
  - kpiconfigs: ${kpiDefinitions.length} documents
  - kras: ${kraDefinitions.length} documents
  - roletemplates: ${roleTemplateDefinitions.length} documents
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
seedInteriorOpsKRAKPI()
