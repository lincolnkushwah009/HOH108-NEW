import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Printer,
  Send,
  CheckCircle,
  CreditCard,
  Clock,
  Mail,
  Phone,
  Briefcase,
  Download,
} from 'lucide-react'
import { customerInvoicesAPI } from '../../utils/api'
import { Button, Badge, Modal, Input, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { formatDate, formatCurrency } from '../../utils/helpers'

const CustomerInvoiceDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const printRef = useRef()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentData, setPaymentData] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    amount: 0,
    paymentMethod: 'bank_transfer',
    referenceNumber: '',
    remarks: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadInvoice()
  }, [id])

  const loadInvoice = async () => {
    try {
      const response = await customerInvoicesAPI.getOne(id)
      setInvoice(response.data)
      setPaymentData(prev => ({ ...prev, amount: response.data?.balanceAmount || 0 }))
    } catch (err) {
      console.error('Failed to load invoice:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    try {
      await customerInvoicesAPI.send(id)
      loadInvoice()
    } catch (err) {
      console.error('Failed to send invoice:', err)
    }
  }

  const handleRecordPayment = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await customerInvoicesAPI.recordPayment(id, paymentData)
      setShowPaymentModal(false)
      loadInvoice()
    } catch (err) {
      console.error('Failed to record payment:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handlePrint = () => {
    const printContent = printRef.current
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${invoice?.invoiceNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 48px; color: #111; line-height: 1.5; }
            .invoice { max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; }
            .logo-section img { height: 80px; width: auto; }
            .invoice-info { text-align: right; }
            .invoice-number { font-size: 14px; color: #666; }
            .invoice-number strong { font-size: 20px; color: #111; display: block; margin-top: 4px; }
            .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-bottom: 40px; }
            .party-label { font-size: 11px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
            .party-name { font-size: 16px; font-weight: 600; color: #111; margin-bottom: 4px; }
            .party-detail { font-size: 13px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
            th { text-align: left; padding: 12px 0; font-size: 11px; font-weight: 600; color: #999; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #111; }
            th:last-child { text-align: right; }
            td { padding: 16px 0; font-size: 14px; color: #333; border-bottom: 1px solid #eee; }
            td:last-child { text-align: right; font-weight: 500; }
            .item-desc { font-weight: 500; color: #111; }
            .item-code { font-size: 12px; color: #999; margin-top: 2px; }
            .summary { display: flex; justify-content: flex-end; }
            .summary-box { width: 280px; }
            .summary-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #666; }
            .summary-total { display: flex; justify-content: space-between; padding: 16px 0; margin-top: 8px; border-top: 2px solid #111; font-size: 18px; font-weight: 700; color: #111; }
            .notes { margin-top: 48px; padding-top: 24px; border-top: 1px solid #eee; }
            .notes-label { font-size: 11px; font-weight: 600; color: #999; text-transform: uppercase; margin-bottom: 8px; }
            .notes-text { font-size: 13px; color: #666; }
            @media print { body { padding: 24px; } }
          </style>
        </head>
        <body>
          <div class="invoice">${printContent.innerHTML}</div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const statusConfig = {
    draft: { color: 'gray', label: 'Draft' },
    sent: { color: 'blue', label: 'Sent' },
    partially_paid: { color: 'yellow', label: 'Partial' },
    paid: { color: 'green', label: 'Paid' },
    overdue: { color: 'red', label: 'Overdue' },
    cancelled: { color: 'gray', label: 'Cancelled' },
    unpaid: { color: 'yellow', label: 'Unpaid' },
  }

  if (loading) return <PageLoader />

  if (!invoice) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <p style={{ color: '#666', marginBottom: 16 }}>Invoice not found</p>
        <Button onClick={() => navigate('/admin/customer-invoices')}>Back to Invoices</Button>
      </div>
    )
  }

  const status = statusConfig[invoice.paymentStatus] || statusConfig.unpaid

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => navigate('/admin/customer-invoices')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8, display: 'flex' }}
              onMouseOver={e => e.currentTarget.style.background = '#f5f5f5'}
              onMouseOut={e => e.currentTarget.style.background = 'none'}
            >
              <ArrowLeft size={20} color="#666" />
            </button>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 600, color: '#111', margin: 0 }}>{invoice.invoiceNumber}</h1>
              <p style={{ fontSize: 13, color: '#888', margin: 0 }}>{invoice.customer?.name}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={handlePrint}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'white', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#333' }}
              onMouseOver={e => e.currentTarget.style.borderColor = '#bbb'}
              onMouseOut={e => e.currentTarget.style.borderColor = '#ddd'}
            >
              <Printer size={16} />
              Print
            </button>
            {invoice.status === 'draft' && (
              <button
                onClick={handleSend}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'white', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#333' }}
              >
                <Send size={16} />
                Send
              </button>
            )}
            {['unpaid', 'partially_paid', 'overdue'].includes(invoice.paymentStatus) && (
              <button
                onClick={() => setShowPaymentModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#111', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'white' }}
              >
                <CreditCard size={16} />
                Record Payment
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32 }}>
          {/* Main Invoice */}
          <div>
            {/* Summary Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
              <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #eee' }}>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: '#111', margin: 0 }}>{formatCurrency(invoice.invoiceTotal)}</p>
              </div>
              <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #eee' }}>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Paid</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: '#22c55e', margin: 0 }}>{formatCurrency(invoice.paidAmount || 0)}</p>
              </div>
              <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #eee' }}>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Balance</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: invoice.balanceAmount > 0 ? '#f59e0b' : '#22c55e', margin: 0 }}>{formatCurrency(invoice.balanceAmount)}</p>
              </div>
              <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #eee' }}>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</p>
                <Badge color={status.color}>{status.label}</Badge>
              </div>
            </div>

            {/* Invoice Card */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #eee', overflow: 'hidden' }}>
              <div ref={printRef} style={{ padding: 40 }}>
                {/* Header */}
                <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 48 }}>
                  <div className="logo-section">
                    <img src="/Logo.png" alt="Logo" style={{ height: 80, width: 'auto' }} />
                  </div>
                  <div className="invoice-info" style={{ textAlign: 'right' }}>
                    <div className="invoice-number" style={{ fontSize: 13, color: '#888' }}>
                      Invoice
                      <strong style={{ display: 'block', fontSize: 18, color: '#111', marginTop: 4 }}>{invoice.invoiceNumber}</strong>
                    </div>
                    <div style={{ fontSize: 13, color: '#888', marginTop: 8 }}>
                      {formatDate(invoice.invoiceDate)}
                    </div>
                  </div>
                </div>

                {/* Parties */}
                <div className="parties" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, marginBottom: 40 }}>
                  <div>
                    <div className="party-label" style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Bill To</div>
                    <div className="party-name" style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 4 }}>{invoice.customer?.name || '-'}</div>
                    {invoice.billingAddress && (
                      <div className="party-detail" style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
                        {invoice.billingAddress.street && <div>{invoice.billingAddress.street}</div>}
                        <div>{[invoice.billingAddress.city, invoice.billingAddress.state, invoice.billingAddress.pincode].filter(Boolean).join(', ')}</div>
                        {invoice.billingAddress.gstNumber && <div style={{ marginTop: 8 }}>GST: {invoice.billingAddress.gstNumber}</div>}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="party-label" style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Details</div>
                    <div style={{ fontSize: 13, color: '#666' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span>Invoice Date</span>
                        <span style={{ color: '#111', fontWeight: 500 }}>{formatDate(invoice.invoiceDate)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span>Due Date</span>
                        <span style={{ color: '#111', fontWeight: 500 }}>{formatDate(invoice.dueDate) || '-'}</span>
                      </div>
                      {invoice.project && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Project</span>
                          <span style={{ color: '#111', fontWeight: 500 }}>{invoice.project.title}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Line Items */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 32 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '12px 0', fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #111' }}>Description</th>
                      <th style={{ textAlign: 'center', padding: '12px 0', fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #111', width: 80 }}>Qty</th>
                      <th style={{ textAlign: 'right', padding: '12px 0', fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #111', width: 100 }}>Rate</th>
                      <th style={{ textAlign: 'center', padding: '12px 0', fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #111', width: 60 }}>Tax</th>
                      <th style={{ textAlign: 'right', padding: '12px 0', fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #111', width: 120 }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.lineItems?.map((item, index) => (
                      <tr key={index}>
                        <td style={{ padding: '16px 0', fontSize: 14, color: '#333', borderBottom: '1px solid #eee' }}>
                          <div className="item-desc" style={{ fontWeight: 500, color: '#111' }}>{item.description}</div>
                          {(item.hsnCode || item.sacCode) && (
                            <div className="item-code" style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                              {item.hsnCode ? `HSN: ${item.hsnCode}` : ''} {item.sacCode ? `SAC: ${item.sacCode}` : ''}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '16px 0', fontSize: 14, color: '#666', borderBottom: '1px solid #eee', textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ padding: '16px 0', fontSize: 14, color: '#666', borderBottom: '1px solid #eee', textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                        <td style={{ padding: '16px 0', fontSize: 14, color: '#666', borderBottom: '1px solid #eee', textAlign: 'center' }}>{item.taxRate}%</td>
                        <td style={{ padding: '16px 0', fontSize: 14, color: '#111', borderBottom: '1px solid #eee', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Summary */}
                <div className="summary" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div className="summary-box" style={{ width: 280 }}>
                    <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14, color: '#666' }}>
                      <span>Subtotal</span>
                      <span>{formatCurrency(invoice.subTotal)}</span>
                    </div>
                    {invoice.totalDiscount > 0 && (
                      <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14, color: '#666' }}>
                        <span>Discount</span>
                        <span style={{ color: '#ef4444' }}>-{formatCurrency(invoice.totalDiscount)}</span>
                      </div>
                    )}
                    {invoice.totalCGST > 0 && (
                      <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14, color: '#666' }}>
                        <span>CGST</span>
                        <span>{formatCurrency(invoice.totalCGST)}</span>
                      </div>
                    )}
                    {invoice.totalSGST > 0 && (
                      <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14, color: '#666' }}>
                        <span>SGST</span>
                        <span>{formatCurrency(invoice.totalSGST)}</span>
                      </div>
                    )}
                    {invoice.totalIGST > 0 && (
                      <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14, color: '#666' }}>
                        <span>IGST</span>
                        <span>{formatCurrency(invoice.totalIGST)}</span>
                      </div>
                    )}
                    {invoice.shippingCharges > 0 && (
                      <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14, color: '#666' }}>
                        <span>Shipping</span>
                        <span>{formatCurrency(invoice.shippingCharges)}</span>
                      </div>
                    )}
                    {invoice.otherCharges > 0 && (
                      <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14, color: '#666' }}>
                        <span>Other Charges</span>
                        <span>{formatCurrency(invoice.otherCharges)}</span>
                      </div>
                    )}
                    <div className="summary-total" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', marginTop: 8, borderTop: '2px solid #111', fontSize: 18, fontWeight: 700, color: '#111' }}>
                      <span>Total</span>
                      <span>{formatCurrency(invoice.invoiceTotal)}</span>
                    </div>
                    {invoice.paidAmount > 0 && invoice.balanceAmount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14, color: '#22c55e' }}>
                        <span>Paid</span>
                        <span>-{formatCurrency(invoice.paidAmount)}</span>
                      </div>
                    )}
                    {invoice.balanceAmount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', marginTop: 8, background: '#fef3c7', borderRadius: 8, fontSize: 15, fontWeight: 600, color: '#92400e' }}>
                        <span>Balance Due</span>
                        <span>{formatCurrency(invoice.balanceAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {invoice.notes && (
                  <div className="notes" style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #eee' }}>
                    <div className="notes-label" style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', marginBottom: 8 }}>Notes</div>
                    <div className="notes-text" style={{ fontSize: 13, color: '#666' }}>{invoice.notes}</div>
                  </div>
                )}

                {invoice.termsAndConditions && (
                  <div style={{ marginTop: 24 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', marginBottom: 8 }}>Terms & Conditions</div>
                    <div style={{ fontSize: 13, color: '#666', whiteSpace: 'pre-line' }}>{invoice.termsAndConditions}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Customer */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #eee', padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: '0 0 20px 0' }}>Customer</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <p style={{ fontSize: 12, color: '#888', margin: '0 0 4px 0' }}>Name</p>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#111', margin: 0 }}>{invoice.customer?.name || '-'}</p>
                </div>
                {invoice.customer?.email && (
                  <div>
                    <p style={{ fontSize: 12, color: '#888', margin: '0 0 4px 0' }}>Email</p>
                    <p style={{ fontSize: 14, color: '#111', margin: 0 }}>{invoice.customer.email}</p>
                  </div>
                )}
                {invoice.customer?.phone && (
                  <div>
                    <p style={{ fontSize: 12, color: '#888', margin: '0 0 4px 0' }}>Phone</p>
                    <p style={{ fontSize: 14, color: '#111', margin: 0 }}>{invoice.customer.phone}</p>
                  </div>
                )}
                {invoice.project && (
                  <div>
                    <p style={{ fontSize: 12, color: '#888', margin: '0 0 4px 0' }}>Project</p>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#111', margin: 0 }}>{invoice.project.title}</p>
                    <p style={{ fontSize: 12, color: '#888', margin: 0 }}>{invoice.project.projectId}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payments */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #eee', padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: '0 0 20px 0' }}>Payments</h3>
              {invoice.payments?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {invoice.payments.map((payment, index) => (
                    <div key={index} style={{ padding: 16, background: '#f0fdf4', borderRadius: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: '#16a34a' }}>{formatCurrency(payment.amount)}</span>
                        <span style={{ fontSize: 11, padding: '4px 10px', background: '#dcfce7', color: '#15803d', borderRadius: 20, fontWeight: 500 }}>
                          {payment.paymentMethod?.replace('_', ' ')}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: '#666', margin: 0 }}>{formatDate(payment.paymentDate)}</p>
                      {payment.referenceNumber && (
                        <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0 0' }}>Ref: {payment.referenceNumber}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <CreditCard size={24} color="#ddd" style={{ marginBottom: 8 }} />
                  <p style={{ fontSize: 13, color: '#888', margin: 0 }}>No payments yet</p>
                </div>
              )}
            </div>

            {/* Activity */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #eee', padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: '0 0 20px 0' }}>Activity</h3>
              {invoice.activities?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {invoice.activities.slice(0, 5).map((activity, index) => (
                    <div key={index} style={{ display: 'flex', gap: 12, position: 'relative' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ddd', marginTop: 6, flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: 13, color: '#333', margin: 0 }}>{activity.description || activity.action}</p>
                        <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0 0' }}>
                          {activity.performedByName} &middot; {formatDate(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <Clock size={24} color="#ddd" style={{ marginBottom: 8 }} />
                  <p style={{ fontSize: 13, color: '#888', margin: 0 }}>No activity</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Record Payment"
      >
        <form onSubmit={handleRecordPayment}>
          <div style={{ padding: '20px 0 24px 0', textAlign: 'center', borderBottom: '1px solid #eee', marginBottom: 24 }}>
            <p style={{ fontSize: 13, color: '#888', margin: '0 0 4px 0' }}>Balance Due</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#111', margin: 0 }}>{formatCurrency(invoice.balanceAmount)}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input
              label="Payment Date"
              type="date"
              value={paymentData.paymentDate}
              onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
              required
            />

            <Input
              label="Amount"
              type="number"
              value={paymentData.amount}
              onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
              prefix="₹"
              required
            />

            <Select
              label="Payment Method"
              options={[
                { value: 'bank_transfer', label: 'Bank Transfer' },
                { value: 'cheque', label: 'Cheque' },
                { value: 'cash', label: 'Cash' },
                { value: 'upi', label: 'UPI' },
                { value: 'card', label: 'Card' },
                { value: 'other', label: 'Other' },
              ]}
              value={paymentData.paymentMethod}
              onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
            />

            <Input
              label="Reference Number"
              value={paymentData.referenceNumber}
              onChange={(e) => setPaymentData({ ...paymentData, referenceNumber: e.target.value })}
              placeholder="Transaction ID, Cheque No, etc."
            />

            <Input
              label="Remarks"
              value={paymentData.remarks}
              onChange={(e) => setPaymentData({ ...paymentData, remarks: e.target.value })}
              placeholder="Optional notes"
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <Button type="button" variant="outline" onClick={() => setShowPaymentModal(false)} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting} style={{ flex: 1 }}>
              Record Payment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default CustomerInvoiceDetail
