import ChartOfAccounts from '../models/ChartOfAccounts.js'

/**
 * Indian Chart of Accounts Seeder
 * Creates ~70 standard Tally-compatible Indian CoA entries for a given company.
 *
 * The hierarchy follows Indian corporate accounting standards with groups for:
 * Assets (1xxx), Liabilities (2xxx), Expenses (3xxx), Income (4xxx)
 *
 * Usage:
 *   import { seedIndianCoA } from './seeders/indianCoASeeder.js'
 *   await seedIndianCoA(companyId, 'IP')
 */

// Default normal balance by account type (debit for asset/expense, credit for liability/equity/revenue)
const DEFAULT_NORMAL_BALANCE = {
  asset: 'debit',
  liability: 'credit',
  equity: 'credit',
  revenue: 'credit',
  expense: 'debit'
}

/**
 * Account definitions organized by type.
 * Each entry: [accountCode, accountName, level, parentCode, options]
 *
 * options may include:
 *   isGroup       - true for group/parent accounts (isControlAccount=true, isPostable=false)
 *   indianGroup   - Tally-compatible Indian accounting group
 *   subType       - accountSubType value
 *   normalBalance - override the default normal balance (e.g., credit for contra-asset)
 *   gstApplicable - boolean
 *   gstCategory   - GST category enum value
 *   tdsApplicable - boolean
 *   tdsSection    - TDS section string
 */
