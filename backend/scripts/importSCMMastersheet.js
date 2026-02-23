import mongoose from 'mongoose'
import dotenv from 'dotenv'
import XLSX from 'xlsx'
import path from 'path'
import { fileURLToPath } from 'url'
import Vendor from '../models/Vendor.js'
import MaterialPricelist from '../models/MaterialPricelist.js'
import Company from '../models/Company.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Script to import vendors and materials from SCM Management Mastersheet
 * Usage: node scripts/importSCMMastersheet.js [path-to-excel-file]
 *
 * Default file: ~/Downloads/HOH108 - SCM Management Mastersheet .xlsx
 */

// Helper to normalize team size
const normalizeTeamSize = (size) => {
  if (!size) return undefined
  const s = String(size).toLowerCase()
  if (s.includes('small') || parseInt(s) <= 5) return 'small'
  if (s.includes('medium') || (parseInt(s) > 5 && parseInt(s) <= 15)) return 'medium'
  if (s.includes('large') || parseInt(s) > 15) return 'large'
  return undefined
}

// Helper to normalize payment terms
const normalizePaymentTerms = (terms) => {
  if (!terms) return 'net_30'
  const t = String(terms).toLowerCase()
  if (t.includes('advance')) return 'advance'
  if (t.includes('cod') || t.includes('cash')) return 'cod'
  if (t.includes('7') || t.includes('week')) return 'net_7'
  if (t.includes('15')) return 'net_15'
  if (t.includes('30')) return 'net_30'
  if (t.includes('45')) return 'net_45'
  if (t.includes('60')) return 'net_60'
  return 'custom'
}

// Helper to extract rate number
const extractRate = (rateStr) => {
  if (!rateStr) return null
  const match = String(rateStr).match(/(\d+)/)
  return match ? parseFloat(match[1]) : null
}

// Helper to determine category from sub-category
const determineCategory = (subCategory) => {
  if (!subCategory) return 'material_supplier'
  const sc = String(subCategory).toLowerCase()
  if (sc.includes('labour') || sc.includes('labor') || sc.includes('contract')) return 'labour'
  if (sc.includes('factory') || sc.includes('manufacturing')) return 'factory'
  if (sc.includes('material') || sc.includes('supplier') || sc.includes('hardware')) return 'material'
  if (sc.includes('both')) return 'both'
  return 'material_supplier'
}

// Parse material type from category/name
const determineMaterialType = (category, brand) => {
  const c = String(category || '').toLowerCase()
  const b = String(brand || '').toLowerCase()

  if (c.includes('cement') || b.includes('cement')) return 'cement'
  if (c.includes('steel') || b.includes('tmt') || b.includes('steel')) return 'steel'
  if (c.includes('block')) return 'blocks'
  if (c.includes('aggregate') || c.includes('sand') || c.includes('msand')) return 'aggregate'
  if (c.includes('rmc') || c.includes('concrete')) return 'rmc'
  if (c.includes('plywood')) return 'plywood'
  if (c.includes('hardware')) return 'hardware'
  if (c.includes('tile')) return 'tiles'
  if (c.includes('sanitary')) return 'sanitaryware'
  if (c.includes('electric')) return 'electrical'
  if (c.includes('plumb')) return 'plumbing'
  return 'other'
}

// Parse unit from specification
const determineUnit = (spec, category) => {
  const s = String(spec || '').toLowerCase()
  const c = String(category || '').toLowerCase()

  if (c.includes('cement')) return 'bag'
  if (c.includes('steel') || c.includes('tmt')) return 'ton'
  if (c.includes('block')) return 'unit'
  if (c.includes('rmc') || c.includes('concrete')) return 'm3'
  if (c.includes('aggregate') || c.includes('sand')) return 'cft'
  return 'unit'
}

