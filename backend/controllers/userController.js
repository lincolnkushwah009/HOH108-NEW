import User from '../models/User.js'
import KarmaTransaction from '../models/KarmaTransaction.js'
import Company from '../models/Company.js'

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query

    const query = {}

    if (role) query.role = role

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ]
    }

    const total = await User.countDocuments(query)
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Get karma transactions
    const karmaHistory = await KarmaTransaction.find({ user: req.params.id })
      .sort({ createdAt: -1 })
      .limit(10)

    res.json({
      success: true,
      data: {
        user,
        karmaHistory
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// @desc    Create user (admin)
// @route   POST /api/users
// @access  Private/SuperAdmin
export const createUser = async (req, res) => {
  try {
    const { name, email, phone, password, role, company, department } = req.body

    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      })
    }

    // Get company - use provided company or default to first company
    let companyId = company
    if (!companyId) {
      const defaultCompany = await Company.findOne({ isActive: true })
      if (defaultCompany) {
        companyId = defaultCompany._id
      }
    }

    // Map legacy role names to new role names
    const roleMap = {
      'user': 'viewer',
      'admin': 'company_admin',
      'superadmin': 'super_admin'
    }
    const mappedRole = roleMap[role] || role || 'viewer'

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: mappedRole,
      company: companyId,
      department: department || 'sales'
    })

    res.status(201).json({
      success: true,
      data: user
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
  try {
    const { name, email, phone, role, isActive, department } = req.body

    // Map legacy role names to new role names
    const roleMap = {
      'user': 'viewer',
      'admin': 'company_admin',
      'superadmin': 'super_admin'
    }
    const mappedRole = role ? (roleMap[role] || role) : undefined

    const updateData = { name, email, phone, isActive, department }
    if (mappedRole) updateData.role = mappedRole

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.json({
      success: true,
      data: user
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/SuperAdmin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Prevent deleting superadmin
    if (['superadmin', 'super_admin'].includes(user.role)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete super admin'
      })
    }

    await User.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// @desc    Add karma points to user
// @route   POST /api/users/:id/karma
// @access  Private/Admin
export const addKarmaPoints = async (req, res) => {
  try {
    const { points, type = 'bonus', source = 'admin-bonus', description } = req.body

    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    user.karmaPoints += points
    await user.save()

    // Create transaction record
    await KarmaTransaction.create({
      user: user._id,
      type,
      points,
      source,
      description: description || `${points} karma points added by admin`,
      balanceAfter: user.karmaPoints,
      processedBy: req.user.id
    })

    res.json({
      success: true,
      data: user,
      message: `${points} karma points added successfully`
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}
