import User from '../models/User.js'
import RoundRobinState from '../models/RoundRobinState.js'

const ONE_HOUR = 60 * 60 * 1000

// City-to-branch mapping for location-based matching
const CITY_BRANCH_MAP = {
  'Bengaluru': ['HSR', 'Horamavu', 'Whitefield', 'Koramangala', 'Jayanagar', 'Bengaluru'],
  'Mysuru': ['Mysore', 'Mysuru'],
  'Hyderabad': ['Hyderabad', 'Secunderabad'],
}

// Region-to-city mapping
const REGION_CITY_MAP = {
  'Karnataka': ['Bengaluru', 'Mysuru'],
  'Telangana': ['Hyderabad'],
}

/**
 * Build user query for finding eligible employees in a city + department.
 * Uses multiple fallback strategies:
 * 1. hrDetails.city (exact match)
 * 2. branch (mapped from city)
 * 3. region (mapped from city)
 * 4. subDepartment OR role-based matching
 */
function buildUserQuery(companyId, city, department, showroom = null) {
  const branches = CITY_BRANCH_MAP[city] || [city]

  // Department to role mapping for fallback
  const deptRoleMap = {
    'pre_sales': { subDepartments: ['pre_sales'], roles: ['pre_sales'] },
    'sales_closure': { subDepartments: ['sales_closure', 'sales'], roles: ['sales_manager', 'sales_executive'] },
    'crm': { subDepartments: ['crm'], roles: ['sales_executive', 'community_manager', 'assoc_community_manager'] },
    'design': { subDepartments: ['design'], roles: ['designer', 'architect', 'drm', 'assoc_drm'] },
    'operations': { subDepartments: ['operations'], roles: ['project_manager', 'site_engineer', 'operations', 'quality_controller'] },
  }

  const deptConfig = deptRoleMap[department] || { subDepartments: [department], roles: [] }

  // Find employees matching city (via multiple fields) AND department
  const query = {
    company: companyId,
    isActive: true,
    $or: [
      { 'hrDetails.city': city },
      { 'hrDetails.city': { $regex: new RegExp(city, 'i') } },
      { branch: { $in: branches } },
      { branch: { $regex: new RegExp(city, 'i') } },
    ],
    $and: [{
      $or: [
        { subDepartment: { $in: deptConfig.subDepartments } },
        { role: { $in: deptConfig.roles } },
      ]
    }]
  }

  if (showroom) {
    query['hrDetails.showroom'] = showroom
  }

  return query
}

/**
 * Get or create the round-robin state for a city + department.
 * Rebuilds the roster from active users if stale (> 1 hour) or empty.
 * Enhanced: uses multiple location fields for matching.
 */
async function getOrCreateState(companyId, city, department, showroom = null) {
  const stateQuery = { company: companyId, city, department, showroom: showroom || null }
  let state = await RoundRobinState.findOne(stateQuery)

  const isStale = !state ||
    !state.rosterUpdatedAt ||
    (Date.now() - state.rosterUpdatedAt.getTime() > ONE_HOUR) ||
    state.roster.length === 0

  if (isStale) {
    // Build roster with enhanced location matching
    const userQuery = buildUserQuery(companyId, city, department, showroom)
    const users = await User.find(userQuery).select('_id name leadCapacity').sort({ _id: 1 })

    // Fallback: if no users found for specific city, try all employees in the department (company-wide)
    let roster = users.map(u => u._id)

    if (roster.length === 0) {
      const deptRoleMap = {
        'pre_sales': { subDepartments: ['pre_sales'], roles: ['pre_sales'] },
        'sales_closure': { subDepartments: ['sales_closure', 'sales'], roles: ['sales_manager', 'sales_executive'] },
        'crm': { subDepartments: ['crm'], roles: ['sales_executive', 'community_manager'] },
        'design': { subDepartments: ['design'], roles: ['designer', 'architect'] },
        'operations': { subDepartments: ['operations'], roles: ['project_manager', 'operations'] },
      }
      const deptConfig = deptRoleMap[department] || { subDepartments: [department], roles: [] }

      const fallbackUsers = await User.find({
        company: companyId,
        isActive: true,
        $or: [
          { subDepartment: { $in: deptConfig.subDepartments } },
          { role: { $in: deptConfig.roles } },
        ]
      }).select('_id name leadCapacity').sort({ _id: 1 })

      roster = fallbackUsers.map(u => u._id)
    }

    if (!state) {
      state = await RoundRobinState.create({
        company: companyId,
        city,
        department,
        showroom: showroom || null,
        roster,
        lastAssignedIndex: -1,
        rosterUpdatedAt: new Date()
      })
    } else {
      state.roster = roster
      state.rosterUpdatedAt = new Date()
      if (state.lastAssignedIndex >= roster.length) {
        state.lastAssignedIndex = -1
      }
      await state.save()
    }
  }

  return state
}

