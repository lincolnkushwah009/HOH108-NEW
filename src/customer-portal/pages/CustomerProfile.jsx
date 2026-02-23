import { useCustomerAuth } from '../context/CustomerAuthContext'

export default function CustomerProfile() {
  const { customer } = useCustomerAuth()

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1F2937', margin: '0 0 24px' }}>My Profile</h1>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {[
            { label: 'Customer ID', value: customer?.customerId },
            { label: 'Name', value: customer?.name },
            { label: 'Email', value: customer?.email },
            { label: 'Phone', value: customer?.phone },
          ].map((field, i) => (
            <div key={i}>
              <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{field.label}</p>
              <p style={{ fontSize: 15, fontWeight: 500, color: '#1F2937', margin: 0 }}>{field.value || '-'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
