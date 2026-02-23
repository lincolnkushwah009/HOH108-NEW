import express from 'express'
import LedgerActivityMapping from '../models/LedgerActivityMapping.js'
import {
  protect,
  setCompanyContext,
  companyScopedQuery
} from '../middleware/rbac.js'

const router = express.Router()

router.use(protect)
router.use(setCompanyContext)

/**
 * @route   GET /api/ledger-mappings
 * @desc    List all ledger activity mappings for company
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const { module, triggerEvent, isActive } = req.query

    const queryFilter = companyScopedQuery(req)

    if (module) queryFilter.module = module
    if (triggerEvent) queryFilter.triggerEvent = triggerEvent
    if (isActive !== undefined) queryFilter.isActive = isActive === 'true'

    const mappings = await LedgerActivityMapping.find(queryFilter)
      .populate('createdBy', 'name')
      .sort({ module: 1, triggerEvent: 1 })

    res.json({ success: true, data: mappings })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * @route   POST /api/ledger-mappings
 * @desc    Create a new ledger activity mapping
 * @access  Private
 */
router.post('/', async (req, res) => {
  try {
    const mapping = await LedgerActivityMapping.create({
      ...req.body,
      company: req.activeCompany._id,
      createdBy: req.user._id
    })

    res.status(201).json({ success: true, data: mapping })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * @route   PUT /api/ledger-mappings/:id
 * @desc    Update a ledger activity mapping
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const mapping = await LedgerActivityMapping.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!mapping) {
      return res.status(404).json({ success: false, message: 'Mapping not found' })
    }

    Object.assign(mapping, req.body)
    await mapping.save()

    res.json({ success: true, data: mapping })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * @route   POST /api/ledger-mappings/:id/toggle
 * @desc    Toggle isActive status of a mapping
 * @access  Private
 */
router.post('/:id/toggle', async (req, res) => {
  try {
    const mapping = await LedgerActivityMapping.findOne({
      _id: req.params.id,
      company: req.activeCompany._id
    })

    if (!mapping) {
      return res.status(404).json({ success: false, message: 'Mapping not found' })
    }

    mapping.isActive = !mapping.isActive
    await mapping.save()

    res.json({
      success: true,
      message: `Mapping ${mapping.isActive ? 'activated' : 'deactivated'}`,
      data: mapping
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * @route   POST /api/ledger-mappings/seed
 * @desc    Seed default ledger activity mappings for the company
 * @access  Private
 */
router.post('/seed', async (req, res) => {
  try {
    const companyId = req.activeCompany._id

    // Check if mappings already exist for this company
    const existingCount = await LedgerActivityMapping.countDocuments({ company: companyId })
    if (existingCount > 0) {
      return res.status(400).json({
        success: false,
        message: `${existingCount} mappings already exist for this company. Delete existing mappings before re-seeding.`
      })
    }

    const defaultMappings = [
      // 1. Vendor Invoice Approved
      {
        company: companyId,
        mappingCode: 'AP-001',
        name: 'Vendor Invoice Approved - Purchase Entry',
        module: 'accounts_payable',
        triggerEvent: 'vendor_invoice_approved',
        isSystem: true,
        isActive: true,
        createdBy: req.user._id,
        journalTemplate: [
          {
            accountCode: '3710',
            accountName: 'Purchase - Materials',
            debitFormula: 'sourceDoc.subTotal',
            creditFormula: '',
            description: 'Material purchase cost'
          },
          {
            accountCode: '1144',
            accountName: 'GST Input CGST',
            debitFormula: 'sourceDoc.totalCGST',
            creditFormula: '',
            description: 'CGST input tax credit'
          },
          {
            accountCode: '1145',
            accountName: 'GST Input SGST',
            debitFormula: 'sourceDoc.totalSGST',
            creditFormula: '',
            description: 'SGST input tax credit'
          },
          {
            accountCode: '2230',
            accountName: 'Sundry Creditors',
            debitFormula: '',
            creditFormula: 'sourceDoc.invoiceTotal',
            description: 'Amount payable to vendor'
          }
        ]
      },

      // 2. Customer Invoice Created
      {
        company: companyId,
        mappingCode: 'AR-001',
        name: 'Customer Invoice Created - Revenue Entry',
        module: 'accounts_receivable',
        triggerEvent: 'customer_invoice_created',
        isSystem: true,
        isActive: true,
        createdBy: req.user._id,
        journalTemplate: [
          {
            accountCode: '1160',
            accountName: 'Sundry Debtors',
            debitFormula: 'sourceDoc.invoiceTotal',
            creditFormula: '',
            description: 'Amount receivable from customer'
          },
          {
            accountCode: '4110',
            accountName: 'Interior Revenue',
            debitFormula: '',
            creditFormula: 'sourceDoc.subTotal',
            description: 'Revenue from interior services'
          },
          {
            accountCode: '2211',
            accountName: 'GST Payable CGST',
            debitFormula: '',
            creditFormula: 'sourceDoc.totalCGST',
            description: 'CGST output tax liability'
          },
          {
            accountCode: '2212',
            accountName: 'GST Payable SGST',
            debitFormula: '',
            creditFormula: 'sourceDoc.totalSGST',
            description: 'SGST output tax liability'
          }
        ]
      },

      // 3. Payment Outgoing Completed
      {
        company: companyId,
        mappingCode: 'PAY-001',
        name: 'Payment Outgoing - Vendor Payment',
        module: 'payments',
        triggerEvent: 'payment_outgoing_completed',
        isSystem: true,
        isActive: true,
        createdBy: req.user._id,
        journalTemplate: [
          {
            accountCode: '2230',
            accountName: 'Sundry Creditors',
            debitFormula: 'sourceDoc.amount',
            creditFormula: '',
            description: 'Creditor balance reduced'
          },
          {
            accountCode: '1111',
            accountName: 'HDFC Bank',
            debitFormula: '',
            creditFormula: 'sourceDoc.amount',
            description: 'Bank payment to vendor'
          }
        ]
      },

      // 4. Payment Incoming Completed
      {
        company: companyId,
        mappingCode: 'PAY-002',
        name: 'Payment Incoming - Customer Receipt',
        module: 'payments',
        triggerEvent: 'payment_incoming_completed',
        isSystem: true,
        isActive: true,
        createdBy: req.user._id,
        journalTemplate: [
          {
            accountCode: '1111',
            accountName: 'HDFC Bank',
            debitFormula: 'sourceDoc.amount',
            creditFormula: '',
            description: 'Bank receipt from customer'
          },
          {
            accountCode: '1160',
            accountName: 'Sundry Debtors',
            debitFormula: '',
            creditFormula: 'sourceDoc.amount',
            description: 'Debtor balance reduced'
          }
        ]
      },

      // 5. TDS Deduction
      {
        company: companyId,
        mappingCode: 'TDS-001',
        name: 'TDS Deduction on Vendor Payment',
        module: 'tds',
        triggerEvent: 'tds_deduction',
        isSystem: true,
        isActive: true,
        createdBy: req.user._id,
        journalTemplate: [
          {
            accountCode: '2230',
            accountName: 'Sundry Creditors',
            debitFormula: 'sourceDoc.tdsAmount',
            creditFormula: '',
            description: 'TDS deducted from vendor payment'
          },
          {
            accountCode: '2214',
            accountName: 'TDS Payable',
            debitFormula: '',
            creditFormula: 'sourceDoc.tdsAmount',
            description: 'TDS payable to government'
          }
        ]
      },

      // 6. Payroll Processed
      {
        company: companyId,
        mappingCode: 'PAY-003',
        name: 'Payroll Processed - Salary Entry',
        module: 'payroll',
        triggerEvent: 'payroll_processed',
        isSystem: true,
        isActive: true,
        createdBy: req.user._id,
        journalTemplate: [
          {
            accountCode: '3310',
            accountName: 'Staff Salary',
            debitFormula: 'sourceDoc.grossSalary',
            creditFormula: '',
            description: 'Gross salary expense'
          },
          {
            accountCode: '2221',
            accountName: 'Salary Payable',
            debitFormula: '',
            creditFormula: 'sourceDoc.netSalary',
            description: 'Net salary payable to employee'
          },
          {
            accountCode: '2214',
            accountName: 'TDS Payable',
            debitFormula: '',
            creditFormula: 'sourceDoc.tdsAmount',
            description: 'TDS deducted from salary'
          },
          {
            accountCode: '2222',
            accountName: 'PF Payable',
            debitFormula: '',
            creditFormula: 'sourceDoc.pfAmount',
            description: 'PF contribution payable'
          },
          {
            accountCode: '2223',
            accountName: 'ESI Payable',
            debitFormula: '',
            creditFormula: 'sourceDoc.esiAmount',
            description: 'ESI contribution payable'
          }
        ]
      },

      // 7. Material Consumed
      {
        company: companyId,
        mappingCode: 'INV-001',
        name: 'Material Consumed - Stock Issued to Production',
        module: 'inventory',
        triggerEvent: 'material_consumed',
        isSystem: true,
        isActive: true,
        createdBy: req.user._id,
        journalTemplate: [
          {
            accountCode: '3110',
            accountName: 'Material Cost',
            debitFormula: 'sourceDoc.totalValue',
            creditFormula: '',
            description: 'Material consumed in production'
          },
          {
            accountCode: '1150',
            accountName: 'Stock-in-Hand',
            debitFormula: '',
            creditFormula: 'sourceDoc.totalValue',
            description: 'Stock reduced on consumption'
          }
        ]
      }
    ]

    const created = await LedgerActivityMapping.insertMany(defaultMappings)

    res.status(201).json({
      success: true,
      message: `${created.length} default mappings seeded successfully`,
      data: created
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