/**
 * Get the next user via round-robin for a given city + department.
 * Skips users who are at max capacity.
 * Returns { userId, userName } or null if no one is available.
 */
export async function getNextAssignee(companyId, city, department, showroom = null) {
  const state = await getOrCreateState(companyId, city, department, showroom)

  if (!state || state.roster.length === 0) {
    return null
  }

  const rosterLength = state.roster.length
  let attempts = 0
  let nextIndex = state.lastAssignedIndex

  while (attempts < rosterLength) {
    nextIndex = (nextIndex + 1) % rosterLength
    attempts++

    const userId = state.roster[nextIndex]
    const user = await User.findById(userId).select('name leadCapacity isActive')

    if (!user || !user.isActive) continue

    // Check capacity
    if (user.leadCapacity.currentActive >= user.leadCapacity.maxActive) continue

    // Found a valid user -- atomically update the pointer
    await RoundRobinState.findByIdAndUpdate(state._id, {
      $set: { lastAssignedIndex: nextIndex, updatedAt: new Date() }
    })

    // Increment the user's currentActive count
    await User.findByIdAndUpdate(userId, {
      $inc: { 'leadCapacity.currentActive': 1 }
    })

    return { userId: user._id, userName: user.name }
  }

  return null // All users at capacity
}

/**
 * Auto-assign for sales transfer (when lead is qualified and transferred to sales)
 * Uses round-robin on 'sales_closure' department for the lead's city.
 */
export async function autoAssignSales(companyId, city, showroom = null) {
  return getNextAssignee(companyId, city, 'sales_closure', showroom)
}

/**
 * Auto-assign CRM coordinator for a lead.
 */
export async function autoAssignCRM(companyId, city) {
  return getNextAssignee(companyId, city, 'crm')
}

/**
 * Auto-assign designer for a project.
 */
export async function autoAssignDesigner(companyId, city) {
  return getNextAssignee(companyId, city, 'design')
}

/**
 * Auto-assign project manager / operations lead.
 */
export async function autoAssignProjectManager(companyId, city) {
  return getNextAssignee(companyId, city, 'operations')
}

/**
 * Force rebuild of the roster for a city + department.
 * Call when admins add/remove team members.
 */
export async function rebuildRoster(companyId, city, department) {
  await RoundRobinState.deleteOne({ company: companyId, city, department })
  return getOrCreateState(companyId, city, department)
}

/**
 * Get round-robin stats for admin dashboard.
 */
export async function getRoundRobinStats(companyId) {
  const states = await RoundRobinState.find({ company: companyId })
    .populate('roster', 'name leadCapacity isActive')

  return states.map(s => ({
    city: s.city,
    department: s.department,
    showroom: s.showroom,
    rosterSize: s.roster.length,
    lastAssignedIndex: s.lastAssignedIndex,
    rosterUpdatedAt: s.rosterUpdatedAt,
    employees: s.roster.map(u => ({
      name: u.name,
      active: u.isActive,
      currentLeads: u.leadCapacity?.currentActive || 0,
      maxLeads: u.leadCapacity?.maxActive || 50,
      atCapacity: (u.leadCapacity?.currentActive || 0) >= (u.leadCapacity?.maxActive || 50)
    }))
  }))
}
