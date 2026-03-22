// API Configuration
const API_BASE_URL = import.meta.env.PROD
  ? 'https://hoh108.com/api'
  : `http://${window.location.hostname}:5001/api`

// Generic API request handler
export async function apiRequest(endpoint, options = {}) {
  // Don't send token for login/register endpoints
  const isAuthEndpoint = endpoint.includes('/auth/login') || endpoint.includes('/auth/admin/login') || endpoint.includes('/auth/register')
  const suppressRedirect = options._suppressRedirect

  const token = isAuthEndpoint ? null : localStorage.getItem('hoh108_admin_token')
  const companyId = localStorage.getItem('hoh108_active_company')

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(companyId && { 'X-Company-Id': companyId }),
    ...options.headers,
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  // Parse response body first
  const data = await response.json()

  if (response.status === 401) {
    // For login endpoints, just throw the error message from server
    if (isAuthEndpoint) {
      throw new Error(data.message || 'Invalid credentials')
    }
    // For other endpoints, it's a session expiry
    // suppressRedirect prevents redirect during batch API calls (e.g. Promise.allSettled)
    if (!suppressRedirect && !window.location.pathname.includes('/admin/login')) {
      localStorage.removeItem('hoh108_admin_token')
      window.location.href = '/admin/login'
    }
    throw new Error('Session expired')
  }

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong')
  }

  return data
}

// Auth API
export const authAPI = {
  login: (email, password) =>
    apiRequest('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getMe: () => apiRequest('/auth/me'),
  updatePassword: (data) =>
    apiRequest('/auth/update-password', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updatePhone: (data) =>
    apiRequest('/auth/phone', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
}

// Dashboard API
export const dashboardAPI = {
  getStats: (year) => apiRequest(`/dashboard/stats${year ? `?year=${year}` : ''}`),
  getSuperAdminStats: () => apiRequest('/admin/dashboard/super'),
  getActivity: () => apiRequest('/dashboard/activity'),
}

// Leads API
export const leadsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/leads${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/leads/${id}`),
  getJourney: (id) => apiRequest(`/leads/${id}/journey`),
  create: (data) =>
    apiRequest('/leads/admin', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updateStatus: (id, status) =>
    apiRequest(`/leads/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  assign: (id, userId) =>
    apiRequest(`/leads/${id}/assign`, {
      method: 'PUT',
      body: JSON.stringify({ userId }),
    }),
  delete: (id) =>
    apiRequest(`/leads/${id}`, { method: 'DELETE' }),
  addNote: (id, note) =>
    apiRequest(`/leads/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content: note }),
    }),
  convert: (id) =>
    apiRequest(`/leads/${id}/convert`, { method: 'POST' }),
  bulkUpload: (data) =>
    apiRequest('/leads/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  // Floor plan upload (FormData with progress tracking via XHR)
  uploadFloorPlan: (id, file, onProgress) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      formData.append('floorPlan', file)
      const token = localStorage.getItem('hoh108_admin_token')
      const companyId = localStorage.getItem('hoh108_active_company')
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${API_BASE_URL}/leads/${id}/floor-plan`)
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      if (companyId) xhr.setRequestHeader('X-Company-Id', companyId)
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      }
      xhr.onload = () => {
        if (xhr.status === 0) {
          return reject(new Error('Upload blocked by browser — please try again'))
        }
        try {
          const data = JSON.parse(xhr.responseText)
          if (xhr.status >= 200 && xhr.status < 300) resolve(data)
          else reject(new Error(data.message || `Upload failed (${xhr.status})`))
        } catch {
          reject(new Error(`Upload failed (${xhr.status}) — server returned unexpected response`))
        }
      }
      xhr.onerror = () => reject(new Error('Network error — check your connection and try again'))
      xhr.ontimeout = () => reject(new Error('Upload timed out — file may be too large'))
      xhr.send(formData)
    })
  },
  // Revised budget (role-restricted)
  updateRevisedBudget: (id, data) =>
    apiRequest(`/leads/${id}/revised-budget`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  // Requirement meeting
  setRequirementMeeting: (id, data) =>
    apiRequest(`/leads/${id}/requirement-meeting`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateRequirementMeetingStatus: (id, status) =>
    apiRequest(`/leads/${id}/requirement-meeting/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  // Assign designer (Design Head only)
  assignDesigner: (id, designerId) =>
    apiRequest(`/leads/${id}/assign-designer`, {
      method: 'POST',
      body: JSON.stringify({ designerId }),
    }),
  // Transfer to sales
  transferToSales: (id) =>
    apiRequest(`/leads/${id}/transfer-to-sales`, {
      method: 'POST',
    }),
}

// CP Data Management API
export const cpDataAPI = {
  getTree: () => apiRequest('/cp-data/tree'),
  getStats: () => apiRequest('/cp-data/stats'),
  getBatch: (id) => apiRequest(`/cp-data/${id}`),
  updatePayment: (id, data) => apiRequest(`/cp-data/${id}/payment`, { method: 'PUT', body: JSON.stringify(data) }),
  recalculate: (id) => apiRequest(`/cp-data/${id}/recalculate`, { method: 'POST' }),
}

// Customers API
export const customersAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/customers${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/customers/${id}`),
  create: (data) =>
    apiRequest('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    apiRequest(`/customers/${id}`, { method: 'DELETE' }),
  addNote: (id, note) =>
    apiRequest(`/customers/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    }),
  getProjects: (customerId) =>
    apiRequest(`/customers/${customerId}/projects`),
  assignProject: (customerId, projectId) =>
    apiRequest(`/customers/${customerId}/projects`, {
      method: 'POST',
      body: JSON.stringify({ projectId }),
    }),
  enablePortalAccess: (id, data) =>
    apiRequest(`/customers/${id}/portal-access`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  resetPortalPassword: (id, password) =>
    apiRequest(`/customers/${id}/reset-portal-password`, {
      method: 'PUT',
      body: JSON.stringify({ password }),
    }),
}

// Projects API
export const projectsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/projects${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/projects/${id}`),
  create: (data) =>
    apiRequest('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    apiRequest(`/projects/${id}`, { method: 'DELETE' }),
  toggleFeatured: (id) =>
    apiRequest(`/projects/${id}/featured`, { method: 'PUT' }),
  getKanbanDetail: (id) => apiRequest(`/projects/${id}/kanban-detail`),
  getSiteMedia: (id) => apiRequest(`/projects/${id}/site-media`),
  uploadSiteMedia: (id, formData) => {
    const token = localStorage.getItem('hoh108_admin_token')
    const companyId = localStorage.getItem('hoh108_active_company')
    return fetch(`${API_BASE_URL}/projects/${id}/site-media`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Company-Id': companyId,
      },
      body: formData,
    }).then(r => r.json())
  },
  deleteSiteMedia: (projectId, mediaId) =>
    apiRequest(`/projects/${projectId}/site-media/${mediaId}`, { method: 'DELETE' }),
}

// Project Wallet API
export const projectWalletAPI = {
  getWallet: (projectId) => apiRequest(`/project-wallet/${projectId}`),
  recordVendorPayment: (projectId, data) =>
    apiRequest(`/project-wallet/${projectId}/vendor-payment`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getEmployeeCosts: (projectId) => apiRequest(`/project-wallet/${projectId}/employee-costs`),
}

// Project P&L API
export const projectPnLAPI = {
  getProjectPnL: (projectId) => apiRequest(`/project-wallet/${projectId}/pnl`),
  getDashboard: () => apiRequest('/project-wallet/dashboard/pnl'),
}

// Users API
export const usersAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/users${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/users/${id}`),
  create: (data) =>
    apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    apiRequest(`/users/${id}`, { method: 'DELETE' }),
}

// Employees API
export const employeesAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/employees${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/employees/${id}`),
  create: (data) =>
    apiRequest('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    apiRequest(`/employees/${id}`, { method: 'DELETE' }),
  bulkUpload: (employees) =>
    apiRequest('/employees/bulk-upload', {
      method: 'POST',
      body: JSON.stringify({ employees }),
    }),
  changePassword: (id, newPassword) =>
    apiRequest(`/employees/${id}/change-password`, {
      method: 'PUT',
      body: JSON.stringify({ newPassword }),
    }),
  // Document Management
  uploadDocument: async (id, formData) => {
    const token = localStorage.getItem('hoh108_admin_token')
    const companyId = localStorage.getItem('hoh108_active_company')
    const response = await fetch(`${API_BASE_URL}/employees/${id}/documents`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(companyId && { 'X-Company-Id': companyId }),
      },
      body: formData,
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Upload failed')
    return data
  },
  getDocuments: (id) => apiRequest(`/employees/${id}/documents`),
  deleteDocument: (id, documentId) =>
    apiRequest(`/employees/${id}/documents/${documentId}`, { method: 'DELETE' }),
  verifyDocument: (id, documentId) =>
    apiRequest(`/employees/${id}/documents/${documentId}/verify`, { method: 'PUT' }),
  getT2Checklist: (id) => apiRequest(`/employees/${id}/documents/t2-checklist`),
  // Probation Management
  getDueForConfirmation: () => apiRequest('/employees/probation/due-for-confirmation'),
  confirmEmployee: (id, data) =>
    apiRequest(`/employees/${id}/confirm`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  extendProbation: (id, data) =>
    apiRequest(`/employees/${id}/extend-probation`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  // HR Details
  updateHRDetails: (id, data) =>
    apiRequest(`/employees/${id}/hr-details`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getByLocation: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/employees/by-location${query ? `?${query}` : ''}`)
  },
}

// Salary API
export const salaryAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/salary${query ? `?${query}` : ''}`)
  },
  getOne: (employeeId) => apiRequest(`/salary/${employeeId}`),
  update: (employeeId, data) =>
    apiRequest(`/salary/${employeeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getSlip: (employeeId, params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/salary/${employeeId}/slip${query ? `?${query}` : ''}`)
  },
  getHistory: (employeeId) => apiRequest(`/salary/${employeeId}/history`),
}

// Project Workflow API
export const projectWorkflowAPI = {
  // Templates
  getPhases: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/project-workflow/phases${query ? `?${query}` : ''}`)
  },
  getFullTemplate: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/project-workflow/template${query ? `?${query}` : ''}`)
  },
  seedTemplates: () =>
    apiRequest('/project-workflow/seed', { method: 'POST' }),

  // Project Tasks
  initializeProject: (projectId, data = {}) =>
    apiRequest(`/project-workflow/projects/${projectId}/initialize`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getProjectTasks: (projectId, params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/project-workflow/projects/${projectId}/tasks${query ? `?${query}` : ''}`)
  },
  getProjectCompletion: (projectId) =>
    apiRequest(`/project-workflow/projects/${projectId}/completion`),
  getGanttData: (projectId) =>
    apiRequest(`/project-workflow/projects/${projectId}/gantt`),
  getProjectBudget: (projectId) =>
    apiRequest(`/project-workflow/projects/${projectId}/budget`),
  getProjectDashboard: (projectId) =>
    apiRequest(`/project-workflow/projects/${projectId}/dashboard`),

  // Task Instance Operations
  updateTaskProgress: (taskId, data) =>
    apiRequest(`/project-workflow/task-instances/${taskId}/progress`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  assignTaskOwner: (taskId, data) =>
    apiRequest(`/project-workflow/task-instances/${taskId}/assign`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  removeTaskOwner: (taskId, ownerType, ownerId) =>
    apiRequest(`/project-workflow/task-instances/${taskId}/owners/${ownerType}/${ownerId}`, {
      method: 'DELETE',
    }),

  // Payment Milestones
  getPaymentMilestones: (projectId) =>
    apiRequest(`/project-workflow/projects/${projectId}/payment-milestones`),
  createDefaultMilestones: (projectId) =>
    apiRequest(`/project-workflow/projects/${projectId}/payment-milestones/default`, {
      method: 'POST',
    }),
  addPayment: (milestoneId, data) =>
    apiRequest(`/project-workflow/payment-milestones/${milestoneId}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// Departments API
export const departmentsAPI = {
  getAll: () => apiRequest('/departments'),
  getOne: (id) => apiRequest(`/departments/${id}`),
  create: (data) =>
    apiRequest('/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    apiRequest(`/departments/${id}`, { method: 'DELETE' }),
}

// Attendance API
export const attendanceAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/attendance${query ? `?${query}` : ''}`)
  },
  create: (data) =>
    apiRequest('/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
}

// Leaves API
export const leavesAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/leaves${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/leaves/${id}`),
  create: (data) =>
    apiRequest('/leaves', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateStatus: (id, status, comment) => {
    // Route to the correct endpoint based on status
    if (status === 'approved') {
      return apiRequest(`/leaves/${id}/approve`, {
        method: 'PUT',
        body: JSON.stringify({ comment }),
      })
    } else if (status === 'rejected') {
      return apiRequest(`/leaves/${id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason: comment }),
      })
    }
    throw new Error('Invalid status')
  },
  approve: (id, comment) =>
    apiRequest(`/leaves/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ comment }),
    }),
  reject: (id, reason) =>
    apiRequest(`/leaves/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),
  cancel: (id, reason) =>
    apiRequest(`/leaves/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),
  delete: (id) =>
    apiRequest(`/leaves/${id}`, { method: 'DELETE' }),
}

// Reimbursements API
export const reimbursementsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/reimbursements${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/reimbursements/${id}`),
  getMy: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/reimbursements/my${query ? `?${query}` : ''}`)
  },
  create: async (data, files = []) => {
    const token = localStorage.getItem('hoh108_admin_token')
    const companyId = localStorage.getItem('hoh108_active_company')

    const formData = new FormData()
    formData.append('category', data.category)
    formData.append('title', data.title)
    formData.append('description', data.description || '')
    formData.append('amount', data.amount)
    formData.append('expenseDate', data.expenseDate)
    if (data.project) formData.append('project', data.project)
    if (data.customer) formData.append('customer', data.customer)
    if (data.vendor) formData.append('vendor', JSON.stringify(data.vendor))
    if (data.notes) formData.append('notes', data.notes)

    // Append files
    files.forEach((file) => {
      formData.append('receipts', file)
    })

    const response = await fetch(`${API_BASE_URL}/reimbursements`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(companyId && { 'X-Company-Id': companyId }),
      },
      body: formData,
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.message || 'Something went wrong')
    }
    return result
  },
  update: (id, data) =>
    apiRequest(`/reimbursements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  approve: (id, data) =>
    apiRequest(`/reimbursements/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  reject: (id, reason) =>
    apiRequest(`/reimbursements/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),
  pay: (id, data) =>
    apiRequest(`/reimbursements/${id}/pay`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  cancel: (id, reason) =>
    apiRequest(`/reimbursements/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),
  delete: (id) =>
    apiRequest(`/reimbursements/${id}`, { method: 'DELETE' }),
  getAnalytics: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/reimbursements/analytics/summary${query ? `?${query}` : ''}`)
  },
}

// Companies API
export const companiesAPI = {
  getAll: () => apiRequest('/companies/list'),
  getOne: (id) => apiRequest(`/companies/${id}`),
  create: (data) =>
    apiRequest('/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    apiRequest(`/companies/${id}`, { method: 'DELETE' }),
}

// Mail Templates API
export const mailTemplatesAPI = {
  getAll: () => apiRequest('/mail-templates'),
  getOne: (id) => apiRequest(`/mail-templates/${id}`),
  create: (data) =>
    apiRequest('/mail-templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/mail-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    apiRequest(`/mail-templates/${id}`, { method: 'DELETE' }),
  toggle: (id) =>
    apiRequest(`/mail-templates/${id}/toggle`, { method: 'PUT' }),
}

// Game Entries API
export const gameEntriesAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/game-entries${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/game-entries/${id}`),
  updatePrize: (id, status) =>
    apiRequest(`/game-entries/${id}/prize`, {
      method: 'PUT',
      body: JSON.stringify({ prizeStatus: status }),
    }),
}