// Parse price range
const parsePrice = (priceStr) => {
  if (!priceStr) return { min: null, max: null }
  const str = String(priceStr)

  // Handle range like "650-700"
  const rangeMatch = str.match(/(\d+)\s*[-–]\s*(\d+)/)
  if (rangeMatch) {
    return { min: parseFloat(rangeMatch[1]), max: parseFloat(rangeMatch[2]) }
  }

  // Single value
  const singleMatch = str.match(/(\d+(?:\.\d+)?)/)
  if (singleMatch) {
    return { min: parseFloat(singleMatch[1]), max: null }
  }

  return { min: null, max: null }
}

// Helper to find sheet by partial name match
const findSheet = (workbook, partialName) => {
  const actualName = workbook.SheetNames.find(name =>
    name.trim().toLowerCase().includes(partialName.toLowerCase())
  )
  return actualName ? { name: actualName, sheet: workbook.Sheets[actualName] } : null
}

const importVendors = async (workbook, company) => {
  console.log('\n--- Importing Vendors ---')

  const sheetPatterns = [
    { pattern: 'Interiors - Vendor Data', type: 'interiors' },
    { pattern: 'Construction - Vendor Data', type: 'construction' }
  ]
  let created = 0
  let updated = 0
  let skipped = 0

  for (const { pattern, type: vendorType } of sheetPatterns) {
    const result = findSheet(workbook, pattern)
    if (!result) {
      console.log(`  Sheet matching "${pattern}" not found, skipping...`)
      continue
    }
    const { name: sheetName, sheet } = result
    console.log(`\n  Processing: ${sheetName} (type: ${vendorType})`)

    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' })

    for (const row of data) {
      // Skip empty rows
      const vendorName = row['Vendor Name'] || row['Name'] || row['VENDOR NAME']
      if (!vendorName || vendorName.trim() === '') continue

      // Map Excel columns to Vendor model
      const vendorData = {
        company: company._id,
        name: String(vendorName).trim(),
        vendorType,
        category: determineCategory(row['Sub Category'] || row['Category']),
        subCategory: row['Sub Category'] || row['SUB CATEGORY'] || '',
        scopeOfWork: row['Scope of work'] || row['Scope Of Work'] || row['SCOPE OF WORK'] || '',
        spoc: row['SPOC'] || row['Spoc'] || '',
        phone: String(row['Contact No'] || row['Contact No.'] || row['CONTACT NO'] || '').replace(/[^\d]/g, ''),
        email: row['Email ID'] || row['Email Id'] || row['EMAIL ID'] || '',
        address: {
          street: row['Office Address'] || row['Address'] || row['OFFICE ADDRESS'] || '',
          city: row['City'] || row['CITY'] || '',
          state: row['State'] || '',
          country: 'India'
        },
        areaOfService: row['Area of Service'] || row['AREA OF SERVICE'] || '',
        teamSize: normalizeTeamSize(row['Team Size'] || row['TEAM SIZE']),
        rates: extractRate(row['Rates'] || row['RATES']),
        rateRemarks: row['Rates'] || row['RATES'] || '',
        gstNumber: row['GST No.'] || row['GST No'] || row['GST NO'] || '',
        panNumber: row['PAN No.'] || row['PAN No'] || row['PAN NO'] || '',
        paymentTerms: normalizePaymentTerms(row['Payment Terms'] || row['PAYMENT TERMS']),
        customPaymentTerms: row['Payment Terms'] || '',
        notes: row['Remarks'] || row['REMARKS'] || '',
        status: 'active'
      }

      // Check if vendor already exists (by name and company)
      const existing = await Vendor.findOne({
        company: company._id,
        name: { $regex: new RegExp(`^${vendorData.name}$`, 'i') }
      })

      if (existing) {
        // Update existing vendor with new fields
        Object.assign(existing, vendorData)
        await existing.save()
        console.log(`    Updated: ${vendorData.name}`)
        updated++
      } else {
        // Create new vendor
        await Vendor.create(vendorData)
        console.log(`    Created: ${vendorData.name}`)
        created++
      }
    }
  }

  console.log(`\n  Vendors - Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`)
  return { created, updated, skipped }
}

