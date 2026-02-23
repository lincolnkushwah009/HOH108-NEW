import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import Company from '../../models/Company.js'
import User from '../../models/User.js'
import { generateCompany, generateUser } from './mock-data.js'

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-testing'

/**
 * Generate a JWT token for a user
 */
export const generateToken = (userId, expiresIn = '1d') => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn })
}

/**
 * Hash a password
 */
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

/**
 * Create a test company and admin user
 * Returns { company, user, token }
 */
export const createTestCompanyAndUser = async (companyOverrides = {}, userOverrides = {}) => {
  // Create company
  const companyData = generateCompany(companyOverrides)
  const company = await Company.create(companyData)

  // Create user with hashed password
  const hashedPassword = await hashPassword('Test@123456')
  const userData = generateUser(company._id, {
    password: hashedPassword,
    ...userOverrides
  })

  const user = await User.create(userData)

  // Generate token
  const token = generateToken(user._id)

  return { company, user, token }
}

/**
 * Create multiple test users for a company
 */
export const createTestUsers = async (companyId, count = 5, overrides = {}) => {
  const users = []
  const hashedPassword = await hashPassword('Test@123456')

  for (let i = 0; i < count; i++) {
    const userData = generateUser(companyId, {
      password: hashedPassword,
      role: i === 0 ? 'admin' : 'user',
      ...overrides
    })
    const user = await User.create(userData)
    users.push(user)
  }

  return users
}

/**
 * Create a user with specific role
 */
export const createUserWithRole = async (companyId, role, permissions = [], overrides = {}) => {
  const hashedPassword = await hashPassword('Test@123456')
  const userData = generateUser(companyId, {
    password: hashedPassword,
    role,
    permissions,
    ...overrides
  })

  const user = await User.create(userData)
  const token = generateToken(user._id)

  return { user, token }
}

/**
 * Create test context with company, users, and tokens for different roles
 */
export const createTestContext = async (companyOverrides = {}) => {
  // Create company
  const companyData = generateCompany(companyOverrides)
  const company = await Company.create(companyData)

  const hashedPassword = await hashPassword('Test@123456')

  // Create admin user
  const adminData = generateUser(company._id, {
    password: hashedPassword,
    role: 'admin',
    email: 'admin@test.com'
  })
  const admin = await User.create(adminData)
  const adminToken = generateToken(admin._id)

  // Create manager user
  const managerData = generateUser(company._id, {
    password: hashedPassword,
    role: 'manager',
    email: 'manager@test.com'
  })
  const manager = await User.create(managerData)
  const managerToken = generateToken(manager._id)

  // Create regular user
  const regularUserData = generateUser(company._id, {
    password: hashedPassword,
    role: 'user',
    email: 'user@test.com'
  })
  const regularUser = await User.create(regularUserData)
  const userToken = generateToken(regularUser._id)

  return {
    company,
    admin: { user: admin, token: adminToken },
    manager: { user: manager, token: managerToken },
    user: { user: regularUser, token: userToken }
  }
}

/**
 * Verify a JWT token
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

/**
 * Create an expired token for testing
 */
export const createExpiredToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '-1s' })
}

/**
 * Create an invalid token
 */
export const createInvalidToken = () => {
  return 'invalid.token.string'
}

export default {
  generateToken,
  hashPassword,
  createTestCompanyAndUser,
  createTestUsers,
  createUserWithRole,
  createTestContext,
  verifyToken,
  createExpiredToken,
  createInvalidToken
}