// Alerts API
export const alertsAPI = {
  getAll: () => apiRequest('/alerts'),
  acknowledge: (id) =>
    apiRequest(`/alerts/${id}/acknowledge`, { method: 'PUT' }),
  delete: (id) =>
    apiRequest(`/alerts/${id}`, { method: 'DELETE' }),
}

// Notifications API
export const notificationsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/notifications${query ? `?${query}` : ''}`)
  },
  markRead: (id) =>
    apiRequest(`/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: () =>
    apiRequest('/notifications/read-all', { method: 'POST' }),
}

// ==========================================
// CRM WORKFLOW APIs
// ==========================================

// Call Activities API
export const callActivitiesAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/call-activities${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/call-activities/${id}`),
  getLeadCalls: (leadId) => apiRequest(`/call-activities/lead/${leadId}`),
  create: (data) =>
    apiRequest('/call-activities', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  complete: (id, data) =>
    apiRequest(`/call-activities/${id}/complete`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  scheduleMeeting: (id, data) =>
    apiRequest(`/call-activities/${id}/schedule-meeting`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateMeetingStatus: (id, data) =>
    apiRequest(`/call-activities/${id}/meeting-status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  addRecording: (id, data) =>
    apiRequest(`/call-activities/${id}/recording`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMyStats: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/call-activities/stats/me${query ? `?${query}` : ''}`)
  },
  getUserStats: (userId, params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/call-activities/stats/user/${userId}${query ? `?${query}` : ''}`)
  },
  getScheduledToday: () => apiRequest('/call-activities/scheduled/today'),
}

