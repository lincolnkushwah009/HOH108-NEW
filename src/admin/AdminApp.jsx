import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CompanyProvider } from './context/CompanyContext'
import { ToastProvider } from './components/ui'
import ProtectedRoute from './components/shared/ProtectedRoute'
import ErrorBoundary from './components/shared/ErrorBoundary'
import AdminLayout from './components/layout/AdminLayout'
import { isPreSalesRole } from './config/navigation'

// Auth Pages
import Login from './pages/auth/Login'

// Dashboard
import Dashboard from './pages/dashboard/Dashboard'

// Leads
import LeadsList from './pages/leads/LeadsList'
import LeadDetail from './pages/leads/LeadDetail'

// Customers
import CustomersList from './pages/customers/CustomersList'
import CustomerDetail from './pages/customers/CustomerDetail'

// Sales
import Quotations from './pages/sales/Quotations'
import NewQuotation from './pages/sales/NewQuotation'
import BOQGenerator from './pages/sales/BOQGenerator'

// Procurement
import VendorsList from './pages/procurement/VendorsList'
import PurchaseRequisitions from './pages/procurement/PurchaseRequisitions'
import PurchaseRequisitionDetail from './pages/procurement/PurchaseRequisitionDetail'
import PurchaseRequisitionEdit from './pages/procurement/PurchaseRequisitionEdit'
import PurchaseOrders from './pages/procurement/PurchaseOrders'
import NewPurchaseOrder from './pages/procurement/NewPurchaseOrder'
import PurchaseOrderDetail from './pages/procurement/PurchaseOrderDetail'
import EditPurchaseOrder from './pages/procurement/EditPurchaseOrder'
import GoodsReceipt from './pages/procurement/GoodsReceipt'
import GoodsReceiptDetail from './pages/procurement/GoodsReceiptDetail'
import NewGoodsReceipt from './pages/procurement/NewGoodsReceipt'
import VendorInvoices from './pages/procurement/VendorInvoices'
import NewVendorInvoice from './pages/procurement/NewVendorInvoice'
import VendorPaymentGateway from './pages/procurement/VendorPaymentGateway'
import RFQManagement from './pages/procurement/RFQManagement'
import VendorPerformance from './pages/procurement/VendorPerformance'

// Inventory
import MaterialsList from './pages/inventory/MaterialsList'
import StockManagement from './pages/inventory/StockManagement'
import StockMovements from './pages/inventory/StockMovements'

// Projects
import ProjectsList from './pages/projects/ProjectsList'
import ProjectDetail from './pages/projects/ProjectDetail'
import ProjectBudget from './pages/projects/ProjectBudget'
import ProjectTimeline from './pages/projects/ProjectTimeline'
import ProjectGantt from './pages/projects/ProjectGantt'
import ProjectTasks from './pages/projects/ProjectTasks'
import ProjectPayments from './pages/projects/ProjectPayments'

// Design P2P Tracker
import DesignP2PTracker from './pages/projects/DesignP2PTracker'

// QC Master
import QCMaster from './pages/projects/QCMaster'

// HR
import Employees from './pages/hr/Employees'
import Departments from './pages/hr/Departments'
import Attendance from './pages/hr/Attendance'
import Leaves from './pages/hr/Leaves'
import Reimbursements from './pages/hr/Reimbursements'
import SalaryManagement from './pages/hr/SalaryManagement'
import Payroll from './pages/hr/Payroll'
import Assets from './pages/hr/Assets'
import AdvanceRequests from './pages/hr/AdvanceRequests'
import EmployeeLetters from './pages/hr/EmployeeLetters'

// Performance
import KRAMaster from './pages/performance/KRAMaster'
import KPIMaster from './pages/performance/KPIMaster'
import PerformanceReviews from './pages/performance/PerformanceReviews'
import RoleTemplates from './pages/performance/RoleTemplates'
import ReviewCycles from './pages/performance/ReviewCycles'

