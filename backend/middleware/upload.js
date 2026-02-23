import multer from 'multer'
import path from 'path'
import fs from 'fs'

// Ensure upload directories exist
const reimbursementDir = 'uploads/reimbursements'
const vendorDir = 'uploads/vendors'
const ticketDir = 'uploads/tickets'

if (!fs.existsSync(reimbursementDir)) {
  fs.mkdirSync(reimbursementDir, { recursive: true })
}
if (!fs.existsSync(vendorDir)) {
  fs.mkdirSync(vendorDir, { recursive: true })
}
if (!fs.existsSync(ticketDir)) {
  fs.mkdirSync(ticketDir, { recursive: true })
}

// Configure storage for reimbursements
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, reimbursementDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/pdf',
    'image/webp'
  ]

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP and PDF files are allowed.'), false)
  }
}

// Create multer upload instance for reimbursements
export const uploadReceipts = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 5 // Max 5 files
  }
})

// Configure storage for vendor documents
const vendorStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, vendorDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'vendor-' + uniqueSuffix + path.extname(file.originalname))
  }
})

// Create multer upload instance for vendor documents
export const uploadVendorDocs = multer({
  storage: vendorStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 10 // Max 10 files
  }
})

// Configure storage for ticket attachments
const ticketStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, ticketDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'ticket-' + uniqueSuffix + path.extname(file.originalname))
  }
})

// Extended file filter for tickets (allows more document types)
const ticketFileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ]

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Allowed: images, PDF, Word, Excel, TXT, CSV'), false)
  }
}

// Create multer upload instance for ticket attachments
export const uploadTicketDocs = multer({
  storage: ticketStorage,
  fileFilter: ticketFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 5 // Max 5 files per upload
  }
})

// Configure storage for floor plans
const floorPlanDir = 'uploads/floor-plans'
if (!fs.existsSync(floorPlanDir)) {
  fs.mkdirSync(floorPlanDir, { recursive: true })
}

const floorPlanStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, floorPlanDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'floorplan-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const floorPlanFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/tiff',
    'application/pdf'
  ]

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only images and PDF are allowed for floor plans.'), false)
  }
}

export const uploadFloorPlan = multer({
  storage: floorPlanStorage,
  fileFilter: floorPlanFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max
    files: 1
  }
})

// Configure storage for design files
const designDir = 'uploads/designs'
if (!fs.existsSync(designDir)) {
  fs.mkdirSync(designDir, { recursive: true })
}

const designStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, designDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'design-' + uniqueSuffix + path.extname(file.originalname))
  }
})

export const uploadDesignFiles = multer({
  storage: designStorage,
  fileFilter: floorPlanFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max
    files: 10
  }
})

export default uploadReceipts
