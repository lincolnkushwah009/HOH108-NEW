import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Phone, PhoneCall, PhoneMissed, PhoneIncoming, PhoneOutgoing,
  Calendar, Clock, User, Search, Filter, Plus, CheckCircle, XCircle,
  MoreVertical, X, Play, RefreshCw, ArrowUpDown, RotateCcw,
  TrendingUp, Users, BarChart3, ChevronDown, ChevronUp,
  Award, Timer, Target, Zap, PhoneForwarded,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts'
import { callActivitiesAPI, callyzerAPI, leadsAPI } from '../../utils/api'
import { telHref, formatPhone } from '../../utils/helpers'
import { useAuth } from '../../context/AuthContext'

const BRAND = '#C59C82'
const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316']
const PIE_COLORS = ['#3B82F6', '#10B981', '#EF4444', '#F59E0B']
const OUTCOME_CHART_COLORS = {
  interested: '#10B981', qualified: '#059669', meeting_scheduled: '#C59C82',
  callback_requested: '#3B82F6', future_prospect: '#06B6D4', rnr: '#F59E0B',
  not_interested: '#EF4444', lost: '#DC2626', voicemail: '#6B7280', wrong_number: '#9CA3AF',
}

const CALL_OUTCOMES = [
  { value: 'interested', label: 'Interested', bg: '#D1FAE5', color: '#065F46' },
  { value: 'not_interested', label: 'Not Interested', bg: '#FEE2E2', color: '#991B1B' },
  { value: 'callback_requested', label: 'Callback Requested', bg: '#DBEAFE', color: '#1E40AF' },
  { value: 'meeting_scheduled', label: 'Meeting Scheduled', bg: '#F5EDE6', color: '#8B7355' },
  { value: 'rnr', label: 'RNR (Ring No Response)', bg: '#FEF3C7', color: '#92400E' },
  { value: 'future_prospect', label: 'Future Prospect', bg: '#CFFAFE', color: '#0E7490' },
  { value: 'qualified', label: 'Qualified', bg: '#D1FAE5', color: '#065F46' },
  { value: 'lost', label: 'Lost', bg: '#FEE2E2', color: '#991B1B' },
  { value: 'voicemail', label: 'Voicemail', bg: '#F3F4F6', color: '#374151' },
  { value: 'wrong_number', label: 'Wrong Number', bg: '#F3F4F6', color: '#374151' },
]

const CALL_STATUSES = [
  { value: 'scheduled', label: 'Scheduled', icon: Calendar, bg: '#DBEAFE', color: '#1E40AF' },
  { value: 'in_progress', label: 'In Progress', icon: PhoneCall, bg: '#D1FAE5', color: '#065F46' },
  { value: 'completed', label: 'Completed', icon: CheckCircle, bg: '#F3F4F6', color: '#374151' },
  { value: 'no_answer', label: 'No Answer', icon: PhoneMissed, bg: '#FEF3C7', color: '#92400E' },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle, bg: '#FEE2E2', color: '#991B1B' },
]

const OutcomeBadge = ({ outcome }) => {
  const config = CALL_OUTCOMES.find(o => o.value === outcome) || { label: outcome, bg: '#F3F4F6', color: '#374151' }
  return (
    <span style={{
      padding: '4px 10px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: '500',
      backgroundColor: config.bg,
      color: config.color,
    }}>
      {config.label}
    </span>
  )
}

const StatusBadge = ({ status }) => {
  const config = CALL_STATUSES.find(s => s.value === status) || CALL_STATUSES[0]
  const Icon = config.icon || Phone
  return (
    <span style={{
      padding: '4px 10px',
      borderRadius: '9999px',
      fontSize: '12px',
      fontWeight: '500',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      backgroundColor: config.bg,
      color: config.color,
    }}>
      <Icon size={12} />
      {config.label}
    </span>
  )
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '10px',
      padding: '10px 14px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    }}>
      <p style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b', margin: '0 0 4px' }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ fontSize: '11px', color: entry.color, margin: '2px 0' }}>
          {entry.name}: <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  )
}

