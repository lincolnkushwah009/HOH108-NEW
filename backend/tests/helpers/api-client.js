import supertest from 'supertest'
import express from 'express'
import mongoose from 'mongoose'

// Import models
import Company from '../../models/Company.js'
import User from '../../models/User.js'
import Customer from '../../models/Customer.js'
import Vendor from '../../models/Vendor.js'
import Lead from '../../models/Lead.js'
import Project from '../../models/Project.js'
import Material from '../../models/Material.js'
import PurchaseOrder from '../../models/PurchaseOrder.js'
import SalesOrder from '../../models/SalesOrder.js'
import VendorInvoice from '../../models/VendorInvoice.js'
import CustomerInvoice from '../../models/CustomerInvoice.js'
import Employee from '../../models/Employee.js'
import Department from '../../models/Department.js'
import Leave from '../../models/Leave.js'
import Attendance from '../../models/Attendance.js'
import Ticket from '../../models/Ticket.js'
import Payment from '../../models/Payment.js'
import GoodsReceiptNote from '../../models/GoodsReceiptNote.js'
import StockMovement from '../../models/StockMovement.js'

// Import routes
import authRoutes from '../../routes/auth.js'
import customerRoutes from '../../routes/customers.js'
import vendorRoutes from '../../routes/vendors.js'
import leadRoutes from '../../routes/leads.js'
import projectRoutes from '../../routes/projects.js'
import materialRoutes from '../../routes/materials.js'
import purchaseOrderRoutes from '../../routes/purchaseOrders.js'
import salesOrderRoutes from '../../routes/salesOrders.js'
import vendorInvoiceRoutes from '../../routes/vendorInvoices.js'
import customerInvoiceRoutes from '../../routes/customerInvoices.js'
import employeeRoutes from '../../routes/employees.js'
import departmentRoutes from '../../routes/departments.js'
import leaveRoutes from '../../routes/leaves.js'
import attendanceRoutes from '../../routes/attendance.js'
import ticketRoutes from '../../routes/tickets.js'
import paymentRoutes from '../../routes/payments.js'
import grnRoutes from '../../routes/grn.js'
import stockMovementRoutes from '../../routes/stockMovements.js'

/**
 * Create a test Express app with all routes
 */
export const createTestApp = () => {
  const app = express()

  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  // Mount routes
  app.use('/api/auth', authRoutes)
  app.use('/api/customers', customerRoutes)
  app.use('/api/vendors', vendorRoutes)
  app.use('/api/leads', leadRoutes)
  app.use('/api/projects', projectRoutes)
  app.use('/api/materials', materialRoutes)
  app.use('/api/purchase-orders', purchaseOrderRoutes)
  app.use('/api/sales-orders', salesOrderRoutes)
  app.use('/api/vendor-invoices', vendorInvoiceRoutes)
  app.use('/api/customer-invoices', customerInvoiceRoutes)
  app.use('/api/employees', employeeRoutes)
  app.use('/api/departments', departmentRoutes)
  app.use('/api/leaves', leaveRoutes)
  app.use('/api/attendance', attendanceRoutes)
  app.use('/api/tickets', ticketRoutes)
  app.use('/api/payments', paymentRoutes)
  app.use('/api/grn', grnRoutes)
  app.use('/api/stock-movements', stockMovementRoutes)

  return app
}

/**
 * Create a supertest request instance
 */
export const createRequest = (app) => supertest(app)

/**
 * API Client class for making authenticated requests
 */
export class APIClient {
  constructor(app, token = null, companyId = null) {
    this.app = app
    this.request = supertest(app)
    this.token = token
    this.companyId = companyId
  }

  setToken(token) {
    this.token = token
    return this
  }

  setCompany(companyId) {
    this.companyId = companyId
    return this
  }

