import { useState, useEffect } from 'react'
import { useCustomerAuth } from '../context/CustomerAuthContext'
import { FileText } from 'lucide-react'

const API_BASE_URL = import.meta.env.PROD
  ? 'https://hoh108.com/api'
  : `http://${window.location.hostname}:5001/api`

export default function CustomerInvoices() {
  const { customer } = useCustomerAuth()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (customer?._id) {
      const token = localStorage.getItem('customer_portal_token')
      fetch(`${API_BASE_URL}/customer-portal/invoices?customerId=${customer._id}`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      })
        .then(r => r.json())
        .then(res => setInvoices(res.data || []))
        .catch(err => console.error(err))
        .finally(() => setLoading(false))
    }
  }, [customer])

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF' }}>Loading invoices...</div>

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1F2937', margin: '0 0 24px' }}>Invoices</h1>
      {invoices.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, padding: 40, textAlign: 'center', border: '1px solid #E5E7EB' }}>
          <FileText size={40} style={{ color: '#D1D5DB', marginBottom: 12 }} />
          <p style={{ color: '#6B7280', margin: 0 }}>No invoices yet</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #E5E7EB' }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                {['Invoice #', 'Date', 'Amount', 'Paid', 'Balance', 'Status'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6B7280', borderBottom: '1px solid #E5E7EB' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv._id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: '#1F2937' }}>{inv.invoiceNumber}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#6B7280' }}>{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString('en-IN') : '-'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: '#1F2937' }}>₹{(inv.invoiceTotal || 0).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#10B981' }}>₹{(inv.paidAmount || 0).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#EF4444', fontWeight: 500 }}>₹{(inv.balanceAmount || 0).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: inv.paymentStatus === 'paid' ? '#D1FAE5' : inv.paymentStatus === 'overdue' ? '#FEE2E2' : '#FEF3C7',
                      color: inv.paymentStatus === 'paid' ? '#065F46' : inv.paymentStatus === 'overdue' ? '#991B1B' : '#92400E',
                    }}>
                      {inv.paymentStatus || inv.status || 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