const CallCard = ({ call, onStartCall, onCompleteCall }) => {
  const [showActions, setShowActions] = useState(false)

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '16px',
      border: '1px solid #E5E7EB',
      padding: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      transition: 'box-shadow 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{
            padding: '12px',
            borderRadius: '12px',
            backgroundColor: call.status === 'in_progress' ? '#D1FAE5' : '#F3F4F6',
          }}>
            <Phone size={20} style={{ color: call.status === 'in_progress' ? '#059669' : '#6B7280' }} />
          </div>
          <div>
            <Link
              to={`/admin/leads/${call.lead?._id}`}
              style={{ fontWeight: '600', color: '#1F2937', textDecoration: 'none', fontSize: '15px' }}
            >
              {call.lead?.name || 'Unknown Lead'}
            </Link>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0 0 0' }}>{call.lead?.phone ? formatPhone(call.lead.phone) : '-'}</p>
            <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '4px 0 0 0' }}>
              {call.lead?.leadId} • Attempt #{call.attemptNumber}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StatusBadge status={call.status} />
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowActions(!showActions)}
              style={{ padding: '6px', background: 'none', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              <MoreVertical size={16} style={{ color: '#9CA3AF' }} />
            </button>
            {showActions && (
              <div style={{
                position: 'absolute', right: 0, top: '32px',
                backgroundColor: '#FFFFFF', borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                border: '1px solid #E5E7EB', padding: '6px 0',
                zIndex: 10, minWidth: '150px',
              }}>
                <button
                  onClick={() => { onStartCall(call); setShowActions(false) }}
                  style={{ width: '100%', padding: '10px 16px', textAlign: 'left', fontSize: '14px', color: '#374151', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  <PhoneCall size={14} /> Start Call
                </button>
                <button
                  onClick={() => { onCompleteCall(call); setShowActions(false) }}
                  style={{ width: '100%', padding: '10px 16px', textAlign: 'left', fontSize: '14px', color: '#374151', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  <CheckCircle size={14} /> Complete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {call.outcome && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <OutcomeBadge outcome={call.outcome} />
            {call.duration && (
              <span style={{ fontSize: '12px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} />
                {Math.floor(call.duration / 60)}:{String(call.duration % 60).padStart(2, '0')}
              </span>
            )}
          </div>
          {call.notes && (
            <p style={{
              fontSize: '14px', color: '#4B5563', margin: '8px 0 0 0',
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {call.notes}
            </p>
          )}
        </div>
      )}

      {call.meetingScheduled?.isScheduled && (
        <div style={{
          marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #F3F4F6',
          backgroundColor: '#FDF8F4', margin: '12px -16px -16px -16px',
          padding: '12px 16px 16px 16px', borderRadius: '0 0 16px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C59C82' }}>
            <Calendar size={14} />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Meeting Scheduled</span>
          </div>
          <p style={{ fontSize: '12px', color: '#A68B6A', margin: '4px 0 0 0' }}>
            {new Date(call.meetingScheduled.scheduledDate).toLocaleString()}
            {call.meetingScheduled.location && ` • ${call.meetingScheduled.location}`}
          </p>
        </div>
      )}

      <div style={{
        marginTop: '12px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', fontSize: '12px', color: '#9CA3AF',
      }}>
        <span>{call.calledByName || 'Unknown'}</span>
        <span>{new Date(call.createdAt).toLocaleString()}</span>
      </div>
    </div>
  )
}

const CallyzerCallCard = ({ call }) => {
  const isIncoming = call.callType?.toLowerCase() === 'incoming'
  const isMissed = call.callType?.toLowerCase() === 'missed'
  const isRejected = call.callType?.toLowerCase() === 'rejected'
  const isConnected = call.duration > 0

  const getCallIcon = () => {
    if (isMissed || isRejected) return PhoneMissed
    if (isIncoming) return PhoneIncoming
    return PhoneOutgoing
  }

  const getCallColor = () => {
    if (isMissed || isRejected) return { bg: '#FEE2E2', color: '#DC2626' }
    if (isConnected) return { bg: '#D1FAE5', color: '#059669' }
    return { bg: '#FEF3C7', color: '#D97706' }
  }

  const getStatusLabel = () => {
    if (isMissed) return 'Missed'
    if (isRejected) return 'Rejected'
    if (isConnected) return 'Connected'
    return 'Not Connected'
  }

  const formatDuration = (seconds) => {
    if (!seconds) return '0s'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) return `${mins}m ${secs}s`
    return `${secs}s`
  }

  const formatTime = (dateStr, timeStr) => {
    if (!dateStr) return ''
    try {
      const dt = new Date(`${dateStr}T${timeStr || '00:00:00'}`)
      return dt.toLocaleString('en-IN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: true
      })
    } catch {
      return dateStr
    }
  }

  const CallIcon = getCallIcon()
  const callColor = getCallColor()

  return (
    <div style={{
      backgroundColor: '#FFFFFF', borderRadius: '16px',
      border: '1px solid #E5E7EB', padding: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)', transition: 'box-shadow 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: callColor.bg }}>
            <CallIcon size={20} style={{ color: callColor.color }} />
          </div>
          <div>
            <p style={{ fontWeight: '600', color: '#1F2937', fontSize: '15px', margin: 0 }}>
              {call.clientName !== 'Unknown' ? call.clientName : call.clientNumber}
            </p>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0 0 0' }}>{call.clientNumber}</p>
            <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '4px 0 0 0' }}>
              {call.callType} • {call.empName}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <span style={{
            padding: '4px 10px', borderRadius: '9999px', fontSize: '11px',
            fontWeight: '600', backgroundColor: callColor.bg, color: callColor.color,
          }}>
            {getStatusLabel()}
          </span>
          {call.recordingUrl && (
            <a
              href={call.recordingUrl} target="_blank" rel="noopener noreferrer"
              style={{
                padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '500',
                backgroundColor: '#EFF6FF', color: '#2563EB', textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: '3px',
              }}
            >
              <Play size={10} /> Recording
            </a>
          )}
        </div>
      </div>

      {isConnected && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #F3F4F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
              fontSize: '13px', color: '#059669', fontWeight: '500',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}>
              <Clock size={12} />
              {formatDuration(call.duration)}
            </span>
          </div>
        </div>
      )}

      <div style={{
        marginTop: '12px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', fontSize: '12px', color: '#9CA3AF',
      }}>
        <span style={{
          padding: '2px 8px', borderRadius: '4px', backgroundColor: '#FDF8F4',
          color: '#C59C82', fontSize: '10px', fontWeight: '600',
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>Callyzer</span>
        <span>{formatTime(call.callDate, call.callTime)}</span>
      </div>
    </div>
  )
}

const LogCallModal = ({ isOpen, onClose, lead, onSuccess }) => {
  const [step, setStep] = useState(1)
  const [selectedLead, setSelectedLead] = useState(lead || null)
  const [searchQuery, setSearchQuery] = useState('')
  const [leads, setLeads] = useState([])
  const [loadingLeads, setLoadingLeads] = useState(false)
  const [formData, setFormData] = useState({
    callType: 'outbound', outcome: '', duration: '', notes: '', nextAction: '', nextActionDate: '',
  })
  const [loading, setLoading] = useState(false)
  const [activeCall, setActiveCall] = useState(null)

  useEffect(() => {
    if (lead) { setSelectedLead(lead); setStep(2) }
  }, [lead])

  const searchLeads = async () => {
    if (!searchQuery.trim()) return
    setLoadingLeads(true)
    try {
      const response = await leadsAPI.getAll({ search: searchQuery, limit: 10 })
      setLeads(response.data || [])
    } catch (error) {
      console.error('Error searching leads:', error)
    } finally {
      setLoadingLeads(false)
    }
  }

  const startCall = async () => {
    if (!selectedLead) return
    setLoading(true)
    try {
      if (selectedLead.phone) window.location.href = telHref(selectedLead.phone)
      const response = await callActivitiesAPI.create({
        leadId: selectedLead._id, callType: formData.callType, notes: formData.notes,
      })
      setActiveCall(response.data)
      setStep(2)
    } catch (error) {
      console.error('Error starting call:', error)
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const completeCall = async () => {
    if (!activeCall) return
    setLoading(true)
    try {
      await callActivitiesAPI.complete(activeCall._id, {
        outcome: formData.outcome, duration: parseInt(formData.duration) || 0,
        notes: formData.notes, nextAction: formData.nextAction, nextActionDate: formData.nextActionDate,
      })
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error completing call:', error)
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const inputStyle = {
    width: '100%', padding: '14px 16px', border: '1px solid #E5E7EB',
    borderRadius: '12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px',
    }}>
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%',
        maxWidth: '500px', maxHeight: '90vh', overflow: 'hidden',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
      }}>
        <div style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', color: '#FFFFFF', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '12px' }}>
                <Phone size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>
                  {step === 1 ? 'Select Lead' : 'Log Call Activity'}
                </h2>
                <p style={{ fontSize: '14px', color: '#BFDBFE', margin: '4px 0 0 0' }}>
                  {selectedLead ? selectedLead.name : 'Search and select a lead'}
                </p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex' }}>
              <X size={20} style={{ color: '#FFFFFF' }} />
            </button>
          </div>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', maxHeight: 'calc(90vh - 200px)' }}>
          {step === 1 && (
            <div>
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                <input type="text" placeholder="Search by name, phone, or email..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchLeads()}
                  style={{ ...inputStyle, paddingLeft: '44px' }}
                />
              </div>
              <button onClick={searchLeads} disabled={loadingLeads}
                style={{ width: '100%', padding: '12px', backgroundColor: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', marginBottom: '16px' }}
              >
                {loadingLeads ? 'Searching...' : 'Search'}
              </button>
              <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                {leads.map((l) => (
                  <button key={l._id} onClick={() => { setSelectedLead(l); setStep(2) }}
                    style={{
                      width: '100%', padding: '14px', textAlign: 'left',
                      border: selectedLead?._id === l._id ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                      borderRadius: '12px', backgroundColor: selectedLead?._id === l._id ? '#EFF6FF' : '#FFFFFF',
                      marginBottom: '8px', cursor: 'pointer',
                    }}
                  >
                    <p style={{ fontWeight: '600', color: '#1F2937', margin: 0 }}>{l.name}</p>
                    <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0 0 0' }}>{l.phone} • {l.leadId}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{ backgroundColor: '#F9FAFB', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', backgroundColor: '#DBEAFE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={20} style={{ color: '#2563EB' }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: '600', color: '#1F2937', margin: 0 }}>{selectedLead?.name}</p>
                    <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0 0 0' }}>{selectedLead?.phone ? formatPhone(selectedLead.phone) : '-'}</p>
                  </div>
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '10px' }}>Call Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {['outbound', 'inbound', 'follow_up'].map((type) => (
                    <button key={type} onClick={() => setFormData({ ...formData, callType: type })}
                      style={{
                        padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: '500', border: 'none', cursor: 'pointer',
                        backgroundColor: formData.callType === type ? '#3B82F6' : '#F3F4F6',
                        color: formData.callType === type ? '#FFFFFF' : '#374151',
                      }}
                    >
                      {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Outcome *</label>
                <select value={formData.outcome} onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                  style={{ ...inputStyle, cursor: 'pointer', backgroundColor: '#FFFFFF' }}>
                  <option value="">Select outcome...</option>
                  {CALL_OUTCOMES.map((outcome) => (
                    <option key={outcome.value} value={outcome.value}>{outcome.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Duration (seconds)</label>
                <input type="number" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} placeholder="e.g., 120" style={inputStyle} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Add call notes..." rows={3} style={{ ...inputStyle, resize: 'none' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Next Action</label>
                <select value={formData.nextAction} onChange={(e) => setFormData({ ...formData, nextAction: e.target.value })}
                  style={{ ...inputStyle, cursor: 'pointer', backgroundColor: '#FFFFFF' }}>
                  <option value="">Select next action...</option>
                  <option value="callback">Schedule Callback</option>
                  <option value="meeting">Schedule Meeting</option>
                  <option value="email">Send Email</option>
                  <option value="proposal">Send Proposal</option>
                  <option value="none">No Action Required</option>
                </select>
              </div>
              {formData.nextAction && formData.nextAction !== 'none' && (
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Next Action Date</label>
                  <input type="datetime-local" value={formData.nextActionDate} onChange={(e) => setFormData({ ...formData, nextActionDate: e.target.value })} style={inputStyle} />
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px solid #E5E7EB', padding: '16px 24px', display: 'flex', gap: '12px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '14px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', color: '#374151', borderRadius: '12px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>Cancel</button>
          {step === 1 && selectedLead && (
            <button onClick={startCall} disabled={loading}
              style={{ flex: 1, padding: '14px', border: 'none', backgroundColor: '#3B82F6', color: '#FFFFFF', borderRadius: '12px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {loading ? 'Starting...' : <><PhoneCall size={18} /> Start Call</>}
            </button>
          )}
          {step === 2 && (
            <button onClick={activeCall ? completeCall : startCall} disabled={loading || (step === 2 && !formData.outcome)}
              style={{
                flex: 1, padding: '14px', border: 'none',
                backgroundColor: (loading || !formData.outcome) ? '#86EFAC' : '#22C55E',
                color: '#FFFFFF', borderRadius: '12px', fontSize: '14px', fontWeight: '500',
                cursor: (loading || !formData.outcome) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}>
              {loading ? 'Saving...' : <><CheckCircle size={18} /> {activeCall ? 'Complete Call' : 'Log Call'}</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const ScheduleMeetingModal = ({ isOpen, onClose, callActivity, onSuccess }) => {
  const [formData, setFormData] = useState({
    scheduledDate: '', location: '', locationType: 'site_visit', meetingType: 'initial_consultation', agenda: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!formData.scheduledDate) { alert('Please select a date and time'); return }
    setLoading(true)
    try {
      await callActivitiesAPI.scheduleMeeting(callActivity._id, formData)
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error scheduling meeting:', error)
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const inputStyle = {
    width: '100%', padding: '14px 16px', border: '1px solid #E5E7EB',
    borderRadius: '12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', width: '100%', maxWidth: '450px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
        <div style={{ background: 'linear-gradient(135deg, #B8926E 0%, #C59C82 100%)', color: '#FFFFFF', padding: '24px', borderRadius: '20px 20px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Calendar size={24} />
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Schedule Meeting</h2>
                <p style={{ fontSize: '14px', color: '#DDC5B0', margin: '4px 0 0 0' }}>Set up a meeting with the lead</p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex' }}>
              <X size={20} style={{ color: '#FFFFFF' }} />
            </button>
          </div>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Date & Time *</label>
            <input type="datetime-local" value={formData.scheduledDate} onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })} style={inputStyle} />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Meeting Type</label>
            <select value={formData.meetingType} onChange={(e) => setFormData({ ...formData, meetingType: e.target.value })} style={{ ...inputStyle, cursor: 'pointer', backgroundColor: '#FFFFFF' }}>
              <option value="initial_consultation">Initial Consultation</option>
              <option value="site_visit">Site Visit</option>
              <option value="design_presentation">Design Presentation</option>
              <option value="proposal_discussion">Proposal Discussion</option>
              <option value="follow_up">Follow Up</option>
            </select>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Location Type</label>
            <select value={formData.locationType} onChange={(e) => setFormData({ ...formData, locationType: e.target.value })} style={{ ...inputStyle, cursor: 'pointer', backgroundColor: '#FFFFFF' }}>
              <option value="site_visit">Site Visit (Client Location)</option>
              <option value="office">Office Meeting</option>
              <option value="virtual">Virtual (Video Call)</option>
            </select>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Location/Link</label>
            <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Address or meeting link..." style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Agenda</label>
            <textarea value={formData.agenda} onChange={(e) => setFormData({ ...formData, agenda: e.target.value })} placeholder="Meeting agenda..." rows={3} style={{ ...inputStyle, resize: 'none' }} />
          </div>
        </div>
        <div style={{ borderTop: '1px solid #E5E7EB', padding: '16px 24px', display: 'flex', gap: '12px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '14px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', color: '#374151', borderRadius: '12px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !formData.scheduledDate}
            style={{ flex: 1, padding: '14px', border: 'none', backgroundColor: (loading || !formData.scheduledDate) ? '#D4B49A' : '#B8926E', color: '#FFFFFF', borderRadius: '12px', fontSize: '14px', fontWeight: '500', cursor: (loading || !formData.scheduledDate) ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Scheduling...' : 'Schedule Meeting'}
          </button>
        </div>
      </div>
    </div>
  )
}

const DURATION_OPTIONS = [
  { value: '', label: 'All Durations' },
  { value: '0-30', label: '< 30s', min: 0, max: 30 },
  { value: '30-120', label: '30s - 2m', min: 30, max: 120 },
  { value: '120-300', label: '2m - 5m', min: 120, max: 300 },
  { value: '300+', label: '5m+', min: 300, max: undefined },
]

const getToday = () => new Date().toISOString().split('T')[0]

const formatTalkTime = (seconds) => {
  if (!seconds) return '0h 0m'
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return `${hrs}h ${mins}m`
}

export default function CallActivities() {
  const { user } = useAuth()
  const isPreSales = user?.subDepartment === 'pre_sales' || user?.role === 'pre_sales'
  const isAdmin = ['superadmin', 'super_admin', 'admin', 'company_admin', 'sales_manager'].includes(
    (user?.role || '').toLowerCase()
  )
  const [searchParams] = useSearchParams()
  const [activities, setActivities] = useState([])
  const [callyzerCalls, setCallyzerCalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingCallyzer, setLoadingCallyzer] = useState(true)
  const [showLogCallModal, setShowLogCallModal] = useState(false)
  const [showMeetingModal, setShowMeetingModal] = useState(false)
  const [selectedCall, setSelectedCall] = useState(null)
  const [callyzerStats, setCallyzerStats] = useState(null)
  const [callyzerConfigured, setCallyzerConfigured] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [viewMode, setViewMode] = useState('callyzer')
  const [callyzerPagination, setCallyzerPagination] = useState({ total: 0, page: 1, pageSize: 50 })
  const [loadingMore, setLoadingMore] = useState(false)

  // Analytics (infographics) state
  const [analyticsOpen, setAnalyticsOpen] = useState(true)
  const [dashboardData, setDashboardData] = useState(null)
  const [loadingDashboard, setLoadingDashboard] = useState(false)

  // Filter state
  const [callyzerFilters, setCallyzerFilters] = useState({
    startDate: getToday(),
    endDate: getToday(),
    callType: '',
    empNumber: '',
    duration: '',
    search: '',
  })
  const [employees, setEmployees] = useState([])

  // Initial config check
  useEffect(() => {
    checkConfig()
  }, [])

  // Re-fetch when filters change
  useEffect(() => {
    if (callyzerConfigured) {
      fetchCallyzerCalls().then(() => fetchCallyzerStats())
      fetchDashboardData()
    }
  }, [callyzerConfigured, callyzerFilters.startDate, callyzerFilters.endDate, callyzerFilters.callType, callyzerFilters.empNumber, callyzerFilters.duration])

  useEffect(() => {
    fetchActivities()
  }, [])

  const checkConfig = async () => {
    try {
      const configRes = await callyzerAPI.getConfig()
      if (configRes.success && configRes.data?.isConfigured) {
        setCallyzerConfigured(true)
      }
    } catch (error) {
      console.error('Error fetching callyzer config:', error)
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoadingDashboard(true)
      const params = {}
      if (callyzerFilters.startDate) params.startDate = callyzerFilters.startDate
      if (callyzerFilters.endDate) params.endDate = callyzerFilters.endDate
      const result = await callyzerAPI.getDashboard(params)
      if (result.success) {
        setDashboardData(result.data)
      }
    } catch (err) {
      console.error('Dashboard data error:', err)
    } finally {
      setLoadingDashboard(false)
    }
  }

  const buildApiParams = useCallback(() => {
    const params = {}
    if (callyzerFilters.startDate) params.startDate = callyzerFilters.startDate
    if (callyzerFilters.endDate) params.endDate = callyzerFilters.endDate
    if (callyzerFilters.callType) params.callType = callyzerFilters.callType
    if (callyzerFilters.empNumber) params.empNumber = callyzerFilters.empNumber
    const dur = DURATION_OPTIONS.find(d => d.value === callyzerFilters.duration)
    if (dur && dur.min !== undefined) params.minDuration = dur.min
    if (dur && dur.max !== undefined) params.maxDuration = dur.max
    return params
  }, [callyzerFilters])

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const response = await callActivitiesAPI.getAll({ limit: 50 })
      setActivities(response.data || [])
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCallyzerStats = async () => {
    try {
      const params = {}
      if (callyzerFilters.startDate) params.startDate = callyzerFilters.startDate
      if (callyzerFilters.endDate) params.endDate = callyzerFilters.endDate
      if (callyzerFilters.empNumber) params.employeeNumber = callyzerFilters.empNumber
      if (callyzerFilters.callType) params.callType = callyzerFilters.callType
      const statsRes = await callyzerAPI.getStats(params)
      if (statsRes.success) {
        setCallyzerStats(statsRes.data?.summary || null)
      }
    } catch (e) {
      console.error('Error fetching callyzer stats:', e)
    }
  }

  const fetchCallyzerCalls = async (pageNum = 1, append = false) => {
    if (!append) setLoadingCallyzer(true)
    setLoadingMore(pageNum > 1)
    try {
      const params = { ...buildApiParams(), page: pageNum }
      const callsRes = await callyzerAPI.getCalls(params)
      if (callsRes.success) {
        const calls = callsRes.data || []
        setCallyzerCalls(prev => append ? [...prev, ...calls] : calls)
        setCallyzerPagination(callsRes.pagination || { total: 0, page: pageNum, pageSize: 50 })
        const empMap = new Map()
        calls.forEach(c => {
          if (c.empNumber && !empMap.has(c.empNumber)) {
            empMap.set(c.empNumber, { empNumber: c.empNumber, empName: c.empName || c.empNumber })
          }
        })
        setEmployees(prev => {
          const merged = new Map(prev.map(e => [e.empNumber, e]))
          empMap.forEach((v, k) => merged.set(k, v))
          return Array.from(merged.values())
        })
      }
    } catch (e) {
      console.error('Error fetching callyzer calls:', e)
    } finally {
      setLoadingCallyzer(false)
      setLoadingMore(false)
    }
  }

  const loadMoreCalls = () => {
    const nextPage = callyzerPagination.page + 1
    fetchCallyzerCalls(nextPage, true)
  }

  const filteredCalls = useMemo(() => {
    if (!callyzerFilters.search.trim()) return callyzerCalls
    const q = callyzerFilters.search.toLowerCase()
    return callyzerCalls.filter(c =>
      (c.clientName && c.clientName.toLowerCase().includes(q)) ||
      (c.clientNumber && c.clientNumber.includes(q)) ||
      (c.empName && c.empName.toLowerCase().includes(q))
    )
  }, [callyzerCalls, callyzerFilters.search])

  const handleFilterChange = (key, value) => {
    setCallyzerFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleResetFilters = () => {
    setCallyzerFilters({ startDate: getToday(), endDate: getToday(), callType: '', empNumber: '', duration: '', search: '' })
  }

  const handleRefreshCallyzer = async () => {
    await fetchCallyzerCalls()
    await fetchCallyzerStats()
    fetchDashboardData()
  }

  const handleStartCall = (call) => { setSelectedCall(call); setShowLogCallModal(true) }
  const handleCompleteCall = (call) => { setSelectedCall(call); setShowLogCallModal(true) }

  // Use dashboard data as fallback when stats endpoint returns incomplete data
  const ds = dashboardData?.summary || {}
  const totalCalls = callyzerStats?.total_calls || ds.total_calls || 0
  const connectedCalls = callyzerStats?.total_connected_calls || ds.total_connected_calls || ds.connected_calls || 0
  const missedCalls = callyzerStats?.total_missed_calls || ds.total_missed_calls || ds.missed_calls || 0
  const outgoingCalls = callyzerStats?.total_outgoing_calls || ds.total_outgoing_calls || ds.outgoing_calls || 0
  const totalDuration = callyzerStats?.total_duration || ds.total_duration || 0

  // Dashboard chart data
  const pieData = useMemo(() => {
    if (!dashboardData?.callTypeBreakdown) return []
    const { incoming, outgoing, missed, rejected } = dashboardData.callTypeBreakdown
    return [
      { name: 'Incoming', value: incoming || 0 },
      { name: 'Outgoing', value: outgoing || 0 },
      { name: 'Missed', value: missed || 0 },
      { name: 'Rejected', value: rejected || 0 },
    ].filter(d => d.value > 0)
  }, [dashboardData])

  const dailyData = useMemo(() => {
    if (!dashboardData?.dailyTrend) return []
    return dashboardData.dailyTrend.map(d => ({
      date: d.date ? new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : d.date,
      'Total': d.total_calls || 0,
      'Connected': d.connected_calls || 0,
      'Missed': d.missed_calls || 0,
    }))
  }, [dashboardData])

  const hourlyData = useMemo(() => {
    if (!dashboardData?.hourlyDistribution) return []
    return dashboardData.hourlyDistribution.map(d => ({
      hour: `${String(d.hour).padStart(2, '0')}:00`,
      Calls: d.total_calls || 0,
    }))
  }, [dashboardData])

  const employeeChartData = useMemo(() => {
    if (!dashboardData?.employees?.length) return []
    return dashboardData.employees
      .sort((a, b) => (b.total_calls || 0) - (a.total_calls || 0))
      .slice(0, 10)
      .map(e => ({
        name: (e.emp_name || e.name || 'Unknown').split(' ')[0],
        fullName: e.emp_name || e.name || 'Unknown',
        Total: e.total_calls || 0,
        Connected: e.connected_calls || 0,
        Missed: e.missed_calls || 0,
      }))
  }, [dashboardData])

  // ─── New admin-only analytics data ───
  const connectionRate = useMemo(() => {
    if (!dashboardData?.summary) return 0
    const { total_calls, connected_calls } = dashboardData.summary
    return total_calls > 0 ? ((connected_calls / total_calls) * 100).toFixed(1) : 0
  }, [dashboardData])

  const avgDuration = useMemo(() => {
    if (!dashboardData?.summary?.avg_duration) return 0
    return dashboardData.summary.avg_duration
  }, [dashboardData])

  const topPerformer = useMemo(() => {
    if (!dashboardData?.employees?.length) return null
    return dashboardData.employees.reduce((best, emp) =>
      (emp.total_calls || 0) > (best?.total_calls || 0) ? emp : best, null)
  }, [dashboardData])

  const busiestHour = useMemo(() => {
    if (!hourlyData.length) return null
    return hourlyData.reduce((best, h) => h.Calls > (best?.Calls || 0) ? h : best, null)
  }, [hourlyData])

  const employeeTalkTimeData = useMemo(() => {
    if (!dashboardData?.employees?.length) return []
    return dashboardData.employees
      .sort((a, b) => (b.total_duration || 0) - (a.total_duration || 0))
      .slice(0, 10)
      .map(e => ({
        name: (e.emp_name || e.name || 'Unknown').split(' ')[0],
        fullName: e.emp_name || e.name || 'Unknown',
        Minutes: Math.round((e.total_duration || 0) / 60),
        'Avg (s)': e.avg_duration || 0,
      }))
  }, [dashboardData])

  const employeeRateData = useMemo(() => {
    if (!dashboardData?.employees?.length) return []
    return dashboardData.employees
      .filter(e => (e.total_calls || 0) > 0)
      .map(e => ({
        name: (e.emp_name || e.name || 'Unknown').split(' ')[0],
        fullName: e.emp_name || e.name || 'Unknown',
        Rate: parseFloat(((e.connected_calls || 0) / (e.total_calls || 1) * 100).toFixed(1)),
        total: e.total_calls,
      }))
      .sort((a, b) => b.Rate - a.Rate)
      .slice(0, 10)
  }, [dashboardData])

  const outcomeData = useMemo(() => {
    if (!dashboardData?.outcomeDistribution?.length) return []
    return dashboardData.outcomeDistribution.map(o => ({
      name: CALL_OUTCOMES.find(co => co.value === o.outcome)?.label || o.outcome,
      value: o.count,
      outcome: o.outcome,
    }))
  }, [dashboardData])

  const hasChartData = (dashboardData?.summary?.total_calls || 0) > 0 || pieData.length > 0 || dailyData.length > 0 || (hourlyData.length > 0 && hourlyData.some(h => h.Calls > 0)) || outcomeData.length > 0

  const inOutDailyData = useMemo(() => {
    if (!dashboardData?.dailyTrend) return []
    return dashboardData.dailyTrend.map(d => ({
      date: d.date ? new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : d.date,
      Incoming: d.incoming || 0,
      Outgoing: d.outgoing || 0,
    }))
  }, [dashboardData])

  const connectionDonutData = useMemo(() => {
    if (!dashboardData?.summary) return []
    const { total_calls, connected_calls } = dashboardData.summary
    const notConnected = total_calls - connected_calls
    return [
      { name: 'Connected', value: connected_calls || 0 },
      { name: 'Not Connected', value: notConnected > 0 ? notConnected : 0 },
    ]
  }, [dashboardData])

  const formatAvgDur = (s) => {
    if (!s) return '0s'
    const m = Math.floor(s / 60)
    const sec = s % 60
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1F2937', margin: 0 }}>Call Activities</h1>
          <p style={{ color: '#6B7280', margin: '8px 0 0 0' }}>
            {isAdmin ? 'All pre-sales team call data & analytics' : 'Your call data & analytics'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {callyzerConfigured && (
            <button onClick={handleRefreshCallyzer}
              style={{
                padding: '12px 16px', backgroundColor: '#FFFFFF', color: '#6B7280',
                border: '1px solid #E5E7EB', borderRadius: '12px', fontSize: '14px',
                fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              }}>
              <RefreshCw size={16} /> Refresh
            </button>
          )}
          <button onClick={() => { setSelectedCall(null); setShowLogCallModal(true) }}
            style={{
              padding: '12px 20px', backgroundColor: '#3B82F6', color: '#FFFFFF',
              border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '500',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            }}>
            <Plus size={18} /> Log New Call
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { icon: Phone, value: totalCalls, label: 'Total Calls', iconBg: '#DBEAFE', iconColor: '#2563EB', valueColor: '#1F2937' },
          { icon: PhoneCall, value: connectedCalls, label: 'Connected', iconBg: '#D1FAE5', iconColor: '#059669', valueColor: '#059669' },
          { icon: PhoneMissed, value: missedCalls, label: 'Missed', iconBg: '#FEE2E2', iconColor: '#DC2626', valueColor: '#DC2626' },
          { icon: PhoneOutgoing, value: outgoingCalls, label: 'Outgoing', iconBg: '#FEF3C7', iconColor: '#D97706', valueColor: '#1F2937' },
          { icon: Clock, value: formatTalkTime(totalDuration), label: 'Talk Time', iconBg: '#F5EDE6', iconColor: '#C59C82', valueColor: '#1F2937' },
        ].map((stat) => (
          <div key={stat.label} style={{
            backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '20px',
            border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '12px', backgroundColor: stat.iconBg, borderRadius: '12px' }}>
                <stat.icon size={22} style={{ color: stat.iconColor }} />
              </div>
              <div>
                <p style={{ fontSize: '28px', fontWeight: '700', color: stat.valueColor, margin: 0 }}>{stat.value}</p>
                <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0 0 0' }}>{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Collapsible Analytics Section */}
      {callyzerConfigured && (
        <div style={{
          backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5E7EB',
          marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden',
        }}>
          <button
            onClick={() => setAnalyticsOpen(!analyticsOpen)}
            style={{
              width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BarChart3 size={18} style={{ color: BRAND }} />
              <span style={{ fontSize: '15px', fontWeight: '600', color: '#1F2937' }}>Analytics & Insights</span>
              {!analyticsOpen && hasChartData && (
                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '400' }}>Click to expand</span>
              )}
            </div>
            {analyticsOpen
              ? <ChevronUp size={18} style={{ color: '#9CA3AF' }} />
              : <ChevronDown size={18} style={{ color: '#9CA3AF' }} />
            }
          </button>

          {analyticsOpen && (
            <div style={{ padding: '0 20px 20px' }}>
              {loadingDashboard ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
                  <div style={{
                    width: '36px', height: '36px',
                    border: '3px solid #F5E6D3', borderTopColor: BRAND,
                    borderRadius: '50%', animation: 'spin 1s linear infinite',
                  }} />
                </div>
              ) : !hasChartData ? (
                <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '32px 0' }}>
                  No analytics data available for the selected date range
                </p>
              ) : (
                <>
                  {/* KPI Cards - Admin Only */}
                  {isAdmin && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
                      {/* Connection Rate */}
                      <div style={{
                        background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                        borderRadius: '14px', padding: '18px', position: 'relative', overflow: 'hidden',
                      }}>
                        <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(59,130,246,0.1)' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                          <Target size={16} style={{ color: '#2563EB' }} />
                          <span style={{ fontSize: '11px', fontWeight: '600', color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Connection Rate</span>
                        </div>
                        <p style={{
                          fontSize: '32px', fontWeight: '800', margin: 0,
                          color: parseFloat(connectionRate) >= 60 ? '#059669' : parseFloat(connectionRate) >= 30 ? '#D97706' : '#DC2626',
                        }}>
                          {connectionRate}%
                        </p>
                        <div style={{ marginTop: '8px', height: '4px', backgroundColor: 'rgba(59,130,246,0.15)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(parseFloat(connectionRate), 100)}%`, backgroundColor: parseFloat(connectionRate) >= 60 ? '#059669' : parseFloat(connectionRate) >= 30 ? '#D97706' : '#DC2626', borderRadius: '2px', transition: 'width 0.8s ease' }} />
                        </div>
                      </div>

                      {/* Avg Call Duration */}
                      <div style={{
                        background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                        borderRadius: '14px', padding: '18px', position: 'relative', overflow: 'hidden',
                      }}>
                        <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                          <Timer size={16} style={{ color: '#059669' }} />
                          <span style={{ fontSize: '11px', fontWeight: '600', color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Duration</span>
                        </div>
                        <p style={{ fontSize: '32px', fontWeight: '800', color: '#065F46', margin: 0 }}>
                          {formatAvgDur(avgDuration)}
                        </p>
                        <p style={{ fontSize: '12px', color: '#6B7280', margin: '6px 0 0 0' }}>per connected call</p>
                      </div>

                      {/* Top Performer */}
                      <div style={{
                        background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
                        borderRadius: '14px', padding: '18px', position: 'relative', overflow: 'hidden',
                      }}>
                        <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(245,158,11,0.1)' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                          <Award size={16} style={{ color: '#D97706' }} />
                          <span style={{ fontSize: '11px', fontWeight: '600', color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top Performer</span>
                        </div>
                        <p style={{ fontSize: '18px', fontWeight: '700', color: '#92400E', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {topPerformer?.emp_name || topPerformer?.name || '—'}
                        </p>
                        <p style={{ fontSize: '12px', color: '#6B7280', margin: '6px 0 0 0' }}>
                          {topPerformer ? `${topPerformer.total_calls} calls • ${topPerformer.connected_calls || 0} connected` : 'No data'}
                        </p>
                      </div>

                      {/* Busiest Hour */}
                      <div style={{
                        background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)',
                        borderRadius: '14px', padding: '18px', position: 'relative', overflow: 'hidden',
                      }}>
                        <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(236,72,153,0.1)' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                          <Zap size={16} style={{ color: '#DB2777' }} />
                          <span style={{ fontSize: '11px', fontWeight: '600', color: '#DB2777', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Busiest Hour</span>
                        </div>
                        <p style={{ fontSize: '32px', fontWeight: '800', color: '#831843', margin: 0 }}>
                          {busiestHour?.hour || '—'}
                        </p>
                        <p style={{ fontSize: '12px', color: '#6B7280', margin: '6px 0 0 0' }}>
                          {busiestHour ? `${busiestHour.Calls} calls at peak` : 'No data'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Row 1: Pie + Daily Trend */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: pieData.length > 0 ? '280px 1fr' : '1fr',
                    gap: '20px', marginBottom: '20px',
                  }}>
                    {pieData.length > 0 && (
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', margin: '0 0 8px' }}>Call Types</p>
                        <div style={{ width: '100%', height: 220 }}>
                          <ResponsiveContainer>
                            <PieChart>
                              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                              </Pie>
                              <Tooltip />
                              <Legend verticalAlign="bottom" height={36}
                                formatter={(value) => <span style={{ fontSize: '11px', color: '#475569' }}>{value}</span>} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {dailyData.length > 0 && (
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', margin: '0 0 8px' }}>Daily Trend</p>
                        <div style={{ width: '100%', height: 220 }}>
                          <ResponsiveContainer>
                            <AreaChart data={dailyData}>
                              <defs>
                                <linearGradient id="aTotal" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="aConnected" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                              <Tooltip content={<ChartTooltip />} />
                              <Legend verticalAlign="top" height={30}
                                formatter={(value) => <span style={{ fontSize: '11px', color: '#475569' }}>{value}</span>} />
                              <Area type="monotone" dataKey="Total" stroke="#3B82F6" fill="url(#aTotal)" strokeWidth={2} />
                              <Area type="monotone" dataKey="Connected" stroke="#10B981" fill="url(#aConnected)" strokeWidth={2} />
                              <Area type="monotone" dataKey="Missed" stroke="#EF4444" fill="none" strokeWidth={2} strokeDasharray="5 5" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Row 2: Hourly + Employee Performance */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isAdmin && employeeChartData.length > 0 ? '1fr 1fr' : '1fr',
                    gap: '20px', marginBottom: isAdmin && dashboardData?.employees?.length > 0 ? '20px' : '0',
                  }}>
                    {hourlyData.some(h => h.Calls > 0) && (
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', margin: '0 0 8px' }}>Peak Hours</p>
                        <div style={{ width: '100%', height: 220 }}>
                          <ResponsiveContainer>
                            <BarChart data={hourlyData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#94a3b8' }} interval={2} />
                              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                              <Tooltip content={<ChartTooltip />} />
                              <Bar dataKey="Calls" fill={BRAND} radius={[3, 3, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {isAdmin && employeeChartData.length > 0 && (
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', margin: '0 0 8px' }}>Team Performance</p>
                        <div style={{ width: '100%', height: 220 }}>
                          <ResponsiveContainer>
                            <BarChart data={employeeChartData} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                              <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#475569' }} width={70} />
                              <Tooltip content={({ active, payload }) => {
                                if (!active || !payload?.length) return null
                                const d = payload[0]?.payload
                                return (
                                  <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                    <p style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b', margin: '0 0 4px' }}>{d?.fullName}</p>
                                    <p style={{ fontSize: '11px', color: '#3B82F6', margin: '2px 0' }}>Total: <strong>{d?.Total}</strong></p>
                                    <p style={{ fontSize: '11px', color: '#10B981', margin: '2px 0' }}>Connected: <strong>{d?.Connected}</strong></p>
                                    <p style={{ fontSize: '11px', color: '#EF4444', margin: '2px 0' }}>Missed: <strong>{d?.Missed}</strong></p>
                                  </div>
                                )
                              }} />
                              <Bar dataKey="Total" fill="#3B82F6" radius={[0, 3, 3, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Row 3: Connection Rate Donut + Employee Talk Time - Admin Only */}
                  {isAdmin && (employeeTalkTimeData.length > 0 || connectionDonutData.some(d => d.value > 0)) && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: connectionDonutData.some(d => d.value > 0) && employeeTalkTimeData.length > 0 ? '280px 1fr' : '1fr',
                      gap: '20px', marginBottom: '20px',
                    }}>
                      {connectionDonutData.some(d => d.value > 0) && (
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', margin: '0 0 8px' }}>Connection Rate</p>
                          <div style={{ width: '100%', height: 220, position: 'relative' }}>
                            <ResponsiveContainer>
                              <PieChart>
                                <Pie data={connectionDonutData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                                  <Cell fill="#10B981" />
                                  <Cell fill="#F1F5F9" />
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                            <div style={{
                              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                              textAlign: 'center', pointerEvents: 'none',
                            }}>
                              <p style={{
                                fontSize: '24px', fontWeight: '800', margin: 0,
                                color: parseFloat(connectionRate) >= 60 ? '#059669' : parseFloat(connectionRate) >= 30 ? '#D97706' : '#DC2626',
                              }}>{connectionRate}%</p>
                              <p style={{ fontSize: '10px', color: '#94a3b8', margin: '2px 0 0' }}>Connected</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {employeeTalkTimeData.length > 0 && (
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', margin: '0 0 8px' }}>
                            <Timer size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }} />
                            Employee Talk Time (minutes)
                          </p>
                          <div style={{ width: '100%', height: 220 }}>
                            <ResponsiveContainer>
                              <BarChart data={employeeTalkTimeData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#475569' }} width={70} />
                                <Tooltip content={({ active, payload }) => {
                                  if (!active || !payload?.length) return null
                                  const d = payload[0]?.payload
                                  return (
                                    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                      <p style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b', margin: '0 0 4px' }}>{d?.fullName}</p>
                                      <p style={{ fontSize: '11px', color: '#10B981', margin: '2px 0' }}>Talk Time: <strong>{d?.Minutes} min</strong></p>
                                      <p style={{ fontSize: '11px', color: '#6B7280', margin: '2px 0' }}>Avg/Call: <strong>{d?.['Avg (s)']}s</strong></p>
                                    </div>
                                  )
                                }} />
                                <Bar dataKey="Minutes" fill="#10B981" radius={[0, 4, 4, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Row 4: Employee Connection Rate + Outcome Distribution - Admin Only */}
                  {isAdmin && (employeeRateData.length > 0 || outcomeData.length > 0) && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: employeeRateData.length > 0 && outcomeData.length > 0 ? '1fr 280px' : '1fr',
                      gap: '20px', marginBottom: '20px',
                    }}>
                      {employeeRateData.length > 0 && (
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', margin: '0 0 8px' }}>
                            <Target size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }} />
                            Connection Rate by Employee
                          </p>
                          <div style={{ width: '100%', height: 220 }}>
                            <ResponsiveContainer>
                              <BarChart data={employeeRateData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 100]} unit="%" />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#475569' }} width={70} />
                                <Tooltip content={({ active, payload }) => {
                                  if (!active || !payload?.length) return null
                                  const d = payload[0]?.payload
                                  return (
                                    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                      <p style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b', margin: '0 0 4px' }}>{d?.fullName}</p>
                                      <p style={{ fontSize: '11px', color: d?.Rate >= 60 ? '#059669' : d?.Rate >= 30 ? '#D97706' : '#DC2626', margin: '2px 0' }}>
                                        Rate: <strong>{d?.Rate}%</strong>
                                      </p>
                                      <p style={{ fontSize: '11px', color: '#6B7280', margin: '2px 0' }}>Total: <strong>{d?.total} calls</strong></p>
                                    </div>
                                  )
                                }} />
                                <Bar dataKey="Rate" radius={[0, 4, 4, 0]}>
                                  {employeeRateData.map((entry, i) => (
                                    <Cell key={i} fill={entry.Rate >= 60 ? '#10B981' : entry.Rate >= 30 ? '#F59E0B' : '#EF4444'} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}

                      {outcomeData.length > 0 && (
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', margin: '0 0 8px' }}>Call Outcomes</p>
                          <div style={{ width: '100%', height: 220 }}>
                            <ResponsiveContainer>
                              <PieChart>
                                <Pie data={outcomeData} cx="50%" cy="50%" innerRadius={40} outerRadius={68} paddingAngle={3} dataKey="value">
                                  {outcomeData.map((entry, i) => (
                                    <Cell key={i} fill={OUTCOME_CHART_COLORS[entry.outcome] || CHART_COLORS[i % CHART_COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36}
                                  formatter={(value) => <span style={{ fontSize: '10px', color: '#475569' }}>{value}</span>} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Row 5: Incoming vs Outgoing Daily Trend - Admin Only */}
                  {isAdmin && inOutDailyData.length > 1 && (
                    <div style={{ marginBottom: '20px' }}>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', margin: '0 0 8px' }}>
                        <PhoneForwarded size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }} />
                        Incoming vs Outgoing (Daily)
                      </p>
                      <div style={{ width: '100%', height: 220 }}>
                        <ResponsiveContainer>
                          <BarChart data={inOutDailyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                            <Tooltip content={<ChartTooltip />} />
                            <Legend verticalAlign="top" height={30}
                              formatter={(value) => <span style={{ fontSize: '11px', color: '#475569' }}>{value}</span>} />
                            <Bar dataKey="Incoming" fill="#3B82F6" radius={[3, 3, 0, 0]} stackId="a" />
                            <Bar dataKey="Outgoing" fill="#F59E0B" radius={[3, 3, 0, 0]} stackId="a" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Employee Table - Admin Only */}
                  {isAdmin && dashboardData?.employees?.length > 0 && (
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', margin: '0 0 10px' }}>
                        <Users size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                        Pre-Sales Team Summary
                      </p>
                      <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                              {['Employee', 'Total', 'Connected', 'Missed', 'Talk Time', 'Rate'].map(h => (
                                <th key={h} style={{
                                  textAlign: h === 'Employee' ? 'left' : 'center', padding: '10px 14px',
                                  fontSize: '11px', fontWeight: '600', color: '#64748b',
                                  textTransform: 'uppercase', letterSpacing: '0.05em',
                                }}>
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {dashboardData.employees
                              .sort((a, b) => (b.total_calls || 0) - (a.total_calls || 0))
                              .map((emp, idx) => {
                                const total = emp.total_calls || 0
                                const connected = emp.connected_calls || 0
                                const missed = emp.missed_calls || 0
                                const duration = emp.total_duration || 0
                                const rate = total > 0 ? ((connected / total) * 100).toFixed(1) : '0.0'

                                return (
                                  <tr key={emp.emp_name || emp.name || idx}
                                    style={{ borderBottom: '1px solid #f8fafc', background: idx % 2 === 0 ? 'white' : '#fafbfc' }}>
                                    <td style={{ padding: '10px 14px', fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{
                                          width: '28px', height: '28px', borderRadius: '50%',
                                          background: CHART_COLORS[idx % CHART_COLORS.length] + '20',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          fontSize: '12px', fontWeight: '700', color: CHART_COLORS[idx % CHART_COLORS.length],
                                        }}>
                                          {(emp.emp_name || emp.name || '?')[0].toUpperCase()}
                                        </div>
                                        {emp.emp_name || emp.name || 'Unknown'}
                                      </div>
                                    </td>
                                    <td style={{ padding: '10px 14px', fontSize: '13px', color: '#1e293b', textAlign: 'center', fontWeight: '600' }}>{total}</td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                      <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', background: '#ECFDF5', color: '#059669' }}>{connected}</span>
                                    </td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                      <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', background: '#FEF2F2', color: '#DC2626' }}>{missed}</span>
                                    </td>
                                    <td style={{ padding: '10px 14px', fontSize: '12px', color: '#475569', textAlign: 'center' }}>{formatTalkTime(duration)}</td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                                        <div style={{ width: '50px', height: '5px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                          <div style={{
                                            height: '100%', width: `${Math.min(parseFloat(rate), 100)}%`,
                                            background: parseFloat(rate) >= 60 ? '#10B981' : parseFloat(rate) >= 30 ? '#F59E0B' : '#EF4444',
                                            borderRadius: '3px', transition: 'width 0.5s ease',
                                          }} />
                                        </div>
                                        <span style={{
                                          fontSize: '12px', fontWeight: '600',
                                          color: parseFloat(rate) >= 60 ? '#059669' : parseFloat(rate) >= 30 ? '#D97706' : '#DC2626',
                                        }}>{rate}%</span>
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Filter Bar */}
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5E7EB',
        padding: '16px 20px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Filter size={16} style={{ color: '#6B7280' }} />
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>Filters</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#6B7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>From</label>
              <input type="date" value={callyzerFilters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '10px', fontSize: '13px', outline: 'none', backgroundColor: '#F9FAFB', color: '#374151' }} />
            </div>
            <span style={{ color: '#9CA3AF', fontSize: '13px', paddingTop: '18px' }}>–</span>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#6B7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>To</label>
              <input type="date" value={callyzerFilters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '10px', fontSize: '13px', outline: 'none', backgroundColor: '#F9FAFB', color: '#374151' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#6B7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Call Type</label>
            <select value={callyzerFilters.callType} onChange={(e) => handleFilterChange('callType', e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '10px', fontSize: '13px', outline: 'none', backgroundColor: '#F9FAFB', color: '#374151', cursor: 'pointer', minWidth: '130px' }}>
              <option value="">All Types</option>
              <option value="Incoming">Incoming</option>
              <option value="Outgoing">Outgoing</option>
              <option value="Missed">Missed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {!isPreSales && (
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#6B7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Employee</label>
              <select value={callyzerFilters.empNumber} onChange={(e) => handleFilterChange('empNumber', e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '10px', fontSize: '13px', outline: 'none', backgroundColor: '#F9FAFB', color: '#374151', cursor: 'pointer', minWidth: '150px' }}>
                <option value="">All Employees</option>
                {employees.map(emp => (
                  <option key={emp.empNumber} value={emp.empNumber}>{emp.empName}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#6B7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duration</label>
            <select value={callyzerFilters.duration} onChange={(e) => handleFilterChange('duration', e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '10px', fontSize: '13px', outline: 'none', backgroundColor: '#F9FAFB', color: '#374151', cursor: 'pointer', minWidth: '130px' }}>
              {DURATION_OPTIONS.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '180px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#6B7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Search</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input type="text" placeholder="Name or number..." value={callyzerFilters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                style={{ width: '100%', padding: '8px 12px 8px 30px', border: '1px solid #E5E7EB', borderRadius: '10px', fontSize: '13px', outline: 'none', backgroundColor: '#F9FAFB', color: '#374151', boxSizing: 'border-box' }} />
            </div>
          </div>

          <button onClick={handleResetFilters}
            style={{
              padding: '8px 14px', backgroundColor: '#F3F4F6', color: '#6B7280',
              border: '1px solid #E5E7EB', borderRadius: '10px', fontSize: '13px', fontWeight: '500',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', marginTop: '18px',
            }}>
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      </div>

      {/* Call List */}
      {loadingCallyzer ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px' }}>
          <div style={{
            width: '48px', height: '48px',
            border: '3px solid #F5E6D3', borderTopColor: '#C59C82',
            borderRadius: '50%', animation: 'spin 1s linear infinite',
          }} />
        </div>
      ) : filteredCalls.length === 0 ? (
        <div style={{
          backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '64px',
          textAlign: 'center', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
          <div style={{
            width: '80px', height: '80px', backgroundColor: '#FDF8F4', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto',
          }}>
            <Phone size={36} style={{ color: '#D4B49A' }} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', margin: '0 0 8px 0' }}>
            No Callyzer calls found
          </h3>
          <p style={{ color: '#6B7280', margin: '0 0 8px 0' }}>
            {callyzerConfigured
              ? (callyzerFilters.search || callyzerFilters.callType || callyzerFilters.empNumber || callyzerFilters.duration
                ? 'No calls match your filters. Try adjusting or resetting.'
                : 'No call data available for this date range. Make some calls or change dates.')
              : 'Configure Callyzer in Settings to see call data here.'}
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {filteredCalls.map((call, idx) => (
              <CallyzerCallCard key={call.id || idx} call={call} />
            ))}
          </div>
          {callyzerPagination.total > callyzerCalls.length && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '12px' }}>
                Showing {filteredCalls.length} of {callyzerPagination.total} calls
              </p>
              <button onClick={loadMoreCalls} disabled={loadingMore}
                style={{
                  padding: '10px 28px', backgroundColor: loadingMore ? '#E5E7EB' : '#FFFFFF',
                  color: '#374151', border: '1px solid #D1D5DB', borderRadius: '10px',
                  fontSize: '14px', fontWeight: '500', cursor: loadingMore ? 'not-allowed' : 'pointer',
                }}>
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>

      <LogCallModal
        isOpen={showLogCallModal}
        onClose={() => { setShowLogCallModal(false); setSelectedCall(null) }}
        lead={selectedCall?.lead}
        onSuccess={() => { fetchActivities(); fetchCallyzerCalls(); fetchCallyzerStats(); fetchDashboardData() }}
      />

      <ScheduleMeetingModal
        isOpen={showMeetingModal}
        onClose={() => { setShowMeetingModal(false); setSelectedCall(null) }}
        callActivity={selectedCall}
        onSuccess={() => { fetchActivities(); fetchCallyzerCalls(); fetchCallyzerStats(); fetchDashboardData() }}
      />
    </div>
  )
}