const ACCOUNT_DEFINITIONS = [
  // ========================================================================
  // ASSETS (accountType: 'asset')
  // ========================================================================

  // Level 1 - Root
  ['1000', 'Assets', 1, null, { isGroup: true }],

  // Level 2 - Major groups
  ['1100', 'Current Assets', 2, '1000', { isGroup: true }],

  // Level 3 - Sub-groups under Current Assets
  ['1110', 'Bank Accounts', 3, '1100', { isGroup: true, indianGroup: 'bank_accounts' }],
  ['1111', 'HDFC Bank A/c', 4, '1110', { subType: 'bank' }],
  ['1112', 'ICICI Bank A/c', 4, '1110', { subType: 'bank' }],

  ['1120', 'Cash-in-Hand', 3, '1100', { indianGroup: 'cash_in_hand', subType: 'cash' }],

  ['1130', 'Deposits', 3, '1100', { isGroup: true, indianGroup: 'deposits' }],
  ['1131', 'Security Deposits', 4, '1130', { subType: 'other_asset' }],
  ['1132', 'EMD / Bid Deposits', 4, '1130', { subType: 'other_asset' }],

  ['1140', 'Loans & Advances (Asset)', 3, '1100', { isGroup: true, indianGroup: 'loans_advances_asset' }],
  ['1141', 'Advance to Suppliers', 4, '1140', { subType: 'prepaid_expense' }],
  ['1142', 'Advance to Employees', 4, '1140', { subType: 'prepaid_expense' }],
  ['1143', 'TDS Receivable', 4, '1140', { subType: 'other_asset' }],
  ['1144', 'GST Input - CGST', 4, '1140', { subType: 'other_asset', gstApplicable: true, gstCategory: 'cgst' }],
  ['1145', 'GST Input - SGST', 4, '1140', { subType: 'other_asset', gstApplicable: true, gstCategory: 'sgst' }],
  ['1146', 'GST Input - IGST', 4, '1140', { subType: 'other_asset', gstApplicable: true, gstCategory: 'igst' }],

  ['1150', 'Stock-in-Hand', 3, '1100', { indianGroup: 'stock_in_hand', subType: 'inventory' }],
  ['1160', 'Sundry Debtors', 3, '1100', { indianGroup: 'sundry_debtors', subType: 'accounts_receivable' }],
  ['1170', 'Prepaid Expenses', 3, '1100', { indianGroup: 'prepaid_expenses', subType: 'prepaid_expense' }],

  // Level 2 - Fixed Assets
  ['1500', 'Fixed Assets', 2, '1000', { isGroup: true, indianGroup: 'fixed_assets' }],
  ['1510', 'Furniture & Fixtures', 3, '1500', { subType: 'fixed_asset' }],
  ['1520', 'Office Equipment', 3, '1500', { subType: 'fixed_asset' }],
  ['1530', 'Computers & IT Equipment', 3, '1500', { subType: 'fixed_asset' }],
  ['1540', 'Vehicles', 3, '1500', { subType: 'fixed_asset' }],
  ['1550', 'Plant & Machinery', 3, '1500', { subType: 'fixed_asset' }],
  ['1560', 'Accumulated Depreciation', 3, '1500', { indianGroup: 'accumulated_depreciation', normalBalance: 'credit' }],

  // Level 2 - Other asset categories
  ['1700', 'Investments', 2, '1000', { indianGroup: 'investments', subType: 'other_asset' }],

  // ========================================================================
  // LIABILITIES (accountType: 'liability')
  // ========================================================================

  // Level 1 - Root
  ['2000', 'Liabilities', 1, null, { isGroup: true }],

  // Level 2 - Capital Account
  ['2100', 'Capital Account', 2, '2000', { isGroup: true, indianGroup: 'capital_account' }],
  ['2110', 'Share Capital', 3, '2100', { subType: 'common_stock' }],
  ['2120', 'Reserves & Surplus', 3, '2100', { indianGroup: 'reserves_surplus', subType: 'retained_earnings' }],

  // Level 2 - Current Liabilities
  ['2200', 'Current Liabilities', 2, '2000', { isGroup: true }],

  ['2210', 'Duties & Taxes', 3, '2200', { isGroup: true, indianGroup: 'duties_taxes' }],
  ['2211', 'GST Payable - CGST', 4, '2210', { subType: 'current_liability', gstApplicable: true, gstCategory: 'output_gst' }],
  ['2212', 'GST Payable - SGST', 4, '2210', { subType: 'current_liability', gstApplicable: true, gstCategory: 'output_gst' }],
  ['2213', 'GST Payable - IGST', 4, '2210', { subType: 'current_liability', gstApplicable: true, gstCategory: 'output_gst' }],
  ['2214', 'TDS Payable', 4, '2210', { subType: 'current_liability', tdsApplicable: true }],
  ['2215', 'GST Payment A/c', 4, '2210', { subType: 'current_liability', gstApplicable: true }],
  ['2216', 'Professional Tax Payable', 4, '2210', { subType: 'current_liability' }],

  ['2220', 'Provisions', 3, '2200', { isGroup: true, indianGroup: 'provisions' }],
  ['2221', 'Salary Payable', 4, '2220', { subType: 'accrued_expense' }],
  ['2222', 'Provident Fund Payable', 4, '2220', { subType: 'accrued_expense' }],
  ['2223', 'ESI Payable', 4, '2220', { subType: 'accrued_expense' }],

  ['2230', 'Sundry Creditors', 3, '2200', { indianGroup: 'sundry_creditors', subType: 'accounts_payable' }],
  ['2240', 'Retention Money', 3, '2200', { indianGroup: 'retention_money', subType: 'current_liability' }],
  ['2250', 'Advance from Customers', 3, '2200', { indianGroup: 'advance_from_customers', subType: 'deferred_revenue' }],

  // Level 2 - Loans (Liability)
  ['2500', 'Loans (Liability)', 2, '2000', { isGroup: true, indianGroup: 'loans_liability' }],
  ['2510', 'Bank Overdraft', 3, '2500', { subType: 'current_liability' }],
  ['2520', 'Secured Loans', 3, '2500', { subType: 'long_term_liability' }],
  ['2530', 'Unsecured Loans', 3, '2500', { subType: 'long_term_liability' }],

  // Level 2 - Other liability categories
  ['2700', 'Branch / Divisions', 2, '2000', { indianGroup: 'branch_divisions' }],
  ['2800', 'Suspense A/c', 2, '2000', { indianGroup: 'suspense_account' }],
  ['2900', 'Profit & Loss A/c', 2, '2000', { indianGroup: 'profit_loss_account', subType: 'retained_earnings' }],

  // ========================================================================
  // EXPENSES (accountType: 'expense')
  // ========================================================================

  // Level 1 - Root
  ['3000', 'Expenses', 1, null, { isGroup: true }],

  // Level 2 - Direct Expenses
  ['3100', 'Direct Expenses', 2, '3000', { isGroup: true, indianGroup: 'direct_expenses' }],
  ['3110', 'Material Cost', 3, '3100', { subType: 'cost_of_goods_sold' }],
  ['3120', 'Labour Cost', 3, '3100', { subType: 'cost_of_goods_sold' }],
  ['3130', 'Sub-Contractor Cost', 3, '3100', { subType: 'cost_of_goods_sold' }],
  ['3140', 'Transportation & Freight', 3, '3100', { subType: 'cost_of_goods_sold' }],
  ['3150', 'Site Expenses', 3, '3100', { subType: 'cost_of_goods_sold' }],

  // Level 2 - Indirect Expenses
  ['3300', 'Indirect Expenses', 2, '3000', { isGroup: true, indianGroup: 'indirect_expenses' }],
  ['3310', 'Staff Salary & Wages', 3, '3300', { subType: 'administrative_expense' }],
  ['3320', 'Office Rent', 3, '3300', { subType: 'administrative_expense' }],
  ['3330', 'Machinery Rental', 3, '3300', { subType: 'operating_expense' }],
  ['3340', 'Marketing & Advertising', 3, '3300', { subType: 'selling_expense' }],
  ['3350', 'Professional & Legal Fees', 3, '3300', { subType: 'administrative_expense', tdsApplicable: true, tdsSection: '194J' }],
  ['3360', 'Travel & Conveyance', 3, '3300', { subType: 'administrative_expense' }],
  ['3370', 'Telephone & Internet', 3, '3300', { subType: 'administrative_expense' }],
  ['3380', 'Printing & Stationery', 3, '3300', { subType: 'administrative_expense' }],
  ['3390', 'Electricity & Water', 3, '3300', { subType: 'administrative_expense' }],
  ['3400', 'Insurance', 3, '3300', { subType: 'administrative_expense' }],
  ['3410', 'Depreciation', 3, '3300', { subType: 'other_expense' }],
  ['3420', 'Bank Charges', 3, '3300', { subType: 'other_expense' }],
  ['3430', 'Audit Fees', 3, '3300', { subType: 'administrative_expense', tdsApplicable: true, tdsSection: '194J' }],
  ['3440', 'Rounded Off', 3, '3300', { subType: 'other_expense' }],
  ['3450', 'Miscellaneous Expenses', 3, '3300', { subType: 'other_expense' }],

  // Level 2 - Purchase Accounts
  ['3700', 'Purchase Accounts', 2, '3000', { isGroup: true, indianGroup: 'purchase_accounts' }],
  ['3710', 'Purchase - Materials', 3, '3700', { subType: 'cost_of_goods_sold' }],
  ['3720', 'Purchase - Hardware & Fittings', 3, '3700', { subType: 'cost_of_goods_sold' }],
  ['3730', 'Purchase Returns', 3, '3700', { subType: 'cost_of_goods_sold', normalBalance: 'credit' }],

  // ========================================================================
  // INCOME (accountType: 'revenue')
  // ========================================================================

  // Level 1 - Root
  ['4000', 'Income', 1, null, { isGroup: true }],

  // Level 2 - Direct Incomes
  ['4100', 'Direct Incomes', 2, '4000', { isGroup: true, indianGroup: 'direct_incomes' }],
  ['4110', 'Interior Design & Execution Revenue', 3, '4100', { subType: 'service_revenue' }],
  ['4120', 'Construction Revenue', 3, '4100', { subType: 'service_revenue' }],
  ['4130', 'Design Consultation Revenue', 3, '4100', { subType: 'service_revenue' }],

  // Level 2 - Indirect Incomes
  ['4300', 'Indirect Incomes', 2, '4000', { isGroup: true, indianGroup: 'indirect_incomes' }],
  ['4310', 'Miscellaneous Receipts', 3, '4300', { subType: 'other_revenue' }],
  ['4320', 'Interest Income', 3, '4300', { subType: 'other_revenue' }],
  ['4330', 'Discount Received', 3, '4300', { subType: 'other_revenue' }],

  // Level 2 - Sales Accounts
  ['4500', 'Sales Accounts', 2, '4000', { isGroup: true, indianGroup: 'sales_accounts' }],
  ['4510', 'Sales - Interiors', 3, '4500', { subType: 'sales' }],
  ['4520', 'Sales - Construction', 3, '4500', { subType: 'sales' }],
  ['4530', 'Sales Returns', 3, '4500', { subType: 'sales', normalBalance: 'debit' }]
]

