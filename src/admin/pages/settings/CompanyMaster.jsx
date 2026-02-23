import { useState, useEffect } from 'react'
import { Plus, Building2, Building, Globe, Edit, Trash2, Sprout, CheckCircle, XCircle, Lock } from 'lucide-react'
import { companiesAPI, generalLedgerAPI } from '../../utils/api'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Modal, Input, Select, useToast } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'

const EMPTY_FORM = {
  code: '',
  name: '',
  type: 'subsidiary',
  parentCompany: '',
  gstin: '',
  gstState: '',
  gstStateCode: '',
  gstRegistrationType: '',
  pan: '',
  tan: '',
  cin: '',
  email: '',
  phone: '',
}

const GST_REG_TYPES = [
  { value: 'regular', label: 'Regular' },
  { value: 'composition', label: 'Composition' },
  { value: 'unregistered', label: 'Unregistered' },
  { value: 'consumer', label: 'Consumer' },
  { value: 'overseas', label: 'Overseas' },
  { value: 'sez', label: 'SEZ' },
]

const INDIAN_STATES = [
  { value: 'Andhra Pradesh', label: 'Andhra Pradesh', code: '37' },
  { value: 'Arunachal Pradesh', label: 'Arunachal Pradesh', code: '12' },
  { value: 'Assam', label: 'Assam', code: '18' },
  { value: 'Bihar', label: 'Bihar', code: '10' },
  { value: 'Chhattisgarh', label: 'Chhattisgarh', code: '22' },
  { value: 'Delhi', label: 'Delhi', code: '07' },
  { value: 'Goa', label: 'Goa', code: '30' },
  { value: 'Gujarat', label: 'Gujarat', code: '24' },
  { value: 'Haryana', label: 'Haryana', code: '06' },
  { value: 'Himachal Pradesh', label: 'Himachal Pradesh', code: '02' },
  { value: 'Jharkhand', label: 'Jharkhand', code: '20' },
  { value: 'Karnataka', label: 'Karnataka', code: '29' },
  { value: 'Kerala', label: 'Kerala', code: '32' },
  { value: 'Madhya Pradesh', label: 'Madhya Pradesh', code: '23' },
  { value: 'Maharashtra', label: 'Maharashtra', code: '27' },
  { value: 'Manipur', label: 'Manipur', code: '14' },
  { value: 'Meghalaya', label: 'Meghalaya', code: '17' },
  { value: 'Mizoram', label: 'Mizoram', code: '15' },
  { value: 'Nagaland', label: 'Nagaland', code: '13' },
  { value: 'Odisha', label: 'Odisha', code: '21' },
  { value: 'Punjab', label: 'Punjab', code: '03' },
  { value: 'Rajasthan', label: 'Rajasthan', code: '08' },
  { value: 'Sikkim', label: 'Sikkim', code: '11' },
  { value: 'Tamil Nadu', label: 'Tamil Nadu', code: '33' },
  { value: 'Telangana', label: 'Telangana', code: '36' },
  { value: 'Tripura', label: 'Tripura', code: '16' },
  { value: 'Uttar Pradesh', label: 'Uttar Pradesh', code: '09' },
  { value: 'Uttarakhand', label: 'Uttarakhand', code: '05' },
  { value: 'West Bengal', label: 'West Bengal', code: '19' },
  { value: 'Jammu and Kashmir', label: 'Jammu and Kashmir', code: '01' },
  { value: 'Ladakh', label: 'Ladakh', code: '02' },
  { value: 'Chandigarh', label: 'Chandigarh', code: '04' },
  { value: 'Dadra and Nagar Haveli', label: 'Dadra and Nagar Haveli', code: '26' },
  { value: 'Daman and Diu', label: 'Daman and Diu', code: '25' },
  { value: 'Lakshadweep', label: 'Lakshadweep', code: '31' },
  { value: 'Puducherry', label: 'Puducherry', code: '34' },
  { value: 'Andaman and Nicobar Islands', label: 'Andaman and Nicobar Islands', code: '35' },
]

