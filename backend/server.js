import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import http from 'http'
import { fileURLToPath } from 'url'
import helmet from 'helmet'
import mongoSanitize from 'express-mongo-sanitize'
import hpp from 'hpp'
import connectDB from './config/db.js'
import logger from './utils/logger.js'
import requestLogger from './middleware/requestLogger.js'
import { globalRateLimiter, authRateLimiter } from './middleware/rateLimiter.js'
import { initializeSocket } from './utils/socketService.js'
import { startScheduler } from './utils/scheduler.js'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Route imports
import authRoutes from './routes/auth.js'
import dashboardRoutes from './routes/dashboard.js'
import leadRoutes from './routes/leads.js'
import userRoutes from './routes/users.js'
import projectRoutes from './routes/projects.js'
import mailTemplateRoutes from './routes/mailTemplates.js'
import companyRoutes from './routes/companies.js'
import customerRoutes from './routes/customers.js'
import employeeRoutes from './routes/employees.js'
import departmentRoutes from './routes/departments.js'
import attendanceRoutes from './routes/attendance.js'
import leaveRoutes from './routes/leaves.js'
import reimbursementRoutes from './routes/reimbursements.js'
import salaryRoutes from './routes/salary.js'
import projectWorkflowRoutes from './routes/projectWorkflow.js'

// Admin Panel Routes
import adminDashboardRoutes from './routes/adminDashboard.js'
import alertRoutes from './routes/alerts.js'
import notificationRoutes from './routes/notifications.js'
import performanceRoutes from './routes/performance.js'
import kpiRoutes from './routes/kpi.js'
import automationRoutes from './routes/automation.js'
import gameEntryRoutes from './routes/gameEntries.js'

// CRM Workflow Routes
import callActivityRoutes from './routes/callActivities.js'
import salesOrderRoutes from './routes/salesOrders.js'
import approvalRoutes from './routes/approvals.js'
import designIterationRoutes from './routes/designIterations.js'
import designP2PTrackerRoutes from './routes/designP2PTracker.js'

// Support Ticketing Routes
import ticketRoutes from './routes/tickets.js'

// Approval Matrix & Workflow Routes
import approvalMatrixRoutes from './routes/approvalMatrix.js'

// Procurement Routes
import vendorRoutes from './routes/vendors.js'
import vendorPortalRoutes from './routes/vendorPortal.js'
import purchaseOrderRoutes from './routes/purchaseOrders.js'
import purchaseRequisitionRoutes from './routes/purchaseRequisitions.js'
import rfqRoutes from './routes/rfq.js'
import goodsReceiptRoutes from './routes/goodsReceipts.js'
import vendorInvoiceRoutes from './routes/vendorInvoices.js'
import materialPricelistRoutes from './routes/materialPricelists.js'
import vendorPerformanceRoutes from './routes/vendorPerformances.js'

// Finance Routes
import paymentRoutes from './routes/payments.js'
import customerInvoiceRoutes from './routes/customerInvoices.js'

// Sales Routes
import quotationRoutes from './routes/quotations.js'
import boqQuoteRoutes from './routes/boqQuotes.js'

// Settings Routes
import roleRoutes from './routes/roles.js'
import auditLogRoutes from './routes/auditLogs.js'

// Inventory Routes
import stockRoutes from './routes/stock.js'
import materialRoutes from './routes/materials.js'
import stockMovementRoutes from './routes/stockMovements.js'
import assetRoutes from './routes/assets.js'

// HR & Payroll Routes
import payrollRoutes from './routes/payroll.js'
import performanceReviewRoutes from './routes/performanceReviews.js'
import reviewCycleRoutes from './routes/reviewCycles.js'
import kraRoutes from './routes/kra.js'
import roleTemplateRoutes from './routes/roleTemplates.js'

// New HRMS Routes
import advanceRequestRoutes from './routes/advanceRequests.js'
import employeeLetterRoutes from './routes/employeeLetters.js'
import exitManagementRoutes from './routes/exitManagement.js'
import skillMatrixRoutes from './routes/skillMatrix.js'

