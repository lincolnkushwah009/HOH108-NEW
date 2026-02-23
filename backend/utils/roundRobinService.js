import User from '../models/User.js'
import RoundRobinState from '../models/RoundRobinState.js'

const ONE_HOUR = 60 * 60 * 1000

/**
 * Get or create the round-robin state for a city + department.
 * Rebuilds the roster from active users if stale (> 1 hour) or empty.
 */
async function getOrCreateState(companyId, city, department, showroom = null) {
  const query = { company: companyId, city, department, showroom: showroom || null }
  let state = await RoundRobinState.findOne(query)

  const isStale = !state ||
    !state.rosterUpdatedAt ||
    (Date.now() - state.rosterUpdatedAt.getTime() > ONE_HOUR) ||
    state.roster.length === 0

  if (isStale) {
    // Build roster: find all active users in this city + department + optional showroom
    const userQuery = {
      company: companyId,
      'hrDetails.city': city,
      subDepartment: department,
      isActive: true
    }
    if (showroom) {
      userQuery['hrDetails.showroom'] = showroom
    }
    const users = await User.find(userQuery).select('_id name leadCapacity').sort({ _id: 1 })

    const roster = users.map(u => u._id)

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
      // Keep lastAssignedIndex valid
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
 * Force rebuild of the roster for a city + department.
 * Call when admins add/remove team members.
 */
export async function rebuildRoster(companyId, city, department) {
  await RoundRobinState.deleteOne({ company: companyId, city, department })
  return getOrCreateState(companyId, city, department)
}