// Lead Workflow API (extensions to existing leads)
export const leadWorkflowAPI = {
  assignDepartment: (id, data) =>
    apiRequest(`/leads/${id}/assign-department`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  qualify: (id, notes) =>
    apiRequest(`/leads/${id}/qualify`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    }),
  markAsRNR: (id, notes) =>
    apiRequest(`/leads/${id}/rnr`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    }),
  markAsFutureProspect: (id, data) =>
    apiRequest(`/leads/${id}/future-prospect`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  markAsLost: (id, reason) =>
    apiRequest(`/leads/${id}/lost`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),
  reactivate: (id, notes) =>
    apiRequest(`/leads/${id}/reactivate`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    }),
  updateSecondaryStatus: (id, secondaryStatus) =>
    apiRequest(`/leads/${id}/secondary-status`, {
      method: 'PUT',
      body: JSON.stringify({ secondaryStatus }),
    }),
  lockPreSales: (id) =>
    apiRequest(`/leads/${id}/lock-presales`, { method: 'PUT' }),
  getByDepartment: (department, params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/leads/department/${department}${query ? `?${query}` : ''}`)
  },
  getWorkflow: (id) => apiRequest(`/leads/${id}/workflow`),
  transferToSales: (id) =>
    apiRequest(`/leads/${id}/transfer-to-sales`, { method: 'POST' }),
  assignSalesExecutive: (id, executiveId, acmId) =>
    apiRequest(`/leads/${id}/assign-sales-executive`, {
      method: 'POST',
      body: JSON.stringify({ executiveId, ...(acmId ? { acmId } : {}) }),
    }),
  assignDesigner: (id, designerId) =>
    apiRequest(`/leads/${id}/assign-designer`, {
      method: 'POST',
      body: JSON.stringify({ designerId }),
    }),
  setDisposition: (id, data) =>
    apiRequest(`/leads/${id}/disposition`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getDispositionConfig: () => apiRequest('/leads/dispositions/config'),
  scheduleMeeting: (id, data) =>
    apiRequest(`/leads/${id}/schedule-meeting`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// Sales Orders API
export const salesOrdersAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/sales-orders${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/sales-orders/${id}`),
  create: (data) =>
    apiRequest('/sales-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/sales-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  addBOQItem: (id, data) =>
    apiRequest(`/sales-orders/${id}/boq`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  addBOMItem: (id, data) =>
    apiRequest(`/sales-orders/${id}/bom`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  submit: (id) =>
    apiRequest(`/sales-orders/${id}/submit`, { method: 'PUT' }),
  addNegotiation: (id, data) =>
    apiRequest(`/sales-orders/${id}/negotiate`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  closeAsWon: (id, data) =>
    apiRequest(`/sales-orders/${id}/close-won`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  cancel: (id, reason) =>
    apiRequest(`/sales-orders/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),
  getStats: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/sales-orders/stats/summary${query ? `?${query}` : ''}`)
  },
}

// Master Agreements / Approvals API
export const approvalsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/approvals/agreements${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/approvals/agreements/${id}`),
  create: (data) =>
    apiRequest('/approvals/agreements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  addItem: (id, data) =>
    apiRequest(`/approvals/agreements/${id}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateItem: (id, itemId, data) =>
    apiRequest(`/approvals/agreements/${id}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  submit: (id, sendEmail = false) =>
    apiRequest(`/approvals/agreements/${id}/submit`, {
      method: 'PUT',
      body: JSON.stringify({ sendEmailNotifications: sendEmail }),
    }),
  approveItem: (id, itemId, data) =>
    apiRequest(`/approvals/agreements/${id}/items/${itemId}/approve`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  completeHandover: (id, data) =>
    apiRequest(`/approvals/agreements/${id}/handover`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getPending: () => apiRequest('/approvals/pending'),
  getStats: () => apiRequest('/approvals/stats'),
}

// Design Iterations API
export const designIterationsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/design-iterations${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/design-iterations/${id}`),
  getProjectIterations: (projectId) => apiRequest(`/design-iterations/project/${projectId}`),
  create: (data) =>
    apiRequest('/design-iterations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/design-iterations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  addFile: (id, data) =>
    apiRequest(`/design-iterations/${id}/files`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  submit: (id) =>
    apiRequest(`/design-iterations/${id}/submit`, { method: 'PUT' }),
  addInternalReview: (id, data) =>
    apiRequest(`/design-iterations/${id}/internal-review`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  addFeedback: (id, data) =>
    apiRequest(`/design-iterations/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  clientApprove: (id, data) =>
    apiRequest(`/design-iterations/${id}/client-approve`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  designHeadApprove: (id, remarks) =>
    apiRequest(`/design-iterations/${id}/design-head-approve`, {
      method: 'PUT',
      body: JSON.stringify({ remarks }),
    }),
  requestRevision: (id, revisionNotes) =>
    apiRequest(`/design-iterations/${id}/request-revision`, {
      method: 'POST',
      body: JSON.stringify({ revisionNotes }),
    }),
  updateMaterialStatus: (id, materialId, status) =>
    apiRequest(`/design-iterations/${id}/materials/${materialId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  getMyAssigned: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/design-iterations/my/assigned${query ? `?${query}` : ''}`)
  },
}

// ==========================================
// DESIGN P2P TRACKER APIs
// ==========================================
export const designP2PTrackerAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/design-p2p-tracker${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/design-p2p-tracker/${id}`),
  getByProject: (projectId) => apiRequest(`/design-p2p-tracker/project/${projectId}`),
  getSummary: () => apiRequest('/design-p2p-tracker/dashboard/summary'),
  export: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/design-p2p-tracker/export${query ? `?${query}` : ''}`)
  },
  create: (data) =>
    apiRequest('/design-p2p-tracker', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/design-p2p-tracker/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updateStage: (id, stageNum, data) =>
    apiRequest(`/design-p2p-tracker/${id}/stage/${stageNum}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  addDailyLog: (id, data) =>
    apiRequest(`/design-p2p-tracker/${id}/daily-log`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    apiRequest(`/design-p2p-tracker/${id}`, {
      method: 'DELETE',
    }),
}

// ==========================================
// SUPPORT TICKETING APIs
// ==========================================

// Ticket Categories API
export const ticketCategoriesAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/tickets/categories${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/tickets/categories/${id}`),
  create: (data) =>
    apiRequest('/tickets/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/tickets/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    apiRequest(`/tickets/categories/${id}`, { method: 'DELETE' }),
  seed: () =>
    apiRequest('/tickets/categories/init', { method: 'POST' }),
}

// Tickets API
export const ticketsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/tickets${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/tickets/${id}`),
  getMy: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/tickets/my${query ? `?${query}` : ''}`)
  },
  getAssigned: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/tickets/assigned${query ? `?${query}` : ''}`)
  },
  getPendingApproval: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/tickets/pending-approval${query ? `?${query}` : ''}`)
  },
  create: (data) =>
    apiRequest('/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    apiRequest(`/tickets/${id}`, { method: 'DELETE' }),
  // Workflow actions
  submit: (id) =>
    apiRequest(`/tickets/${id}/submit`, { method: 'POST' }),
  approve: (id, comments) =>
    apiRequest(`/tickets/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ comments }),
    }),
  reject: (id, reason) =>
    apiRequest(`/tickets/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),
  assign: (id, data) =>
    apiRequest(`/tickets/${id}/assign`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  resolve: (id, resolution) =>
    apiRequest(`/tickets/${id}/resolve`, {
      method: 'PUT',
      body: JSON.stringify({ resolution }),
    }),
  close: (id, data) =>
    apiRequest(`/tickets/${id}/close`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  reopen: (id, reason) =>
    apiRequest(`/tickets/${id}/reopen`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),
  escalate: (id, data) =>
    apiRequest(`/tickets/${id}/escalate`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  // Comments
  addComment: (id, data) =>
    apiRequest(`/tickets/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  // Stats
  getStats: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/tickets/stats${query ? `?${query}` : ''}`)
  },
  // File uploads
  uploadFiles: async (ticketId, formData) => {
    const token = localStorage.getItem('hoh108_admin_token')
    const companyId = localStorage.getItem('hoh108_active_company')
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(companyId && { 'X-Company-Id': companyId }),
      },
      body: formData,
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || 'Failed to upload files')
    }
    return data
  },
  deleteAttachment: (ticketId, attachmentId) =>
    apiRequest(`/tickets/${ticketId}/attachments/${attachmentId}`, { method: 'DELETE' }),
}

// ==========================================
// APPROVAL MATRIX & WORKFLOW APIs
// ==========================================

// Approval Matrix API
export const approvalMatrixAPI = {
  // Matrix management
  getAll: () => apiRequest('/approval-matrix/matrices'),
  getOne: (id) => apiRequest(`/approval-matrix/matrices/${id}`),
  create: (data) =>
    apiRequest('/approval-matrix/matrices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/approval-matrix/matrices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    apiRequest(`/approval-matrix/matrices/${id}`, { method: 'DELETE' }),
  seedDefaults: () =>
    apiRequest('/approval-matrix/matrices/seed-defaults', { method: 'POST' }),
  getApplicable: (module, activity, params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/approval-matrix/matrices/applicable/${module}/${activity}${query ? `?${query}` : ''}`)
  },

  // Workflow management
  getWorkflows: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/approval-matrix/workflows${query ? `?${query}` : ''}`)
  },
  getWorkflow: (id) => apiRequest(`/approval-matrix/workflows/${id}`),
  getPendingForMe: () => apiRequest('/approval-matrix/workflows/pending-for-me'),
  getMyRequests: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/approval-matrix/workflows/my-requests${query ? `?${query}` : ''}`)
  },
  createWorkflow: (data) =>
    apiRequest('/approval-matrix/workflows', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  approveWorkflow: (id, data) =>
    apiRequest(`/approval-matrix/workflows/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  rejectWorkflow: (id, data) =>
    apiRequest(`/approval-matrix/workflows/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  delegateWorkflow: (id, data) =>
    apiRequest(`/approval-matrix/workflows/${id}/delegate`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  cancelWorkflow: (id, data) =>
    apiRequest(`/approval-matrix/workflows/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Stats and helpers
  getStats: () => apiRequest('/approval-matrix/stats'),
  getPotentialApprovers: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/approval-matrix/potential-approvers${query ? `?${query}` : ''}`)
  },
}

// ==================== PROCUREMENT APIs ====================

// Vendors API
export const vendorsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/vendors${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/vendors/${id}`),
  create: (data) =>
    apiRequest('/vendors', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/vendors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    apiRequest(`/vendors/${id}`, { method: 'DELETE' }),
  approve: (id) =>
    apiRequest(`/vendors/${id}/approve`, { method: 'PUT' }),
  reject: (id, reason) =>
    apiRequest(`/vendors/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),
  uploadDocuments: async (id, files, documentType = 'other') => {
    const token = localStorage.getItem('hoh108_admin_token')
    const companyId = localStorage.getItem('hoh108_active_company')
    const baseUrl = import.meta.env.PROD
      ? 'https://hoh108.com/api'
      : `http://${window.location.hostname}:5001/api`
    const formData = new FormData()
    files.forEach(file => formData.append('documents', file))
    formData.append('documentType', documentType)

    const response = await fetch(`${baseUrl}/vendors/${id}/documents`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(companyId && { 'X-Company-Id': companyId }),
      },
      body: formData,
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Upload failed')
    return data
  },
  deleteDocument: (vendorId, documentId) =>
    apiRequest(`/vendors/${vendorId}/documents/${documentId}`, { method: 'DELETE' }),
  enablePortalAccess: (id, data) =>
    apiRequest(`/vendors/${id}/portal-access`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  resetPortalPassword: (id, password) =>
    apiRequest(`/vendors/${id}/reset-portal-password`, {
      method: 'PUT',
      body: JSON.stringify({ password }),
    }),
  // Vendor Materials Management
  getMaterials: (vendorId) => apiRequest(`/vendors/${vendorId}/materials`),
  addMaterial: (vendorId, data) =>
    apiRequest(`/vendors/${vendorId}/materials`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateMaterial: (vendorId, materialId, data) =>
    apiRequest(`/vendors/${vendorId}/materials/${materialId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteMaterial: (vendorId, materialId) =>
    apiRequest(`/vendors/${vendorId}/materials/${materialId}`, { method: 'DELETE' }),
  approveMaterial: (vendorId, materialId, remarks) =>
    apiRequest(`/vendors/${vendorId}/materials/${materialId}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ remarks }),
    }),
  // Get all materials across vendors (for comparison)
  getAllMaterials: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/vendors/all-materials${query ? `?${query}` : ''}`)
  },
}

// Purchase Orders API
export const purchaseOrdersAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/purchase-orders${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/purchase-orders/${id}`),
  create: (data) =>
    apiRequest('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/purchase-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  submit: (id) =>
    apiRequest(`/purchase-orders/${id}/submit`, { method: 'PUT' }),
  approve: (id, remarks) =>
    apiRequest(`/purchase-orders/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ remarks }),
    }),
  reject: (id, reason) =>
    apiRequest(`/purchase-orders/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),
  send: (id) =>
    apiRequest(`/purchase-orders/${id}/send`, { method: 'PUT' }),
  cancel: (id, reason) =>
    apiRequest(`/purchase-orders/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),
  delete: (id) =>
    apiRequest(`/purchase-orders/${id}`, { method: 'DELETE' }),
}

// Purchase Requisitions API
export const purchaseRequisitionsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/purchase-requisitions${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/purchase-requisitions/${id}`),
  create: (data) =>
    apiRequest('/purchase-requisitions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/purchase-requisitions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  submit: (id) =>
    apiRequest(`/purchase-requisitions/${id}/submit`, { method: 'PUT' }),
  approve: (id, remarks) =>
    apiRequest(`/purchase-requisitions/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ remarks }),
    }),
  reject: (id, reason) =>
    apiRequest(`/purchase-requisitions/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),
  delete: (id) =>
    apiRequest(`/purchase-requisitions/${id}`, { method: 'DELETE' }),
}

// RFQ (Request for Quotation) API
export const rfqAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/rfq${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/rfq/${id}`),
  create: (data) =>
    apiRequest('/rfq', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/rfq/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  send: (id) =>
    apiRequest(`/rfq/${id}/send`, { method: 'PUT' }),
  submitQuotation: (id, vendorId, data) =>
    apiRequest(`/rfq/${id}/quotation/${vendorId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  award: (id, vendorId, remarks) =>
    apiRequest(`/rfq/${id}/award`, {
      method: 'PUT',
      body: JSON.stringify({ vendorId, remarks }),
    }),
  close: (id, reason) =>
    apiRequest(`/rfq/${id}/close`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),
  getForVendor: (vendorId) => apiRequest(`/rfq/vendor/${vendorId}`),
  delete: (id) =>
    apiRequest(`/rfq/${id}`, { method: 'DELETE' }),
}

// Goods Receipts API
export const goodsReceiptsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/goods-receipts${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/goods-receipts/${id}`),
  create: (data) =>
    apiRequest('/goods-receipts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/goods-receipts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  inspection: (id, data) =>
    apiRequest(`/goods-receipts/${id}/inspection`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  accept: (id) =>
    apiRequest(`/goods-receipts/${id}/accept`, { method: 'PUT' }),
  delete: (id) =>
    apiRequest(`/goods-receipts/${id}`, { method: 'DELETE' }),
}

// Vendor Invoices API
export const vendorInvoicesAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/vendor-invoices${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/vendor-invoices/${id}`),
  create: (data) =>
    apiRequest('/vendor-invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/vendor-invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  verify: (id) =>
    apiRequest(`/vendor-invoices/${id}/verify`, { method: 'PUT' }),
  approve: (id, remarks) =>
    apiRequest(`/vendor-invoices/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ remarks }),
    }),
  recordPayment: (id, data) =>
    apiRequest(`/vendor-invoices/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  dispute: (id, reason) =>
    apiRequest(`/vendor-invoices/${id}/dispute`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),
  delete: (id) =>
    apiRequest(`/vendor-invoices/${id}`, { method: 'DELETE' }),
}

// ==================== FINANCE APIs ====================

// Payments API
export const paymentsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/payments${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/payments/${id}`),
  create: (data) =>
    apiRequest('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  approve: (id, remarks) =>
    apiRequest(`/payments/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ remarks }),
    }),
  process: (id, data) =>
    apiRequest(`/payments/${id}/process`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  cancel: (id, reason) =>
    apiRequest(`/payments/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),
  delete: (id) =>
    apiRequest(`/payments/${id}`, { method: 'DELETE' }),
}

// Customer Invoices API
export const customerInvoicesAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/customer-invoices${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/customer-invoices/${id}`),
  create: (data) =>
    apiRequest('/customer-invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/customer-invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  send: (id) =>
    apiRequest(`/customer-invoices/${id}/send`, { method: 'PUT' }),
  sendReminder: (id) =>
    apiRequest(`/customer-invoices/${id}/reminder`, { method: 'PUT' }),
  recordPayment: (id, data) =>
    apiRequest(`/customer-invoices/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  cancel: (id, reason) =>
    apiRequest(`/customer-invoices/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),
  delete: (id) =>
    apiRequest(`/customer-invoices/${id}`, { method: 'DELETE' }),
}

// ==================== SALES APIs ====================

// Quotations API
export const quotationsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/quotations${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/quotations/${id}`),
  create: (data) =>
    apiRequest('/quotations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/quotations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  send: (id) =>
    apiRequest(`/quotations/${id}/send`, { method: 'PUT' }),
  markViewed: (id) =>
    apiRequest(`/quotations/${id}/viewed`, { method: 'PUT' }),
  accept: (id, notes) =>
    apiRequest(`/quotations/${id}/accept`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    }),
  reject: (id, reason) =>
    apiRequest(`/quotations/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),
  createRevision: (id) =>
    apiRequest(`/quotations/${id}/revision`, { method: 'POST' }),
  addNegotiation: (id, data) =>
    apiRequest(`/quotations/${id}/negotiate`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  convert: (id) =>
    apiRequest(`/quotations/${id}/convert`, { method: 'POST' }),
  delete: (id) =>
    apiRequest(`/quotations/${id}`, { method: 'DELETE' }),
}

// ==================== SETTINGS APIs ====================

// Roles API
export const rolesAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/roles${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/roles/${id}`),
  create: (data) =>
    apiRequest('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    apiRequest(`/roles/${id}`, { method: 'DELETE' }),
  seedDefaults: () =>
    apiRequest('/roles/seed-defaults', { method: 'POST' }),
  getPermissionsMeta: () => apiRequest('/roles/meta/permissions'),
}

// KPI API
export const kpiAPI = {
  getConfigs: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/kpi/configs${query ? `?${query}` : ''}`)
  },
  getConfig: (id) => apiRequest(`/kpi/configs/${id}`),
  createConfig: (data) =>
    apiRequest('/kpi/configs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateConfig: (id, data) =>
    apiRequest(`/kpi/configs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteConfig: (id) =>
    apiRequest(`/kpi/configs/${id}`, { method: 'DELETE' }),
  getValues: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/kpi/values${query ? `?${query}` : ''}`)
  },
  getHistory: (kpiCode, params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/kpi/values/${kpiCode}/history${query ? `?${query}` : ''}`)
  },
  initDefaults: () =>
    apiRequest('/kpi/init-defaults', { method: 'POST' }),
}

// Stock/Inventory API
export const stockAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/stock${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/stock/${id}`),
  create: (data) =>
    apiRequest('/stock', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/stock/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  adjust: (id, data) =>
    apiRequest(`/stock/${id}/adjust`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  reserve: (id, data) =>
    apiRequest(`/stock/${id}/reserve`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  release: (id, data) =>
    apiRequest(`/stock/${id}/release`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    apiRequest(`/stock/${id}`, { method: 'DELETE' }),
  getWarehouses: () => apiRequest('/stock/meta/warehouses'),
  getByMaterial: (materialId) => apiRequest(`/stock?material=${materialId}`),
}

// Audit Logs API
export const auditLogsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/audit-logs${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/audit-logs/${id}`),
  getEntityHistory: (entity, entityId, params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/audit-logs/entity/${entity}/${entityId}${query ? `?${query}` : ''}`)
  },
  getUserActivity: (userId, params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/audit-logs/user/${userId}${query ? `?${query}` : ''}`)
  },
  getStats: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/audit-logs/meta/stats${query ? `?${query}` : ''}`)
  },
  exportCSV: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/audit-logs/export/csv${query ? `?${query}` : ''}`)
  },
  getFilterOptions: () => apiRequest('/audit-logs/meta/filters'),
}

// ==================== INVENTORY APIs ====================

// Materials API
export const materialsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/materials${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/materials/${id}`),
  create: (data) =>
    apiRequest('/materials', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    apiRequest(`/materials/${id}`, { method: 'DELETE' }),
  getCategories: () => apiRequest('/materials/meta/categories'),
}