// Finance
import CustomerInvoices from './pages/finance/CustomerInvoices'
import CustomerInvoiceDetail from './pages/finance/CustomerInvoiceDetail'
import NewCustomerInvoice from './pages/finance/NewCustomerInvoice'
import Payments from './pages/finance/Payments'
import AccountsReceivable from './pages/finance/AccountsReceivable'
import AccountsPayable from './pages/finance/AccountsPayable'

// Approvals
import ApprovalsList from './pages/approvals/ApprovalsList'

// CRM Workflow
import CRMDashboard from './pages/crm/CRMDashboard'
import CallActivities from './pages/crm/CallActivities'
import CRMSalesOrders from './pages/crm/SalesOrders'
import CRMApprovals from './pages/crm/Approvals'
import DesignIterations from './pages/crm/DesignIterations'
import ChannelPartners from './pages/crm/ChannelPartners'
import CPDataManagement from './pages/crm/CPDataManagement'

// Support Tickets
import TicketsList from './pages/tickets/TicketsList'
import NewTicket from './pages/tickets/NewTicket'
import TicketDetail from './pages/tickets/TicketDetail'

// Marketing
import MailTemplates from './pages/marketing/MailTemplates'
import GameEntries from './pages/marketing/GameEntries'

// Notifications
import NotificationsList from './pages/notifications/NotificationsList'

// Settings
import Users from './pages/settings/Users'
import Profile from './pages/settings/Profile'
import RolesPermissions from './pages/settings/RolesPermissions'
import ApprovalMatrix from './pages/settings/ApprovalMatrix'
import ApprovalMatrixSettings from './pages/settings/ApprovalMatrixSettings'
import AuditTrail from './pages/settings/AuditTrail'
import MDMDashboard from './pages/settings/MDMDashboard'
import CallyzerSettings from './pages/settings/CallyzerSettings'

// PPC (Production Planning & Control)
import PPCDashboard from './pages/ppc/PPCDashboard'
import WorkOrders from './pages/ppc/WorkOrders'
import BillOfMaterials from './pages/ppc/BillOfMaterials'
import MaterialRequirements from './pages/ppc/MaterialRequirements'
import MaterialIssues from './pages/ppc/MaterialIssues'
import LaborEntries from './pages/ppc/LaborEntries'
import DailyProgressReports from './pages/ppc/DailyProgressReports'
import ProductionCosts from './pages/ppc/ProductionCosts'

// Analytics
import AnalyticsDashboard from './pages/analytics/AnalyticsDashboard'
import SalesAnalytics from './pages/analytics/SalesAnalytics'
import FinanceAnalytics from './pages/analytics/FinanceAnalytics'
import ProjectAnalytics from './pages/analytics/ProjectAnalytics'
import HRAnalytics from './pages/analytics/HRAnalytics'

// Compliance
import ComplianceDashboard from './pages/compliance/ComplianceDashboard'
import ConsentManagement from './pages/compliance/ConsentManagement'
import DataSubjectRequests from './pages/compliance/DataSubjectRequests'
import EInvoiceManagement from './pages/compliance/EInvoiceManagement'
import GSTReturns from './pages/compliance/GSTReturns'
import SoDReview from './pages/compliance/SoDReview'
import AccessReviews from './pages/compliance/AccessReviews'

// Additional Finance
import BankReconciliation from './pages/finance/BankReconciliation'
import BudgetForecasting from './pages/finance/BudgetForecasting'
import CreditDebitNotes from './pages/finance/CreditDebitNotes'

// Operations
import ChangeOrders from './pages/operations/ChangeOrders'
import RiskRegister from './pages/operations/RiskRegister'
import StockTakes from './pages/operations/StockTakes'

// Additional HR
import SkillMatrix from './pages/hr/SkillMatrix'
import ExitManagementPage from './pages/hr/ExitManagement'

// Additional CRM
import LeadScoring from './pages/crm/LeadScoring'
import SurveysPage from './pages/crm/Surveys'

// Additional Settings
import DocumentManager from './pages/settings/DocumentManager'
import MFASetup from './pages/settings/MFASetup'
import ConfigurationMaster from './pages/settings/ConfigurationMaster'
import CompanyMaster from './pages/settings/CompanyMaster'

