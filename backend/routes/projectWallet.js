import express from 'express'
import { protect, setCompanyContext, requireModulePermission, authorize } from '../middleware/rbac.js'
import Project from '../models/Project.js'
import PaymentMilestone from '../models/PaymentMilestone.js'
import VendorPaymentMilestone from '../models/VendorPaymentMilestone.js'
import PurchaseOrder from '../models/PurchaseOrder.js'
import VendorInvoice from '../models/VendorInvoice.js'
import CustomerInvoice from '../models/CustomerInvoice.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)

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

export default router
