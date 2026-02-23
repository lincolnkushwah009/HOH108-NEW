import { useState, useEffect } from 'react'
import { useVendorAuth } from '../context/VendorAuthContext'
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Package,
  IndianRupee,
  Save,
  X,
  TrendingUp,
  History,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const MATERIAL_TYPES = [
  { value: 'cement', label: 'Cement' },
  { value: 'steel', label: 'Steel' },
  { value: 'blocks', label: 'Blocks' },
  { value: 'aggregate', label: 'Aggregate' },
  { value: 'rmc', label: 'RMC' },
  { value: 'plywood', label: 'Plywood' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'tiles', label: 'Tiles' },
  { value: 'sanitaryware', label: 'Sanitaryware' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'paint', label: 'Paint' },
  { value: 'glass', label: 'Glass' },
  { value: 'aluminium', label: 'Aluminium' },
  { value: 'labour', label: 'Labour' },
  { value: 'service', label: 'Service' },
  { value: 'other', label: 'Other' }
]

const UNITS = [
  { value: 'unit', label: 'Unit' },
  { value: 'kg', label: 'Kg' },
  { value: 'ton', label: 'Ton' },
  { value: 'bag', label: 'Bag' },
  { value: 'sqft', label: 'Sq.ft' },
  { value: 'sqm', label: 'Sq.m' },
  { value: 'cft', label: 'Cft' },
  { value: 'm3', label: 'M³' },
  { value: 'ltr', label: 'Ltr' },
  { value: 'bundle', label: 'Bundle' },
  { value: 'box', label: 'Box' },
  { value: 'set', label: 'Set' },
  { value: 'hour', label: 'Hour' },
  { value: 'day', label: 'Day' },
  { value: 'month', label: 'Month' },
  { value: 'job', label: 'Job' }
]

const PRICE_TYPES = [
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'range', label: 'Price Range' },
  { value: 'negotiable', label: 'Negotiable' }
]

const GST_RATES = [0, 5, 12, 18, 28]