const importMaterials = async (workbook, company) => {
  console.log('\n--- Importing Material Pricelist ---')

  const result = findSheet(workbook, 'MATERIAL PRICELIST')
  if (!result) {
    console.log('  Sheet matching "MATERIAL PRICELIST" not found, skipping...')
    return { created: 0, updated: 0, skipped: 0 }
  }
  const { name: sheetName, sheet } = result
  console.log(`  Using sheet: ${sheetName}`)

  const data = XLSX.utils.sheet_to_json(sheet, { defval: '', header: 1 })
  let created = 0
  let updated = 0
  let skipped = 0

  /**
   * Actual sheet structure:
   * Row 0: ["Category","","Cement – Price (₹/bag)","","TMT Steel – Price (₹/ton)","Concrete Blocks – Price (₹/unit)","Aggregates – Price (₹/ton)","Remarks"]
   * Row 1: ["Brand","Type","OPC","PPC","Per Ton","Per Unit","Per Ton",""]
   * Row 2+: ["Priya","Cement",330,310,"–","–","–",""]
   *
   * Column mapping:
   * A (0): Brand name
   * B (1): Type (Cement, Steel, Blocks, Aggregate, RMC)
   * C (2): OPC price (for cement)
   * D (3): PPC price (for cement)
   * E (4): Steel price (per ton)
   * F (5): Blocks price (per unit)
   * G (6): Aggregates price (per ton)
   */

  // Helper to create/update material
  const upsertMaterial = async (brand, category, subCategory, priceStr, unit) => {
    const { min: price, max: priceMax } = parsePrice(priceStr)
    if (!price) return null

    const materialData = {
      company: company._id,
      materialType: determineMaterialType(category, brand),
      brand: brand,
      category: category,
      subCategory: subCategory,
      unit: unit,
      currentPrice: price,
      currentPriceMax: priceMax,
      priceType: priceMax ? 'range' : 'fixed',
      status: 'active'
    }

    // Escape special regex characters in brand name
    const escapedBrand = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    const existing = await MaterialPricelist.findOne({
      company: company._id,
      brand: { $regex: new RegExp(`^${escapedBrand}$`, 'i') },
      category: category,
      subCategory: subCategory
    })

    if (existing) {
      if (existing.currentPrice !== price) {
        existing.currentPrice = price
        existing.currentPriceMax = priceMax
        existing.priceType = priceMax ? 'range' : 'fixed'
        await existing.save()
        console.log(`    Updated: ${brand} (${category}/${subCategory}) - ₹${price}${priceMax ? '-' + priceMax : ''}`)
        return 'updated'
      } else {
        return 'skipped'
      }
    } else {
      await MaterialPricelist.create(materialData)
      console.log(`    Created: ${brand} (${category}/${subCategory}) - ₹${price}${priceMax ? '-' + priceMax : ''} per ${unit}`)
      return 'created'
    }
  }

  // Skip header rows (0 and 1)
  for (let i = 2; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length === 0) continue

    const brand = String(row[0] || '').trim()
    const type = String(row[1] || '').trim().toLowerCase()

    if (!brand || brand === '') continue

    // Process based on type
    if (type === 'cement') {
      // OPC price in column C (index 2)
      const opcPrice = row[2]
      if (opcPrice && opcPrice !== '–' && opcPrice !== '-') {
        const result = await upsertMaterial(brand, 'Cement', 'OPC', opcPrice, 'bag')
        if (result === 'created') created++
        else if (result === 'updated') updated++
        else if (result === 'skipped') skipped++
      }

      // PPC price in column D (index 3)
      const ppcPrice = row[3]
      if (ppcPrice && ppcPrice !== '–' && ppcPrice !== '-') {
        const result = await upsertMaterial(brand, 'Cement', 'PPC', ppcPrice, 'bag')
        if (result === 'created') created++
        else if (result === 'updated') updated++
        else if (result === 'skipped') skipped++
      }
    } else if (type === 'steel') {
      // Steel price in column E (index 4)
      const steelPrice = row[4]
      if (steelPrice && steelPrice !== '–' && steelPrice !== '-') {
        const result = await upsertMaterial(brand, 'Steel', 'TMT', steelPrice, 'ton')
        if (result === 'created') created++
        else if (result === 'updated') updated++
        else if (result === 'skipped') skipped++
      }
    } else if (type === 'blocks') {
      // Blocks price in column F (index 5)
      const blocksPrice = row[5]
      // Extract block size from brand name (e.g., "4" Block" -> "4\"")
      const sizeMatch = brand.match(/^(\d+)"/)
      const subCategory = sizeMatch ? `${sizeMatch[1]}" Block` : 'Block'
      if (blocksPrice && blocksPrice !== '–' && blocksPrice !== '-') {
        const result = await upsertMaterial(brand, 'Blocks', subCategory, blocksPrice, 'unit')
        if (result === 'created') created++
        else if (result === 'updated') updated++
        else if (result === 'skipped') skipped++
      }
    } else if (type === 'aggregate') {
      // Aggregates price in column G (index 6)
      const aggPrice = row[6]
      if (aggPrice && aggPrice !== '–' && aggPrice !== '-') {
        const result = await upsertMaterial(brand, 'Aggregates', brand, aggPrice, 'ton')
        if (result === 'created') created++
        else if (result === 'updated') updated++
        else if (result === 'skipped') skipped++
      }
    } else if (type === 'rmc') {
      // RMC price - check column F (index 5) based on the data
      const rmcPrice = row[5]
      // Extract grade from brand name (e.g., "M10 Concrete - Per M3" -> "M10")
      const gradeMatch = brand.match(/^(M\d+)/)
      const subCategory = gradeMatch ? gradeMatch[1] : 'RMC'
      if (rmcPrice && rmcPrice !== '–' && rmcPrice !== '-') {
        const result = await upsertMaterial(brand, 'RMC', subCategory, rmcPrice, 'm3')
        if (result === 'created') created++
        else if (result === 'updated') updated++
        else if (result === 'skipped') skipped++
      }
    }
  }

  console.log(`\n  Materials - Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`)
  return { created, updated, skipped }
}

