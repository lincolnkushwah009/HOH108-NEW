import { useState, useEffect } from 'react'
import {
  User,
  Phone,
  Mail,
  MapPin,
  Building,
  CreditCard,
  Lock,
  Save,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { useVendorAuth } from '../context/VendorAuthContext'

const API_BASE = import.meta.env.PROD
  ? 'https://hoh108.com/api'
  : `http://${window.location.hostname}:5001/api`

const VendorProfile = () => {
  const { vendor, checkAuth } = useVendorAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const [profileData, setProfileData] = useState({
    phone: '',
    alternatePhone: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    bankDetails: {
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      accountHolderName: ''
    }
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  useEffect(() => {
    if (vendor) {
      setProfileData({
        phone: vendor.phone || '',
        alternatePhone: vendor.alternatePhone || '',
        address: vendor.address || {
          street: '',
          city: '',
          state: '',
          pincode: '',
          country: 'India'
        },
        bankDetails: vendor.bankDetails || {
          bankName: '',
          accountNumber: '',
          ifscCode: '',
          accountHolderName: ''
        }
      })
    }
  }, [vendor])

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const token = localStorage.getItem('vendor_portal_token')
      const response = await fetch(`${API_BASE}/vendor-portal/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message)

      setMessage({ type: 'success', text: 'Profile updated successfully' })
      checkAuth()
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      setLoading(false)
      return
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      setLoading(false)
      return
    }

    try {
      const token = localStorage.getItem('vendor_portal_token')
      const response = await fetch(`${API_BASE}/vendor-portal/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message)

      setMessage({ type: 'success', text: 'Password changed successfully' })
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s'
  }

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '8px'
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937', marginBottom: '24px' }}>
        My Profile
      </h1>

      {/* Message Alert */}
      {message.text && (
        <div style={{
          padding: '16px',
          marginBottom: '24px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: message.type === 'success' ? '#16a34a' : '#dc2626'
        }}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      {/* Vendor Info Card */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        border: '1px solid #e5e7eb',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0d9488, #0f766e)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '28px',
            fontWeight: '600'
          }}>
            {vendor?.name?.charAt(0) || 'V'}
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
              {vendor?.name}
            </h2>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              Vendor ID: {vendor?.vendorId} | {vendor?.email}
            </p>
            <span style={{
              display: 'inline-block',
              marginTop: '8px',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '500',
              background: vendor?.status === 'active' ? '#dcfce7' : '#fef3c7',
              color: vendor?.status === 'active' ? '#16a34a' : '#d97706',
              textTransform: 'capitalize'
            }}>
              {vendor?.status}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '0'
      }}>
        {[
          { id: 'profile', label: 'Profile Details', icon: User },
          { id: 'password', label: 'Change Password', icon: Lock }
        ].map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                setMessage({ type: '', text: '' })
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                border: 'none',
                background: 'none',
                fontSize: '14px',
                fontWeight: '500',
                color: isActive ? '#0d9488' : '#6b7280',
                cursor: 'pointer',
                borderBottom: isActive ? '2px solid #0d9488' : '2px solid transparent',
                marginBottom: '-1px'
              }}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileUpdate}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            padding: '24px'
          }}>
            {/* Contact Information */}
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={18} /> Contact Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              <div>
                <label style={labelStyle}>Phone Number</label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  style={inputStyle}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label style={labelStyle}>Alternate Phone</label>
                <input
                  type="tel"
                  value={profileData.alternatePhone}
                  onChange={(e) => setProfileData({ ...profileData, alternatePhone: e.target.value })}
                  style={inputStyle}
                  placeholder="Enter alternate phone"
                />
              </div>
            </div>

            {/* Address */}
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} /> Address
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Street Address</label>
                <input
                  type="text"
                  value={profileData.address.street}
                  onChange={(e) => setProfileData({
                    ...profileData,
                    address: { ...profileData.address, street: e.target.value }
                  })}
                  style={inputStyle}
                  placeholder="Enter street address"
                />
              </div>
              <div>
                <label style={labelStyle}>City</label>
                <input
                  type="text"
                  value={profileData.address.city}
                  onChange={(e) => setProfileData({
                    ...profileData,
                    address: { ...profileData.address, city: e.target.value }
                  })}
                  style={inputStyle}
                  placeholder="Enter city"
                />
              </div>
              <div>
                <label style={labelStyle}>State</label>
                <input
                  type="text"
                  value={profileData.address.state}
                  onChange={(e) => setProfileData({
                    ...profileData,
                    address: { ...profileData.address, state: e.target.value }
                  })}
                  style={inputStyle}
                  placeholder="Enter state"
                />
              </div>
              <div>
                <label style={labelStyle}>Pincode</label>
                <input
                  type="text"
                  value={profileData.address.pincode}
                  onChange={(e) => setProfileData({
                    ...profileData,
                    address: { ...profileData.address, pincode: e.target.value }
                  })}
                  style={inputStyle}
                  placeholder="Enter pincode"
                />
              </div>
            </div>

            {/* Bank Details */}
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={18} /> Bank Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={labelStyle}>Bank Name</label>
                <input
                  type="text"
                  value={profileData.bankDetails.bankName}
                  onChange={(e) => setProfileData({
                    ...profileData,
                    bankDetails: { ...profileData.bankDetails, bankName: e.target.value }
                  })}
                  style={inputStyle}
                  placeholder="Enter bank name"
                />
              </div>
              <div>
                <label style={labelStyle}>Account Holder Name</label>
                <input
                  type="text"
                  value={profileData.bankDetails.accountHolderName}
                  onChange={(e) => setProfileData({
                    ...profileData,
                    bankDetails: { ...profileData.bankDetails, accountHolderName: e.target.value }
                  })}
                  style={inputStyle}
                  placeholder="Enter account holder name"
                />
              </div>
              <div>
                <label style={labelStyle}>Account Number</label>
                <input
                  type="text"
                  value={profileData.bankDetails.accountNumber}
                  onChange={(e) => setProfileData({
                    ...profileData,
                    bankDetails: { ...profileData.bankDetails, accountNumber: e.target.value }
                  })}
                  style={inputStyle}
                  placeholder="Enter account number"
                />
              </div>
              <div>
                <label style={labelStyle}>IFSC Code</label>
                <input
                  type="text"
                  value={profileData.bankDetails.ifscCode}
                  onChange={(e) => setProfileData({
                    ...profileData,
                    bankDetails: { ...profileData.bankDetails, ifscCode: e.target.value }
                  })}
                  style={inputStyle}
                  placeholder="Enter IFSC code"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: '#0d9488',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              <Save size={18} />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <form onSubmit={handlePasswordChange}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            padding: '24px',
            maxWidth: '500px'
          }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Current Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  style={{ ...inputStyle, paddingRight: '48px' }}
                  placeholder="Enter current password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  style={{ ...inputStyle, paddingRight: '48px' }}
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  style={{ ...inputStyle, paddingRight: '48px' }}
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: '#0d9488',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              <Lock size={18} />
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default VendorProfile