// Stock Movements API
export const stockMovementsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/stock-movements${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/stock-movements/${id}`),
  create: (data) =>
    apiRequest('/stock-movements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/stock-movements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    apiRequest(`/stock-movements/${id}`, { method: 'DELETE' }),
}

// Assets API
export const assetsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/assets${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/assets/${id}`),
  create: (data) =>
    apiRequest('/assets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    apiRequest(`/assets/${id}`, { method: 'DELETE' }),
  addMaintenance: (id, data) =>
    apiRequest(`/assets/${id}/maintenance`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  bulkUpload: (assets) =>
    apiRequest('/assets/bulk-upload', {
      method: 'POST',
      body: JSON.stringify({ assets }),
    }),
}

// ==================== HR & PAYROLL APIs ====================

// Payroll API
export const payrollAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/payroll${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/payroll/${id}`),
  create: (data) =>
    apiRequest('/payroll', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/payroll/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    apiRequest(`/payroll/${id}`, { method: 'DELETE' }),
  generate: (data) =>
    apiRequest('/payroll/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  process: (id) =>
    apiRequest(`/payroll/${id}/process`, { method: 'PUT' }),
}

// Review Cycles API
export const reviewCyclesAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/review-cycles${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/review-cycles/${id}`),
  create: (data) =>
    apiRequest('/review-cycles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/review-cycles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    apiRequest(`/review-cycles/${id}`, { method: 'DELETE' }),
  launch: (id) =>
    apiRequest(`/review-cycles/${id}/launch`, { method: 'PUT' }),
  complete: (id) =>
    apiRequest(`/review-cycles/${id}/complete`, { method: 'PUT' }),
}

// KRA API
export const krasAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/kras${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/kras/${id}`),
  create: (data) =>
    apiRequest('/kras', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/kras/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    apiRequest(`/kras/${id}`, { method: 'DELETE' }),
  seedDefaults: () =>
    apiRequest('/kras/seed-defaults', { method: 'POST' }),
}

// Role Templates API
export const roleTemplatesAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/role-templates${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/role-templates/${id}`),
  create: (data) =>
    apiRequest('/role-templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/role-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    apiRequest(`/role-templates/${id}`, { method: 'DELETE' }),
  seedDefaults: () =>
    apiRequest('/role-templates/seed-defaults', { method: 'POST' }),
}

// Material Pricelist API
export const materialPricelistAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/material-pricelists${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/material-pricelists/${id}`),
  getSummary: () => apiRequest('/material-pricelists/summary'),
  create: (data) =>
    apiRequest('/material-pricelists', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/material-pricelists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updatePrice: (id, data) =>
    apiRequest(`/material-pricelists/${id}/price`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  addVendor: (id, data) =>
    apiRequest(`/material-pricelists/${id}/vendors`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  removeVendor: (id, vendorEntryId) =>
    apiRequest(`/material-pricelists/${id}/vendors/${vendorEntryId}`, { method: 'DELETE' }),
  delete: (id) =>
    apiRequest(`/material-pricelists/${id}`, { method: 'DELETE' }),
}

// ==================== NEW HRMS APIs ====================

// Advance Requests API
export const advanceRequestsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/advance-requests${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/advance-requests/${id}`),
  getMy: () => apiRequest('/advance-requests/my'),
  getPendingApprovals: () => apiRequest('/advance-requests/pending-approvals'),
  create: (data) =>
    apiRequest('/advance-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  // 3-Level Approval
  managerApprove: (id, data) =>
    apiRequest(`/advance-requests/${id}/manager-approve`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  hrApprove: (id, data) =>
    apiRequest(`/advance-requests/${id}/hr-approve`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  finalApprove: (id, data) =>
    apiRequest(`/advance-requests/${id}/final-approve`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  tagHR: (id, hrUserIds) =>
    apiRequest(`/advance-requests/${id}/tag-hr`, {
      method: 'PUT',
      body: JSON.stringify({ hrUserIds }),
    }),
  // Disbursement & Recovery
  disburse: (id, data) =>
    apiRequest(`/advance-requests/${id}/disburse`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  recordRecovery: (id, data) =>
    apiRequest(`/advance-requests/${id}/recovery`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getStats: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/advance-requests/stats/summary${query ? `?${query}` : ''}`)
  },
}

// Employee Letters API
export const employeeLettersAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/employee-letters${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/employee-letters/${id}`),
  getMy: () => apiRequest('/employee-letters/my'),
  create: (data) =>
    apiRequest('/employee-letters', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/employee-letters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  submit: (id, approverId) =>
    apiRequest(`/employee-letters/${id}/submit`, {
      method: 'PUT',
      body: JSON.stringify({ approverId }),
    }),
  approve: (id, comment) =>
    apiRequest(`/employee-letters/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ comment }),
    }),
  reject: (id, reason) =>
    apiRequest(`/employee-letters/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),
  issue: (id, data) =>
    apiRequest(`/employee-letters/${id}/issue`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  acknowledge: (id, comments) =>
    apiRequest(`/employee-letters/${id}/acknowledge`, {
      method: 'PUT',
      body: JSON.stringify({ comments }),
    }),
  getTemplate: (type) => apiRequest(`/employee-letters/templates/${type}`),
  getStats: () => apiRequest('/employee-letters/stats/summary'),
}

// Enhanced Reimbursements API (3-Level Approval & Payments)
export const reimbursementsEnhancedAPI = {
  // 3-Level Approval Workflow
  getApprovalsByLevel: (level) =>
    apiRequest(`/reimbursements/approvals/by-level?level=${level}`),
  managerApprove: (id, data) =>
    apiRequest(`/reimbursements/${id}/manager-approve`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  hrApprove: (id, data) =>
    apiRequest(`/reimbursements/${id}/hr-approve`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  finalApprove: (id, data) =>
    apiRequest(`/reimbursements/${id}/final-approve`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  tagHR: (id, hrUserIds) =>
    apiRequest(`/reimbursements/${id}/tag-hr`, {
      method: 'PUT',
      body: JSON.stringify({ hrUserIds }),
    }),
  // Separate Payment Entries
  addPayment: (id, data) =>
    apiRequest(`/reimbursements/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getPayments: (id) => apiRequest(`/reimbursements/${id}/payments`),
  getWorkflowSummary: () => apiRequest('/reimbursements/workflow/summary'),
}

// Salary Deductions API
export const salaryDeductionsAPI = {
  getDeductions: (employeeId) => apiRequest(`/salary/${employeeId}/deductions`),
  addDeduction: (employeeId, data) =>
    apiRequest(`/salary/${employeeId}/deductions`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updateDeduction: (employeeId, deductionId, data) =>
    apiRequest(`/salary/${employeeId}/deductions/${deductionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteDeduction: (employeeId, deductionId) =>
    apiRequest(`/salary/${employeeId}/deductions/${deductionId}`, { method: 'DELETE' }),
  recordDeduction: (employeeId, deductionId, data) =>
    apiRequest(`/salary/${employeeId}/deductions/${deductionId}/record`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getDetailedSlip: (employeeId, params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/salary/${employeeId}/slip-detailed${query ? `?${query}` : ''}`)
  },
}

// ==================== PPC (Production Planning & Control) APIs ====================

// Work Orders API
export const workOrdersAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/work-orders${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/work-orders/${id}`),
  create: (data) =>
    apiRequest('/work-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  createFromBOM: (bomId, data) =>
    apiRequest(`/work-orders/from-bom/${bomId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/work-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  release: (id) =>
    apiRequest(`/work-orders/${id}/release`, { method: 'PUT' }),
  start: (id) =>
    apiRequest(`/work-orders/${id}/start`, { method: 'PUT' }),
  updateProgress: (id, data) =>
    apiRequest(`/work-orders/${id}/progress`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  complete: (id) =>
    apiRequest(`/work-orders/${id}/complete`, { method: 'PUT' }),
  hold: (id, reason) =>
    apiRequest(`/work-orders/${id}/hold`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),
  resume: (id) =>
    apiRequest(`/work-orders/${id}/resume`, { method: 'PUT' }),
  cancel: (id, reason) =>
    apiRequest(`/work-orders/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),
  addActivity: (id, data) =>
    apiRequest(`/work-orders/${id}/activities`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  recordQualityCheck: (id, data) =>
    apiRequest(`/work-orders/${id}/quality-check`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getByProject: (projectId) => apiRequest(`/work-orders/project/${projectId}`),
  getDashboard: () => apiRequest('/work-orders/summary/dashboard'),
  delete: (id) =>
    apiRequest(`/work-orders/${id}`, { method: 'DELETE' }),
}

// Bill of Materials API
export const bomAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/bom${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/bom/${id}`),
  create: (data) =>
    apiRequest('/bom', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/bom/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  submit: (id) =>
    apiRequest(`/bom/${id}/submit`, { method: 'PUT' }),
  approve: (id) =>
    apiRequest(`/bom/${id}/approve`, { method: 'PUT' }),
  reject: (id, reason) =>
    apiRequest(`/bom/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),
  activate: (id) =>
    apiRequest(`/bom/${id}/activate`, { method: 'PUT' }),
  createNewVersion: (id, changeDescription) =>
    apiRequest(`/bom/${id}/new-version`, {
      method: 'POST',
      body: JSON.stringify({ changeDescription }),
    }),
  copy: (id, project) =>
    apiRequest(`/bom/${id}/copy`, {
      method: 'POST',
      body: JSON.stringify({ project }),
    }),
  addItem: (id, data) =>
    apiRequest(`/bom/${id}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateItem: (id, itemIndex, data) =>
    apiRequest(`/bom/${id}/items/${itemIndex}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  removeItem: (id, itemIndex) =>
    apiRequest(`/bom/${id}/items/${itemIndex}`, { method: 'DELETE' }),
  getByProject: (projectId) => apiRequest(`/bom/project/${projectId}`),
  getTemplates: () => apiRequest('/bom/templates/list'),
  delete: (id) =>
    apiRequest(`/bom/${id}`, { method: 'DELETE' }),
}

// Material Requirements (MRP) API
export const materialRequirementsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/material-requirements${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/material-requirements/${id}`),
  runMRP: (workOrderId) =>
    apiRequest(`/material-requirements/run-mrp/${workOrderId}`, { method: 'POST' }),
  refreshStock: (requirementIds) =>
    apiRequest('/material-requirements/refresh-stock', {
      method: 'POST',
      body: JSON.stringify({ requirementIds }),
    }),
  createPR: (data) =>
    apiRequest('/material-requirements/create-pr', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateStatus: (id, data) =>
    apiRequest(`/material-requirements/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getWorkOrderSummary: (workOrderId) =>
    apiRequest(`/material-requirements/work-order/${workOrderId}/summary`),
  getShortfallReport: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/material-requirements/reports/shortfall${query ? `?${query}` : ''}`)
  },
  delete: (id) =>
    apiRequest(`/material-requirements/${id}`, { method: 'DELETE' }),
}

// Material Issues API
export const materialIssuesAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/material-issues${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/material-issues/${id}`),
  create: (data) =>
    apiRequest('/material-issues', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  bulkCreate: (data) =>
    apiRequest('/material-issues/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  recordConsumption: (id, data) =>
    apiRequest(`/material-issues/${id}/consumption`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  returnMaterial: (id, data) =>
    apiRequest(`/material-issues/${id}/return`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  approve: (id) =>
    apiRequest(`/material-issues/${id}/approve`, { method: 'PUT' }),
  getByWorkOrder: (workOrderId) =>
    apiRequest(`/material-issues/work-order/${workOrderId}`),
  getDailyReport: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/material-issues/reports/daily${query ? `?${query}` : ''}`)
  },
  getConsumptionReport: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/material-issues/reports/consumption${query ? `?${query}` : ''}`)
  },
}

// Labor Entries API
export const laborEntriesAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/labor-entries${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/labor-entries/${id}`),
  create: (data) =>
    apiRequest('/labor-entries', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  bulkCreate: (data) =>
    apiRequest('/labor-entries/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/labor-entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  approve: (id) =>
    apiRequest(`/labor-entries/${id}/approve`, { method: 'PUT' }),
  bulkApprove: (entryIds) =>
    apiRequest('/labor-entries/bulk-approve', {
      method: 'POST',
      body: JSON.stringify({ entryIds }),
    }),
  reject: (id, reason) =>
    apiRequest(`/labor-entries/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),
  getByWorkOrder: (workOrderId) =>
    apiRequest(`/labor-entries/work-order/${workOrderId}`),
  getDailyReport: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/labor-entries/reports/daily${query ? `?${query}` : ''}`)
  },
  getProductivityReport: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/labor-entries/reports/productivity${query ? `?${query}` : ''}`)
  },
  getOvertimeReport: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/labor-entries/reports/overtime${query ? `?${query}` : ''}`)
  },
  delete: (id) =>
    apiRequest(`/labor-entries/${id}`, { method: 'DELETE' }),
}

// Daily Progress Reports API
export const dailyProgressReportsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/daily-progress-reports${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/daily-progress-reports/${id}`),
  create: (data) =>
    apiRequest('/daily-progress-reports', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/daily-progress-reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  submit: (id) =>
    apiRequest(`/daily-progress-reports/${id}/submit`, { method: 'PUT' }),
  review: (id, comments) =>
    apiRequest(`/daily-progress-reports/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify({ comments }),
    }),
  approve: (id) =>
    apiRequest(`/daily-progress-reports/${id}/approve`, { method: 'PUT' }),
  reject: (id, reason) =>
    apiRequest(`/daily-progress-reports/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    }),
  addActivity: (id, data) =>
    apiRequest(`/daily-progress-reports/${id}/activities`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  addIssue: (id, data) =>
    apiRequest(`/daily-progress-reports/${id}/issues`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  addPhoto: (id, data) =>
    apiRequest(`/daily-progress-reports/${id}/photos`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getProjectSummary: (projectId, params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/daily-progress-reports/project/${projectId}/summary${query ? `?${query}` : ''}`)
  },
  getManpowerReport: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/daily-progress-reports/reports/manpower${query ? `?${query}` : ''}`)
  },
  getSafetyReport: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/daily-progress-reports/reports/safety${query ? `?${query}` : ''}`)
  },
  getProgressTrend: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/daily-progress-reports/reports/progress-trend${query ? `?${query}` : ''}`)
  },
  getIssuesReport: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/daily-progress-reports/reports/issues${query ? `?${query}` : ''}`)
  },
  delete: (id) =>
    apiRequest(`/daily-progress-reports/${id}`, { method: 'DELETE' }),
}

// Production Costs API
export const productionCostsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/production-costs${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/production-costs/${id}`),
  calculate: (workOrderId) =>
    apiRequest(`/production-costs/calculate/${workOrderId}`, { method: 'POST' }),
  recalculate: (id) =>
    apiRequest(`/production-costs/${id}/recalculate`, { method: 'PUT' }),
  updateOverhead: (id, data) =>
    apiRequest(`/production-costs/${id}/overhead`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updateProfitability: (id, data) =>
    apiRequest(`/production-costs/${id}/profitability`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  verify: (id) =>
    apiRequest(`/production-costs/${id}/verify`, { method: 'PUT' }),
  finalize: (id) =>
    apiRequest(`/production-costs/${id}/finalize`, { method: 'PUT' }),
  addVarianceExplanation: (id, explanation) =>
    apiRequest(`/production-costs/${id}/variance-explanation`, {
      method: 'PUT',
      body: JSON.stringify({ explanation }),
    }),
  getProjectSummary: (projectId) =>
    apiRequest(`/production-costs/project/${projectId}/summary`),
  getVarianceReport: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/production-costs/reports/variance${query ? `?${query}` : ''}`)
  },
  getCOGSReport: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/production-costs/reports/cogs${query ? `?${query}` : ''}`)
  },
  getProfitabilityReport: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/production-costs/reports/profitability${query ? `?${query}` : ''}`)
  },
  postToGL: (id) =>
    apiRequest(`/production-costs/${id}/post-to-gl`, { method: 'PUT' }),
}

// PPC Dashboard API
export const ppcDashboardAPI = {
  getOverview: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/ppc-dashboard/overview${query ? `?${query}` : ''}`)
  },
  getSchedule: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/ppc-dashboard/schedule${query ? `?${query}` : ''}`)
  },
  getWorkOrderProgress: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/ppc-dashboard/work-order-progress${query ? `?${query}` : ''}`)
  },
  getMRPSummary: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/ppc-dashboard/mrp-summary${query ? `?${query}` : ''}`)
  },
  getLaborSummary: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/ppc-dashboard/labor-summary${query ? `?${query}` : ''}`)
  },
  getCostSummary: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/ppc-dashboard/cost-summary${query ? `?${query}` : ''}`)
  },
  getProgressSummary: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/ppc-dashboard/progress-summary${query ? `?${query}` : ''}`)
  },
  getKPIs: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/ppc-dashboard/kpis${query ? `?${query}` : ''}`)
  },
}

// ==================== BOQ QUOTES APIs ====================

// BOQ Quotes API
export const boqQuotesAPI = {
  // Quotes
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/boq-quotes${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/boq-quotes/${id}`),
  create: (data) =>
    apiRequest('/boq-quotes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/boq-quotes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    apiRequest(`/boq-quotes/${id}`, { method: 'DELETE' }),

  // BOQ Items
  getItems: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/boq-quotes/items${query ? `?${query}` : ''}`)
  },
  createItem: (data) =>
    apiRequest('/boq-quotes/items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateItem: (id, data) =>
    apiRequest(`/boq-quotes/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteItem: (id) =>
    apiRequest(`/boq-quotes/items/${id}`, { method: 'DELETE' }),
  bulkCreateItems: (items) =>
    apiRequest('/boq-quotes/items/bulk', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),
  seedItems: () =>
    apiRequest('/boq-quotes/items/seed', { method: 'POST' }),

  // Packages
  getPackages: () => apiRequest('/boq-quotes/packages'),
  createPackage: (data) =>
    apiRequest('/boq-quotes/packages', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePackage: (id, data) =>
    apiRequest(`/boq-quotes/packages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deletePackage: (id) =>
    apiRequest(`/boq-quotes/packages/${id}`, { method: 'DELETE' }),
  seedPackages: () =>
    apiRequest('/boq-quotes/packages/seed', { method: 'POST' }),

  // Pricing
  getCostConfig: (itemId, packageCode) =>
    apiRequest(`/boq-quotes/cost-config/${itemId}/${packageCode}`),
  getItemsWithPricing: (packageCode) =>
    apiRequest(`/boq-quotes/items-with-pricing/${packageCode}`),

  // PDF Generation
  generatePDF: async (data) => {
    const token = localStorage.getItem('hoh108_admin_token')
    const companyId = localStorage.getItem('hoh108_active_company')
    const API_BASE_URL = import.meta.env.PROD
      ? 'https://hoh108.com/api'
      : `http://${window.location.hostname}:5001/api`

    const response = await fetch(`${API_BASE_URL}/boq-quotes/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(companyId && { 'X-Company-Id': companyId }),
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('Failed to generate PDF')
    }

    // Return blob for download
    return response.blob()
  },

  downloadQuotePDF: async (id) => {
    const token = localStorage.getItem('hoh108_admin_token')
    const companyId = localStorage.getItem('hoh108_active_company')
    const API_BASE_URL = import.meta.env.PROD
      ? 'https://hoh108.com/api'
      : `http://${window.location.hostname}:5001/api`

    const response = await fetch(`${API_BASE_URL}/boq-quotes/${id}/pdf`, {
      method: 'GET',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(companyId && { 'X-Company-Id': companyId }),
      },
    })

    if (!response.ok) {
      throw new Error('Failed to download PDF')
    }

    return response.blob()
  },
}

// QC Master API
export const qcMasterAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/qc-master${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/qc-master/${id}`),
  getDashboard: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/qc-master/dashboard${query ? `?${query}` : ''}`)
  },
  getByProject: (projectId) => apiRequest(`/qc-master/project/${projectId}`),
  create: (data) =>
    apiRequest('/qc-master', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/qc-master/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  inspect: (id, data) =>
    apiRequest(`/qc-master/${id}/inspect`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  approve: (id, data) =>
    apiRequest(`/qc-master/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  addDefect: (id, data) =>
    apiRequest(`/qc-master/${id}/defects`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateDefect: (id, defectId, data) =>
    apiRequest(`/qc-master/${id}/defects/${defectId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    apiRequest(`/qc-master/${id}`, { method: 'DELETE' }),
  export: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/qc-master/export${query ? `?${query}` : ''}`)
  },
}

// MDM (Master Data Management) API
export const mdmAPI = {
  // Dashboard
  getDashboard: () => apiRequest('/mdm/dashboard'),

  // Entities
  getEntities: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/mdm/entities${query ? `?${query}` : ''}`)
  },
  getEntity: (code) => apiRequest(`/mdm/entities/${code}`),
  createEntity: (data) =>
    apiRequest('/mdm/entities', { method: 'POST', body: JSON.stringify(data) }),
  updateEntity: (code, data) =>
    apiRequest(`/mdm/entities/${code}`, { method: 'PUT', body: JSON.stringify(data) }),
  seedEntities: (force = false) =>
    apiRequest('/mdm/entities/seed', { method: 'POST', body: JSON.stringify({ force }) }),

  // Golden Records
  getRecords: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/mdm/records${query ? `?${query}` : ''}`)
  },
  getRecord: (id) => apiRequest(`/mdm/records/${id}`),
  updateRecord: (id, data) =>
    apiRequest(`/mdm/records/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  syncEntity: (entityCode) =>
    apiRequest('/mdm/records/sync', { method: 'POST', body: JSON.stringify({ entityCode }) }),
  syncAll: () =>
    apiRequest('/mdm/records/sync-all', { method: 'POST', body: JSON.stringify({}) }),

  // ID Mappings
  getMappings: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/mdm/mappings${query ? `?${query}` : ''}`)
  },
  getEntityMappings: (entityCode, id) =>
    apiRequest(`/mdm/mappings/entity/${entityCode}/${id}`),
  createMapping: (data) =>
    apiRequest('/mdm/mappings', { method: 'POST', body: JSON.stringify(data) }),
  autoDiscover: () =>
    apiRequest('/mdm/mappings/auto-discover', { method: 'POST', body: JSON.stringify({}) }),
  deleteMapping: (id) =>
    apiRequest(`/mdm/mappings/${id}`, { method: 'DELETE' }),

  // Data Quality
  getQuality: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/mdm/quality${query ? `?${query}` : ''}`)
  },

  // Audit Trail
  getAudit: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/mdm/audit${query ? `?${query}` : ''}`)
  },

  // Refresh Stats
  refreshStats: () =>
    apiRequest('/mdm/refresh-stats', { method: 'POST', body: JSON.stringify({}) }),
}

// ===========================================
// Enhanced Performance Reviews API (KRA Integration)
export const performanceReviewsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/performance-reviews${query ? `?${query}` : ''}`)
  },
  getMyReviews: (role = 'employee') => apiRequest(`/performance-reviews/my-reviews?role=${role}`),
  getOne: (id) => apiRequest(`/performance-reviews/${id}`),
  initialize: (data) =>
    apiRequest('/performance-reviews/initialize', { method: 'POST', body: JSON.stringify(data) }),
  create: (data) =>
    apiRequest('/performance-reviews', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    apiRequest(`/performance-reviews/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) =>
    apiRequest(`/performance-reviews/${id}`, { method: 'DELETE' }),
  // Self-review workflow
  saveSelfAssessment: (id, data) =>
    apiRequest(`/performance-reviews/${id}/self-assessment/save`, { method: 'PUT', body: JSON.stringify(data) }),
  submitSelfAssessment: (id) =>
    apiRequest(`/performance-reviews/${id}/self-assessment/submit`, { method: 'PUT', body: JSON.stringify({}) }),
  // Manager review workflow
  saveManagerReview: (id, data) =>
    apiRequest(`/performance-reviews/${id}/manager-review/save`, { method: 'PUT', body: JSON.stringify(data) }),
  submitManagerReview: (id) =>
    apiRequest(`/performance-reviews/${id}/manager-review/submit`, { method: 'PUT', body: JSON.stringify({}) }),
  // Calibration workflow
  getPendingCalibration: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/performance-reviews/calibration/pending${query ? `?${query}` : ''}`)
  },
  calibrate: (id, data) =>
    apiRequest(`/performance-reviews/${id}/calibrate`, { method: 'PUT', body: JSON.stringify(data) }),
  skipCalibration: (id) =>
    apiRequest(`/performance-reviews/${id}/skip-calibration`, { method: 'PUT', body: JSON.stringify({}) }),
  // Finalization
  finalize: (id) =>
    apiRequest(`/performance-reviews/${id}/finalize`, { method: 'PUT', body: JSON.stringify({}) }),
  acknowledge: (id, comments) =>
    apiRequest(`/performance-reviews/${id}/acknowledge`, { method: 'PUT', body: JSON.stringify({ employeeComments: comments }) }),
  dispute: (id, reason) =>
    apiRequest(`/performance-reviews/${id}/dispute`, { method: 'PUT', body: JSON.stringify({ disputeReason: reason }) }),
  // Goals
  addGoal: (id, data) =>
    apiRequest(`/performance-reviews/${id}/goals`, { method: 'POST', body: JSON.stringify(data) }),
  updateGoal: (id, goalId, data) =>
    apiRequest(`/performance-reviews/${id}/goals/${goalId}`, { method: 'PUT', body: JSON.stringify(data) }),
  // Reports
  getDistribution: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/performance-reviews/reports/distribution${query ? `?${query}` : ''}`)
  },
  getCalibrationImpact: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/performance-reviews/reports/calibration-impact${query ? `?${query}` : ''}`)
  },
  getAuditTrail: (id) => apiRequest(`/performance-reviews/${id}/audit-trail`),
}