  getHeaders() {
    const headers = {}
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }
    if (this.companyId) {
      headers['x-company-id'] = this.companyId.toString()
    }
    return headers
  }

  async get(url, query = {}) {
    return this.request
      .get(url)
      .query(query)
      .set(this.getHeaders())
  }

  async post(url, data = {}) {
    return this.request
      .post(url)
      .send(data)
      .set(this.getHeaders())
  }

  async put(url, data = {}) {
    return this.request
      .put(url)
      .send(data)
      .set(this.getHeaders())
  }

  async patch(url, data = {}) {
    return this.request
      .patch(url)
      .send(data)
      .set(this.getHeaders())
  }

  async delete(url) {
    return this.request
      .delete(url)
      .set(this.getHeaders())
  }

  // Auth endpoints
  async login(email, password) {
    return this.post('/api/auth/login', { email, password })
  }

  async register(userData) {
    return this.post('/api/auth/register', userData)
  }

  async getProfile() {
    return this.get('/api/auth/me')
  }

  // Customer endpoints
  async createCustomer(data) {
    return this.post('/api/customers', data)
  }

  async getCustomers(query = {}) {
    return this.get('/api/customers', query)
  }

  async getCustomer(id) {
    return this.get(`/api/customers/${id}`)
  }

  async updateCustomer(id, data) {
    return this.put(`/api/customers/${id}`, data)
  }

  async deleteCustomer(id) {
    return this.delete(`/api/customers/${id}`)
  }

  // Vendor endpoints
  async createVendor(data) {
    return this.post('/api/vendors', data)
  }

  async getVendors(query = {}) {
    return this.get('/api/vendors', query)
  }

  async getVendor(id) {
    return this.get(`/api/vendors/${id}`)
  }

  async updateVendor(id, data) {
    return this.put(`/api/vendors/${id}`, data)
  }

  // Lead endpoints
  async createLead(data) {
    return this.post('/api/leads', data)
  }

  async getLeads(query = {}) {
    return this.get('/api/leads', query)
  }

  async getLead(id) {
    return this.get(`/api/leads/${id}`)
  }

  async updateLead(id, data) {
    return this.put(`/api/leads/${id}`, data)
  }

  async convertLeadToCustomer(id) {
    return this.post(`/api/leads/${id}/convert`)
  }

  // Project endpoints
  async createProject(data) {
    return this.post('/api/projects', data)
  }

  async getProjects(query = {}) {
    return this.get('/api/projects', query)
  }

  async getProject(id) {
    return this.get(`/api/projects/${id}`)
  }

  async updateProject(id, data) {
    return this.put(`/api/projects/${id}`, data)
  }

  async updateProjectStage(id, stage) {
    return this.put(`/api/projects/${id}/stage`, { stage })
  }

  // Material endpoints
  async createMaterial(data) {
    return this.post('/api/materials', data)
  }

  async getMaterials(query = {}) {
    return this.get('/api/materials', query)
  }

  async getMaterial(id) {
    return this.get(`/api/materials/${id}`)
  }

  async updateMaterial(id, data) {
    return this.put(`/api/materials/${id}`, data)
  }

  // Purchase Order endpoints
  async createPurchaseOrder(data) {
    return this.post('/api/purchase-orders', data)
  }

  async getPurchaseOrders(query = {}) {
    return this.get('/api/purchase-orders', query)
  }

  async getPurchaseOrder(id) {
    return this.get(`/api/purchase-orders/${id}`)
  }

  async updatePurchaseOrder(id, data) {
    return this.put(`/api/purchase-orders/${id}`, data)
  }

  async approvePurchaseOrder(id) {
    return this.put(`/api/purchase-orders/${id}/approve`)
  }

  async submitPurchaseOrder(id) {
    return this.put(`/api/purchase-orders/${id}/submit`)
  }

  // Sales Order endpoints
  async createSalesOrder(data) {
    return this.post('/api/sales-orders', data)
  }

  async getSalesOrders(query = {}) {
    return this.get('/api/sales-orders', query)
  }

  async getSalesOrder(id) {
    return this.get(`/api/sales-orders/${id}`)
  }

  async approveSalesOrder(id) {
    return this.put(`/api/sales-orders/${id}/approve`)
  }

  // Vendor Invoice endpoints
  async createVendorInvoice(data) {
    return this.post('/api/vendor-invoices', data)
  }

  async getVendorInvoices(query = {}) {
    return this.get('/api/vendor-invoices', query)
  }

  async getVendorInvoice(id) {
    return this.get(`/api/vendor-invoices/${id}`)
  }

  async recordVendorPayment(id, paymentData) {
    return this.post(`/api/vendor-invoices/${id}/payments`, paymentData)
  }

  // Customer Invoice endpoints
  async createCustomerInvoice(data) {
    return this.post('/api/customer-invoices', data)
  }

  async getCustomerInvoices(query = {}) {
    return this.get('/api/customer-invoices', query)
  }

  async getCustomerInvoice(id) {
    return this.get(`/api/customer-invoices/${id}`)
  }

  async sendCustomerInvoice(id) {
    return this.put(`/api/customer-invoices/${id}/send`)
  }

  async recordCustomerPayment(id, paymentData) {
    return this.post(`/api/customer-invoices/${id}/payments`, paymentData)
  }

  // Employee endpoints
  async createEmployee(data) {
    return this.post('/api/employees', data)
  }

  async getEmployees(query = {}) {
    return this.get('/api/employees', query)
  }

  async getEmployee(id) {
    return this.get(`/api/employees/${id}`)
  }

  async updateEmployee(id, data) {
    return this.put(`/api/employees/${id}`, data)
  }

  // Department endpoints
  async createDepartment(data) {
    return this.post('/api/departments', data)
  }

  async getDepartments(query = {}) {
    return this.get('/api/departments', query)
  }

  // Leave endpoints
  async createLeaveRequest(data) {
    return this.post('/api/leaves', data)
  }

  async getLeaveRequests(query = {}) {
    return this.get('/api/leaves', query)
  }

  async approveLeave(id) {
    return this.put(`/api/leaves/${id}/approve`)
  }

  async rejectLeave(id, reason) {
    return this.put(`/api/leaves/${id}/reject`, { reason })
  }

  // Attendance endpoints
  async checkIn(data) {
    return this.post('/api/attendance/check-in', data)
  }

  async checkOut(id) {
    return this.put(`/api/attendance/${id}/check-out`)
  }

  async getAttendance(query = {}) {
    return this.get('/api/attendance', query)
  }

  // Ticket endpoints
  async createTicket(data) {
    return this.post('/api/tickets', data)
  }

  async getTickets(query = {}) {
    return this.get('/api/tickets', query)
  }

  async getTicket(id) {
    return this.get(`/api/tickets/${id}`)
  }

  async updateTicketStatus(id, status) {
    return this.put(`/api/tickets/${id}/status`, { status })
  }

  // Payment endpoints
  async createPayment(data) {
    return this.post('/api/payments', data)
  }

  async getPayments(query = {}) {
    return this.get('/api/payments', query)
  }

  // GRN endpoints
  async createGRN(data) {
    return this.post('/api/grn', data)
  }

  async getGRNs(query = {}) {
    return this.get('/api/grn', query)
  }

  async getGRN(id) {
    return this.get(`/api/grn/${id}`)
  }

  async approveGRN(id) {
    return this.put(`/api/grn/${id}/approve`)
  }

  // Stock Movement endpoints
  async createStockMovement(data) {
    return this.post('/api/stock-movements', data)
  }

  async getStockMovements(query = {}) {
    return this.get('/api/stock-movements', query)
  }
}

export default {
  createTestApp,
  createRequest,
  APIClient
}