const importSCMMastersheet = async () => {
  try {
    // Get file path from command line or use default
    const defaultPath = path.join(process.env.HOME, 'Downloads', 'HOH108 - SCM Management Mastersheet .xlsx')
    const filePath = process.argv[2] || defaultPath

    console.log('SCM Management Mastersheet Import Script')
    console.log('========================================')
    console.log(`File: ${filePath}`)

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    // Get the company
    const company = await Company.findOne({ isActive: true })
    if (!company) {
      console.log('No active company found. Please create a company first.')
      process.exit(1)
    }
    console.log(`Using company: ${company.name} (${company.code})`)

    // Read Excel file
    console.log('\nReading Excel file...')
    const workbook = XLSX.readFile(filePath)
    console.log(`Sheets found: ${workbook.SheetNames.join(', ')}`)

    // Import vendors
    const vendorResults = await importVendors(workbook, company)

    // Import materials
    const materialResults = await importMaterials(workbook, company)

    // Summary
    console.log('\n========================================')
    console.log('IMPORT SUMMARY')
    console.log('========================================')
    console.log(`Vendors:`)
    console.log(`  - Created: ${vendorResults.created}`)
    console.log(`  - Updated: ${vendorResults.updated}`)
    console.log(`Materials:`)
    console.log(`  - Created: ${materialResults.created}`)
    console.log(`  - Updated: ${materialResults.updated}`)

    await mongoose.disconnect()
    console.log('\nDone!')

  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  }
}

importSCMMastersheet()