// Indian Accounting System
import LedgerMaster from './pages/finance/LedgerMaster'
import LedgerMapping from './pages/finance/LedgerMapping'
import AgingDashboard from './pages/finance/AgingDashboard'
import SalesDispatches from './pages/sales/SalesDispatches'
import VendorPaymentMilestones from './pages/procurement/VendorPaymentMilestones'


// Dashboard wrapper that redirects Pre-Sales to CRM Dashboard
const DashboardRouter = () => {
  const { user } = useAuth()

  // Pre-Sales users should only see CRM Dashboard
  if (user && isPreSalesRole(user.role)) {
    return <Navigate to="/admin/crm" replace />
  }

  return <Dashboard />
}

const AdminApp = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CompanyProvider>
          <ToastProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="login" element={<Login />} />

              {/* Protected Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                {/* Dashboard - Pre-Sales users are redirected to CRM Dashboard */}
                <Route index element={<DashboardRouter />} />

                {/* Leads */}
                <Route path="leads" element={<LeadsList />} />
                <Route path="leads/:id" element={<LeadDetail />} />

                {/* Customers */}
                <Route path="customers" element={<CustomersList />} />
                <Route path="customers/:id" element={<CustomerDetail />} />

                {/* Sales */}
                <Route path="quotations" element={<Quotations />} />
                <Route path="quotations/new" element={<NewQuotation />} />
                <Route path="quotations/:id" element={<Quotations />} />
                <Route path="quotations/:id/edit" element={<NewQuotation />} />
                <Route path="boq-generator" element={<BOQGenerator />} />
                <Route path="boq-quotes" element={<BOQGenerator />} />

                {/* Procurement */}
                <Route path="vendors" element={<VendorsList />} />
                <Route path="vendors/:id" element={<VendorsList />} />
                <Route path="purchase-requisitions" element={<PurchaseRequisitions />} />
                <Route path="purchase-requisitions/:id" element={<PurchaseRequisitionDetail />} />
                <Route path="purchase-requisitions/:id/edit" element={<PurchaseRequisitionEdit />} />
                <Route path="purchase-orders" element={<PurchaseOrders />} />
                <Route path="purchase-orders/new" element={<NewPurchaseOrder />} />
                <Route path="purchase-orders/:id" element={<PurchaseOrderDetail />} />
                <Route path="purchase-orders/:id/edit" element={<EditPurchaseOrder />} />
                <Route path="goods-receipt" element={<GoodsReceipt />} />
                <Route path="goods-receipt/new" element={<NewGoodsReceipt />} />
                <Route path="goods-receipt/:id" element={<GoodsReceiptDetail />} />
                <Route path="goods-receipts/new" element={<NewGoodsReceipt />} />
                <Route path="grn/new" element={<NewGoodsReceipt />} />
                <Route path="vendor-invoices" element={<VendorInvoices />} />
                <Route path="vendor-invoices/new" element={<NewVendorInvoice />} />
                <Route path="vendor-invoices/:id" element={<VendorInvoices />} />
                <Route path="vendor-payment-gateway" element={<VendorPaymentGateway />} />
                <Route path="rfq" element={<RFQManagement />} />
                <Route path="vendor-performance" element={<VendorPerformance />} />

                {/* Inventory */}
                <Route path="materials" element={<MaterialsList />} />
                <Route path="materials/:id" element={<MaterialsList />} />
                <Route path="stock-management" element={<StockManagement />} />
                <Route path="stock-movements" element={<StockMovements />} />

                {/* Projects */}
                <Route path="projects" element={<ProjectsList />} />
                <Route path="projects/:id" element={<ProjectDetail />} />
                <Route path="projects/:id/gantt" element={<ProjectGantt />} />
                <Route path="projects/:id/tasks" element={<ProjectTasks />} />
                <Route path="projects/:id/payments" element={<ProjectPayments />} />
                <Route path="project-kanban" element={<Navigate to="/admin/projects" replace />} />
                <Route path="project-gantt" element={<ProjectGantt />} />
                <Route path="project-budget" element={<ProjectBudget />} />
                <Route path="project-budget/:id" element={<ProjectBudget />} />
                <Route path="project-timeline" element={<ProjectTimeline />} />
                <Route path="project-timeline/:id" element={<ProjectTimeline />} />
                <Route path="design-p2p-tracker" element={<DesignP2PTracker />} />
                <Route path="qc-master" element={<QCMaster />} />

                {/* HR */}
                <Route path="employees" element={<Employees />} />
                <Route path="departments" element={<Departments />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="leaves" element={<Leaves />} />
                <Route path="reimbursements" element={<Reimbursements />} />
                <Route path="salary" element={<SalaryManagement />} />
                <Route path="payroll" element={<Payroll />} />
                <Route path="payroll/:id" element={<Payroll />} />
                <Route path="assets" element={<Assets />} />
                <Route path="advance-requests" element={<AdvanceRequests />} />
                <Route path="employee-letters" element={<EmployeeLetters />} />

                {/* Performance */}
                <Route path="kra-master" element={<KRAMaster />} />
                <Route path="kpi-master" element={<KPIMaster />} />
                <Route path="performance-reviews" element={<PerformanceReviews />} />
                <Route path="role-templates" element={<RoleTemplates />} />
                <Route path="role-templates/:id" element={<RoleTemplates />} />
                <Route path="review-cycles" element={<ReviewCycles />} />
                <Route path="review-cycles/:id" element={<ReviewCycles />} />

                {/* Finance */}
                <Route path="customer-invoices" element={<CustomerInvoices />} />
                <Route path="customer-invoices/new" element={<NewCustomerInvoice />} />
                <Route path="customer-invoices/:id" element={<CustomerInvoiceDetail />} />
                <Route path="payments" element={<Payments />} />
                <Route path="accounts-receivable" element={<AccountsReceivable />} />
                <Route path="accounts-receivable/:id" element={<AccountsReceivable />} />
                <Route path="accounts-payable" element={<AccountsPayable />} />
                <Route path="accounts-payable/:id" element={<AccountsPayable />} />

                {/* Notifications */}
                <Route path="notifications" element={<NotificationsList />} />

                {/* Approvals */}
                <Route path="approvals" element={<ApprovalsList />} />

                {/* CRM Workflow */}
                <Route path="crm" element={<CRMDashboard />} />
                <Route path="crm/call-activities" element={<CallActivities />} />
                <Route path="crm/sales-orders" element={<CRMSalesOrders />} />
                <Route path="crm/sales-orders/:id" element={<CRMSalesOrders />} />
                <Route path="crm/approvals" element={<CRMApprovals />} />
                <Route path="crm/approvals/:id" element={<CRMApprovals />} />
                <Route path="crm/design-iterations" element={<DesignIterations />} />
                <Route path="crm/design-iterations/:id" element={<DesignIterations />} />

                {/* Support Tickets */}
                <Route path="tickets" element={<TicketsList />} />
                <Route path="tickets/new" element={<NewTicket />} />
                <Route path="tickets/:id" element={<TicketDetail />} />

                {/* Marketing */}
                <Route path="mail-templates" element={<MailTemplates />} />
                <Route path="game-entries" element={<GameEntries />} />

                {/* Settings */}
                <Route path="users" element={<Users />} />
                <Route path="profile" element={<Profile />} />
                <Route path="roles-permissions" element={<RolesPermissions />} />
                <Route path="approval-matrix" element={<ApprovalMatrix />} />
                <Route path="approval-matrix/:id" element={<ApprovalMatrix />} />
                <Route path="approval-matrix-settings" element={<ApprovalMatrixSettings />} />
                <Route path="audit-trail" element={<AuditTrail />} />
                <Route path="mdm" element={<MDMDashboard />} />
                <Route path="callyzer" element={<CallyzerSettings />} />

                {/* Analytics */}
                <Route path="analytics" element={<AnalyticsDashboard />} />
                <Route path="analytics/sales" element={<SalesAnalytics />} />
                <Route path="analytics/finance" element={<FinanceAnalytics />} />
                <Route path="analytics/projects" element={<ProjectAnalytics />} />
                <Route path="analytics/hr" element={<HRAnalytics />} />

                {/* Compliance */}
                <Route path="compliance" element={<ComplianceDashboard />} />
                <Route path="compliance/consents" element={<ConsentManagement />} />
                <Route path="compliance/dsr" element={<DataSubjectRequests />} />
                <Route path="compliance/e-invoices" element={<EInvoiceManagement />} />
                <Route path="compliance/gst-returns" element={<GSTReturns />} />
                <Route path="compliance/sod" element={<SoDReview />} />
                <Route path="compliance/access-reviews" element={<AccessReviews />} />

                {/* Additional Finance */}
                <Route path="bank-reconciliation" element={<BankReconciliation />} />
                <Route path="budget-forecasting" element={<BudgetForecasting />} />
                <Route path="credit-debit-notes" element={<CreditDebitNotes />} />

                {/* Operations */}
                <Route path="change-orders" element={<ChangeOrders />} />
                <Route path="risk-register" element={<RiskRegister />} />
                <Route path="stock-takes" element={<StockTakes />} />

                {/* Additional HR */}
                <Route path="skill-matrix" element={<SkillMatrix />} />
                <Route path="exit-management" element={<ExitManagementPage />} />

                {/* Additional CRM */}
                <Route path="crm/lead-scoring" element={<LeadScoring />} />
                <Route path="crm/surveys" element={<SurveysPage />} />
                <Route path="crm/channel-partners" element={<ChannelPartners />} />
                <Route path="crm/cp-data" element={<CPDataManagement />} />

                {/* Additional Settings */}
                <Route path="documents" element={<DocumentManager />} />
                <Route path="mfa-setup" element={<MFASetup />} />
                <Route path="configuration-master" element={<ConfigurationMaster />} />
                <Route path="company-master" element={<CompanyMaster />} />

                {/* Indian Accounting System */}
                <Route path="ledger-master" element={<LedgerMaster />} />
                <Route path="ledger-mapping" element={<LedgerMapping />} />
                <Route path="aging-dashboard" element={<AgingDashboard />} />
                <Route path="sales-dispatches" element={<SalesDispatches />} />
                <Route path="vendor-payment-milestones" element={<VendorPaymentMilestones />} />

                {/* PPC (Production Planning & Control) */}
                <Route path="ppc" element={<PPCDashboard />} />
                <Route path="ppc/work-orders" element={<WorkOrders />} />
                <Route path="ppc/work-orders/:id" element={<WorkOrders />} />
                <Route path="ppc/work-orders/:id/edit" element={<WorkOrders />} />
                <Route path="ppc/bom" element={<BillOfMaterials />} />
                <Route path="ppc/bom/:id" element={<BillOfMaterials />} />
                <Route path="ppc/bom/:id/edit" element={<BillOfMaterials />} />
                <Route path="ppc/material-requirements" element={<MaterialRequirements />} />
                <Route path="ppc/material-requirements/:id" element={<MaterialRequirements />} />
                <Route path="ppc/material-issues" element={<MaterialIssues />} />
                <Route path="ppc/material-issues/:id" element={<MaterialIssues />} />
                <Route path="ppc/labor-entries" element={<LaborEntries />} />
                <Route path="ppc/labor-entries/:id" element={<LaborEntries />} />
                <Route path="ppc/labor-entries/:id/edit" element={<LaborEntries />} />
                <Route path="ppc/daily-progress-reports" element={<DailyProgressReports />} />
                <Route path="ppc/daily-progress-reports/:id" element={<DailyProgressReports />} />
                <Route path="ppc/daily-progress-reports/:id/edit" element={<DailyProgressReports />} />
                <Route path="ppc/production-costs" element={<ProductionCosts />} />
                <Route path="ppc/production-costs/:id" element={<ProductionCosts />} />

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Route>
            </Routes>
          </ToastProvider>
        </CompanyProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default AdminApp