// PPC (Production Planning & Control) Routes
import workOrderRoutes from './routes/workOrders.js'
import bomRoutes from './routes/billOfMaterials.js'
import materialRequirementRoutes from './routes/materialRequirements.js'
import materialIssueRoutes from './routes/materialIssues.js'
import laborEntryRoutes from './routes/laborEntries.js'
import dailyProgressReportRoutes from './routes/dailyProgressReports.js'
import productionCostRoutes from './routes/productionCosts.js'
import ppcDashboardRoutes from './routes/ppcDashboard.js'

// Operations Routes
import riskRegisterRoutes from './routes/riskRegister.js'
import stockTakeRoutes from './routes/stockTakes.js'
import materialConsumptionRoutes from './routes/materialConsumption.js'

// QC Master Routes
import qcMasterRoutes from './routes/qcMaster.js'

// Project Wallet Routes
import projectWalletRoutes from './routes/projectWallet.js'

// MDM (Master Data Management) Routes
import mdmRoutes from './routes/mdm.js'

// Global Search Routes
import searchRoutes from './routes/search.js'

// SOX 404 Compliance Routes
import threeWayMatchRoutes from './routes/threeWayMatch.js'
import generalLedgerRoutes from './routes/generalLedger.js'

// External Integrations
import callyzerRoutes from './routes/callyzer.js'

// Phase C: New Compliance, Analytics & Operations Routes
import privacyRoutes from './routes/privacy.js'
import gstComplianceRoutes from './routes/gstCompliance.js'
import bankReconciliationRoutes from './routes/bankReconciliation.js'
import budgetForecastRoutes from './routes/budgetForecast.js'
import analyticsRoutes from './routes/analytics.js'
import documentRoutes from './routes/documents.js'
import soxComplianceRoutes from './routes/soxCompliance.js'
import customerPortalRoutes from './routes/customerPortal.js'
import channelPartnerPortalRoutes from './routes/channelPartnerPortal.js'
import channelPartnerRoutes from './routes/channelPartners.js'
import cpDataManagementRoutes from './routes/cpDataManagement.js'
import mfaRoutes from './routes/mfa.js'
import approvalDelegationRoutes from './routes/approvalDelegation.js'
import coreOperationsRoutes from './routes/coreOperations.js'
import whatsappRoutes from './routes/whatsapp.js'

// Business & Sales Routes
import surveyRoutes from './routes/surveys.js'
import packageRoutes from './routes/packages.js'
import masterAgreementRoutes from './routes/masterAgreements.js'
import tdsConfigRoutes from './routes/tdsConfig.js'
import dataRetentionRoutes from './routes/dataRetention.js'
import dataMigrationRoutes from './routes/dataMigration.js'

// Configuration Management Master
import processConfigRoutes from './routes/processConfiguration.js'
import rolePermissionConfigRoutes from './routes/rolePermissionConfig.js'

// Indian Accounting System Routes
import ledgerActivityMappingRoutes from './routes/ledgerActivityMapping.js'
import vendorPaymentMilestoneRoutes from './routes/vendorPaymentMilestones.js'
import salesDispatchRoutes from './routes/salesDispatches.js'
import salesThreeWayMatchRoutes from './routes/salesThreeWayMatch.js'
import agingDashboardRoutes from './routes/agingDashboard.js'

// Load env vars
dotenv.config()

// Connect to database
connectDB()

const app = express()

// Security middleware (Phase A)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(mongoSanitize())
app.use(hpp())
app.use(express.json({ limit: '10mb' }))
app.use(requestLogger)
app.use(globalRateLimiter)

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Enable CORS - only for local development
// Production CORS is handled by Nginx
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://192.168.0.109:5173',
    'http://192.168.0.109:5174',
    'http://192.168.1.18:5173',
    'http://192.168.1.18:5174',
    'http://192.168.1.19:5173',
    'http://192.168.1.19:5174',
    /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d{4,5}$/, // Allow any 192.168.x.x with any 4-5 digit port
    /^http:\/\/172\.16\.\d{1,3}\.\d{1,3}:\d{4,5}$/, // Allow any 172.16.x.x with any 4-5 digit port
    /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{4,5}$/, // Allow any 10.x.x.x with any 4-5 digit port
    'null', // Allow file:// protocol (local HTML files)
    'file://' // Allow file protocol
  ],
  credentials: true
}))

