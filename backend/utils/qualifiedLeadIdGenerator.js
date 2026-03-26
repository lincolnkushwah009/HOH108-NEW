import mongoose from 'mongoose'

/**
 * Qualified Lead ID Generator
 *
 * ID Format: CITY-MOTHERCOMPANY-ENTITY-SERIES
 * Example: HYD-HG-IP-00001
 *
 * City Codes:
 *   - HYD = Hyderabad
 *   - BLR = Bengaluru
 *   - MYS = Mysuru
 *
 * Mother Company: HG (Hancet Globe - default)
 *
 * Entity Codes (for Revenue):
 *   - IP = Interior Plus
 *   - EP = Education Plus
 *   - XP = Exterior Plus
 *   - RP = Renovation Plus
 *   - OP = ODS Plus
 *
 * Series: 00001, 00002, etc. (5 digits, reset per city-entity combination)
 */

// City code mapping
const CITY_CODES = {
  'Hyderabad': 'HYD',
  'hyderabad': 'HYD',
  'Bengaluru': 'BLR',
  'Bangalore': 'BLR',
  'bengaluru': 'BLR',
  'bangalore': 'BLR',
  'Mysuru': 'MYS',
  'Mysore': 'MYS',
  'mysuru': 'MYS',
  'mysore': 'MYS'
}

// Mother company code (default)
const MOTHER_COMPANY_CODE = 'HG'

// Entity codes for revenue
const ENTITY_CODES = {
  'IP': 'IP',  // Interior Plus
  'EP': 'EP',  // Education Plus
  'XP': 'XP',  // Exterior Plus
  'RP': 'RP',  // Renovation Plus
  'OP': 'OP',  // ODS Plus
  'HOH': 'IP'  // HOH108 maps to IP
}

// Execution/Production codes for Project IDs
const EXECUTION_CODES = {
  'factory': 'HIP',      // Factory for Interiors (in-house production)
  'inhouse': 'HIP',
  'HIP': 'HIP',
  'vendor': 'GIK',       // Outsourced to Vendors
  'outsourced': 'GIK',
  'GIK': 'GIK'
}

/**
 * Get or create the ID Sequence collection for tracking sequences
 * Note: Uses 'IDSequence' model (not 'IDMapping' which is used by entity relationships)
 */
const getIDSequenceModel = () => {
  if (mongoose.models.IDSequence) {
    return mongoose.models.IDSequence
  }

  const idSequenceSchema = new mongoose.Schema({
    prefix: {
      type: String,
      required: true,
      index: true
    },
    currentSequence: {
      type: Number,
      default: 0
    },
    idType: {
      type: String,
      enum: ['qualified_lead', 'project', 'work_order'],
      required: true
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company'
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now
    }
  }, {
    timestamps: true,
    collection: 'idsequences'
  })

  idSequenceSchema.index({ prefix: 1, idType: 1 }, { unique: true })

  return mongoose.model('IDSequence', idSequenceSchema)
}

/**
 * Generate Qualified Lead ID
 * Format: CITY-HG-ENTITY-SERIES
 *
 * @param {Object} params
 * @param {String} params.city - City name (Hyderabad, Bengaluru, Mysuru)
 * @param {String} params.entityCode - Company/Entity code (IP, EP, CP, etc.)
 * @param {ObjectId} params.companyId - Company ObjectId
 * @returns {String} Generated ID (e.g., HYD-HG-IP-00001)
 */