const VendorMaterials = () => {
  const { token } = useVendorAuth()
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState(null)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  const [formData, setFormData] = useState({
    materialName: '',
    materialType: 'other',
    category: '',
    subCategory: '',
    brand: '',
    specification: '',
    unit: 'unit',
    currentPrice: '',
    currentPriceMax: '',
    priceType: 'fixed',
    minOrderQty: '',
    leadTimeDays: '',
    gstRate: 18,
    remarks: '',
    status: 'active'
  })

  useEffect(() => {
    fetchMaterials()
  }, [])

  const fetchMaterials = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/vendor-portal/materials`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setMaterials(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching materials:', error)
      showToast('Failed to load materials', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData({
      materialName: '',
      materialType: 'other',
      category: '',
      subCategory: '',
      brand: '',
      specification: '',
      unit: 'unit',
      currentPrice: '',
      currentPriceMax: '',
      priceType: 'fixed',
      minOrderQty: '',
      leadTimeDays: '',
      gstRate: 18,
      remarks: '',
      status: 'active'
    })
    setEditingMaterial(null)
  }

  const openAddModal = () => {
    resetForm()
    setShowModal(true)
  }

  const openEditModal = (material) => {
    setEditingMaterial(material)
    setFormData({
      materialName: material.materialName || '',
      materialType: material.materialType || 'other',
      category: material.category || '',
      subCategory: material.subCategory || '',
      brand: material.brand || '',
      specification: material.specification || '',
      unit: material.unit || 'unit',
      currentPrice: material.currentPrice || '',
      currentPriceMax: material.currentPriceMax || '',
      priceType: material.priceType || 'fixed',
      minOrderQty: material.minOrderQty || '',
      leadTimeDays: material.leadTimeDays || '',
      gstRate: material.gstRate ?? 18,
      remarks: material.remarks || '',
      status: material.status || 'active'
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.materialName || !formData.currentPrice) {
      showToast('Please fill required fields', 'error')
      return
    }

    setSaving(true)
    try {
      const url = editingMaterial
        ? `${API_URL}/vendor-portal/materials/${editingMaterial._id}`
        : `${API_URL}/vendor-portal/materials`

      const method = editingMaterial ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          currentPrice: parseFloat(formData.currentPrice),
          currentPriceMax: formData.currentPriceMax ? parseFloat(formData.currentPriceMax) : null,
          minOrderQty: formData.minOrderQty ? parseInt(formData.minOrderQty) : null,
          leadTimeDays: formData.leadTimeDays ? parseInt(formData.leadTimeDays) : null,
          gstRate: parseFloat(formData.gstRate)
        })
      })

      const data = await response.json()
      if (data.success) {
        showToast(editingMaterial ? 'Material updated successfully' : 'Material added successfully')
        setShowModal(false)
        resetForm()
        fetchMaterials()
      } else {
        showToast(data.message || 'Failed to save material', 'error')
      }
    } catch (error) {
      console.error('Error saving material:', error)
      showToast('Failed to save material', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (materialId) => {
    if (!confirm('Are you sure you want to delete this material?')) return

    try {
      const response = await fetch(`${API_URL}/vendor-portal/materials/${materialId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        showToast('Material deleted successfully')
        fetchMaterials()
      } else {
        showToast(data.message || 'Failed to delete material', 'error')
      }
    } catch (error) {
      console.error('Error deleting material:', error)
      showToast('Failed to delete material', 'error')
    }
  }

  const openPriceHistory = (material) => {
    setSelectedMaterial(material)
    setShowHistoryModal(true)
  }

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.materialName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.category?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = !filterType || m.materialType === filterType
    return matchesSearch && matchesType
  })

  const formatPrice = (price, priceMax, priceType) => {
    if (priceType === 'range' && priceMax) {
      return `₹${price?.toLocaleString()} - ₹${priceMax?.toLocaleString()}`
    }
    return `₹${price?.toLocaleString()}`
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#0d9488' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // Common input style with dark text
  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    color: '#1f2937'
  }

  const selectStyle = {
    ...inputStyle,
    background: 'white'
  }

  return (
    <div>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '12px 20px',
          borderRadius: '8px',
          background: toast.type === 'error' ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${toast.type === 'error' ? '#fee2e2' : '#bbf7d0'}`,
          color: toast.type === 'error' ? '#dc2626' : '#16a34a',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 1000,
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
        }}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
            My Materials & Pricelist
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0' }}>
            Manage your materials, products and pricing
          </p>
        </div>
        <button
          onClick={openAddModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #0d9488, #0f766e)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          <Plus size={18} />
          Add Material
        </button>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Search materials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 10px 10px 40px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{
            padding: '10px 16px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            minWidth: '150px',
            background: 'white'
          }}
        >
          <option value="">All Types</option>
          {MATERIAL_TYPES.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: '#0d948815',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Package size={22} color="#0d9488" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
                {materials.length}
              </p>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Total Materials</p>
            </div>
          </div>
        </div>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: '#16a34a15',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle size={22} color="#16a34a" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
                {materials.filter(m => m.status === 'active').length}
              </p>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Active Items</p>
            </div>
          </div>
        </div>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: '#eab30815',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TrendingUp size={22} color="#eab308" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
                {new Set(materials.map(m => m.materialType)).size}
              </p>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Categories</p>
            </div>
          </div>
        </div>
      </div>

      {/* Materials List */}
      {filteredMaterials.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '60px 20px',
          textAlign: 'center',
          border: '1px solid #e5e7eb'
        }}>
          <Package size={48} style={{ color: '#d1d5db', marginBottom: '16px' }} />
          <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>
            {searchTerm || filterType ? 'No materials found matching your criteria' : 'No materials added yet'}
          </p>
          {!searchTerm && !filterType && (
            <button
              onClick={openAddModal}
              style={{
                marginTop: '16px',
                padding: '10px 20px',
                background: '#0d9488',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Add Your First Material
            </button>
          )}
        </div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Material</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Type</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Unit</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Price</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>GST</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterials.map((material) => (
                  <tr key={material._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', margin: 0 }}>
                          {material.materialName}
                        </p>
                        {(material.brand || material.specification) && (
                          <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>
                            {[material.brand, material.specification].filter(Boolean).join(' • ')}
                          </p>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: '#f3f4f6',
                        color: '#374151',
                        textTransform: 'capitalize'
                      }}>
                        {material.materialType?.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6b7280', textTransform: 'capitalize' }}>
                      {material.unit}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                        {formatPrice(material.currentPrice, material.currentPriceMax, material.priceType)}
                      </p>
                      {material.priceType !== 'fixed' && (
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                          {material.priceType === 'negotiable' ? 'Negotiable' : 'Range'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
                      {material.gstRate}%
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: material.status === 'active' ? '#dcfce7' : material.status === 'out_of_stock' ? '#fef3c7' : '#f3f4f6',
                        color: material.status === 'active' ? '#16a34a' : material.status === 'out_of_stock' ? '#d97706' : '#6b7280'
                      }}>
                        {material.status === 'out_of_stock' ? 'Out of Stock' : material.status?.charAt(0).toUpperCase() + material.status?.slice(1)}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        {material.priceHistory?.length > 0 && (
                          <button
                            onClick={() => openPriceHistory(material)}
                            title="Price History"
                            style={{
                              padding: '6px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              background: 'white',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <History size={16} color="#6b7280" />
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(material)}
                          title="Edit"
                          style={{
                            padding: '6px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            background: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Edit2 size={16} color="#0d9488" />
                        </button>
                        <button
                          onClick={() => handleDelete(material._id)}
                          title="Delete"
                          style={{
                            padding: '6px',
                            border: '1px solid #fee2e2',
                            borderRadius: '6px',
                            background: '#fef2f2',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Trash2 size={16} color="#dc2626" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              background: 'white',
              zIndex: 10
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                {editingMaterial ? 'Edit Material' : 'Add New Material'}
              </h2>
              <button
                onClick={() => { setShowModal(false); resetForm() }}
                style={{
                  padding: '8px',
                  border: 'none',
                  background: '#f3f4f6',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <X size={20} color="#6b7280" />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gap: '16px' }}>
                {/* Material Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Material Name <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="materialName"
                    value={formData.materialName}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., ACC Cement OPC 53 Grade"
                    style={inputStyle}
                  />
                </div>

                {/* Type & Unit */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                      Material Type
                    </label>
                    <select
                      name="materialType"
                      value={formData.materialType}
                      onChange={handleInputChange}
                      style={selectStyle}
                    >
                      {MATERIAL_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                      Unit
                    </label>
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      style={selectStyle}
                    >
                      {UNITS.map(unit => (
                        <option key={unit.value} value={unit.value}>{unit.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Brand & Specification */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                      Brand
                    </label>
                    <input
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleInputChange}
                      placeholder="e.g., ACC, Ultratech"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                      Specification
                    </label>
                    <input
                      type="text"
                      name="specification"
                      value={formData.specification}
                      onChange={handleInputChange}
                      placeholder="e.g., 53 Grade, 10mm"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Category & Sub-Category */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                      Category
                    </label>
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      placeholder="e.g., Construction Materials"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                      Sub-Category
                    </label>
                    <input
                      type="text"
                      name="subCategory"
                      value={formData.subCategory}
                      onChange={handleInputChange}
                      placeholder="e.g., OPC, PPC"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Price Type */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Price Type
                  </label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {PRICE_TYPES.map(pt => (
                      <label
                        key={pt.value}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${formData.priceType === pt.value ? '#0d9488' : '#e5e7eb'}`,
                          background: formData.priceType === pt.value ? '#0d948810' : 'white'
                        }}
                      >
                        <input
                          type="radio"
                          name="priceType"
                          value={pt.value}
                          checked={formData.priceType === pt.value}
                          onChange={handleInputChange}
                          style={{ display: 'none' }}
                        />
                        <span style={{
                          fontSize: '13px',
                          color: formData.priceType === pt.value ? '#0d9488' : '#6b7280',
                          fontWeight: formData.priceType === pt.value ? '500' : '400'
                        }}>
                          {pt.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: formData.priceType === 'range' ? '1fr 1fr' : '1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                      {formData.priceType === 'range' ? 'Min Price' : 'Price'} <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <IndianRupee size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                      <input
                        type="number"
                        name="currentPrice"
                        value={formData.currentPrice}
                        onChange={handleInputChange}
                        required
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        style={{ ...inputStyle, paddingLeft: '36px' }}
                      />
                    </div>
                  </div>
                  {formData.priceType === 'range' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                        Max Price
                      </label>
                      <div style={{ position: 'relative' }}>
                        <IndianRupee size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                        <input
                          type="number"
                          name="currentPriceMax"
                          value={formData.currentPriceMax}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          style={{ ...inputStyle, paddingLeft: '36px' }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* GST & Status */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                      GST Rate
                    </label>
                    <select
                      name="gstRate"
                      value={formData.gstRate}
                      onChange={handleInputChange}
                      style={selectStyle}
                    >
                      {GST_RATES.map(rate => (
                        <option key={rate} value={rate}>{rate}%</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      style={selectStyle}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="out_of_stock">Out of Stock</option>
                    </select>
                  </div>
                </div>

                {/* Min Order & Lead Time */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                      Min Order Qty
                    </label>
                    <input
                      type="number"
                      name="minOrderQty"
                      value={formData.minOrderQty}
                      onChange={handleInputChange}
                      min="0"
                      placeholder="Optional"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                      Lead Time (Days)
                    </label>
                    <input
                      type="number"
                      name="leadTimeDays"
                      value={formData.leadTimeDays}
                      onChange={handleInputChange}
                      min="0"
                      placeholder="Optional"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Remarks
                  </label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="Any additional notes..."
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '24px',
                paddingTop: '20px',
                borderTop: '1px solid #e5e7eb'
              }}>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm() }}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    background: 'white',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1
                  }}
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {editingMaterial ? 'Update Material' : 'Add Material'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Price History Modal */}
      {showHistoryModal && selectedMaterial && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                  Price History
                </h2>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>
                  {selectedMaterial.materialName}
                </p>
              </div>
              <button
                onClick={() => { setShowHistoryModal(false); setSelectedMaterial(null) }}
                style={{
                  padding: '8px',
                  border: 'none',
                  background: '#f3f4f6',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <X size={20} color="#6b7280" />
              </button>
            </div>

            <div style={{ padding: '20px 24px' }}>
              {selectedMaterial.priceHistory?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedMaterial.priceHistory.slice().reverse().map((history, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '14px',
                        background: '#f9fafb',
                        borderRadius: '10px',
                        border: '1px solid #e5e7eb'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <p style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                            {formatPrice(history.price, history.priceMax, selectedMaterial.priceType)}
                          </p>
                          {history.remarks && (
                            <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>
                              {history.remarks}
                            </p>
                          )}
                        </div>
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                          {formatDate(history.changedAt)}
                        </span>
                      </div>
                      {history.changedBy && (
                        <p style={{ fontSize: '12px', color: '#9ca3af', margin: '8px 0 0' }}>
                          Changed by: {history.changedBy}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
                  No price history available
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VendorMaterials