/**
 * Determine the accountType from the account code range.
 */
function getAccountType(accountCode) {
  const code = parseInt(accountCode, 10)
  if (code >= 1000 && code < 2000) return 'asset'
  if (code >= 2000 && code < 3000) return 'liability'
  if (code >= 3000 && code < 4000) return 'expense'
  if (code >= 4000 && code < 5000) return 'revenue'
  throw new Error(`Unknown account code range: ${accountCode}`)
}

/**
 * Seed the standard Indian Chart of Accounts for a company.
 *
 * @param {string|ObjectId} companyId - The company's MongoDB _id
 * @param {string} companyCode - Short code for ledger prefix (e.g., 'IP')
 * @returns {Promise<{ success: boolean, count: number, message: string }>}
 */
export async function seedIndianCoA(companyId, companyCode) {
  try {
    console.log(`[CoA Seeder] Starting Indian Chart of Accounts seeding for company: ${companyId} (${companyCode})`)

    // Step 1: Delete existing system accounts for this company
    const deleteResult = await ChartOfAccounts.deleteMany({
      company: companyId,
      isSystemAccount: true
    })
    console.log(`[CoA Seeder] Deleted ${deleteResult.deletedCount} existing system accounts`)

    // Step 2: Create accounts in hierarchy order (parents before children).
    // The ACCOUNT_DEFINITIONS array is already ordered so that parents appear before their children.
    const accountMap = new Map() // accountCode -> MongoDB _id
    let createdCount = 0

    // We bypass the pre-save hook's normalBalance auto-calculation by using direct document
    // construction + save, then fixing normalBalance overrides. However, for simplicity and
    // correctness (especially for the parent-level auto-calculation in the hook), we create
    // accounts one by one using create(). The hook auto-sets normalBalance from accountType,
    // so we will do a targeted update for the few accounts that need a normalBalance override.
    const normalBalanceOverrides = [] // Collect accounts needing normalBalance correction

    for (const [accountCode, accountName, level, parentCode, options = {}] of ACCOUNT_DEFINITIONS) {
      const accountType = getAccountType(accountCode)
      const isGroup = options.isGroup === true

      const doc = {
        company: companyId,
        accountCode,
        accountName,
        accountType,
        normalBalance: options.normalBalance || DEFAULT_NORMAL_BALANCE[accountType],
        level,
        isControlAccount: isGroup,
        isPostable: !isGroup,
        isSystemAccount: true,
        approvalStatus: 'approved',
        isActive: true,
        ledgerCode: `${companyCode}-${accountCode}`
      }

      // Set parent reference
      if (parentCode && accountMap.has(parentCode)) {
        doc.parentAccount = accountMap.get(parentCode)
      }

      // Optional fields
      if (options.indianGroup) doc.indianGroup = options.indianGroup
      if (options.subType) doc.accountSubType = options.subType
      if (options.gstApplicable) doc.gstApplicable = true
      if (options.gstCategory) doc.gstCategory = options.gstCategory
      if (options.tdsApplicable) doc.tdsApplicable = true
      if (options.tdsSection) doc.tdsSection = options.tdsSection

      // Create the account. The pre-save hook will run, but we have already set all fields
      // explicitly including normalBalance and level, so the hook's auto-calculations
      // should not cause issues (it only overrides normalBalance on new docs based on accountType,
      // and recalculates level from parent). We need to handle the normalBalance override case.
      const account = await ChartOfAccounts.create(doc)

      // Track if the hook has overridden our normalBalance
      if (options.normalBalance && account.normalBalance !== options.normalBalance) {
        normalBalanceOverrides.push({
          _id: account._id,
          normalBalance: options.normalBalance
        })
      }

      accountMap.set(accountCode, account._id)
      createdCount++
    }

    // Step 3: Fix normalBalance overrides for contra-accounts
    // (Accumulated Depreciation, Purchase Returns, Sales Returns)
    if (normalBalanceOverrides.length > 0) {
      console.log(`[CoA Seeder] Fixing ${normalBalanceOverrides.length} normalBalance overrides...`)
      for (const override of normalBalanceOverrides) {
        await ChartOfAccounts.updateOne(
          { _id: override._id },
          { $set: { normalBalance: override.normalBalance } }
        )
      }
    }

    console.log(`[CoA Seeder] Successfully created ${createdCount} accounts`)

    return {
      success: true,
      count: createdCount,
      message: `Created ${createdCount} Indian Chart of Accounts entries for company ${companyCode}`
    }
  } catch (error) {
    console.error('[CoA Seeder] Error seeding Indian Chart of Accounts:', error)
    throw error
  }
}

/**
 * Delete all system-seeded CoA entries for a company.
 *
 * @param {string|ObjectId} companyId - The company's MongoDB _id
 * @returns {Promise<{ success: boolean, deletedCount: number }>}
 */
export async function deleteIndianCoA(companyId) {
  try {
    const result = await ChartOfAccounts.deleteMany({
      company: companyId,
      isSystemAccount: true
    })
    console.log(`[CoA Seeder] Deleted ${result.deletedCount} system accounts for company: ${companyId}`)
    return { success: true, deletedCount: result.deletedCount }
  } catch (error) {
    console.error('[CoA Seeder] Error deleting Indian CoA:', error)
    throw error
  }
}

export default { seedIndianCoA, deleteIndianCoA }
