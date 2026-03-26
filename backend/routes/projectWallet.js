import express from 'express'
import { protect, setCompanyContext, requireModulePermission, authorize } from '../middleware/rbac.js'
import Project from '../models/Project.js'
import PaymentMilestone from '../models/PaymentMilestone.js'
import VendorPaymentMilestone from '../models/VendorPaymentMilestone.js'
import PurchaseOrder from '../models/PurchaseOrder.js'
import VendorInvoice from '../models/VendorInvoice.js'
import CustomerInvoice from '../models/CustomerInvoice.js'
import LaborEntry from '../models/LaborEntry.js'
import User from '../models/User.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)

// ============================================
// GET /api/project-wallet/dashboard/pnl
// All Projects P&L Dashboard (management view)
// NOTE: Must be defined BEFORE /:projectId routes
// ============================================
router.get('/dashboard/pnl', async (req, res) => {
  try {
    // Finance roles, admins, and users with all_projects:view can access P&L
    const isAdmin = ['super_admin', 'company_admin'].includes(req.user.role)
    const isFinance = req.user.role === 'finance' || req.user.department === 'finance' || req.user.subDepartment === 'finance'
    if (!isAdmin && !isFinance) {
      const user = await User.findById(req.user._id).select('modulePermissions')
      const hasProjectAccess = user?.modulePermissions?.all_projects?.view
      const hasFinanceAccess = user?.modulePermissions?.customer_invoices?.view || user?.modulePermissions?.payments?.view || user?.modulePermissions?.accounts_receivable?.view
      if (!hasProjectAccess && !hasFinanceAccess) {
        return res.status(403).json({ success: false, message: 'You do not have access to Project P&L' })
      }
    }

    const companyId = req.activeCompany?._id || req.user?.company?._id

    // Get all active/completed projects for this company
    const projects = await Project.find({
      company: companyId,
      status: { $in: ['active', 'in_progress', 'completed', 'on_hold'] }
    }).select('projectId title status stage financials budget')

    const projectIds = projects.map(p => p._id)

    // Batch fetch all related data
    const [allCustomerMilestones, allCustomerInvoices, allPurchaseOrders, allVendorMilestones, allLaborEntries] = await Promise.all([
      PaymentMilestone.find({ project: { $in: projectIds } }).select('project amount collectedAmount'),
      CustomerInvoice.find({ project: { $in: projectIds } }).select('project invoiceTotal paidAmount'),
      PurchaseOrder.find({ project: { $in: projectIds }, status: { $nin: ['draft', 'cancelled', 'rejected'] } }).select('project poTotal'),
      VendorPaymentMilestone.find({ project: { $in: projectIds } }).select('project amount paidAmount'),
      LaborEntry.find({ project: { $in: projectIds }, status: { $in: ['approved', 'submitted', 'completed'] } }).select('project cost.totalCost')
    ])

    // Group data by project
    const groupByProject = (items) => {
      const map = {}
      items.forEach(item => {
        const pid = item.project.toString()
        if (!map[pid]) map[pid] = []
        map[pid].push(item)
      })
      return map
    }

    const cmByProject = groupByProject(allCustomerMilestones)
    const ciByProject = groupByProject(allCustomerInvoices)
    const poByProject = groupByProject(allPurchaseOrders)
    const vmByProject = groupByProject(allVendorMilestones)
    const leByProject = groupByProject(allLaborEntries)

    let companyTotalRevenue = 0
    let companyTotalCOGS = 0
    let companyTotalGrossProfit = 0
    let companyTotalOpex = 0
    let companyTotalNetProfit = 0

    const projectRows = projects.map(project => {
      const pid = project._id.toString()

      // REVENUE
      const milestoneCollected = (cmByProject[pid] || []).reduce((s, m) => s + (m.collectedAmount || 0), 0)
      const invoicePaid = (ciByProject[pid] || []).reduce((s, inv) => s + (inv.paidAmount || 0), 0)
      const revenue = Math.max(milestoneCollected, invoicePaid)

      // COGS
      const materialCosts = (poByProject[pid] || []).reduce((s, po) => s + (po.poTotal || 0), 0)
      const laborCosts = (leByProject[pid] || []).reduce((s, le) => s + (le.cost?.totalCost || 0), 0)
      const vendorPayments = (vmByProject[pid] || []).reduce((s, vm) => s + (vm.paidAmount || 0), 0)
      // Use vendor payments as primary cost indicator (actual cash out), material costs as committed
      const directCosts = vendorPayments || project.budget?.actualCost || 0
      const cogs = directCosts + laborCosts

      // GROSS PROFIT
      const grossProfit = revenue - cogs

      // OPERATING EXPENSES
      const contingencyUsed = project.budget?.contingencyUsed || 0
      const opex = contingencyUsed

      // NET PROFIT
      const netProfit = grossProfit - opex
      const margin = revenue > 0 ? (netProfit / revenue * 100) : 0

      companyTotalRevenue += revenue
      companyTotalCOGS += cogs
      companyTotalGrossProfit += grossProfit
      companyTotalOpex += opex
      companyTotalNetProfit += netProfit

      return {
        _id: project._id,
        projectId: project.projectId,
        title: project.title,
        status: project.status,
        stage: project.stage,
        revenue,
        milestoneCollected,
        invoicePaid,
        cogs,
        materialCosts,
        laborCosts,
        vendorPayments,
        grossProfit,
        opex,
        contingencyUsed,
        netProfit,
        margin: parseFloat(margin.toFixed(1)),
        profitable: netProfit >= 0,
        agreedAmount: project.financials?.finalAmount || project.financials?.agreedAmount || 0,
        budgetAmount: project.budget?.currentBudget || project.budget?.originalBudget || 0
      }
    })

    // Sort by margin descending
    projectRows.sort((a, b) => b.margin - a.margin)

    const companyMargin = companyTotalRevenue > 0
      ? parseFloat((companyTotalNetProfit / companyTotalRevenue * 100).toFixed(1))
      : 0

    // Top 5 most profitable
    const top5Profitable = projectRows.filter(p => p.profitable).slice(0, 5)

    // Top 5 least profitable / loss-making
    const top5Losses = [...projectRows].sort((a, b) => a.netProfit - b.netProfit).slice(0, 5)

    // Revenue vs Cost trend by project (sorted by revenue desc)
    const revenueVsCost = [...projectRows]
      .filter(p => p.revenue > 0 || p.cogs > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 15)
      .map(p => ({
        projectId: p.projectId,
        title: p.title,
        revenue: p.revenue,
        cost: p.cogs,
        profit: p.netProfit
      }))

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue: companyTotalRevenue,
          totalCOGS: companyTotalCOGS,
          grossProfit: companyTotalGrossProfit,
          totalOpex: companyTotalOpex,
          netProfit: companyTotalNetProfit,
          netMargin: companyMargin,
          projectCount: projects.length,
          profitableCount: projectRows.filter(p => p.profitable).length,
          lossCount: projectRows.filter(p => !p.profitable).length
        },
        projects: projectRows,
        top5Profitable,
        top5Losses,
        revenueVsCost
      }
    })
  } catch (error) {
    console.error('P&L Dashboard Error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ============================================
// GET /api/project-wallet/:projectId
// Full wallet view for a project
// ============================================
router.get('/:projectId', requireModulePermission('all_projects', 'view'), async (req, res) => {
  try {
    const { projectId } = req.params

    const project = await Project.findById(projectId)
      .select('projectId title financials budget status stage')

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' })
    }

    // --- MONEY IN: Customer payments via payment milestones ---
    const customerMilestones = await PaymentMilestone.find({ project: projectId })
      .select('name amount collectedAmount status percentage payments order type')
      .sort({ order: 1 })

    const totalCustomerMilestoneValue = customerMilestones.reduce((s, m) => s + (m.amount || 0), 0)
    const totalCustomerCollected = customerMilestones.reduce((s, m) => s + (m.collectedAmount || 0), 0)

    // Customer invoices for this project
    const customerInvoices = await CustomerInvoice.find({ project: projectId })
      .select('invoiceNumber invoiceDate invoiceTotal paidAmount balanceAmount status')
      .sort({ invoiceDate: -1 })

    const totalCustomerInvoiced = customerInvoices.reduce((s, inv) => s + (inv.invoiceTotal || 0), 0)
    const totalCustomerInvoicePaid = customerInvoices.reduce((s, inv) => s + (inv.paidAmount || 0), 0)

    // --- MONEY OUT: Vendor payments ---
    // Purchase Orders for this project
    const purchaseOrders = await PurchaseOrder.find({ project: projectId })
      .select('poNumber vendor poTotal status deliveryStatus orderDate')
      .populate('vendor', 'name vendorId')
      .sort({ orderDate: -1 })

    const totalPOValue = purchaseOrders.reduce((s, po) => s + (po.poTotal || 0), 0)
    const approvedPOs = purchaseOrders.filter(po => !['draft', 'cancelled', 'rejected'].includes(po.status))

    // Vendor payment milestones for this project
    const vendorMilestones = await VendorPaymentMilestone.find({ project: projectId })
      .select('name vendor purchaseOrder amount paidAmount pendingAmount status type percentage dueDate payments')
      .populate('vendor', 'name vendorId')
      .populate('purchaseOrder', 'poNumber')
      .sort({ dueDate: 1 })

    const totalVendorMilestoneValue = vendorMilestones.reduce((s, m) => s + (m.amount || 0), 0)
    const totalVendorPaid = vendorMilestones.reduce((s, m) => s + (m.paidAmount || 0), 0)
    const totalVendorPending = vendorMilestones.reduce((s, m) => s + (m.pendingAmount || 0), 0)

    // Vendor invoices for this project's POs
    const poIds = purchaseOrders.map(po => po._id)
    const vendorInvoices = await VendorInvoice.find({ purchaseOrder: { $in: poIds } })
      .select('invoiceNumber invoiceDate invoiceTotal paidAmount balanceAmount status vendor threeWayMatchStatus')
      .populate('vendor', 'name vendorId')
      .sort({ invoiceDate: -1 })

    const totalVendorInvoiced = vendorInvoices.reduce((s, inv) => s + (inv.invoiceTotal || 0), 0)
    const totalVendorInvoicePaid = vendorInvoices.reduce((s, inv) => s + (inv.paidAmount || 0), 0)

    // --- WALLET CALCULATIONS ---
    const agreedAmount = project.financials?.finalAmount || project.financials?.agreedAmount || project.financials?.quotedAmount || totalCustomerMilestoneValue || 0
    const moneyIn = totalCustomerCollected || totalCustomerInvoicePaid
    const moneyOut = totalVendorPaid || totalVendorInvoicePaid
    const walletBalance = moneyIn - moneyOut
    const committedNotPaid = totalPOValue - totalVendorPaid
    const availableBalance = walletBalance - Math.max(0, committedNotPaid - moneyOut)
    const profitMargin = moneyIn > 0 ? ((moneyIn - moneyOut) / moneyIn * 100) : 0

    // --- BUILD TRANSACTION LEDGER ---
    const transactions = []

    // Customer payment transactions (IN)
    customerMilestones.forEach(m => {
      if (m.payments) {
        m.payments.forEach(p => {
          transactions.push({
            date: p.paymentDate || p.recordedAt,
            type: 'credit',
            category: 'customer_payment',
            description: `Customer payment: ${m.name}`,
            amount: p.amount,
            method: p.paymentMethod,
            reference: p.referenceNumber
          })
        })
      }
    })

    // Vendor payment transactions (OUT)
    vendorMilestones.forEach(m => {
      if (m.payments) {
        m.payments.forEach(p => {
          transactions.push({
            date: p.paymentDate || p.recordedAt,
            type: 'debit',
            category: 'vendor_payment',
            description: `Vendor payment: ${m.vendor?.name || 'Vendor'} - ${m.name}`,
            vendor: m.vendor?.name,
            poNumber: m.purchaseOrder?.poNumber,
            amount: p.amount,
            method: p.paymentMethod,
            reference: p.referenceNumber
          })
        })
      }
    })

    // Sort by date desc
    transactions.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))

    // Running balance
    let runningBalance = 0
    const ledger = transactions.reverse().map(t => {
      runningBalance += t.type === 'credit' ? t.amount : -t.amount
      return { ...t, balance: runningBalance }
    }).reverse()

    res.json({
      success: true,
      data: {
        project: {
          _id: project._id,
          projectId: project.projectId,
          title: project.title,
          status: project.status,
          stage: project.stage
        },
        wallet: {
          agreedAmount,
          moneyIn,
          moneyOut,
          walletBalance,
          committedNotPaid: Math.max(0, totalPOValue - totalVendorPaid),
          profitMargin: parseFloat(profitMargin.toFixed(1)),
          customerPending: agreedAmount - moneyIn,
          vendorPending: totalVendorPending
        },
        moneyIn: {
          milestones: customerMilestones,
          invoices: customerInvoices,
          totalMilestoneValue: totalCustomerMilestoneValue,
          totalCollected: totalCustomerCollected,
          totalInvoiced: totalCustomerInvoiced,
          totalInvoicePaid: totalCustomerInvoicePaid
        },
        moneyOut: {
          purchaseOrders,
          vendorMilestones,
          vendorInvoices,
          totalPOValue,
          totalVendorPaid,
          totalVendorPending,
          totalVendorInvoiced,
          totalVendorInvoicePaid
        },
        transactions: ledger
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ============================================
// POST /api/project-wallet/:projectId/vendor-payment
// Record a vendor payment against a project (procurement team)
// ============================================
router.post('/:projectId/vendor-payment',
  requireModulePermission('all_projects', 'edit'),
  async (req, res) => {
    try {
      const { vendorMilestoneId, amount, paymentMethod, referenceNumber, remarks } = req.body

      if (!vendorMilestoneId || !amount) {
        return res.status(400).json({ success: false, message: 'Vendor milestone ID and amount are required' })
      }

      const milestone = await VendorPaymentMilestone.findOne({
        _id: vendorMilestoneId,
        project: req.params.projectId
      })

      if (!milestone) {
        return res.status(404).json({ success: false, message: 'Vendor payment milestone not found' })
      }

      // Record payment
      milestone.payments = milestone.payments || []
      milestone.payments.push({
        paymentDate: new Date(),
        amount,
        paymentMethod: paymentMethod || 'bank_transfer',
        referenceNumber,
        remarks,
        recordedBy: req.user._id,
        recordedAt: new Date()
      })

      milestone.paidAmount = (milestone.paidAmount || 0) + amount
      milestone.pendingAmount = Math.max(0, (milestone.amount || 0) - milestone.paidAmount)
      milestone.status = milestone.paidAmount >= milestone.amount ? 'paid' : milestone.paidAmount > 0 ? 'partially_paid' : 'pending'

      await milestone.save()

      // Update project budget actualCost
      const project = await Project.findById(req.params.projectId)
      if (project) {
        const allVendorMilestones = await VendorPaymentMilestone.find({ project: project._id })
        project.budget.actualCost = allVendorMilestones.reduce((s, m) => s + (m.paidAmount || 0), 0)
        project.financials.totalPaid = project.budget.actualCost
        await project.save()
      }

      res.json({
        success: true,
        message: 'Vendor payment recorded successfully',
        data: milestone
      })
    } catch (error) {
      res.status(500).json({ success: false, message: error.message })
    }
  }
)

// ============================================
// GET /api/project-wallet/:projectId/pnl
// Project-level Profit & Loss Statement
// ============================================
router.get('/:projectId/pnl', async (req, res) => {
  try {
    // Finance roles, admins, and users with relevant permissions can access
    const isAdmin = ['super_admin', 'company_admin'].includes(req.user.role)
    const isFinance = req.user.role === 'finance' || req.user.department === 'finance' || req.user.subDepartment === 'finance'
    if (!isAdmin && !isFinance) {
      const user = await User.findById(req.user._id).select('modulePermissions')
      const hasProjectAccess = user?.modulePermissions?.all_projects?.view
      const hasFinanceAccess = user?.modulePermissions?.customer_invoices?.view || user?.modulePermissions?.payments?.view || user?.modulePermissions?.accounts_receivable?.view
      if (!hasProjectAccess && !hasFinanceAccess) {
        return res.status(403).json({ success: false, message: 'You do not have access to Project P&L' })
      }
    }

    const { projectId } = req.params

    const project = await Project.findById(projectId)
      .select('projectId title financials budget status stage')

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' })
    }

    // --- REVENUE ---
    const [customerMilestones, customerInvoices] = await Promise.all([
      PaymentMilestone.find({ project: projectId }).select('name amount collectedAmount status order'),
      CustomerInvoice.find({ project: projectId }).select('invoiceNumber invoiceTotal paidAmount status invoiceDate')
    ])

    const milestoneCollected = customerMilestones.reduce((s, m) => s + (m.collectedAmount || 0), 0)
    const invoicePaid = customerInvoices.reduce((s, inv) => s + (inv.paidAmount || 0), 0)
    const revenue = Math.max(milestoneCollected, invoicePaid)

    const totalMilestoneValue = customerMilestones.reduce((s, m) => s + (m.amount || 0), 0)
    const totalInvoiceValue = customerInvoices.reduce((s, inv) => s + (inv.invoiceTotal || 0), 0)

    // --- COST OF GOODS SOLD ---
    const [purchaseOrders, vendorMilestones, laborEntries] = await Promise.all([
      PurchaseOrder.find({ project: projectId, status: { $nin: ['draft', 'cancelled', 'rejected'] } })
        .select('poNumber poTotal status vendor').populate('vendor', 'name'),
      VendorPaymentMilestone.find({ project: projectId })
        .select('name vendor amount paidAmount status').populate('vendor', 'name'),
      LaborEntry.find({ project: projectId, status: { $in: ['approved', 'submitted', 'completed'] } })
        .select('cost.totalCost employeeDetails.name activity.name entryDate')
    ])

    const materialCosts = purchaseOrders.reduce((s, po) => s + (po.poTotal || 0), 0)
    const vendorPayments = vendorMilestones.reduce((s, vm) => s + (vm.paidAmount || 0), 0)
    const laborCosts = laborEntries.reduce((s, le) => s + (le.cost?.totalCost || 0), 0)

    // Direct costs: vendor payments (actual cash out) or project budget actualCost as fallback
    const directCosts = vendorPayments || project.budget?.actualCost || 0
    const cogs = directCosts + laborCosts

    // --- GROSS PROFIT ---
    const grossProfit = revenue - cogs
    const grossMargin = revenue > 0 ? parseFloat((grossProfit / revenue * 100).toFixed(1)) : 0

    // --- EMPLOYEE COSTS (allocated from salary based on effort) ---
    let employeeCost = 0
    try {
      // Quick employee cost calculation (simplified version of full endpoint)
      const projectDoc = await Project.findById(projectId)
        .select('projectManager originalLead departmentAssignments')
        .populate('projectManager', 'salary.ctc')

      const hourlyFromCtc = (ctc) => ctc > 0 ? ctc / (12 * 22 * 8) : 0

      // PM cost estimate
      if (projectDoc?.projectManager?.salary?.ctc) {
        employeeCost += 40 * hourlyFromCtc(projectDoc.projectManager.salary.ctc)
      }

      // Design iteration hours
      const DesignIteration = (await import('../models/DesignIteration.js')).default
      const designIterations = await DesignIteration.find({ project: projectId })
        .select('timeline.actualHours timeline.estimatedHours designer')
        .populate('designer', 'salary.ctc')
      designIterations.forEach(di => {
        const hrs = di.timeline?.actualHours || di.timeline?.estimatedHours || 8
        if (di.designer?.salary?.ctc) employeeCost += hrs * hourlyFromCtc(di.designer.salary.ctc)
      })

      // Labor entries (already have cost)
      employeeCost += laborEntries.reduce((s, le) => s + (le.cost?.totalCost || 0), 0)
    } catch (e) {
      console.error('Employee cost calc error:', e.message)
    }

    // --- OPERATING EXPENSES ---
    const contingencyUsed = project.budget?.contingencyUsed || 0
    const opex = contingencyUsed + employeeCost

    // --- NET PROFIT ---
    const netProfit = grossProfit - opex
    const netMargin = revenue > 0 ? parseFloat((netProfit / revenue * 100).toFixed(1)) : 0

    // Budget analysis
    const budgetAmount = project.budget?.currentBudget || project.budget?.originalBudget || 0
    const agreedAmount = project.financials?.finalAmount || project.financials?.agreedAmount || project.financials?.quotedAmount || 0
    const budgetVariance = budgetAmount > 0 ? budgetAmount - cogs : 0
    const budgetUtilization = budgetAmount > 0 ? parseFloat((cogs / budgetAmount * 100).toFixed(1)) : 0

    res.json({
      success: true,
      data: {
        project: {
          _id: project._id,
          projectId: project.projectId,
          title: project.title,
          status: project.status,
          stage: project.stage,
          agreedAmount,
          budgetAmount
        },
        pnl: {
          revenue: {
            total: revenue,
            milestoneCollected,
            invoicePaid,
            totalMilestoneValue,
            totalInvoiceValue,
            milestones: customerMilestones,
            invoices: customerInvoices
          },
          cogs: {
            total: cogs,
            materialCosts,
            vendorPayments,
            laborCosts,
            directCosts,
            purchaseOrders: purchaseOrders.map(po => ({
              poNumber: po.poNumber,
              vendor: po.vendor?.name,
              amount: po.poTotal,
              status: po.status
            })),
            vendorMilestones: vendorMilestones.map(vm => ({
              name: vm.name,
              vendor: vm.vendor?.name,
              amount: vm.amount,
              paid: vm.paidAmount,
              status: vm.status
            })),
            laborEntries: laborEntries.length
          },
          grossProfit,
          grossMargin,
          opex: {
            total: opex,
            employeeCost: Math.round(employeeCost),
            contingencyUsed
          },
          netProfit,
          netMargin,
          profitable: netProfit >= 0
        },
        budget: {
          budgetAmount,
          actualCost: cogs,
          variance: budgetVariance,
          utilization: budgetUtilization,
          contingencyTotal: project.budget?.contingencyAmount || 0,
          contingencyUsed,
          contingencyRemaining: project.budget?.contingencyRemaining || 0
        }
      }
    })
  } catch (error) {
    console.error('Project P&L Error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ============================================
// GET /api/project-wallet/:projectId/employee-costs
// Employee cost allocation across project lifecycle
// ============================================
router.get('/:projectId/employee-costs', requireModulePermission('all_projects', 'view'), async (req, res) => {
  try {
    const { projectId } = req.params

    const project = await Project.findById(projectId)
      .select('projectId title originalLead customer projectManager teamMembers departmentAssignments')
      .populate('projectManager', 'name email designation salary.ctc salary.grossSalary')
      .populate('teamMembers.user', 'name email designation salary.ctc salary.grossSalary')
      .populate('departmentAssignments.design.lead', 'name email designation salary.ctc salary.grossSalary')
      .populate('departmentAssignments.design.team.user', 'name email designation salary.ctc salary.grossSalary')
      .populate('departmentAssignments.operations.lead', 'name email designation salary.ctc salary.grossSalary')
      .populate('departmentAssignments.operations.team.user', 'name email designation salary.ctc salary.grossSalary')

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' })
    }

    // Helper: calculate hourly cost from CTC
    const hourlyRate = (user) => {
      const ctc = user?.salary?.ctc || user?.salary?.grossSalary || 0
      return ctc > 0 ? ctc / (12 * 22 * 8) : 0 // Monthly CTC / 22 working days / 8 hours
    }

    const employeeMap = {} // userId → aggregated cost data

    const addEmployee = (user, phase, hours, cost, activity) => {
      if (!user || !user._id) return
      const uid = user._id.toString()
      if (!employeeMap[uid]) {
        employeeMap[uid] = {
          _id: uid,
          name: user.name || 'Unknown',
          email: user.email || '',
          designation: user.designation || '',
          ctc: user.salary?.ctc || 0,
          hourlyRate: hourlyRate(user),
          phases: {},
          totalHours: 0,
          totalCost: 0,
          activities: []
        }
      }
      if (!employeeMap[uid].phases[phase]) {
        employeeMap[uid].phases[phase] = { hours: 0, cost: 0, activities: [] }
      }
      employeeMap[uid].phases[phase].hours += hours
      employeeMap[uid].phases[phase].cost += cost
      if (activity) employeeMap[uid].phases[phase].activities.push(activity)
      employeeMap[uid].totalHours += hours
      employeeMap[uid].totalCost += cost
    }

    // --- 1. PRE-SALES PHASE: Call activities on the original lead ---
    if (project.originalLead) {
      try {
        const Lead = (await import('../models/Lead.js')).default
        const CallActivity = (await import('../models/CallActivity.js')).default

        const lead = await Lead.findById(project.originalLead)
          .select('departmentAssignments createdBy assignedTo')
          .populate('departmentAssignments.preSales.employee', 'name email designation salary.ctc salary.grossSalary')
          .populate('departmentAssignments.crm.employee', 'name email designation salary.ctc salary.grossSalary')
          .populate('createdBy', 'name email designation salary.ctc salary.grossSalary')

        // Pre-sales employee assigned to lead
        if (lead?.departmentAssignments?.preSales?.employee) {
          const emp = lead.departmentAssignments.preSales.employee
          // Estimate hours: from assignedAt to qualification (or 2 weeks default)
          const assignedAt = lead.departmentAssignments.preSales.assignedAt
          const estimatedDays = 10 // average pre-sales engagement
          const estimatedHours = estimatedDays * 2 // 2 hours/day on a lead
          const cost = estimatedHours * hourlyRate(emp)
          addEmployee(emp, 'Pre-Sales', estimatedHours, cost, 'Lead qualification & follow-up')
        }

        // CRM coordinator
        if (lead?.departmentAssignments?.crm?.employee) {
          const emp = lead.departmentAssignments.crm.employee
          const estimatedHours = 5 // CRM coordination
          addEmployee(emp, 'Pre-Sales', estimatedHours, estimatedHours * hourlyRate(emp), 'CRM coordination')
        }

        // Call activities - actual tracked effort
        const calls = await CallActivity.find({ lead: project.originalLead })
          .select('calledBy duration status')
          .populate('calledBy', 'name email designation salary.ctc salary.grossSalary')

        calls.forEach(call => {
          if (call.calledBy) {
            const hours = (call.duration || 300) / 3600 // duration in seconds → hours (5 min default)
            const cost = hours * hourlyRate(call.calledBy)
            addEmployee(call.calledBy, 'Pre-Sales', hours, cost, `Call (${call.status})`)
          }
        })
      } catch (e) {
        console.error('Pre-sales cost error:', e.message)
      }
    }

    // --- 2. SALES PHASE: Quotation & Sales Order effort ---
    try {
      const SalesOrder = (await import('../models/SalesOrder.js')).default
      const Quotation = (await import('../models/Quotation.js')).default

      const quotations = await Quotation.find({ project: projectId })
        .select('preparedBy createdBy quotationDate')
        .populate('preparedBy', 'name email designation salary.ctc salary.grossSalary')
        .populate('createdBy', 'name email designation salary.ctc salary.grossSalary')

      quotations.forEach(q => {
        const emp = q.preparedBy || q.createdBy
        if (emp) {
          const hours = 4 // avg hours per quotation preparation
          addEmployee(emp, 'Sales', hours, hours * hourlyRate(emp), 'Quotation preparation')
        }
      })

      const salesOrders = await SalesOrder.find({ project: projectId })
        .select('createdBy')
        .populate('createdBy', 'name email designation salary.ctc salary.grossSalary')

      salesOrders.forEach(so => {
        if (so.createdBy) {
          const hours = 3 // avg hours per SO
          addEmployee(so.createdBy, 'Sales', hours, hours * hourlyRate(so.createdBy), 'Sales order processing')
        }
      })

      // Sales department assignment from lead
      if (project.originalLead) {
        const Lead = (await import('../models/Lead.js')).default
        const lead = await Lead.findById(project.originalLead)
          .select('departmentAssignments.sales.employee')
          .populate('departmentAssignments.sales.employee', 'name email designation salary.ctc salary.grossSalary')

        if (lead?.departmentAssignments?.sales?.employee) {
          const emp = lead.departmentAssignments.sales.employee
          const hours = 15 // avg total sales effort per project
          addEmployee(emp, 'Sales', hours, hours * hourlyRate(emp), 'Sales management & closure')
        }
      }
    } catch (e) {
      console.error('Sales cost error:', e.message)
    }

    // --- 3. DESIGN PHASE: Design iterations ---
    try {
      const DesignIteration = (await import('../models/DesignIteration.js')).default

      const iterations = await DesignIteration.find({ project: projectId })
        .select('designer designTeam timeline.actualHours timeline.estimatedHours version phase')
        .populate('designer', 'name email designation salary.ctc salary.grossSalary')
        .populate('designTeam.user', 'name email designation salary.ctc salary.grossSalary')

      iterations.forEach(di => {
        const actualHours = di.timeline?.actualHours || di.timeline?.estimatedHours || 8
        if (di.designer) {
          addEmployee(di.designer, 'Design', actualHours, actualHours * hourlyRate(di.designer), `Design v${di.version} (${di.phase})`)
        }
        (di.designTeam || []).forEach(tm => {
          if (tm.user) {
            const memberHours = actualHours * 0.5 // team members ~50% of lead hours
            addEmployee(tm.user, 'Design', memberHours, memberHours * hourlyRate(tm.user), `Design v${di.version} support`)
          }
        })
      })

      // Design lead from project assignment
      if (project.departmentAssignments?.design?.lead) {
        const lead = project.departmentAssignments.design.lead
        if (lead?.name && !employeeMap[lead._id?.toString()]?.phases?.Design) {
          const hours = 10 // design oversight
          addEmployee(lead, 'Design', hours, hours * hourlyRate(lead), 'Design oversight & review')
        }
      }
    } catch (e) {
      console.error('Design cost error:', e.message)
    }

    // --- 4. PROJECT MANAGEMENT: PM and operations team ---
    if (project.projectManager?.name) {
      // Estimate PM hours based on project duration or default
      const hours = 40 // avg PM hours per project
      addEmployee(project.projectManager, 'Project Management', hours, hours * hourlyRate(project.projectManager), 'Project management & coordination')
    }

    if (project.departmentAssignments?.operations?.lead) {
      const lead = project.departmentAssignments.operations.lead
      if (lead?.name) {
        const hours = 20 // operations oversight
        addEmployee(lead, 'Project Management', hours, hours * hourlyRate(lead), 'Operations management')
      }
    }

    ;(project.departmentAssignments?.operations?.team || []).forEach(tm => {
      if (tm.user?.name) {
        const hours = 15 // team member involvement
        addEmployee(tm.user, 'Project Management', hours, hours * hourlyRate(tm.user), `${tm.role || 'Operations'} support`)
      }
    })

    // --- 5. EXECUTION: Labor entries (actual tracked hours) ---
    const laborEntries = await LaborEntry.find({
      project: projectId,
      status: { $in: ['approved', 'submitted', 'completed'] }
    })
      .select('employee hours.total cost.totalCost activity.name entryDate employeeDetails')
      .populate('employee', 'name email designation salary.ctc salary.grossSalary')

    laborEntries.forEach(le => {
      if (le.employee) {
        const hours = le.hours?.total || 0
        const cost = le.cost?.totalCost || (hours * hourlyRate(le.employee))
        addEmployee(le.employee, 'Execution', hours, cost, le.activity?.name || 'Site work')
      }
    })

    // --- 6. PROCUREMENT: PO creators & approvers ---
    const purchaseOrders = await PurchaseOrder.find({ project: projectId })
      .select('createdBy approvedBy poNumber')
      .populate('createdBy', 'name email designation salary.ctc salary.grossSalary')
      .populate('approvedBy', 'name email designation salary.ctc salary.grossSalary')

    purchaseOrders.forEach(po => {
      if (po.createdBy) {
        addEmployee(po.createdBy, 'Procurement', 2, 2 * hourlyRate(po.createdBy), `PO ${po.poNumber} creation`)
      }
      if (po.approvedBy && po.approvedBy._id?.toString() !== po.createdBy?._id?.toString()) {
        addEmployee(po.approvedBy, 'Procurement', 1, 1 * hourlyRate(po.approvedBy), `PO ${po.poNumber} approval`)
      }
    })

    // --- BUILD RESPONSE ---
    const employees = Object.values(employeeMap).sort((a, b) => b.totalCost - a.totalCost)

    // Phase summary
    const phaseSummary = {}
    employees.forEach(emp => {
      Object.entries(emp.phases).forEach(([phase, data]) => {
        if (!phaseSummary[phase]) phaseSummary[phase] = { hours: 0, cost: 0, employees: 0 }
        phaseSummary[phase].hours += data.hours
        phaseSummary[phase].cost += data.cost
        phaseSummary[phase].employees += 1
      })
    })

    const totalEmployeeCost = employees.reduce((s, e) => s + e.totalCost, 0)
    const totalHours = employees.reduce((s, e) => s + e.totalHours, 0)

    res.json({
      success: true,
      data: {
        project: { projectId: project.projectId, title: project.title },
        summary: {
          totalEmployees: employees.length,
          totalHours: parseFloat(totalHours.toFixed(1)),
          totalCost: Math.round(totalEmployeeCost),
          avgCostPerHour: totalHours > 0 ? Math.round(totalEmployeeCost / totalHours) : 0
        },
        phaseSummary: Object.entries(phaseSummary).map(([phase, data]) => ({
          phase,
          hours: parseFloat(data.hours.toFixed(1)),
          cost: Math.round(data.cost),
          employees: data.employees
        })).sort((a, b) => {
          const order = ['Pre-Sales', 'Sales', 'Design', 'Project Management', 'Procurement', 'Execution']
          return order.indexOf(a.phase) - order.indexOf(b.phase)
        }),
        employees: employees.map(e => ({
          ...e,
          totalHours: parseFloat(e.totalHours.toFixed(1)),
          totalCost: Math.round(e.totalCost),
          hourlyRate: Math.round(e.hourlyRate),
          phases: Object.fromEntries(
            Object.entries(e.phases).map(([k, v]) => [k, { hours: parseFloat(v.hours.toFixed(1)), cost: Math.round(v.cost), activities: v.activities }])
          )
        }))
      }
    })
  } catch (error) {
    console.error('Employee cost allocation error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