export const generateQualifiedLeadId = async ({ city, entityCode, companyId }) => {
  const IDMapping = getIDSequenceModel()

  // Get city code
  const cityCode = CITY_CODES[city] || 'OTH'

  // Get entity code
  const entity = ENTITY_CODES[entityCode] || entityCode || 'IP'

  // Build prefix: CITY-HG-ENTITY
  const prefix = `${cityCode}-${MOTHER_COMPANY_CODE}-${entity}`

  // Find and increment sequence atomically
  const result = await IDMapping.findOneAndUpdate(
    {
      prefix,
      idType: 'qualified_lead'
    },
    {
      $inc: { currentSequence: 1 },
      $set: {
        lastUpdatedAt: new Date(),
        company: companyId
      }
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  )

  // Format sequence with leading zeros (5 digits)
  const sequence = String(result.currentSequence).padStart(5, '0')

  // Return full ID
  return `${prefix}-${sequence}`
}

/**
 * Generate Project ID with Execution Suffix
 * Format: CITY-HG-ENTITY-SERIES-EXECUTION
 *
 * @param {Object} params
 * @param {String} params.qualifiedLeadId - The qualified lead ID (e.g., HYD-HG-IP-00001)
 * @param {String} params.executionType - 'factory'/'inhouse' for HIP, 'vendor'/'outsourced' for GIK
 * @returns {String} Project ID (e.g., HYD-HG-IP-00001-HIP)
 */
export const generateProjectId = async ({ qualifiedLeadId, executionType }) => {
  if (!qualifiedLeadId) {
    throw new Error('Qualified Lead ID is required to generate Project ID')
  }

  // Get execution code
  const executionCode = EXECUTION_CODES[executionType] || EXECUTION_CODES[executionType?.toLowerCase()] || 'HIP'

  // Return project ID with execution suffix
  return `${qualifiedLeadId}-${executionCode}`
}

/**
 * Generate Work Order ID
 * Format: PROJECTID-WO-SERIES
 *
 * @param {Object} params
 * @param {String} params.projectId - The project ID
 * @param {ObjectId} params.companyId - Company ObjectId
 * @returns {String} Work Order ID
 */
export const generateWorkOrderId = async ({ projectId, companyId }) => {
  const IDMapping = getIDSequenceModel()

  // Build prefix for work order sequence
  const prefix = `${projectId}-WO`

  // Find and increment sequence atomically
  const result = await IDMapping.findOneAndUpdate(
    {
      prefix,
      idType: 'work_order'
    },
    {
      $inc: { currentSequence: 1 },
      $set: {
        lastUpdatedAt: new Date(),
        company: companyId
      }
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  )

  // Format sequence (3 digits for work orders)
  const sequence = String(result.currentSequence).padStart(3, '0')

  return `${prefix}-${sequence}`
}

/**
 * Parse a qualified lead ID to extract components
 *
 * @param {String} qualifiedLeadId - e.g., HYD-HG-IP-00001
 * @returns {Object} { city, motherCompany, entity, sequence }
 */
export const parseQualifiedLeadId = (qualifiedLeadId) => {
  if (!qualifiedLeadId) return null

  const parts = qualifiedLeadId.split('-')
  if (parts.length < 4) return null

  return {
    cityCode: parts[0],
    motherCompany: parts[1],
    entityCode: parts[2],
    sequence: parts[3],
    executionCode: parts[4] || null // For project IDs
  }
}

/**
 * Validate if a string is a valid qualified lead ID format
 *
 * @param {String} id - ID to validate
 * @returns {Boolean}
 */
export const isValidQualifiedLeadId = (id) => {
  if (!id || typeof id !== 'string') return false

  // Pattern: XXX-XX-XX-XXXXX (city-mother-entity-sequence)
  const pattern = /^[A-Z]{2,3}-[A-Z]{2}-[A-Z]{2}-\d{5}$/
  return pattern.test(id)
}

/**
 * Validate if a string is a valid project ID format
 *
 * @param {String} id - ID to validate
 * @returns {Boolean}
 */
export const isValidProjectId = (id) => {
  if (!id || typeof id !== 'string') return false

  // Pattern: XXX-XX-XX-XXXXX-XXX (city-mother-entity-sequence-execution)
  const pattern = /^[A-Z]{2,3}-[A-Z]{2}-[A-Z]{2}-\d{5}-(HIP|GIK)$/
  return pattern.test(id)
}

export default {
  generateQualifiedLeadId,
  generateProjectId,
  generateWorkOrderId,
  parseQualifiedLeadId,
  isValidQualifiedLeadId,
  isValidProjectId,
  CITY_CODES,
  ENTITY_CODES,
  EXECUTION_CODES,
  MOTHER_COMPANY_CODE
}