// ==================== CALLYZER INTEGRATION API ====================

export const callyzerAPI = {
  // Configuration
  getConfig: () => apiRequest('/callyzer/config'),
  saveConfig: (data) =>
    apiRequest('/callyzer/config', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  testConnection: (apiToken) =>
    apiRequest('/callyzer/test', {
      method: 'POST',
      body: JSON.stringify({ apiToken }),
    }),

  // Sync
  syncCalls: (params = {}) =>
    apiRequest('/callyzer/sync/calls', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  // Statistics
  getStats: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/callyzer/stats${query ? `?${query}` : ''}`)
  },

  // Call history (live from Callyzer)
  getCalls: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/callyzer/calls${query ? `?${query}` : ''}`)
  },

  // Employee mapping
  getEmployees: () => apiRequest('/callyzer/employees'),
  mapEmployee: (userId, callyzerEmployeeNumber) =>
    apiRequest('/callyzer/employees/map', {
      method: 'PUT',
      body: JSON.stringify({ userId, callyzerEmployeeNumber }),
    }),

  // Dashboard (infographics)
  getDashboard: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/callyzer/dashboard${query ? `?${query}` : ''}`)
  },

  // Poll call status (check if a call to a phone has ended)
  pollCallStatus: (phone, since) => {
    const query = new URLSearchParams({ phone, since: since.toISOString() }).toString()
    return apiRequest(`/callyzer/poll-call-status?${query}`)
  },
}

// ==================== GENERAL LEDGER / COA API ====================

export const generalLedgerAPI = {
  // Chart of Accounts
  getAccountTree: (accountType) =>
    apiRequest(`/general-ledger/accounts/tree${accountType ? `?accountType=${accountType}` : ''}`),
  getAccounts: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/general-ledger/accounts${query ? `?${query}` : ''}`)
  },
  getAccount: (id) => apiRequest(`/general-ledger/accounts/${id}`),
  createAccount: (data) =>
    apiRequest('/general-ledger/accounts', { method: 'POST', body: JSON.stringify(data) }),
  approveAccount: (id) =>
    apiRequest(`/general-ledger/accounts/${id}/approve`, { method: 'POST' }),
  seedIndianCoA: (companyId) =>
    apiRequest('/general-ledger/accounts/seed-indian-coa', {
      method: 'POST',
      body: JSON.stringify({ companyId }),
    }),

  // Ledger Master
  getLedgerMaster: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/general-ledger/ledger-master${query ? `?${query}` : ''}`)
  },
  getLedgerTransactions: (id, params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/general-ledger/ledger-master/${id}/transactions${query ? `?${query}` : ''}`)
  },

  // Journal Entries
  getJournalEntries: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/general-ledger/journal-entries${query ? `?${query}` : ''}`)
  },
  getJournalEntry: (id) => apiRequest(`/general-ledger/journal-entries/${id}`),
  createJournalEntry: (data) =>
    apiRequest('/general-ledger/journal-entries', { method: 'POST', body: JSON.stringify(data) }),

  // Trial Balance
  getTrialBalance: () => apiRequest('/general-ledger/trial-balance'),

  // Fiscal Periods
  getFiscalPeriods: () => apiRequest('/general-ledger/fiscal-periods'),
}

// ==================== LEDGER ACTIVITY MAPPING API ====================

export const ledgerMappingAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/ledger-mappings${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/ledger-mappings/${id}`),
  create: (data) =>
    apiRequest('/ledger-mappings', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    apiRequest(`/ledger-mappings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggle: (id) =>
    apiRequest(`/ledger-mappings/${id}/toggle`, { method: 'POST' }),
  seedDefaults: () =>
    apiRequest('/ledger-mappings/seed', { method: 'POST' }),
}

// ==================== AGING DASHBOARD API ====================

export const agingAPI = {
  getReceivable: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/aging/receivable${query ? `?${query}` : ''}`)
  },
  getReceivableByProject: (projectId) =>
    apiRequest(`/aging/receivable/by-project/${projectId}`),
  getReceivableByCustomer: (customerId) =>
    apiRequest(`/aging/receivable/by-customer/${customerId}`),
  getPayable: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/aging/payable${query ? `?${query}` : ''}`)
  },
  getPayableByProject: (projectId) =>
    apiRequest(`/aging/payable/by-project/${projectId}`),
  getPayableByVendor: (vendorId) =>
    apiRequest(`/aging/payable/by-vendor/${vendorId}`),
  getSummary: () => apiRequest('/aging/summary'),
}

// ==================== VENDOR PAYMENT MILESTONES API ====================

export const vendorPaymentMilestonesAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/vendor-payment-milestones${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/vendor-payment-milestones/${id}`),
  create: (data) =>
    apiRequest('/vendor-payment-milestones', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    apiRequest(`/vendor-payment-milestones/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  recordPayment: (id, data) =>
    apiRequest(`/vendor-payment-milestones/${id}/payments`, { method: 'POST', body: JSON.stringify(data) }),
  createDefaults: (data) =>
    apiRequest('/vendor-payment-milestones/create-defaults', { method: 'POST', body: JSON.stringify(data) }),
}

// ==================== SALES DISPATCHES API ====================

export const salesDispatchesAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/sales-dispatches${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/sales-dispatches/${id}`),
  create: (data) =>
    apiRequest('/sales-dispatches', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    apiRequest(`/sales-dispatches/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  markDispatched: (id, data = {}) =>
    apiRequest(`/sales-dispatches/${id}/dispatch`, { method: 'POST', body: JSON.stringify(data) }),
  confirmDelivery: (id, data = {}) =>
    apiRequest(`/sales-dispatches/${id}/confirm-delivery`, { method: 'POST', body: JSON.stringify(data) }),
}

// ==================== SALES THREE-WAY MATCH API ====================

export const salesThreeWayMatchAPI = {
  execute: (data) =>
    apiRequest('/sales-three-way-match/execute', { method: 'POST', body: JSON.stringify(data) }),
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/sales-three-way-match${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/sales-three-way-match/${id}`),
  approveException: (id, data) =>
    apiRequest(`/sales-three-way-match/${id}/approve-exception`, { method: 'POST', body: JSON.stringify(data) }),
}

// ==================== EXIT MANAGEMENT API ====================

export const exitManagementAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/exit-management${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/exit-management/${id}`),
  create: (data) =>
    apiRequest('/exit-management', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    apiRequest(`/exit-management/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateChecklist: (id, data) =>
    apiRequest(`/exit-management/${id}/checklist`, { method: 'PUT', body: JSON.stringify(data) }),
  updateFnF: (id, data) =>
    apiRequest(`/exit-management/${id}/fnf`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) =>
    apiRequest(`/exit-management/${id}`, { method: 'DELETE' }),
}

// ==================== RISK REGISTER API ====================

export const riskRegisterAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/risk-register${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/risk-register/${id}`),
  getDashboard: () => apiRequest('/risk-register/dashboard'),
  create: (data) =>
    apiRequest('/risk-register', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    apiRequest(`/risk-register/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  addActivity: (id, data) =>
    apiRequest(`/risk-register/${id}/activities`, { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) =>
    apiRequest(`/risk-register/${id}`, { method: 'DELETE' }),
}

// ==================== STOCK TAKES API ====================

export const stockTakesAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/stock-takes${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/stock-takes/${id}`),
  create: (data) =>
    apiRequest('/stock-takes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    apiRequest(`/stock-takes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  approve: (id) =>
    apiRequest(`/stock-takes/${id}/approve`, { method: 'PUT' }),
  delete: (id) =>
    apiRequest(`/stock-takes/${id}`, { method: 'DELETE' }),
}

// ==================== SKILL MATRIX API ====================

export const skillMatrixAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/skill-matrix${query ? `?${query}` : ''}`)
  },
  getByEmployee: (employeeId) => apiRequest(`/skill-matrix/employee/${employeeId}`),
  createOrUpdate: (data) =>
    apiRequest('/skill-matrix', { method: 'POST', body: JSON.stringify(data) }),
  addSkill: (id, data) =>
    apiRequest(`/skill-matrix/${id}/skills`, { method: 'POST', body: JSON.stringify(data) }),
  addTraining: (id, data) =>
    apiRequest(`/skill-matrix/${id}/trainings`, { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) =>
    apiRequest(`/skill-matrix/${id}`, { method: 'DELETE' }),
}

// ==================== SURVEYS API ====================

export const surveysAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/surveys${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/surveys/${id}`),
  getResponses: (id) => apiRequest(`/surveys/${id}/responses`),
  create: (data) =>
    apiRequest('/surveys', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    apiRequest(`/surveys/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  submitResponse: (id, data) =>
    apiRequest(`/surveys/${id}/responses`, { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) =>
    apiRequest(`/surveys/${id}`, { method: 'DELETE' }),
}

// ==================== PACKAGES API ====================

export const packagesAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/packages${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/packages/${id}`),
  create: (data) =>
    apiRequest('/packages', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    apiRequest(`/packages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) =>
    apiRequest(`/packages/${id}`, { method: 'DELETE' }),
}

// ==================== MATERIAL CONSUMPTION API ====================

export const materialConsumptionAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/material-consumption${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/material-consumption/${id}`),
  create: (data) =>
    apiRequest('/material-consumption', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    apiRequest(`/material-consumption/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  approve: (id) =>
    apiRequest(`/material-consumption/${id}/approve`, { method: 'PUT' }),
  getWorkOrderSummary: (workOrderId) =>
    apiRequest(`/material-consumption/work-order/${workOrderId}/summary`),
  getScrapAnalysis: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/material-consumption/scrap-analysis${query ? `?${query}` : ''}`)
  },
  delete: (id) =>
    apiRequest(`/material-consumption/${id}`, { method: 'DELETE' }),
}

// ==================== TDS CONFIG API ====================

export const tdsConfigAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/tds-config${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/tds-config/${id}`),
  create: (data) =>
    apiRequest('/tds-config', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    apiRequest(`/tds-config/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) =>
    apiRequest(`/tds-config/${id}`, { method: 'DELETE' }),
}

// ==================== MASTER AGREEMENTS API ====================

export const masterAgreementsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/master-agreements${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/master-agreements/${id}`),
  create: (data) =>
    apiRequest('/master-agreements', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    apiRequest(`/master-agreements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  submitForApproval: (id) =>
    apiRequest(`/master-agreements/${id}/submit-approval`, { method: 'PUT' }),
  processApproval: (id, data) =>
    apiRequest(`/master-agreements/${id}/process-approval`, { method: 'PUT', body: JSON.stringify(data) }),
  completeHandover: (id, data) =>
    apiRequest(`/master-agreements/${id}/handover`, { method: 'PUT', body: JSON.stringify(data) }),
  getPendingApprovals: () =>
    apiRequest('/master-agreements/pending-approvals'),
  delete: (id) =>
    apiRequest(`/master-agreements/${id}`, { method: 'DELETE' }),
}

// ==================== DATA RETENTION API ====================

export const dataRetentionAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/data-retention${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/data-retention/${id}`),
  create: (data) =>
    apiRequest('/data-retention', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    apiRequest(`/data-retention/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) =>
    apiRequest(`/data-retention/${id}`, { method: 'DELETE' }),
}

