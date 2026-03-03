import { useState, useEffect } from 'react'
import {
  User,
  Phone,
  Mail,
  MapPin,
  Building,
  Lock,
  Save,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Shield,
  FileText
} from 'lucide-react'
import { useChannelPartnerAuth } from '../context/ChannelPartnerAuthContext'

const API_BASE = import.meta.env.PROD
  ? 'https://hoh108.com/api'
  : `http://${window.location.hostname}:5001/api`
const PRIMARY_COLOR = '#C59C82'

const ChannelPartnerProfile = () => {
  const { partner, checkAuth } = useChannelPartnerAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const [profileData, setProfileData] = useState({
    phone: '',
    contactPerson: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
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
    if (partner) {
      setProfileData({
        phone: partner.phone || '',
        contactPerson: partner.contactPerson || '',
        address: partner.address || {
          street: '',
          city: '',
          state: '',
          pincode: '',
          country: 'India'
        }
      })
    }
  }, [partner])

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const token = localStorage.getItem('channel_partner_token')
      const response = await fetch(`${API_BASE}/channel-partner-portal/profile`, {
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
      const token = localStorage.getItem('channel_partner_token')
      const response = await fetch(`${API_BASE}/channel-partner-portal/change-password`, {
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
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '8px'
  }

  const readOnlyInputStyle = {
    ...inputStyle,
    background: '#f9fafb',
    color: '#6b7280',
    cursor: 'not-allowed'
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

      {/* Partner Info Card */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        border: '1px solid #e5e7eb',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${PRIMARY_COLOR}, #a8825e)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '28px',
            fontWeight: '600'
          }}>
            {partner?.name?.charAt(0) || 'P'}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '4px', margin: '0 0 4px 0' }}>
              {partner?.name}
            </h2>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 4px 0' }}>
              Partner ID: {partner?.partnerId} | {partner?.email}
            </p>
            {partner?.businessName && (
              <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 8px 0' }}>
                <Building size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                {partner.businessName}
              </p>
            )}
            <span style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '500',
              background: partner?.status === 'active' ? '#dcfce7' : '#fef3c7',
              color: partner?.status === 'active' ? '#16a34a' : '#d97706',
              textTransform: 'capitalize'
            }}>
              {partner?.status}
            </span>
          </div>
        </div>
      </div>

      {/* SPOC Info (Read-only) */}
      {partner?.spoc && (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0' }}>
            <Shield size={18} color={PRIMARY_COLOR} /> Your SPOC (Point of Contact)
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Name</p>
              <p style={{ fontSize: '15px', fontWeight: '500', color: '#1f2937', margin: 0 }}>
                {partner.spoc.name || '-'}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Email</p>
              <p style={{ fontSize: '15px', fontWeight: '500', color: '#1f2937', margin: 0 }}>
                {partner.spoc.email || '-'}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Phone</p>
              <p style={{ fontSize: '15px', fontWeight: '500', color: '#1f2937', margin: 0 }}>
                {partner.spoc.phone || '-'}
              </p>
            </div>
          </div>
        </div>
      )}

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
                color: isActive ? PRIMARY_COLOR : '#6b7280',
                cursor: 'pointer',
                borderBottom: isActive ? `2px solid ${PRIMARY_COLOR}` : '2px solid transparent',
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
            {/* Read-Only Fields */}
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 20px 0' }}>
              <FileText size={18} /> Account Details (Read-Only)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              <div>
                <label style={labelStyle}>Partner Name</label>
                <input
                  type="text"
                  value={partner?.name || ''}
                  style={readOnlyInputStyle}
                  readOnly
                />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={partner?.email || ''}
                  style={readOnlyInputStyle}
                  readOnly
                />
              </div>
              <div>
                <label style={labelStyle}>Business Name</label>
                <input
                  type="text"
                  value={partner?.businessName || ''}
                  style={readOnlyInputStyle}
                  readOnly
                />
              </div>
              <div>
                <label style={labelStyle}>GSTIN</label>
                <input
                  type="text"
                  value={partner?.gstin || ''}
                  style={readOnlyInputStyle}
                  readOnly
                />
              </div>
            </div>

            {/* Editable Fields */}
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 20px 0' }}>
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
                  onFocus={(e) => e.target.style.borderColor = PRIMARY_COLOR}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
              <div>
                <label style={labelStyle}>Contact Person</label>
                <input
                  type="text"
                  value={profileData.contactPerson}
                  onChange={(e) => setProfileData({ ...profileData, contactPerson: e.target.value })}
                  style={inputStyle}
                  placeholder="Enter contact person name"
                  onFocus={(e) => e.target.style.borderColor = PRIMARY_COLOR}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
            </div>

            {/* Address */}
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 20px 0' }}>
              <MapPin size={18} /> Address
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
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
                  onFocus={(e) => e.target.style.borderColor = PRIMARY_COLOR}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
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
                  onFocus={(e) => e.target.style.borderColor = PRIMARY_COLOR}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
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
                  onFocus={(e) => e.target.style.borderColor = PRIMARY_COLOR}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
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
                  onFocus={(e) => e.target.style.borderColor = PRIMARY_COLOR}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
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
                background: PRIMARY_COLOR,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.2s'
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
                  onFocus={(e) => e.target.style.borderColor = PRIMARY_COLOR}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
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
                  onFocus={(e) => e.target.style.borderColor = PRIMARY_COLOR}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
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
                  onFocus={(e) => e.target.style.borderColor = PRIMARY_COLOR}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
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
                background: PRIMARY_COLOR,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.2s'
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

export default ChannelPartnerProfile
