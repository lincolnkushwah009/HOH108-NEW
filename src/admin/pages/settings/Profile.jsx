import { useState } from 'react'
import { User, Mail, Phone, Lock, Camera, RefreshCw, AlertTriangle, Clock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { authAPI } from '../../utils/api'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Input, Avatar } from '../../components/ui'

const Profile = () => {
  const { user, checkAuth } = useAuth()
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [phoneData, setPhoneData] = useState({
    newNumber: '',
    reason: '',
  })
  const [saving, setSaving] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [savingPhone, setSavingPhone] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const isPreSales = user?.subDepartment === 'pre_sales'

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      // Profile update would go here
      setMessage('Profile updated successfully')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setSavingPassword(true)
    setMessage('')
    setError('')
    try {
      await authAPI.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })
      setMessage('Password updated successfully')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingPassword(false)
    }
  }

  const handleUpdatePhone = async (e) => {
    e.preventDefault()
    if (!phoneData.newNumber || !phoneData.reason) {
      setError('Please enter new number and reason')
      return
    }
    const cleaned = phoneData.newNumber.replace(/\D/g, '')
    if (cleaned.length !== 10) {
      setError('Please enter a valid 10-digit phone number')
      return
    }
    setSavingPhone(true)
    setMessage('')
    setError('')
    try {
      await authAPI.updatePhone({
        newNumber: phoneData.newNumber,
        reason: phoneData.reason,
      })
      setMessage('Phone number updated successfully. Your Callyzer mapping has been updated.')
      setPhoneData({ newNumber: '', reason: '' })
      // Refresh user data to reflect new number
      await checkAuth()
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingPhone(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Profile Settings"
        description="Manage your account settings"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Profile' }]}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        {/* Profile Card */}
        <Card>
          <Card.Content style={{ textAlign: 'center', padding: 24 }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
              <Avatar name={user?.name} size="xl" />
              <button style={{
                position: 'absolute', bottom: 0, right: 0,
                padding: 8, background: '#92400e', borderRadius: '50%',
                color: '#fff', border: 'none', cursor: 'pointer'
              }}>
                <Camera size={14} />
              </button>
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111' }}>{user?.name}</h2>
            <p style={{ fontSize: 13, color: '#6b7280' }}>{user?.email}</p>
            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4, textTransform: 'capitalize' }}>
              {user?.role?.replace('_', ' ')}
            </p>
            {user?.phone && (
              <p style={{ fontSize: 13, color: '#6b7280', marginTop: 8 }}>
                <Phone size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                {user.phone}
              </p>
            )}
          </Card.Content>
        </Card>

        {/* Forms Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Messages */}
          {message && (
            <div style={{ padding: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }}>
              <p style={{ fontSize: 13, color: '#15803d' }}>{message}</p>
            </div>
          )}
          {error && (
            <div style={{ padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8 }}>
              <p style={{ fontSize: 13, color: '#dc2626' }}>{error}</p>
            </div>
          )}

          {/* Update My Number - Pre-Sales Only */}
          {isPreSales && (
            <Card>
              <Card.Header>
                <Card.Title>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <RefreshCw size={16} style={{ color: '#C59C82' }} />
                    Update My Number
                  </span>
                </Card.Title>
              </Card.Header>
              <Card.Content style={{ padding: '0 20px 20px' }}>
                <div style={{
                  padding: 12, background: '#fffbeb', border: '1px solid #fde68a',
                  borderRadius: 8, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'flex-start'
                }}>
                  <AlertTriangle size={16} style={{ color: '#d97706', flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>
                    Use this if your number has been flagged as spam and you've received a new SIM.
                    This will update your phone number and Callyzer mapping. Admin will be notified.
                  </p>
                </div>

                <div style={{
                  padding: 12, background: '#f9fafb', borderRadius: 8, marginBottom: 16,
                  display: 'flex', alignItems: 'center', gap: 12
                }}>
                  <Phone size={16} style={{ color: '#6b7280' }} />
                  <div>
                    <p style={{ fontSize: 11, color: '#9ca3af' }}>Current Number</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>
                      {user?.phone || 'Not set'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleUpdatePhone}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <Input
                      label="New Phone Number"
                      placeholder="Enter 10-digit number"
                      icon={Phone}
                      value={phoneData.newNumber}
                      onChange={(e) => setPhoneData({ ...phoneData, newNumber: e.target.value })}
                    />
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4 }}>
                        Reason for Change
                      </label>
                      <select
                        value={phoneData.reason}
                        onChange={(e) => setPhoneData({ ...phoneData, reason: e.target.value })}
                        style={{
                          width: '100%', padding: '8px 12px', borderRadius: 8,
                          border: '1px solid #d1d5db', fontSize: 13, color: '#374151',
                          background: '#fff'
                        }}
                      >
                        <option value="">Select reason...</option>
                        <option value="Number marked as spam">Number marked as spam</option>
                        <option value="New SIM issued by company">New SIM issued by company</option>
                        <option value="SIM deactivated">SIM deactivated</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button type="submit" loading={savingPhone}>
                        Update Number
                      </Button>
                    </div>
                  </div>
                </form>
              </Card.Content>
            </Card>
          )}

          {/* Profile Form */}
          <Card>
            <Card.Header>
              <Card.Title>Personal Information</Card.Title>
            </Card.Header>
            <Card.Content style={{ padding: '0 20px 20px' }}>
              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Input
                  label="Full Name"
                  icon={User}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <Input
                  label="Email"
                  type="email"
                  icon={Mail}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <Input
                  label="Phone"
                  icon={Phone}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={isPreSales}
                />
                {isPreSales && (
                  <p style={{ fontSize: 11, color: '#9ca3af', marginTop: -8 }}>
                    Use "Update My Number" above to change your phone number
                  </p>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button type="submit" loading={saving}>Save Changes</Button>
                </div>
              </form>
            </Card.Content>
          </Card>

          {/* Password Form */}
          <Card>
            <Card.Header>
              <Card.Title>Change Password</Card.Title>
            </Card.Header>
            <Card.Content style={{ padding: '0 20px 20px' }}>
              <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Input
                  label="Current Password"
                  type="password"
                  icon={Lock}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                />
                <Input
                  label="New Password"
                  type="password"
                  icon={Lock}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  icon={Lock}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                />
                <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.6, padding: '4px 0' }}>
                  Password must have: 8+ characters, 1 uppercase, 1 lowercase, 1 digit, 1 special character
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button type="submit" loading={savingPassword}>Update Password</Button>
                </div>
              </form>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Profile