// ==================== CHANNEL PARTNERS API ====================

export const channelPartnersAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/channel-partners${query ? `?${query}` : ''}`)
  },
  getOne: (id) => apiRequest(`/channel-partners/${id}`),
  create: (data) =>
    apiRequest('/channel-partners', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    apiRequest(`/channel-partners/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  enablePortal: (id, data) =>
    apiRequest(`/channel-partners/${id}/enable-portal`, { method: 'POST', body: JSON.stringify(data) }),
  updateIncentive: (id, data) =>
    apiRequest(`/channel-partners/${id}/incentive`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) =>
    apiRequest(`/channel-partners/${id}`, { method: 'DELETE' }),
}

// ==================== CHANNEL PARTNER PORTAL API ====================

export const channelPartnerPortalAPI = {
  getDashboard: () => apiRequest('/channel-partner-portal/dashboard'),
  getLeads: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/channel-partner-portal/leads${query ? `?${query}` : ''}`)
  },
  submitLead: (data) =>
    apiRequest('/channel-partner-portal/leads', { method: 'POST', body: JSON.stringify(data) }),
  getCommissions: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiRequest(`/channel-partner-portal/commissions${query ? `?${query}` : ''}`)
  },
  getProfile: () => apiRequest('/channel-partner-portal/profile'),
  updateProfile: (data) =>
    apiRequest('/channel-partner-portal/profile', { method: 'PUT', body: JSON.stringify(data) }),
}
