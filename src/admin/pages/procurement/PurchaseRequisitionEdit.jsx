import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Input, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { purchaseRequisitionsAPI, projectsAPI, materialsAPI, vendorsAPI } from '../../utils/api'

const PurchaseRequisitionEdit = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [projects, setProjects] = useState([])
  const [materials, setMaterials] = useState([])
  const [vendors, setVendors] = useState([])
  const [formData, setFormData] = useState({
    vendor: '',
    project: '',
    material: '',
    quantity: '',
    estimatedUnitPrice: '',
    deliveryLocation: '',
    requiredByDate: '',
    requisitionReason: '',
    priority: 'medium'
  })
  const [originalData, setOriginalData] = useState(null)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      const [prRes, projectsRes, materialsRes, vendorsRes] = await Promise.all([
        purchaseRequisitionsAPI.getOne(id),
        projectsAPI.getAll({ limit: 100 }),
        materialsAPI.getAll({ limit: 100 }),
        vendorsAPI.getAll({ limit: 100, status: 'active' })
      ])

      setProjects(projectsRes.data || [])
      setMaterials(materialsRes.data || [])
      setVendors(vendorsRes.data || [])

      const pr = prRes.data
      setOriginalData(pr)

      // Extract data from the PR
      const lineItem = pr.lineItems?.[0] || {}
      setFormData({
        vendor: pr.targetVendor?._id || pr.targetVendor || '',
        project: pr.project?._id || pr.project || '',
        material: lineItem.material?._id || lineItem.material || '',
        quantity: lineItem.quantity?.toString() || '',
        estimatedUnitPrice: lineItem.estimatedUnitPrice?.toString() || '',
        deliveryLocation: lineItem.remarks?.replace('Delivery: ', '') || '',
        requiredByDate: pr.requiredDate ? new Date(pr.requiredDate).toISOString().split('T')[0] : '',
        requisitionReason: pr.purpose || '',
        priority: pr.priority || 'medium'
      })
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const selectedMaterial = materials.find(m => m._id === formData.material)

      const payload = {
        project: formData.project,
        targetVendor: formData.vendor,
        purpose: formData.requisitionReason || `Purchase requisition for ${selectedMaterial?.materialName || 'material'}`,
        requiredDate: formData.requiredByDate,
        priority: formData.priority,
        lineItems: [{
          material: formData.material,
          description: selectedMaterial?.materialName || 'Material',
          itemCode: selectedMaterial?.skuCode || '',
          unit: selectedMaterial?.unit || 'kg',
          quantity: parseInt(formData.quantity) || 1,
          estimatedUnitPrice: parseFloat(formData.estimatedUnitPrice) || 0,
          remarks: formData.deliveryLocation ? `Delivery: ${formData.deliveryLocation}` : ''
        }]
      }

      await purchaseRequisitionsAPI.update(id, payload)
      navigate(`/admin/purchase-requisitions/${id}`)
    } catch (err) {
      console.error('Failed to update requisition:', err)
      alert('Failed to update requisition')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader />

  if (!originalData) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <p style={{ color: '#666', marginBottom: 16 }}>Purchase requisition not found</p>
        <Button onClick={() => navigate('/admin/purchase-requisitions')}>Back to Requisitions</Button>
      </div>
    )
  }

  // Check if PR can be edited
  if (!['draft', 'submitted'].includes(originalData.status)) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <p style={{ color: '#666', marginBottom: 16 }}>This requisition cannot be edited in its current status.</p>
        <Button onClick={() => navigate(`/admin/purchase-requisitions/${id}`)}>View Requisition</Button>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={`Edit ${originalData.prNumber}`}
        description="Update purchase requisition details"
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Procurement' },
          { label: 'Purchase Requisitions', path: '/admin/purchase-requisitions' },
          { label: 'Edit' }
        ]}
        actions={
          <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate(`/admin/purchase-requisitions/${id}`)}>
            Back
          </Button>
        }
      />

      <Card className="max-w-3xl">
        <form onSubmit={handleSave} className="p-6 space-y-6">
          <Select
            label="Vendor"
            options={[
              { value: '', label: 'Select Vendor' },
              ...vendors.map(v => ({ value: v._id, label: `${v.name} (${v.vendorId || ''})` }))
            ]}
            value={formData.vendor}
            onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
            required
          />

          <Select
            label="Project"
            options={[
              { value: '', label: 'Select Project' },
              ...projects.map(p => ({ value: p._id, label: `${p.title || p.name} (${p.projectId || ''})` }))
            ]}
            value={formData.project}
            onChange={(e) => setFormData({ ...formData, project: e.target.value })}
            required
          />

          <Select
            label="Material"
            options={[
              { value: '', label: 'Select Material' },
              ...materials.map(m => ({ value: m._id, label: `${m.materialName || m.name} (${m.unit || ''})` }))
            ]}
            value={formData.material}
            onChange={(e) => setFormData({ ...formData, material: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
            />
            <Input
              label="Estimated Unit Price (INR)"
              type="number"
              value={formData.estimatedUnitPrice}
              onChange={(e) => setFormData({ ...formData, estimatedUnitPrice: e.target.value })}
              required
            />
          </div>

          <Select
            label="Priority"
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' }
            ]}
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
          />

          <Input
            label="Delivery Location"
            value={formData.deliveryLocation}
            onChange={(e) => setFormData({ ...formData, deliveryLocation: e.target.value })}
            required
          />

          <Input
            label="Required By Date"
            type="date"
            value={formData.requiredByDate}
            onChange={(e) => setFormData({ ...formData, requiredByDate: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason/Notes</label>
            <textarea
              value={formData.requisitionReason}
              onChange={(e) => setFormData({ ...formData, requisitionReason: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#111111]"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(`/admin/purchase-requisitions/${id}`)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" icon={Save} loading={saving} className="flex-1">
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default PurchaseRequisitionEdit
