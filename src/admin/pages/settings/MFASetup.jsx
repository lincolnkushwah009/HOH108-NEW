import { useState, useEffect } from 'react'
import { Shield, ShieldCheck, ShieldOff, Key, Copy, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Modal, Input } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { apiRequest } from '../../utils/api'
import { copyToClipboard } from '../../utils/helpers'

const MFASetup = () => {
  const [loading, setLoading] = useState(true)
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Setup flow
  const [setupStep, setSetupStep] = useState(0) // 0=idle, 1=qr, 2=verify, 3=recovery
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [recoveryCodes, setRecoveryCodes] = useState([])
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [copiedCodes, setCopiedCodes] = useState(false)

  // Disable flow
  const [showDisableModal, setShowDisableModal] = useState(false)
  const [disabling, setDisabling] = useState(false)

  // Recovery codes regeneration
  const [regenerating, setRegenerating] = useState(false)
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false)

  useEffect(() => {
    checkMFAStatus()
  }, [])

  const checkMFAStatus = async () => {
    setLoading(true)
    try {
      const response = await apiRequest('/mfa/status')
      setMfaEnabled(response.enabled || response.mfaEnabled || false)
    } catch (err) {
      console.error('Failed to check MFA status:', err)
      // If endpoint doesn't exist, assume not enabled
      setMfaEnabled(false)
    } finally {
      setLoading(false)
    }
  }

  const handleStartSetup = async () => {
    setError(null)
    setSuccess(null)
    try {
      const response = await apiRequest('/mfa/setup', { method: 'POST' })
      setQrCode(response.qrCode || response.qr || '')
      setSecret(response.secret || '')
      setSetupStep(1)
    } catch (err) {
      console.error('Failed to start MFA setup:', err)
      setError(err.message || 'Failed to start MFA setup')
    }
  }

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) return
    setVerifying(true)
    setError(null)
    try {
      await apiRequest('/mfa/verify', {
        method: 'POST',
        body: JSON.stringify({ token: verificationCode }),
      })

      // Get recovery codes
      const codesResponse = await apiRequest('/mfa/recovery-codes', { method: 'POST' })
      setRecoveryCodes(codesResponse.codes || codesResponse.recoveryCodes || [])
      setSetupStep(3)
      setMfaEnabled(true)
      setSuccess('Two-factor authentication has been enabled successfully!')
    } catch (err) {
      console.error('Failed to verify code:', err)
      setError(err.message || 'Invalid verification code. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  const handleDisableMFA = async () => {
    setDisabling(true)
    setError(null)
    try {
      await apiRequest('/mfa/disable', { method: 'DELETE' })
      setMfaEnabled(false)
      setShowDisableModal(false)
      setSetupStep(0)
      setQrCode('')
      setSecret('')
      setVerificationCode('')
      setRecoveryCodes([])
      setSuccess('Two-factor authentication has been disabled.')
    } catch (err) {
      console.error('Failed to disable MFA:', err)
      setError(err.message || 'Failed to disable MFA')
    } finally {
      setDisabling(false)
    }
  }

  const handleRegenerateCodes = async () => {
    setRegenerating(true)
    setError(null)
    try {
      const response = await apiRequest('/mfa/recovery-codes', { method: 'POST' })
      setRecoveryCodes(response.codes || response.recoveryCodes || [])
      setShowRecoveryCodes(true)
      setSuccess('Recovery codes regenerated. Save them securely.')
    } catch (err) {
      console.error('Failed to regenerate codes:', err)
      setError(err.message || 'Failed to regenerate recovery codes')
    } finally {
      setRegenerating(false)
    }
  }

  const handleCopySecret = async () => {
    const copied = await copyToClipboard(secret)
    if (copied) {
      setCopiedSecret(true)
      setTimeout(() => setCopiedSecret(false), 2000)
    }
  }

  const handleCopyCodes = async () => {
    const codesText = recoveryCodes.join('\n')
    const copied = await copyToClipboard(codesText)
    if (copied) {
      setCopiedCodes(true)
      setTimeout(() => setCopiedCodes(false), 2000)
    }
  }

  const handleFinishSetup = () => {
    setSetupStep(0)
    setQrCode('')
    setSecret('')
    setVerificationCode('')
  }

  if (loading) return <PageLoader />

  return (
    <div>
      <PageHeader
        title="Multi-Factor Authentication"
        description="Add an extra layer of security to your account"
        breadcrumbs={[
          { label: 'Settings', path: '/admin/settings' },
          { label: 'MFA Setup' },
        ]}
      />

      {/* Status Messages */}
      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#fef2f2',
          color: '#dc2626',
          borderRadius: '12px',
          marginBottom: '20px',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <AlertTriangle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#ecfdf5',
          color: '#059669',
          borderRadius: '12px',
          marginBottom: '20px',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <CheckCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
          {success}
        </div>
      )}

      {/* MFA Status Card */}
      <Card style={{ marginBottom: '24px' }}>
        <Card.Content style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                padding: '14px',
                backgroundColor: mfaEnabled ? '#ecfdf5' : '#f8fafc',
                borderRadius: '16px',
              }}>
                {mfaEnabled ? (
                  <ShieldCheck style={{ width: '28px', height: '28px', color: '#059669' }} />
                ) : (
                  <ShieldOff style={{ width: '28px', height: '28px', color: '#94a3b8' }} />
                )}
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                  Two-Factor Authentication
                </h3>
                <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
                  {mfaEnabled
                    ? 'Your account is protected with two-factor authentication.'
                    : 'Add an additional layer of security to your account by enabling 2FA.'
                  }
                </p>
              </div>
            </div>
            <div style={{
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '600',
              backgroundColor: mfaEnabled ? '#ecfdf5' : '#fef2f2',
              color: mfaEnabled ? '#059669' : '#dc2626',
            }}>
              {mfaEnabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Setup Flow (when not enabled and not in setup) */}
      {!mfaEnabled && setupStep === 0 && (
        <Card>
          <Card.Header title="Enable Two-Factor Authentication" />
          <Card.Content style={{ padding: 24 }}>
            <div style={{ maxWidth: '500px' }}>
              <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6', marginTop: 0 }}>
                Two-factor authentication adds a second step to your login process.
                You will need an authenticator app like Google Authenticator, Authy, or
                1Password to scan a QR code and generate time-based verification codes.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px', marginBottom: '24px' }}>
                {[
                  { num: 1, text: 'Scan a QR code with your authenticator app' },
                  { num: 2, text: 'Enter the 6-digit verification code' },
                  { num: 3, text: 'Save your recovery codes securely' },
                ].map((step) => (
                  <div key={step.num} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: '#FDF8F4',
                      color: '#C59C82',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: '700',
                      flexShrink: 0,
                    }}>
                      {step.num}
                    </div>
                    <span style={{ fontSize: '14px', color: '#475569' }}>{step.text}</span>
                  </div>
                ))}
              </div>

              <Button icon={Shield} onClick={handleStartSetup}>
                Enable 2FA
              </Button>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Step 1: QR Code */}
      {setupStep === 1 && (
        <Card>
          <Card.Header title="Step 1: Scan QR Code" />
          <Card.Content style={{ padding: 24 }}>
            <div style={{ maxWidth: '500px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#C59C82',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: '700',
                }}>
                  1
                </div>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>Scan this QR code with your authenticator app</span>
              </div>

              {qrCode && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '24px',
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  border: '2px dashed #e2e8f0',
                  marginBottom: '20px',
                }}>
                  <img
                    src={qrCode}
                    alt="MFA QR Code"
                    style={{ width: '200px', height: '200px' }}
                  />
                </div>
              )}

              {secret && (
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 8px 0' }}>
                    Can't scan? Enter this key manually:
                  </p>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 16px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                  }}>
                    <code style={{
                      flex: 1,
                      fontSize: '14px',
                      fontFamily: 'monospace',
                      color: '#1e293b',
                      fontWeight: '600',
                      letterSpacing: '1px',
                      wordBreak: 'break-all',
                    }}>
                      {secret}
                    </code>
                    <button
                      onClick={handleCopySecret}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: copiedSecret ? '#059669' : '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {copiedSecret ? (
                        <CheckCircle style={{ width: '18px', height: '18px' }} />
                      ) : (
                        <Copy style={{ width: '18px', height: '18px' }} />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <Button onClick={() => setSetupStep(2)}>
                Continue to Verification
              </Button>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Step 2: Verify Code */}
      {setupStep === 2 && (
        <Card>
          <Card.Header title="Step 2: Enter Verification Code" />
          <Card.Content style={{ padding: 24 }}>
            <div style={{ maxWidth: '500px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#C59C82',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: '700',
                }}>
                  2
                </div>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>Enter the 6-digit code from your authenticator app</span>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <Input
                  label="Verification Code"
                  value={verificationCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setVerificationCode(val)
                  }}
                  placeholder="000000"
                  style={{
                    fontSize: '24px',
                    letterSpacing: '8px',
                    textAlign: 'center',
                    fontFamily: 'monospace',
                    fontWeight: '700',
                  }}
                  maxLength={6}
                />
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '8px 0 0 0' }}>
                  The code refreshes every 30 seconds
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <Button variant="ghost" onClick={() => setSetupStep(1)}>
                  Back
                </Button>
                <Button
                  onClick={handleVerifyCode}
                  disabled={verifying || verificationCode.length !== 6}
                >
                  {verifying ? 'Verifying...' : 'Verify & Enable'}
                </Button>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Step 3: Recovery Codes */}
      {setupStep === 3 && (
        <Card>
          <Card.Header title="Step 3: Save Recovery Codes" />
          <Card.Content style={{ padding: 24 }}>
            <div style={{ maxWidth: '500px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#059669',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: '700',
                }}>
                  3
                </div>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>Save these recovery codes in a safe place</span>
              </div>

              <div style={{
                padding: '12px 16px',
                backgroundColor: '#fffbeb',
                borderRadius: '10px',
                border: '1px solid #fcd34d',
                marginBottom: '16px',
                fontSize: '13px',
                color: '#92400e',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
              }}>
                <AlertTriangle style={{ width: '16px', height: '16px', flexShrink: 0, marginTop: '1px' }} />
                <span>
                  These codes can be used to access your account if you lose your authenticator device.
                  Each code can only be used once. Store them securely.
                </span>
              </div>

              {recoveryCodes.length > 0 && (
                <div style={{
                  padding: '16px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '16px',
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '8px',
                  }}>
                    {recoveryCodes.map((code, i) => (
                      <code key={i} style={{
                        padding: '8px 12px',
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        fontWeight: '600',
                        color: '#1e293b',
                        textAlign: 'center',
                        border: '1px solid #f1f5f9',
                      }}>
                        {code}
                      </code>
                    ))}
                  </div>

                  <div style={{ marginTop: '12px', textAlign: 'center' }}>
                    <button
                      onClick={handleCopyCodes}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: copiedCodes ? '#059669' : '#C59C82',
                        fontSize: '13px',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {copiedCodes ? (
                        <>
                          <CheckCircle style={{ width: '14px', height: '14px' }} />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy style={{ width: '14px', height: '14px' }} />
                          Copy All Codes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <Button onClick={handleFinishSetup}>
                Done
              </Button>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* When MFA is enabled: Management options */}
      {mfaEnabled && setupStep === 0 && (
        <>
          {/* Recovery Codes Section */}
          <Card style={{ marginBottom: '24px' }}>
            <Card.Header title="Recovery Codes" />
            <Card.Content style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                    Recovery codes can be used to access your account if you lose your authenticator device.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  icon={RefreshCw}
                  onClick={handleRegenerateCodes}
                  disabled={regenerating}
                >
                  {regenerating ? 'Regenerating...' : 'Regenerate Codes'}
                </Button>
              </div>

              {showRecoveryCodes && recoveryCodes.length > 0 && (
                <div style={{
                  marginTop: '16px',
                  padding: '16px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '8px',
                  }}>
                    {recoveryCodes.map((code, i) => (
                      <code key={i} style={{
                        padding: '8px 12px',
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        fontWeight: '600',
                        color: '#1e293b',
                        textAlign: 'center',
                        border: '1px solid #f1f5f9',
                      }}>
                        {code}
                      </code>
                    ))}
                  </div>
                  <div style={{ marginTop: '12px', textAlign: 'center' }}>
                    <button
                      onClick={handleCopyCodes}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: copiedCodes ? '#059669' : '#C59C82',
                        fontSize: '13px',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {copiedCodes ? (
                        <>
                          <CheckCircle style={{ width: '14px', height: '14px' }} />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy style={{ width: '14px', height: '14px' }} />
                          Copy All Codes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Disable 2FA Section */}
          <Card>
            <Card.Header title="Disable Two-Factor Authentication" />
            <Card.Content style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                    Disabling 2FA will make your account less secure. You will only need your password to sign in.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  icon={ShieldOff}
                  onClick={() => setShowDisableModal(true)}
                  style={{ color: '#dc2626' }}
                >
                  Disable 2FA
                </Button>
              </div>
            </Card.Content>
          </Card>
        </>
      )}

      {/* Disable Confirmation Modal */}
      <Modal
        isOpen={showDisableModal}
        onClose={() => setShowDisableModal(false)}
        title="Disable Two-Factor Authentication"
        size="sm"
      >
        <div style={{
          padding: '16px',
          backgroundColor: '#fef2f2',
          borderRadius: '12px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}>
          <AlertTriangle style={{ width: '20px', height: '20px', color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#dc2626', margin: 0 }}>
              This will reduce your account security
            </p>
            <p style={{ fontSize: '13px', color: '#7f1d1d', margin: '4px 0 0 0' }}>
              Without 2FA, anyone with your password can access your account. Are you sure you want to continue?
            </p>
          </div>
        </div>

        <Modal.Footer>
          <Button variant="ghost" onClick={() => setShowDisableModal(false)}>Cancel</Button>
          <Button
            onClick={handleDisableMFA}
            disabled={disabling}
            style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
          >
            {disabling ? 'Disabling...' : 'Disable 2FA'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default MFASetup