// Also allow requests from any origin for public game endpoints
app.use('/api/game-entries', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Company-Id');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
})

// Allow public lead submissions from any origin (for spin wheel game)
app.use('/api/leads', (req, res, next) => {
  // Only allow POST from any origin (public submission)
  if (req.method === 'POST' || req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Company-Id');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
})

// Allow public auth endpoints (register/login) from any origin for InteriorPlus website
app.use('/api/auth', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Company-Id');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
})

// Auth rate limiter
app.use('/api/auth', authRateLimiter)

// Mount routes
app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/leads', leadRoutes)
app.use('/api/users', userRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/mail-templates', mailTemplateRoutes)
app.use('/api/companies', companyRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/employees', employeeRoutes)
app.use('/api/departments', departmentRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/leaves', leaveRoutes)
app.use('/api/reimbursements', reimbursementRoutes)
app.use('/api/salary', salaryRoutes)
app.use('/api/project-workflow', projectWorkflowRoutes)

// Admin Panel Routes
app.use('/api/admin/dashboard', adminDashboardRoutes)
app.use('/api/alerts', alertRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/performance', performanceRoutes)
app.use('/api/kpi', kpiRoutes)
app.use('/api/automation', automationRoutes)
app.use('/api/game-entries', gameEntryRoutes)

// CRM Workflow Routes
app.use('/api/call-activities', callActivityRoutes)
app.use('/api/sales-orders', salesOrderRoutes)
app.use('/api/approvals', approvalRoutes)
app.use('/api/design-iterations', designIterationRoutes)
app.use('/api/design-p2p-tracker', designP2PTrackerRoutes)

// Support Ticketing Routes
app.use('/api/tickets', ticketRoutes)

// Approval Matrix & Workflow Routes
app.use('/api/approval-matrix', approvalMatrixRoutes)

// Procurement Routes
app.use('/api/vendors', vendorRoutes)
app.use('/api/vendor-portal', vendorPortalRoutes)
app.use('/api/purchase-orders', purchaseOrderRoutes)
app.use('/api/purchase-requisitions', purchaseRequisitionRoutes)
app.use('/api/rfq', rfqRoutes)
app.use('/api/goods-receipts', goodsReceiptRoutes)
app.use('/api/vendor-invoices', vendorInvoiceRoutes)
app.use('/api/material-pricelists', materialPricelistRoutes)
app.use('/api/vendor-performances', vendorPerformanceRoutes)

// Finance Routes
app.use('/api/payments', paymentRoutes)
app.use('/api/customer-invoices', customerInvoiceRoutes)

// Sales Routes
app.use('/api/quotations', quotationRoutes)
app.use('/api/boq-quotes', boqQuoteRoutes)

// Settings Routes
app.use('/api/roles', roleRoutes)
app.use('/api/audit-logs', auditLogRoutes)

// Inventory Routes
app.use('/api/stock', stockRoutes)
app.use('/api/materials', materialRoutes)
app.use('/api/stock-movements', stockMovementRoutes)
app.use('/api/assets', assetRoutes)

// HR & Payroll Routes
app.use('/api/payroll', payrollRoutes)
app.use('/api/performance-reviews', performanceReviewRoutes)
app.use('/api/review-cycles', reviewCycleRoutes)
app.use('/api/kras', kraRoutes)
app.use('/api/role-templates', roleTemplateRoutes)

// New HRMS Routes
app.use('/api/advance-requests', advanceRequestRoutes)
app.use('/api/exit-management', exitManagementRoutes)
app.use('/api/skill-matrix', skillMatrixRoutes)
app.use('/api/employee-letters', employeeLetterRoutes)

// PPC (Production Planning & Control) Routes
app.use('/api/work-orders', workOrderRoutes)
app.use('/api/bom', bomRoutes)
app.use('/api/material-requirements', materialRequirementRoutes)
app.use('/api/material-issues', materialIssueRoutes)
app.use('/api/labor-entries', laborEntryRoutes)
app.use('/api/daily-progress-reports', dailyProgressReportRoutes)
app.use('/api/production-costs', productionCostRoutes)
app.use('/api/ppc-dashboard', ppcDashboardRoutes)

// Operations Routes
app.use('/api/risk-register', riskRegisterRoutes)
app.use('/api/stock-takes', stockTakeRoutes)
app.use('/api/material-consumption', materialConsumptionRoutes)

// QC Master Routes
app.use('/api/qc-master', qcMasterRoutes)

// Project Wallet Routes
app.use('/api/project-wallet', projectWalletRoutes)

// MDM (Master Data Management) Routes
app.use('/api/mdm', mdmRoutes)

// Global Search Routes
app.use('/api/search', searchRoutes)

// SOX 404 Compliance Routes
app.use('/api/three-way-match', threeWayMatchRoutes)
app.use('/api/general-ledger', generalLedgerRoutes)

// External Integrations
app.use('/api/callyzer', callyzerRoutes)

// Phase C: New Compliance, Analytics & Operations Routes
app.use('/api/privacy', privacyRoutes)
app.use('/api/gst', gstComplianceRoutes)
app.use('/api/bank-reconciliation', bankReconciliationRoutes)
app.use('/api/budget-forecast', budgetForecastRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/documents', documentRoutes)
app.use('/api/sox', soxComplianceRoutes)
app.use('/api/customer-portal', customerPortalRoutes)
app.use('/api/channel-partner-portal', channelPartnerPortalRoutes)
app.use('/api/channel-partners', channelPartnerRoutes)
app.use('/api/cp-data', cpDataManagementRoutes)
app.use('/api/mfa', mfaRoutes)
app.use('/api/approval-delegation', approvalDelegationRoutes)
app.use('/api/core', coreOperationsRoutes)
app.use('/api/whatsapp', whatsappRoutes)

// Business & Sales Routes
app.use('/api/surveys', surveyRoutes)
app.use('/api/packages', packageRoutes)
app.use('/api/master-agreements', masterAgreementRoutes)
app.use('/api/tds-config', tdsConfigRoutes)
app.use('/api/data-retention', dataRetentionRoutes)
app.use('/api/data-migration', dataMigrationRoutes)

// Configuration Management Master
app.use('/api/process-config', processConfigRoutes)
app.use('/api/role-permissions', rolePermissionConfigRoutes)

// Indian Accounting System Routes
app.use('/api/ledger-mappings', ledgerActivityMappingRoutes)
app.use('/api/vendor-payment-milestones', vendorPaymentMilestoneRoutes)
app.use('/api/sales-dispatches', salesDispatchRoutes)
app.use('/api/sales-three-way-match', salesThreeWayMatchRoutes)
app.use('/api/aging', agingDashboardRoutes)

// ============================================
// Alias routes for frontend compatibility
// These map alternative paths to existing route handlers
// ============================================
app.use('/api/kra-master', kraRoutes)              // Alias: frontend may hit /kra-master or /kras
app.use('/api/accounts-receivable', customerInvoiceRoutes)  // AR is filtered customer invoices
app.use('/api/accounts-payable', vendorInvoiceRoutes)       // AP is filtered vendor invoices
// Ledger master: frontend calls /api/general-ledger/ledger-master (already mounted)
// Add a direct redirect for /api/ledger-master to the GL ledger-master sub-route
app.get('/api/ledger-master', (req, res, next) => {
  req.url = '/ledger-master' + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '')
  generalLedgerRoutes(req, res, next)
})
app.get('/api/ledger-master/:id/transactions', (req, res, next) => {
  req.url = `/ledger-master/${req.params.id}/transactions` + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '')
  generalLedgerRoutes(req, res, next)
})
app.use('/api/budget-forecasting', budgetForecastRoutes)    // Alias: frontend may use -forecasting
app.use('/api/compliance', soxComplianceRoutes)             // Compliance dashboard alias

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'HOH108 API is running' })
})

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack })
  res.status(500).json({
    success: false,
    message: 'Server Error'
  })
})

const PORT = process.env.PORT || 5000

// Create HTTP server for Socket.IO
const server = http.createServer(app)
initializeSocket(server)

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`)
  startScheduler()
})
