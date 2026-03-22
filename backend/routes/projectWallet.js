import express from 'express'
import { protect, setCompanyContext, requireModulePermission, authorize } from '../middleware/rbac.js'
import Project from '../models/Project.js'
import PaymentMilestone from '../models/PaymentMilestone.js'
import VendorPaymentMilestone from '../models/VendorPaymentMilestone.js'
import PurchaseOrder from '../models/PurchaseOrder.js'
import VendorInvoice from '../models/VendorInvoice.js'
import CustomerInvoice from '../models/CustomerInvoice.js'
import LaborEntry from '../models/LaborEntry.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)

// ============================================
// GET /api/project-wallet/dashboard/pnl
// All Projects P&L Dashboard (management view)
// NOTE: Must be defined BEFORE /:projectId routes
// ============================================
router.get('/dashboard/pnl', requireModulePermission('all_projects', 'view'), async (req, res) => {
  try {
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
router.get('/:projectId/pnl', requireModulePermission('all_projects', 'view'), async (req, res) => {
  try {
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

    // --- OPERATING EXPENSES ---
    const contingencyUsed = project.budget?.contingencyUsed || 0
    const opex = contingencyUsed

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

export default router