const CompanyMaster = () => {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ show: false, edit: false, data: null })
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [seedingId, setSeedingId] = useState(null)
  const toast = useToast()

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    setLoading(true)
    try {
      const response = await companiesAPI.getAll()
      setCompanies(response.data || response || [])
    } catch (err) {
      console.error('Failed to load companies:', err)
      toast.error('Failed to load companies')
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = () => {
    setFormData(EMPTY_FORM)
    setModal({ show: true, edit: false, data: null })
  }

  const openEditModal = (company) => {
    setFormData({
      code: company.code || '',
      name: company.name || '',
      type: company.type || 'subsidiary',
      parentCompany: company.parentCompany || '',
      gstin: company.gstin || '',
      gstState: company.gstState || '',
      gstStateCode: company.gstStateCode || '',
      gstRegistrationType: company.gstRegistrationType || '',
      pan: company.pan || '',
      tan: company.tan || '',
      cin: company.cin || '',
      email: company.email || '',
      phone: company.phone || '',
    })
    setModal({ show: true, edit: true, data: company })
  }

  const closeModal = () => {
    setModal({ show: false, edit: false, data: null })
    setFormData(EMPTY_FORM)
  }

  const handleFieldChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      if (field === 'gstState') {
        const state = INDIAN_STATES.find(s => s.value === value)
        if (state) updated.gstStateCode = state.code
      }
      if (field === 'type' && value === 'mother') {
        updated.parentCompany = ''
      }
      return updated
    })
  }

  const handleSubmit = async () => {
    if (!formData.code || !formData.name) {
      toast.error('Code and Name are required')
      return
    }
    setSaving(true)
    try {
      const payload = { ...formData }
      // Remove empty parentCompany to avoid ObjectId cast error
      if (!payload.parentCompany) delete payload.parentCompany
      if (modal.edit && modal.data) {
        await companiesAPI.update(modal.data._id, payload)
        toast.success('Entity updated successfully')
      } else {
        await companiesAPI.create(payload)
        toast.success('Entity created successfully')
      }
      closeModal()
      loadCompanies()
    } catch (err) {
      console.error('Failed to save entity:', err)
      toast.error(err.message || 'Failed to save entity')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (company) => {
    if (!confirm(`Delete entity "${company.name}"? This action cannot be undone.`)) return
    try {
      await companiesAPI.delete(company._id)
      toast.success('Entity deleted successfully')
      loadCompanies()
    } catch (err) {
      console.error('Failed to delete entity:', err)
      toast.error(err.message || 'Failed to delete entity')
    }
  }

  const handleSeedCoA = async (company) => {
    if (!confirm(`Seed Indian Chart of Accounts for "${company.name}"? This will create standard ledger accounts.`)) return
    setSeedingId(company._id)
    try {
      await generalLedgerAPI.seedIndianCoA(company._id)
      toast.success('Indian Chart of Accounts seeded successfully')
    } catch (err) {
      console.error('Failed to seed CoA:', err)
      toast.error(err.message || 'Failed to seed Chart of Accounts')
    } finally {
      setSeedingId(null)
    }
  }

  const motherCompany = companies.find(c => c.type === 'mother')
  const activeCount = companies.filter(c => c.status === 'active' || !c.status).length
  const parentOptions = companies
    .filter(c => c.type === 'mother')
    .map(c => ({ value: c._id, label: c.name }))

  if (loading) return <PageLoader />

  return (
    <div>
      <PageHeader
        title="Company Master"
        description="Manage company entities and subsidiaries"
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Settings', path: '/admin/settings' },
          { label: 'Company Master' },
        ]}
        actions={
          <Button icon={Plus} onClick={openAddModal}>Add Entity</Button>
        }
      />

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'rgba(197, 156, 130, 0.15)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Building2 size={24} style={{ color: '#C59C82' }} />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Total Entities</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>{companies.length}</div>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle size={24} style={{ color: '#059669' }} />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Active Entities</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>{activeCount}</div>
            </div>
          </div>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'rgba(59, 130, 246, 0.15)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Globe size={24} style={{ color: '#3B82F6' }} />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Mother Company</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', marginTop: '2px' }}>
                {motherCompany ? motherCompany.name : 'Not Set'}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Companies Table */}
      <Card padding="none">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                {['Code', 'Name', 'Type', 'GSTIN', 'PAN', 'Status', 'Actions'].map(header => (
                  <th key={header} style={{
                    padding: '14px 16px', textAlign: 'left',
                    fontSize: '12px', fontWeight: 600, color: '#64748b',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 16px', textAlign: 'center', color: '#94a3b8' }}>
                    No entities found. Click "Add Entity" to create one.
                  </td>
                </tr>
              ) : (
                companies.map(company => (
                  <tr key={company._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 500, color: '#1e293b', fontFamily: 'monospace' }}>
                      {company.code || '-'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '10px',
                          background: company.type === 'mother' ? 'rgba(197, 156, 130, 0.15)' : '#f1f5f9',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {company.type === 'mother'
                            ? <Building2 size={18} style={{ color: '#C59C82' }} />
                            : <Building size={18} style={{ color: '#64748b' }} />
                          }
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 500, color: '#1e293b' }}>{company.name}</div>
                          {company.email && (
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{company.email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-block', padding: '4px 12px', borderRadius: '20px',
                        fontSize: '12px', fontWeight: 600,
                        background: company.type === 'mother' ? 'rgba(197, 156, 130, 0.15)' : '#f1f5f9',
                        color: company.type === 'mother' ? '#C59C82' : '#64748b',
                      }}>
                        {company.type === 'mother' ? 'Mother' : 'Subsidiary'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569', fontFamily: 'monospace' }}>
                      {company.gstin || '-'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569', fontFamily: 'monospace' }}>
                      {company.pan || '-'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                        background: (company.status === 'active' || !company.status) ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: (company.status === 'active' || !company.status) ? '#059669' : '#DC2626',
                      }}>
                        {(company.status === 'active' || !company.status)
                          ? <><CheckCircle size={12} /> Active</>
                          : <><XCircle size={12} /> Inactive</>
                        }
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {company.type === 'mother' ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            padding: '6px 12px', borderRadius: '8px', fontSize: '12px',
                            color: '#94a3b8', background: '#f8fafc',
                          }}>
                            <Lock size={13} /> Default
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => openEditModal(company)}
                              title="Edit"
                              style={{
                                padding: '8px', background: '#f1f5f9', border: 'none',
                                borderRadius: '8px', cursor: 'pointer', color: '#475569',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0' }}
                              onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9' }}
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              onClick={() => handleSeedCoA(company)}
                              title="Seed Indian CoA"
                              disabled={seedingId === company._id}
                              style={{
                                padding: '8px', background: 'rgba(197, 156, 130, 0.1)', border: 'none',
                                borderRadius: '8px', cursor: seedingId === company._id ? 'not-allowed' : 'pointer',
                                color: '#C59C82', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s', opacity: seedingId === company._id ? 0.6 : 1,
                              }}
                              onMouseEnter={e => { if (seedingId !== company._id) e.currentTarget.style.background = 'rgba(197, 156, 130, 0.2)' }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(197, 156, 130, 0.1)' }}
                            >
                              <Sprout size={15} />
                            </button>
                            <button
                              onClick={() => handleDelete(company)}
                              title="Delete"
                              style={{
                                padding: '8px', background: 'rgba(239, 68, 68, 0.08)', border: 'none',
                                borderRadius: '8px', cursor: 'pointer', color: '#DC2626',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)' }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)' }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modal.show}
        onClose={closeModal}
        title={modal.edit ? 'Edit Entity' : 'Add New Entity'}
        description={modal.edit ? 'Update company entity details' : 'Create a new company entity'}
        size="lg"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input
            label="Entity Code *"
            placeholder="e.g. IPPL"
            value={formData.code}
            onChange={e => handleFieldChange('code', e.target.value)}
          />
          <Input
            label="Entity Name *"
            placeholder="Company name"
            value={formData.name}
            onChange={e => handleFieldChange('name', e.target.value)}
          />
          <Select
            label="Entity Type"
            value={formData.type}
            onChange={e => handleFieldChange('type', e.target.value)}
            options={[
              { value: 'mother', label: 'Mother Company' },
              { value: 'subsidiary', label: 'Subsidiary' },
            ]}
          />
          {formData.type === 'subsidiary' && (
            <Select
              label="Parent Company"
              value={formData.parentCompany}
              onChange={e => handleFieldChange('parentCompany', e.target.value)}
              options={parentOptions}
              placeholder="Select parent..."
            />
          )}
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', marginBottom: '12px', marginTop: '8px' }}>
              GST Details
            </div>
          </div>
          <Input
            label="GSTIN"
            placeholder="e.g. 27AABCU9603R1ZM"
            value={formData.gstin}
            onChange={e => handleFieldChange('gstin', e.target.value)}
          />
          <Select
            label="GST State"
            value={formData.gstState}
            onChange={e => handleFieldChange('gstState', e.target.value)}
            options={INDIAN_STATES}
            placeholder="Select state..."
          />
          <Input
            label="GST State Code"
            placeholder="e.g. 27"
            value={formData.gstStateCode}
            onChange={e => handleFieldChange('gstStateCode', e.target.value)}
          />
          <Select
            label="GST Registration Type"
            value={formData.gstRegistrationType}
            onChange={e => handleFieldChange('gstRegistrationType', e.target.value)}
            options={GST_REG_TYPES}
            placeholder="Select type..."
          />
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', marginBottom: '12px', marginTop: '8px' }}>
              Tax & Registration
            </div>
          </div>
          <Input
            label="PAN"
            placeholder="e.g. AABCU9603R"
            value={formData.pan}
            onChange={e => handleFieldChange('pan', e.target.value)}
          />
          <Input
            label="TAN"
            placeholder="e.g. MUMA12345B"
            value={formData.tan}
            onChange={e => handleFieldChange('tan', e.target.value)}
          />
          <Input
            label="CIN"
            placeholder="e.g. U12345MH2020PTC123456"
            value={formData.cin}
            onChange={e => handleFieldChange('cin', e.target.value)}
          />
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', marginBottom: '12px', marginTop: '8px' }}>
              Contact Details
            </div>
          </div>
          <Input
            label="Email"
            type="email"
            placeholder="company@example.com"
            value={formData.email}
            onChange={e => handleFieldChange('email', e.target.value)}
          />
          <Input
            label="Phone"
            type="tel"
            placeholder="+91 9876543210"
            value={formData.phone}
            onChange={e => handleFieldChange('phone', e.target.value)}
          />
        </div>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal}>Cancel</Button>
          <Button onClick={handleSubmit} loading={saving}>
            {modal.edit ? 'Update Entity' : 'Create Entity'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default CompanyMaster
