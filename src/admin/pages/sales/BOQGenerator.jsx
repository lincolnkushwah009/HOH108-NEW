import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calculator, Plus, Trash2, FileDown, Save, ShoppingCart,
  Building2, User, MapPin, Layers, Package, CheckCircle2,
  ArrowLeft, RefreshCw, Search, X
} from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Card, Button, Input, Select, Badge } from '../../components/ui'
import { boqQuotesAPI, employeesAPI, leadsAPI } from '../../utils/api'

const BOQGenerator = () => {
  const navigate = useNavigate()

  // Form state
  const [formData, setFormData] = useState({
    leadId: '',
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    createdByUser: '',
    place: '',
    projectType: 'residential',
    floors: '1',
    builtUpArea: '',
    package: ''
  })

  // Data state
  const [packages, setPackages] = useState([])
  const [boqItems, setBoqItems] = useState([])
  const [employees, setEmployees] = useState([])
  const [qualifiedLeads, setQualifiedLeads] = useState([])
  const [cart, setCart] = useState([])

  // UI state
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedItem, setSelectedItem] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  // Load items when package changes
  useEffect(() => {
    if (formData.package) {
      loadItemsForPackage(formData.package)
    }
  }, [formData.package])

  // Recalculate cart when builtUpArea changes
  useEffect(() => {
    if (cart.length > 0 && formData.builtUpArea) {
      recalculateCart()
    }
  }, [formData.builtUpArea])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [packagesRes, employeesRes, leadsRes] = await Promise.allSettled([
        boqQuotesAPI.getPackages(),
        employeesAPI.getAll({ limit: 100, status: 'active' }),
        leadsAPI.getAll({ primaryStatus: 'qualified', limit: 500 })
      ])

      const packagesData = packagesRes.status === 'fulfilled' ? packagesRes.value.data || [] : []
      const employeesData = employeesRes.status === 'fulfilled' ? employeesRes.value.data || [] : []
      const leadsData = leadsRes.status === 'fulfilled' ? leadsRes.value.data || [] : []

      setPackages(packagesData)
      setEmployees(employeesData)
      setQualifiedLeads(leadsData)

      // Set default package
      const defaultPkg = packagesData.find(p => p.isDefault) || packagesData[0]
      if (defaultPkg) {
        setFormData(prev => ({ ...prev, package: defaultPkg.code }))
      }

      // If no packages, seed them
      if (!packagesData.length && packagesRes.status === 'fulfilled') {
        await boqQuotesAPI.seedPackages()
        const newPackagesRes = await boqQuotesAPI.getPackages()
        setPackages(newPackagesRes.data || [])
        if (newPackagesRes.data?.[0]) {
          setFormData(prev => ({ ...prev, package: newPackagesRes.data[0].code }))
        }
      }

      // Show error only if packages or leads failed (employees is optional)
      if (packagesRes.status === 'rejected' && leadsRes.status === 'rejected') {
        setError('Failed to load packages and leads data')
      }
    } catch (err) {
      console.error('Failed to load data:', err)
      setError('Failed to load initial data')
    } finally {
      setLoading(false)
    }
  }

  const loadItemsForPackage = async (packageCode) => {
    try {
      const res = await boqQuotesAPI.getItemsWithPricing(packageCode)
      setBoqItems(res.data || [])

      // If no items, seed them
      if (!res.data?.length) {
        await boqQuotesAPI.seedItems()
        const newRes = await boqQuotesAPI.getItemsWithPricing(packageCode)
        setBoqItems(newRes.data || [])
      }
    } catch (err) {
      console.error('Failed to load items:', err)
    }
  }

  const recalculateCart = useCallback(() => {
    const area = parseFloat(formData.builtUpArea) || 0
    setCart(prevCart =>
      prevCart.map(item => ({
        ...item,
        quantity: area,
        cost: area * item.rate * (item.percent / 100)
      }))
    )
  }, [formData.builtUpArea])

  const handlePackageChange = async (newPackage) => {
    setFormData(prev => ({ ...prev, package: newPackage }))

    // Recalculate cart items with new package pricing
    if (cart.length > 0) {
      try {
        const res = await boqQuotesAPI.getItemsWithPricing(newPackage)
        const itemsMap = new Map(res.data?.map(i => [i._id, i]) || [])

        const area = parseFloat(formData.builtUpArea) || 0
        setCart(prevCart =>
          prevCart.map(cartItem => {
            const newPricing = itemsMap.get(cartItem.boqItem)
            if (newPricing) {
              return {
                ...cartItem,
                rate: newPricing.rate,
                percent: newPricing.percent,
                cost: area * newPricing.rate * (newPricing.percent / 100)
              }
            }
            return cartItem
          })
        )
      } catch (err) {
        console.error('Failed to recalculate:', err)
      }
    }
  }

  const addToCart = (item) => {
    if (cart.find(c => c.boqItem === item._id)) return

    const area = parseFloat(formData.builtUpArea) || 0
    const newItem = {
      boqItem: item._id,
      itemName: item.name,
      itemCode: item.code,
      category: item.category,
      unit: item.unit,
      rate: item.rate,
      percent: item.percent,
      quantity: area,
      cost: area * item.rate * (item.percent / 100)
    }

    setCart(prev => [...prev, newItem])
    setSelectedItem('')
  }

  const addAllToCart = () => {
    const area = parseFloat(formData.builtUpArea) || 0
    const existingIds = new Set(cart.map(c => c.boqItem))

    const newItems = boqItems
      .filter(item => !existingIds.has(item._id))
      .map(item => ({
        boqItem: item._id,
        itemName: item.name,
        itemCode: item.code,
        category: item.category,
        unit: item.unit,
        rate: item.rate,
        percent: item.percent,
        quantity: area,
        cost: area * item.rate * (item.percent / 100)
      }))

    setCart(prev => [...prev, ...newItems])
  }

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(item => item.boqItem !== itemId))
  }

  const clearCart = () => {
    setCart([])
  }

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.cost || 0), 0)
  const grandTotal = subtotal

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0)
  }

  const handleSave = async (status = 'draft') => {
    setError('')

    if (!formData.clientName) {
      setError('Please enter client name')
      return
    }

    if (!formData.builtUpArea || parseFloat(formData.builtUpArea) <= 0) {
      setError('Please enter valid built-up area')
      return
    }

    if (cart.length === 0) {
      setError('Please add at least one item to the quote')
      return
    }

    setSaving(true)
    try {
      const quoteData = {
        ...formData,
        builtUpArea: parseFloat(formData.builtUpArea),
        items: cart,
        status
      }

      await boqQuotesAPI.create(quoteData)
      navigate('/admin/boq-quotes')
    } catch (err) {
      console.error('Failed to save:', err)
      setError(err.message || 'Failed to save quote')
    } finally {
      setSaving(false)
    }
  }

  const handleGeneratePDF = async () => {
    setError('')

    if (!formData.clientName) {
      setError('Please enter client name')
      return
    }

    if (!formData.builtUpArea || parseFloat(formData.builtUpArea) <= 0) {
      setError('Please enter valid built-up area')
      return
    }

    if (cart.length === 0) {
      setError('Please add at least one item to the quote')
      return
    }

    setSaving(true)
    try {
      const quoteData = {
        ...formData,
        builtUpArea: parseFloat(formData.builtUpArea),
        items: cart,
        creatorName: employees.find(e => e._id === formData.createdByUser)?.name || ''
      }

      const blob = await boqQuotesAPI.generatePDF(quoteData)

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `BOQ-Quote-${formData.clientName.replace(/\s+/g, '-')}-${Date.now()}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to generate PDF:', err)
      setError(err.message || 'Failed to generate PDF')
    } finally {
      setSaving(false)
    }
  }

  const filteredItems = boqItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const availableItems = filteredItems.filter(
    item => !cart.find(c => c.boqItem === item._id)
  )

  const projectTypeOptions = [
    { value: 'residential', label: 'Residential' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'villa', label: 'Villa' },
    { value: 'apartment', label: 'Apartment' },
    { value: '1bhk', label: '1 BHK' },
    { value: '2bhk', label: '2 BHK' },
    { value: '3bhk', label: '3 BHK' },
    { value: '4bhk', label: '4 BHK' },
    { value: 'penthouse', label: 'Penthouse' },
    { value: 'office', label: 'Office' },
    { value: 'showroom', label: 'Showroom' },
    { value: 'retail', label: 'Retail' },
    { value: 'other', label: 'Other' }
  ]

  const floorOptions = [
    { value: '1', label: '1 Floor' },
    { value: '2', label: '2 Floors' },
    { value: '3', label: '3 Floors' },
    { value: '4', label: '4+ Floors' }
  ]

  const categoryColorMap = {
    modular_kitchen: { bg: '#fff7ed', color: '#c2410c' },
    wardrobe: { bg: '#fffbeb', color: '#b45309' },
    false_ceiling: { bg: '#fefce8', color: '#a16207' },
    painting: { bg: '#fdf2f8', color: '#be185d' },
    flooring: { bg: '#FDF8F4', color: '#C59C82' },
    furniture: { bg: '#ecfdf5', color: '#059669' },
    electrical: { bg: '#fefce8', color: '#ca8a04' },
    bathroom: { bg: '#ecfeff', color: '#0891b2' },
    civil: { bg: '#f1f5f9', color: '#475569' },
    plumbing: { bg: '#f0fdfa', color: '#0d9488' },
    lighting: { bg: '#fef9c3', color: '#a16207' },
    doors_windows: { bg: '#fef2f2', color: '#dc2626' },
  }

  const getCategoryStyle = (category) => {
    const colors = categoryColorMap[category] || { bg: '#f1f5f9', color: '#64748b' }
    return {
      display: 'inline-block',
      padding: '2px 8px',
      fontSize: 11,
      fontWeight: 600,
      borderRadius: 6,
      background: colors.bg,
      color: colors.color,
      textTransform: 'capitalize',
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256 }}>
        <div style={{
          width: 32, height: 32,
          border: '3px solid #f1f5f9',
          borderTop: '3px solid #C59C82',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="BOQ Quote Generator"
        description="Generate Bill of Quantities quotes for clients"
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Sales' },
          { label: 'BOQ Generator' }
        ]}
        actions={
          <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/admin/boq-quotes')}>
            View All Quotes
          </Button>
        }
      />

      {error && (
        <div style={{
          padding: '14px 18px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 14,
          color: '#dc2626',
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}>
          <span>{error}</span>
          <button
            onClick={() => setError('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#dc2626' }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, marginTop: 24 }}>
        {/* Top Row — Client + Project side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>

          {/* Client Details */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FDF8F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User style={{ width: 18, height: 18, color: '#C59C82' }} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', margin: 0 }}>Client Details</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Select
                label="Client Name (Qualified Lead) *"
                options={[
                  { value: '', label: 'Select Qualified Lead' },
                  ...qualifiedLeads.map(lead => ({
                    value: lead._id,
                    label: `${lead.name}${lead.qualifiedLeadId ? ` (${lead.qualifiedLeadId})` : ''}${lead.phone ? ` — ${lead.phone}` : ''}`
                  }))
                ]}
                value={formData.leadId}
                onChange={(e) => {
                  const selectedLead = qualifiedLeads.find(l => l._id === e.target.value)
                  if (selectedLead) {
                    setFormData(prev => ({
                      ...prev,
                      leadId: selectedLead._id,
                      clientName: selectedLead.name || '',
                      clientPhone: selectedLead.phone || '',
                      clientEmail: selectedLead.email || '',
                      place: selectedLead.location?.city || selectedLead.location?.address || prev.place,
                    }))
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      leadId: '',
                      clientName: '',
                      clientPhone: '',
                      clientEmail: '',
                    }))
                  }
                }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Input
                  label="Phone"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                  placeholder="Auto-filled from lead"
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  placeholder="Auto-filled from lead"
                />
              </div>
              <Select
                label="Quote Created By"
                options={[
                  { value: '', label: 'Select Employee' },
                  ...employees.map(e => ({ value: e._id, label: e.name }))
                ]}
                value={formData.createdByUser}
                onChange={(e) => setFormData({ ...formData, createdByUser: e.target.value })}
              />
            </div>
          </Card>

          {/* Project Details */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FDF8F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 style={{ width: 18, height: 18, color: '#C59C82' }} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', margin: 0 }}>Project Details</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input
                label="Place / Location"
                value={formData.place}
                onChange={(e) => setFormData({ ...formData, place: e.target.value })}
                placeholder="e.g., Whitefield, Bangalore"
                icon={MapPin}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Select
                  label="Project Type"
                  options={projectTypeOptions}
                  value={formData.projectType}
                  onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                />
                <Select
                  label="Floors"
                  options={floorOptions}
                  value={formData.floors}
                  onChange={(e) => setFormData({ ...formData, floors: e.target.value })}
                />
              </div>
              <Input
                label="Built-up Area (sqft) *"
                type="number"
                value={formData.builtUpArea}
                onChange={(e) => setFormData({ ...formData, builtUpArea: e.target.value })}
                placeholder="Enter area in sqft"
                min="1"
              />
            </div>
          </Card>
        </div>

        {/* Package Selection — Full Width */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FDF8F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package style={{ width: 18, height: 18, color: '#C59C82' }} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', margin: 0 }}>Select Package</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
            {packages.map((pkg) => {
              const isSelected = formData.package === pkg.code
              return (
                <button
                  key={pkg._id}
                  onClick={() => handlePackageChange(pkg.code)}
                  style={{
                    padding: '16px 18px',
                    borderRadius: 14,
                    border: isSelected ? '2px solid #C59C82' : '2px solid #e2e8f0',
                    background: isSelected ? '#FDF8F4' : 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = '#cbd5e1' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = '#e2e8f0' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isSelected && <CheckCircle2 style={{ width: 18, height: 18, color: '#C59C82', flexShrink: 0 }} />}
                    <span style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>{pkg.name}</span>
                  </div>
                  {pkg.description && (
                    <p style={{ fontSize: 12, color: '#64748b', margin: '6px 0 0', lineHeight: 1.4 }}>{pkg.description}</p>
                  )}
                </button>
              )
            })}
          </div>
        </Card>

        {/* Bottom Row — Items + Cart */}
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24 }}>

          {/* BOQ Item Selection */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FDF8F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers style={{ width: 18, height: 18, color: '#C59C82' }} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', margin: 0 }}>BOQ Items</h3>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{boqItems.length} items available</p>
              </div>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  height: 40,
                  paddingLeft: 38,
                  paddingRight: 14,
                  fontSize: 13,
                  background: '#f8fafc',
                  border: '2px solid #e2e8f0',
                  borderRadius: 12,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={e => { e.target.style.borderColor = '#C59C82'; e.target.style.background = 'white' }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
              />
            </div>

            {/* Items List */}
            <div style={{ maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {availableItems.map((item) => (
                <div
                  key={item._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: '#f8fafc',
                    borderRadius: 12,
                    transition: 'background 0.15s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                  onClick={() => addToCart(item)}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 500, fontSize: 13, color: '#1e293b' }}>{item.name}</span>
                      <span style={getCategoryStyle(item.category)}>
                        {item.category?.replace('_', ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                      {formatCurrency(item.rate)} / {item.unit}
                    </div>
                  </div>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#C59C82', flexShrink: 0,
                  }}>
                    <Plus style={{ width: 18, height: 18 }} />
                  </div>
                </div>
              ))}

              {availableItems.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: 13 }}>
                  {searchTerm ? 'No items match your search' : 'All items added to cart'}
                </div>
              )}
            </div>

            {/* Add All */}
            {availableItems.length > 0 && (
              <button
                onClick={addAllToCart}
                style={{
                  width: '100%',
                  marginTop: 14,
                  padding: '10px 0',
                  border: '2px dashed #C59C82',
                  background: 'transparent',
                  color: '#C59C82',
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#FDF8F4'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                + Add All Items ({availableItems.length})
              </button>
            )}
          </Card>

          {/* Right Panel — Cart */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FDF8F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShoppingCart style={{ width: 18, height: 18, color: '#C59C82' }} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', margin: 0 }}>Quote Cart</h3>
                  <Badge color="purple">{cart.length} items</Badge>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      fontSize: 13, color: '#dc2626', fontWeight: 500,
                      background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px',
                      borderRadius: 8,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Trash2 style={{ width: 14, height: 14 }} />
                    Clear All
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '48px 20px',
                  background: '#f8fafc', borderRadius: 16,
                }}>
                  <ShoppingCart style={{ width: 48, height: 48, color: '#cbd5e1', margin: '0 auto 12px' }} />
                  <p style={{ color: '#64748b', fontSize: 14, margin: 0, fontWeight: 500 }}>No items in cart</p>
                  <p style={{ color: '#94a3b8', fontSize: 13, margin: '6px 0 0' }}>Select items from the left panel to start building your quote</p>
                </div>
              ) : (
                <>
                  {/* Cart Table */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                          <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>#</th>
                          <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>BOQ Item</th>
                          <th style={{ textAlign: 'center', padding: '10px 8px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unit</th>
                          <th style={{ textAlign: 'right', padding: '10px 8px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rate</th>
                          <th style={{ textAlign: 'right', padding: '10px 8px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Qty</th>
                          <th style={{ textAlign: 'right', padding: '10px 8px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cost</th>
                          <th style={{ padding: '10px 4px', width: 36 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {cart.map((item, index) => (
                          <tr
                            key={item.boqItem}
                            style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#fafbfc'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={{ padding: '12px 8px', fontSize: 13, color: '#94a3b8' }}>{index + 1}</td>
                            <td style={{ padding: '12px 8px' }}>
                              <div>
                                <p style={{ fontWeight: 500, fontSize: 13, color: '#1e293b', margin: 0 }}>{item.itemName}</p>
                                <span style={{ ...getCategoryStyle(item.category), marginTop: 4 }}>
                                  {item.category?.replace('_', ' ')}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: 13, color: '#64748b' }}>{item.unit}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: 13, color: '#1e293b' }}>{formatCurrency(item.rate)}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: 13, color: '#64748b' }}>{item.quantity?.toFixed(0) || '0'}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{formatCurrency(item.cost)}</td>
                            <td style={{ padding: '12px 4px' }}>
                              <button
                                onClick={() => removeFromCart(item.boqItem)}
                                style={{
                                  background: 'none', border: 'none', cursor: 'pointer', padding: 6,
                                  color: '#cbd5e1', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  transition: 'color 0.15s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                                onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
                              >
                                <Trash2 style={{ width: 15, height: 15 }} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div style={{ marginTop: 24, paddingTop: 20, borderTop: '2px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{ width: 280 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                          <span style={{ fontSize: 14, color: '#64748b' }}>Subtotal</span>
                          <span style={{ fontSize: 14, color: '#1e293b', fontWeight: 500 }}>{formatCurrency(subtotal)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                          <span style={{ fontSize: 14, color: '#64748b' }}>Tax (GST 18%)</span>
                          <span style={{ fontSize: 14, color: '#1e293b', fontWeight: 500 }}>{formatCurrency(subtotal * 0.18)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 14, borderTop: '2px solid #e2e8f0' }}>
                          <span style={{ fontSize: 15, fontWeight: 600, color: '#1e293b' }}>Grand Total</span>
                          <span style={{ fontSize: 22, fontWeight: 700, color: '#C59C82' }}>{formatCurrency(grandTotal * 1.18)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <Button
                      variant="secondary"
                      icon={Save}
                      onClick={() => handleSave('draft')}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save as Draft'}
                    </Button>
                    <Button
                      variant="primary"
                      icon={FileDown}
                      onClick={handleGeneratePDF}
                      disabled={saving}
                    >
                      {saving ? 'Generating...' : 'Generate PDF'}
                    </Button>
                  </div>
                </>
              )}
            </Card>

            {/* Summary Card */}
            {cart.length > 0 && (
              <Card style={{
                background: 'linear-gradient(135deg, #1e1e1e 0%, #3d2e1f 50%, #A68B6A 100%)',
                color: 'white',
                border: 'none',
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: 'white' }}>Quote Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                  <div>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Client</p>
                    <p style={{ fontWeight: 500, fontSize: 14, margin: '4px 0 0', color: 'white' }}>{formData.clientName || '-'}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Location</p>
                    <p style={{ fontWeight: 500, fontSize: 14, margin: '4px 0 0', color: 'white' }}>{formData.place || '-'}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Built-up Area</p>
                    <p style={{ fontWeight: 500, fontSize: 14, margin: '4px 0 0', color: 'white' }}>{formData.builtUpArea || '0'} sqft</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Package</p>
                    <p style={{ fontWeight: 500, fontSize: 14, margin: '4px 0 0', color: 'white' }}>{packages.find(p => p.code === formData.package)?.name || '-'}</p>
                  </div>
                </div>
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Total Items</p>
                    <p style={{ fontSize: 28, fontWeight: 700, margin: '4px 0 0', color: 'white' }}>{cart.length}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Estimated Total (incl. GST)</p>
                    <p style={{ fontSize: 32, fontWeight: 700, margin: '4px 0 0', color: '#C59C82' }}>{formatCurrency(grandTotal * 1.18)}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BOQGenerator
