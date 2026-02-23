import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Edit,
  Trash2,
  UserPlus,
  MessageSquare,
  ArrowRight,
  ArrowRightLeft,
  PhoneCall,
  PhoneOff,
  CheckCircle,
  XCircle,
  Building2,
  Target,
  FileText,
  AlertCircle,
  Shield,
  Eye,
  Timer,
  Upload,
  Users,
} from 'lucide-react'
import { leadsAPI, callActivitiesAPI, leadWorkflowAPI, employeesAPI, callyzerAPI } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import PageHeader from '../../components/layout/PageHeader'
import {
  Button,
  Card,
  Badge,
  Avatar,
  Modal,
  Input,
  Select,
  Tabs,
} from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import { formatDate, formatDateTime, formatPhone, formatMaskedPhone, formatRelativeTime, telHref } from '../../utils/helpers'
import { LEAD_STATUSES, PRE_SALES_STATUSES, SALES_STATUSES, LEAD_PRIORITIES, SERVICE_TYPES, PROPERTY_TYPES } from '../../utils/constants'
import { DISPOSITION_GROUPS, getUserDispositionCategory, getDispositionGroupStyle } from '../../config/dispositions'
import { io } from 'socket.io-client'

const LeadDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [lead, setLead] = useState(null)
  const [journey, setJourney] = useState([])
  const [callActivities, setCallActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [showCallModal, setShowCallModal] = useState(false)
  const [showDepartmentModal, setShowDepartmentModal] = useState(false)
  const [note, setNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [activeTab, setActiveTab] = useState('timeline')
  const [callOutcome, setCallOutcome] = useState('')
  const [callNotes, setCallNotes] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignableUsers, setAssignableUsers] = useState([])
  const [selectedAssignee, setSelectedAssignee] = useState('')
  const [assigningUser, setAssigningUser] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [transferring, setTransferring] = useState(false)
  const [showSalesExecModal, setShowSalesExecModal] = useState(false)
  const [salesExecUsers, setSalesExecUsers] = useState([])
  const [selectedSalesExec, setSelectedSalesExec] = useState('')
  const [assigningSalesExec, setAssigningSalesExec] = useState(false)
  const [loadingSalesExec, setLoadingSalesExec] = useState(false)
  const [showFollowUpForm, setShowFollowUpForm] = useState(false)
  const [followUpDate, setFollowUpDate] = useState('')
  const [followUpType, setFollowUpType] = useState('call')
  const [followUpNotes, setFollowUpNotes] = useState('')
  const [savingFollowUp, setSavingFollowUp] = useState(false)
  const [dispositionConfig, setDispositionConfig] = useState(null)
  const [selectedGroup, setSelectedGroup] = useState('')
  const [selectedSubDisposition, setSelectedSubDisposition] = useState('')
  const [dispositionRemarks, setDispositionRemarks] = useState('')
  const [savingDisposition, setSavingDisposition] = useState(false)
  const [showDispositionHistory, setShowDispositionHistory] = useState(false)
  // Click-to-call state
  const [callInProgress, setCallInProgress] = useState(false)
  const [callTimer, setCallTimer] = useState(0)
  const [showDispositionModal, setShowDispositionModal] = useState(false)
  const [callStartTime, setCallStartTime] = useState(null)
  const [callDispGroup, setCallDispGroup] = useState('')
  const [callDispSub, setCallDispSub] = useState('')
  const [callDispRemarks, setCallDispRemarks] = useState('')
  const [savingCallDisposition, setSavingCallDisposition] = useState(false)
  const callTimerRef = useRef(null)
  const callPollRef = useRef(null)
  const phoneRef = useRef(null)
  const socketRef = useRef(null)
  // Schedule Meeting modal
  const [showScheduleMeetingModal, setShowScheduleMeetingModal] = useState(false)
  const [meetingForm, setMeetingForm] = useState({
    date: '', time: '', salesPersonId: '', designerId: '', meetingType: 'office', location: '', notes: '',
  })
  const [schedulingMeeting, setSchedulingMeeting] = useState(false)
  const [salesUsers, setSalesUsers] = useState([])
  const [designerUsers, setDesignerUsers] = useState([])
  // Designer assignment modal
  const [showDesignerModal, setShowDesignerModal] = useState(false)
  const [availableDesigners, setAvailableDesigners] = useState([])
  // Inline detail editing
  const [editingDetails, setEditingDetails] = useState(false)
  const [detailsForm, setDetailsForm] = useState({})
  const [savingDetails, setSavingDetails] = useState(false)

  // Socket.IO: listen for call:ended from Callyzer webhook
  useEffect(() => {
    const token = localStorage.getItem('hoh108_admin_token')
    if (!token) return

    const socketUrl = import.meta.env.PROD
      ? 'https://hoh108.com'
      : `http://${window.location.hostname}:5001`

    socketRef.current = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    socketRef.current.on('call:ended', (data) => {
      // Only handle if it's for this lead
      if (data.leadId !== id) return

      // Stop call timer and polling
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current)
        callTimerRef.current = null
      }
      if (callPollRef.current) {
        clearInterval(callPollRef.current)
        clearTimeout(callPollRef.current)
        callPollRef.current = null
      }

      // Update timer with actual duration from Callyzer if available
      if (data.duration > 0) {
        setCallTimer(data.duration)
      }

      setCallInProgress(false)
      setShowDispositionModal(true)
    })

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [id])

  useEffect(() => {
    loadLead()
  }, [id])

  useEffect(() => {
    leadWorkflowAPI.getDispositionConfig()
      .then(res => { if (res && res.data) setDispositionConfig(res.data) })
      .catch(() => {})
  }, [])

  const loadLead = async () => {
    try {
      const [leadRes, journeyRes, callsRes] = await Promise.allSettled([
        leadsAPI.getOne(id),
        leadsAPI.getJourney(id),
        callActivitiesAPI.getLeadCalls(id),
      ])
      if (leadRes.status === 'fulfilled') {
        setLead(leadRes.value.data)
      } else {
        console.error('Failed to load lead:', leadRes.reason)
      }
      if (journeyRes.status === 'fulfilled') {
        setJourney(journeyRes.value.data?.timeline || [])
      }
      if (callsRes.status === 'fulfilled') {
        setCallActivities(callsRes.value.data || [])
      }
    } catch (err) {
      console.error('Failed to load lead:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    try {
      await leadsAPI.updateStatus(id, newStatus)
      setLead({ ...lead, status: newStatus })
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  const loadAssignableUsers = async () => {
    setLoadingUsers(true)
    try {
      const res = await employeesAPI.getAll({ status: 'active', limit: 200 })
      const allUsers = res.data || []
      // Filter to only sales and pre-sales employees
      const salesPreSalesUsers = allUsers.filter(emp => {
        const dept = emp.subDepartment
        const role = emp.role
        return ['pre_sales', 'crm', 'sales_closure'].includes(dept) ||
               ['sales_manager', 'sales_executive', 'pre_sales'].includes(role)
      })
      setAssignableUsers(salesPreSalesUsers)
    } catch (err) {
      console.error('Failed to load users:', err)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleOpenAssignModal = () => {
    setSelectedAssignee('')
    setShowAssignModal(true)
    loadAssignableUsers()
  }

  const handleAssignUser = async (e) => {
    e.preventDefault()
    if (!selectedAssignee) return
    setAssigningUser(true)
    try {
      await leadsAPI.assign(id, selectedAssignee)
      setShowAssignModal(false)
      setSelectedAssignee('')
      loadLead()
    } catch (err) {
      console.error('Failed to assign lead:', err)
      alert(err.message || 'Failed to assign lead')
    } finally {
      setAssigningUser(false)
    }
  }

  const handleAddNote = async (e) => {
    e.preventDefault()
    setSavingNote(true)
    try {
      await leadsAPI.addNote(id, note)
      setNote('')
      setShowNoteModal(false)
      loadLead()
    } catch (err) {
      console.error('Failed to add note:', err)
    } finally {
      setSavingNote(false)
    }
  }

  const handleConvert = async () => {
    if (!confirm('Convert this lead to a customer?')) return
    try {
      await leadsAPI.convert(id)
      navigate('/admin/customers')
    } catch (err) {
      console.error('Failed to convert lead:', err)
      alert(err.message || 'Failed to convert lead to customer')
    }
  }

  const handleScheduleFollowUp = async () => {
    if (!followUpDate) return
    setSavingFollowUp(true)
    try {
      await leadsAPI.update(id, {
        nextFollowUp: {
          date: followUpDate,
          type: followUpType,
          notes: followUpNotes,
        }
      })
      setLead({ ...lead, nextFollowUp: { date: followUpDate, type: followUpType, notes: followUpNotes } })
      setShowFollowUpForm(false)
      setFollowUpDate('')
      setFollowUpType('call')
      setFollowUpNotes('')
    } catch (err) {
      console.error('Failed to schedule follow-up:', err)
    } finally {
      setSavingFollowUp(false)
    }
  }

  const handleLogCall = async (e) => {
    e.preventDefault()
    if (!callOutcome) {
      alert('Please select a call outcome')
      return
    }
    try {
      // First create the call activity
      const response = await callActivitiesAPI.create({
        leadId: id,
        notes: callNotes,
        callType: 'outbound',
      })

      // Then complete it with the outcome
      if (response.data?._id) {
        await callActivitiesAPI.complete(response.data._id, {
          outcome: callOutcome,
          notes: callNotes,
        })
      }

      setCallOutcome('')
      setCallNotes('')
      setShowCallModal(false)
      loadLead()
    } catch (err) {
      console.error('Failed to log call:', err)
      alert('Failed to log call. Please try again.')
    }
  }

  const handleAssignDepartment = async (e) => {
    e.preventDefault()
    if (!selectedDepartment) {
      alert('Please select an interest area')
      return
    }
    try {
      await leadWorkflowAPI.assignDepartment(id, { department: selectedDepartment })
      setSelectedDepartment('')
      setShowDepartmentModal(false)
      loadLead()
    } catch (err) {
      console.error('Failed to assign interest area:', err)
      alert('Failed to assign interest area. Please try again.')
    }
  }

  const handleQualifyLead = async () => {
    if (!confirm('Mark this lead as qualified? You will be prompted to schedule a meeting.')) return
    try {
      await leadWorkflowAPI.qualify(id, 'Lead qualified based on call activities')
      await loadLead()
      // Auto-open Schedule Meeting modal after qualifying
      loadMeetingUsers()
      setShowScheduleMeetingModal(true)
    } catch (err) {
      console.error('Failed to qualify lead:', err)
    }
  }

  const loadMeetingUsers = async () => {
    try {
      const res = await employeesAPI.getAll({ status: 'active', limit: 200 })
      const allUsers = res.data || []
      setSalesUsers(allUsers.filter(emp =>
        emp.subDepartment === 'sales_closure' ||
        ['sales_manager', 'sales_executive'].includes(emp.role)
      ))
      setDesignerUsers(allUsers.filter(emp =>
        emp.subDepartment === 'design' || emp.role === 'designer'
      ))
    } catch (err) {
      console.error('Failed to load meeting users:', err)
    }
  }

  const handleScheduleMeeting = async (e) => {
    e.preventDefault()
    if (!meetingForm.date || !meetingForm.salesPersonId) {
      alert('Please select a date and sales person')
      return
    }
    setSchedulingMeeting(true)
    try {
      await leadWorkflowAPI.scheduleMeeting(id, meetingForm)
      setShowScheduleMeetingModal(false)
      setMeetingForm({ date: '', time: '', salesPersonId: '', designerId: '', meetingType: 'office', location: '', notes: '' })
      loadLead()
    } catch (err) {
      console.error('Failed to schedule meeting:', err)
      alert(err.message || 'Failed to schedule meeting')
    } finally {
      setSchedulingMeeting(false)
    }
  }

  const handleTransferToSales = async () => {
    if (!confirm('Transfer this qualified lead to the Sales Manager? Pre-sales will get view-only access with masked phone numbers.')) return
    setTransferring(true)
    try {
      await leadWorkflowAPI.transferToSales(id)
      loadLead()
    } catch (err) {
      console.error('Failed to transfer to sales:', err)
      alert(err.message || 'Failed to transfer lead to sales')
    } finally {
      setTransferring(false)
    }
  }

  const loadSalesExecUsers = async () => {
    setLoadingSalesExec(true)
    try {
      const res = await employeesAPI.getAll({ status: 'active', limit: 200 })
      // Filter to sales-related users only
      const salesUsers = (res.data || []).filter(emp => {
        return emp.subDepartment === 'sales_closure' || emp.role === 'sales_executive'
      })
      setSalesExecUsers(salesUsers)
    } catch (err) {
      console.error('Failed to load sales users:', err)
    } finally {
      setLoadingSalesExec(false)
    }
  }

  const handleOpenSalesExecModal = () => {
    setSelectedSalesExec('')
    setShowSalesExecModal(true)
    loadSalesExecUsers()
  }

  const handleAssignSalesExec = async (e) => {
    e.preventDefault()
    if (!selectedSalesExec) return
    setAssigningSalesExec(true)
    try {
      await leadWorkflowAPI.assignSalesExecutive(id, selectedSalesExec)
      setShowSalesExecModal(false)
      setSelectedSalesExec('')
      loadLead()
    } catch (err) {
      console.error('Failed to assign sales executive:', err)
      alert(err.message || 'Failed to assign sales executive')
    } finally {
      setAssigningSalesExec(false)
    }
  }

  const handleMarkRNR = async () => {
    if (!confirm('Mark this lead as RNR (Ringing No Response)?')) return
    try {
      await leadWorkflowAPI.markAsRNR(id, 'No response after multiple call attempts')
      loadLead()
    } catch (err) {
      console.error('Failed to mark as RNR:', err)
    }
  }

  const handleSetDisposition = async () => {
    if (!selectedGroup || !selectedSubDisposition) {
      alert('Please select a disposition group and sub-disposition')
      return
    }

    // Determine which category to use
    const userCat = getUserDispositionCategory(currentUser)
    let category = userCat === 'both' ? 'pre_sales' : userCat
    // If user has both, check which tree has this group
    if (userCat === 'both' && dispositionConfig) {
      if (dispositionConfig.sales?.groups?.some(g => g.value === selectedGroup)) {
        category = 'sales'
      }
      if (dispositionConfig.pre_sales?.groups?.some(g => g.value === selectedGroup)) {
        category = 'pre_sales'
      }
    }

    setSavingDisposition(true)
    try {
      await leadWorkflowAPI.setDisposition(id, {
        category,
        group: selectedGroup,
        subDisposition: selectedSubDisposition,
        remarks: dispositionRemarks,
      })
      setSelectedGroup('')
      setSelectedSubDisposition('')
      setDispositionRemarks('')
      loadLead()
    } catch (err) {
      console.error('Failed to set disposition:', err)
      alert(err.message || 'Failed to set disposition')
    } finally {
      setSavingDisposition(false)
    }
  }

  // Click-to-Call: start call timer (actual dialing handled by QuickCall extension)
  const handleClickToCall = () => {
    if (!lead.phone || lead._phoneMasked) return

    // Try to click the Callyzer QuickCall extension overlay near the phone number
    let clicked = false
    if (phoneRef.current) {
      // QuickCall injects elements near detected phone numbers - search up to grandparent
      const searchAreas = [
        phoneRef.current,
        phoneRef.current.parentElement,
        phoneRef.current.parentElement?.parentElement,
      ].filter(Boolean)

      for (const area of searchAreas) {
        // Look for extension-injected elements (images from chrome-extension://, callyzer classes, etc.)
        const extEl = area.querySelector(
          'img[src*="chrome-extension"], img[src*="callyzer"], [class*="callyzer"], [id*="callyzer"], [data-callyzer]'
        )
        if (extEl) {
          extEl.click()
          clicked = true
          break
        }
      }
    }

    // Fallback: trigger tel: link if extension element not found
    if (!clicked) {
      window.location.href = telHref(lead.phone)
    }

    // Start call tracking
    const startTime = new Date()
    setCallInProgress(true)
    setCallStartTime(startTime)
    setCallTimer(0)
    callTimerRef.current = setInterval(() => {
      setCallTimer(prev => prev + 1)
    }, 1000)

    // Start polling Callyzer for call completion (every 10 seconds, start after 15s)
    if (callPollRef.current) clearInterval(callPollRef.current)
    callPollRef.current = setTimeout(() => {
      callPollRef.current = setInterval(async () => {
        try {
          const res = await callyzerAPI.pollCallStatus(lead.phone, startTime)
          if (res.callEnded) {
            // Call ended — auto-stop and show disposition
            if (callTimerRef.current) {
              clearInterval(callTimerRef.current)
              callTimerRef.current = null
            }
            if (callPollRef.current) {
              clearInterval(callPollRef.current)
              callPollRef.current = null
            }
            if (res.data?.duration > 0) {
              setCallTimer(res.data.duration)
            }
            setCallInProgress(false)
            setShowDispositionModal(true)
          }
        } catch (err) {
          // Silently ignore poll errors
        }
      }, 10000) // Poll every 10 seconds
    }, 15000) // Start polling after 15 seconds
  }

  // End call → show disposition modal
  const handleEndCall = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current)
      callTimerRef.current = null
    }
    if (callPollRef.current) {
      clearInterval(callPollRef.current)
      clearTimeout(callPollRef.current)
      callPollRef.current = null
    }
    setCallInProgress(false)
    setShowDispositionModal(true)
  }

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current)
      if (callPollRef.current) {
        clearInterval(callPollRef.current)
        clearTimeout(callPollRef.current)
      }
    }
  }, [])

  const formatCallTimer = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // Get groups available for the call disposition modal
  const getCallDispGroups = () => {
    if (!dispositionConfig) return []
    const groups = []
    if (dispositionConfig.pre_sales) {
      dispositionConfig.pre_sales.groups.forEach(g => groups.push({ ...g, category: 'pre_sales' }))
    }
    if (dispositionConfig.sales) {
      dispositionConfig.sales.groups.forEach(g => groups.push({ ...g, category: 'sales' }))
    }
    return groups
  }

  const getCallDispSubDispositions = () => {
    if (!callDispGroup || !dispositionConfig) return []
    const allGroups = getCallDispGroups()
    const group = allGroups.find(g => g.value === callDispGroup)
    return group ? group.subDispositions : []
  }

  const getSelectedGroupInfo = () => {
    const allGroups = getCallDispGroups()
    return allGroups.find(g => g.value === callDispGroup) || null
  }

  // Map disposition group to a CallActivity outcome
  const mapGroupToOutcome = (group) => {
    const mapping = {
      pending: 'rnr',
      attempted: 'follow_up_required',
      lost: 'not_interested',
      follow_up: 'follow_up_required',
      qualified_to_sales: 'qualified',
      qualified: 'interested',
      won: 'qualified',
    }
    return mapping[group] || 'information_shared'
  }

  // Submit call disposition
  const handleSubmitDisposition = async () => {
    if (!callDispGroup || !callDispSub) {
      alert('Please select a disposition group and sub-disposition')
      return
    }
    setSavingCallDisposition(true)
    try {
      const duration = callStartTime ? Math.floor((new Date() - callStartTime) / 1000) : callTimer
      const outcome = mapGroupToOutcome(callDispGroup)

      // 1. Create call activity record
      const response = await callActivitiesAPI.create({
        leadId: id,
        callType: 'outbound',
        notes: callDispRemarks,
      })
      if (response.data?._id) {
        await callActivitiesAPI.complete(response.data._id, {
          outcome,
          notes: callDispRemarks,
          duration,
        })
      }

      // 2. Set disposition on the lead
      const groupInfo = getSelectedGroupInfo()
      const category = groupInfo?.category || 'pre_sales'
      await leadWorkflowAPI.setDisposition(id, {
        category,
        group: callDispGroup,
        subDisposition: callDispSub,
        remarks: callDispRemarks,
      })

      setShowDispositionModal(false)
      setCallDispGroup('')
      setCallDispSub('')
      setCallDispRemarks('')
      setCallStartTime(null)
      setCallTimer(0)
      loadLead()
    } catch (err) {
      console.error('Failed to save call disposition:', err)
      alert(err.message || 'Failed to save call disposition. Please try again.')
    } finally {
      setSavingCallDisposition(false)
    }
  }

  // Get available disposition groups from config
  const getAvailableGroups = () => {
    if (!dispositionConfig) return []
    const groups = []
    if (dispositionConfig.pre_sales) {
      dispositionConfig.pre_sales.groups.forEach(g => groups.push({ ...g, category: 'pre_sales' }))
    }
    if (dispositionConfig.sales) {
      dispositionConfig.sales.groups.forEach(g => groups.push({ ...g, category: 'sales' }))
    }
    return groups
  }

  const getSubDispositions = () => {
    if (!selectedGroup || !dispositionConfig) return []
    const allGroups = getAvailableGroups()
    const group = allGroups.find(g => g.value === selectedGroup)
    return group ? group.subDispositions : []
  }

  if (loading) {
    return <PageLoader />
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Lead not found</p>
      </div>
    )
  }

  const statusOptions = Object.entries(LEAD_STATUSES).map(([value, { label }]) => ({
    value,
    label,
  }))

  const tabs = [
    { id: 'timeline', label: 'Timeline', count: journey.length },
    { id: 'calls', label: 'Call Activities', count: callActivities.length },
    { id: 'notes', label: 'Notes', count: lead.notes?.length || 0 },
    { id: 'details', label: 'Details' },
  ]

  const callOutcomeOptions = [
    { value: 'interested', label: 'Interested' },
    { value: 'not_interested', label: 'Not Interested' },
    { value: 'callback', label: 'Callback Requested' },
    { value: 'rnr', label: 'Ringing No Response' },
    { value: 'switched_off', label: 'Switched Off' },
    { value: 'wrong_number', label: 'Wrong Number' },
    { value: 'qualified', label: 'Qualified' },
  ]

  const departmentOptions = [
    { value: 'interior', label: 'Interior' },
    { value: 'construction', label: 'Construction' },
  ]

  return (
    <div>
      <PageHeader
        title={lead.name}
        description={lead.leadId}
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Leads', path: '/admin/leads' },
          { label: lead.name },
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!lead._phoneMasked && lead.phone && (
              <button
                onClick={handleClickToCall}
                disabled={callInProgress}
                style={{
                  padding: '8px 16px',
                  background: callInProgress ? '#D1D5DB' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: callInProgress ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Phone size={15} />
                Call
              </button>
            )}
            {lead.primaryStatus === 'hot' && currentUser?.role !== 'pre_sales' && (
              <Button icon={ArrowRight} onClick={handleConvert}>
                Convert to Customer
              </Button>
            )}
          </div>
        }
      />

      <style>{`@media (min-width: 1024px) { .lead-detail-grid { grid-template-columns: 2fr 1fr !important; } }`}</style>
      <div className="lead-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Lead Info Card */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #E5E7EB',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <Avatar name={lead.name} size="xl" />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#1F2937', margin: 0 }}>{lead.name}</h2>
                  {(() => {
                    const statusKey = lead.primaryStatus || lead.status
                    const statusColor = LEAD_STATUSES[statusKey]?.color
                    const bgMap = {
                      blue: '#DBEAFE', green: '#D1FAE5', yellow: '#FEF3C7', red: '#FEE2E2',
                      purple: '#F3E8FF', teal: '#CCFBF1', orange: '#FFEDD5', cyan: '#CFFAFE',
                      amber: '#FEF3C7', crimson: '#FEE2E2',
                    }
                    const textMap = {
                      blue: '#1D4ED8', green: '#059669', yellow: '#D97706', red: '#DC2626',
                      purple: '#7C3AED', teal: '#0D9488', orange: '#EA580C', cyan: '#0891B2',
                      amber: '#D97706', crimson: '#DC2626',
                    }
                    return (
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: bgMap[statusColor] || '#F3F4F6',
                        color: textMap[statusColor] || '#6B7280',
                      }}>
                        {LEAD_STATUSES[statusKey]?.label || statusKey}
                      </span>
                    )
                  })()}
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '500',
                    background: LEAD_PRIORITIES[lead.priority]?.color === 'red' ? '#FEE2E2' :
                               LEAD_PRIORITIES[lead.priority]?.color === 'yellow' ? '#FEF3C7' :
                               LEAD_PRIORITIES[lead.priority]?.color === 'green' ? '#D1FAE5' : '#F3F4F6',
                    color: LEAD_PRIORITIES[lead.priority]?.color === 'red' ? '#DC2626' :
                           LEAD_PRIORITIES[lead.priority]?.color === 'yellow' ? '#D97706' :
                           LEAD_PRIORITIES[lead.priority]?.color === 'green' ? '#059669' : '#6B7280',
                  }}>
                    {LEAD_PRIORITIES[lead.priority]?.label || lead.priority}
                  </span>
                </div>
                {/* View-only badge for pre-sales locked leads */}
                {lead._phoneMasked && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    background: '#FEF3C7',
                    color: '#92400E',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    marginBottom: '12px',
                  }}>
                    <Eye size={14} />
                    View Only - Phone numbers are masked
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280' }}>
                    <Phone size={16} />
                    <span ref={phoneRef} style={{ fontSize: '14px' }}>{lead._phoneMasked ? formatMaskedPhone(lead.phone) : formatPhone(lead.phone)}</span>
                  </div>
                  {lead.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280' }}>
                      <Mail size={16} />
                      <span style={{ fontSize: '14px' }}>{lead.email}</span>
                    </div>
                  )}
                  {(lead.location?.city || lead.location?.address || lead.location?.legacy) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280' }}>
                      <MapPin size={16} />
                      <span style={{ fontSize: '14px' }}>{lead.location?.city || lead.location?.address || lead.location?.legacy || ''}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280' }}>
                    <Calendar size={16} />
                    <span style={{ fontSize: '14px' }}>Created {formatDate(lead.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '1px solid #E5E7EB',
            paddingBottom: '0',
          }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: activeTab === tab.id ? '#3B82F6' : '#6B7280',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #3B82F6' : '2px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '-1px',
                  transition: 'all 0.2s',
                }}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    background: activeTab === tab.id ? '#DBEAFE' : '#F3F4F6',
                    color: activeTab === tab.id ? '#1D4ED8' : '#6B7280',
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'timeline' && (
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #E5E7EB',
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937', margin: 0 }}>Activity Timeline</h3>
              </div>
              <div style={{ padding: '20px' }}>
                {journey.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {journey.map((activity, index) => (
                      <div key={activity._id || index} style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{
                            width: '10px',
                            height: '10px',
                            background: '#3B82F6',
                            borderRadius: '50%',
                            flexShrink: 0,
                          }} />
                          {index < journey.length - 1 && (
                            <div style={{
                              width: '2px',
                              flex: 1,
                              minHeight: '40px',
                              background: '#E5E7EB',
                            }} />
                          )}
                        </div>
                        <div style={{ flex: 1, paddingBottom: '20px' }}>
                          <p style={{ fontSize: '14px', fontWeight: '500', color: '#1F2937', margin: 0 }}>
                            {activity.description || activity.action?.replace(/_/g, ' ')}
                          </p>
                          {activity.performedByName && (
                            <p style={{ fontSize: '12px', color: '#6B7280', margin: '4px 0 0 0' }}>
                              by {activity.performedByName}
                            </p>
                          )}
                          <p style={{ fontSize: '12px', color: '#D97706', margin: '4px 0 0 0' }}>
                            {formatRelativeTime(activity.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ textAlign: 'center', color: '#9CA3AF', padding: '24px 0', margin: 0 }}>No activity yet</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'calls' && (
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937', margin: 0 }}>Call Activities</h3>
                <Button size="sm" icon={PhoneCall} onClick={() => setShowCallModal(true)}>
                  Log Call
                </Button>
              </div>
              <div style={{ padding: '20px' }}>
                {callActivities.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {callActivities.map((call, index) => (
                      <div key={call._id || index} style={{
                        padding: '16px',
                        background: '#F9FAFB',
                        borderRadius: '12px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              padding: '10px',
                              borderRadius: '10px',
                              background: call.outcome === 'qualified' ? '#D1FAE5' :
                                         call.outcome === 'interested' ? '#DBEAFE' :
                                         call.outcome === 'rnr' ? '#FEF3C7' :
                                         call.outcome === 'not_interested' ? '#FEE2E2' : '#F3F4F6',
                            }}>
                              {call.outcome === 'qualified' ? (
                                <CheckCircle size={20} style={{ color: '#059669' }} />
                              ) : call.outcome === 'interested' ? (
                                <PhoneCall size={20} style={{ color: '#2563EB' }} />
                              ) : call.outcome === 'rnr' ? (
                                <PhoneOff size={20} style={{ color: '#D97706' }} />
                              ) : call.outcome === 'not_interested' ? (
                                <XCircle size={20} style={{ color: '#DC2626' }} />
                              ) : (
                                <Phone size={20} style={{ color: '#6B7280' }} />
                              )}
                            </div>
                            <div>
                              <p style={{ fontSize: '14px', fontWeight: '500', color: '#1F2937', margin: 0, textTransform: 'capitalize' }}>
                                {call.outcome?.replace(/_/g, ' ') || 'Call'}
                              </p>
                              <p style={{ fontSize: '12px', color: '#6B7280', margin: '4px 0 0 0' }}>
                                {call.callType === 'outbound' ? 'Outbound Call' : 'Inbound Call'}
                              </p>
                            </div>
                          </div>
                          <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                            {formatRelativeTime(call.createdAt)}
                          </span>
                        </div>
                        {call.notes && (
                          <p style={{ fontSize: '14px', color: '#4B5563', margin: '12px 0 0 52px' }}>{call.notes}</p>
                        )}
                        {call.calledBy && (
                          <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '4px 0 0 52px' }}>
                            by {call.calledBy.name}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <PhoneCall size={48} style={{ color: '#D1D5DB', margin: '0 auto 12px' }} />
                    <p style={{ color: '#6B7280', margin: '0 0 16px 0' }}>No call activities yet</p>
                    <Button size="sm" variant="outline" onClick={() => setShowCallModal(true)}>
                      Log First Call
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937', margin: 0 }}>Notes</h3>
                <Button size="sm" onClick={() => setShowNoteModal(true)}>
                  Add Note
                </Button>
              </div>
              <div style={{ padding: '20px' }}>
                {lead.notes?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {lead.notes.map((n, index) => (
                      <div key={index} style={{
                        padding: '16px',
                        background: '#F9FAFB',
                        borderRadius: '12px',
                      }}>
                        <p style={{ fontSize: '14px', color: '#374151', margin: 0 }}>{n.content}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                          <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{n.addedBy?.name || 'Unknown'}</span>
                          <span style={{ fontSize: '12px', color: '#D1D5DB' }}>•</span>
                          <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{formatRelativeTime(n.addedAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ textAlign: 'center', color: '#9CA3AF', padding: '24px 0', margin: 0 }}>No notes yet</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'details' && (() => {
            const canEditDetails = !['qualified', 'proposal', 'negotiation', 'lost'].includes(lead.status)
            const budgetDisplay = lead.budget
              ? (typeof lead.budget === 'string'
                  ? lead.budget
                  : lead.budget.legacy
                    ? lead.budget.legacy
                    : lead.budget.min || lead.budget.max
                      ? `${lead.budget.currency || 'INR'} ${(lead.budget.min || 0).toLocaleString()}${lead.budget.max ? ` - ${lead.budget.max.toLocaleString()}` : ''}`
                      : '')
              : ''
            const areaDisplay = lead.area
              ? (typeof lead.area === 'string'
                  ? lead.area
                  : lead.area.value ? String(lead.area.value) : '')
              : ''

            const handleEditDetails = () => {
              setDetailsForm({
                name: lead.name || '',
                email: lead.email || '',
                phone: lead.phone || '',
                service: lead.service || '',
                budgetMin: lead.budget?.min || '',
                budgetMax: lead.budget?.max || '',
                propertyType: lead.propertyType || '',
                area: areaDisplay,
                source: lead.source || '',
              })
              setEditingDetails(true)
            }

            const handleSaveDetails = async () => {
              setSavingDetails(true)
              try {
                const payload = { ...detailsForm }
                // Format budget as object for the model
                const budgetMin = parseFloat(String(payload.budgetMin || '').replace(/[^0-9.]/g, ''))
                const budgetMax = parseFloat(String(payload.budgetMax || '').replace(/[^0-9.]/g, ''))
                if (!isNaN(budgetMin) || !isNaN(budgetMax)) {
                  payload.budget = {
                    min: isNaN(budgetMin) ? 0 : budgetMin,
                    max: isNaN(budgetMax) ? 0 : budgetMax,
                    currency: 'INR'
                  }
                }
                delete payload.budgetMin
                delete payload.budgetMax
                // Format area as object for the model
                if (payload.area && String(payload.area).trim()) {
                  const num = parseFloat(String(payload.area).replace(/[^0-9.]/g, ''))
                  payload.area = isNaN(num) ? undefined : { value: num, unit: 'sqft' }
                } else {
                  delete payload.area
                }
                await leadsAPI.update(id, payload)
                setEditingDetails(false)
                loadLead()
              } catch (err) {
                console.error('Failed to update lead:', err)
                alert(err.message || 'Failed to update lead details')
              } finally {
                setSavingDetails(false)
              }
            }

            const inputStyle = {
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: 8,
              fontSize: 14,
              color: '#1F2937',
              outline: 'none',
              fontFamily: 'inherit',
            }

            const selectStyle = { ...inputStyle, background: '#fff', cursor: 'pointer' }

            return (
              <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #E5E7EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937', margin: 0 }}>Lead Details</h3>
                  {canEditDetails && !editingDetails && (
                    <button
                      onClick={handleEditDetails}
                      style={{
                        padding: '6px 14px',
                        background: '#fff',
                        color: '#C59C82',
                        border: '1px solid #DDC5B0',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Edit size={13} />
                      Edit
                    </button>
                  )}
                </div>
                <div style={{ padding: '20px' }}>
                  {editingDetails ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                      <div>
                        <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 4 }}>Name</label>
                        <input
                          style={inputStyle}
                          value={detailsForm.name}
                          onChange={(e) => setDetailsForm({ ...detailsForm, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 4 }}>Email</label>
                        <input
                          style={inputStyle}
                          type="email"
                          value={detailsForm.email}
                          onChange={(e) => setDetailsForm({ ...detailsForm, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 4 }}>Phone</label>
                        <input
                          style={inputStyle}
                          value={detailsForm.phone}
                          onChange={(e) => setDetailsForm({ ...detailsForm, phone: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 4 }}>Service</label>
                        <select
                          style={selectStyle}
                          value={detailsForm.service}
                          onChange={(e) => setDetailsForm({ ...detailsForm, service: e.target.value })}
                        >
                          <option value="">Select service...</option>
                          {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 4 }}>Budget (INR)</label>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input
                            style={{ ...inputStyle, flex: 1 }}
                            type="number"
                            value={detailsForm.budgetMin}
                            onChange={(e) => setDetailsForm({ ...detailsForm, budgetMin: e.target.value })}
                            placeholder="Min"
                          />
                          <span style={{ color: '#9CA3AF', fontSize: 13 }}>to</span>
                          <input
                            style={{ ...inputStyle, flex: 1 }}
                            type="number"
                            value={detailsForm.budgetMax}
                            onChange={(e) => setDetailsForm({ ...detailsForm, budgetMax: e.target.value })}
                            placeholder="Max"
                          />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 4 }}>Property Type</label>
                        <select
                          style={selectStyle}
                          value={detailsForm.propertyType}
                          onChange={(e) => setDetailsForm({ ...detailsForm, propertyType: e.target.value })}
                        >
                          <option value="">Select type...</option>
                          {PROPERTY_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 4 }}>Area (sq ft)</label>
                        <input
                          style={inputStyle}
                          value={detailsForm.area}
                          onChange={(e) => setDetailsForm({ ...detailsForm, area: e.target.value })}
                          placeholder="e.g. 1200"
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 13, color: '#6B7280', display: 'block', marginBottom: 4 }}>Source</label>
                        <input
                          style={inputStyle}
                          value={detailsForm.source}
                          onChange={(e) => setDetailsForm({ ...detailsForm, source: e.target.value })}
                        />
                      </div>
                      <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                        <button
                          onClick={() => setEditingDetails(false)}
                          style={{
                            padding: '8px 16px', background: '#fff', color: '#6B7280',
                            border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13,
                            fontWeight: 500, cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveDetails}
                          disabled={savingDetails}
                          style={{
                            padding: '8px 20px',
                            background: savingDetails ? '#D1D5DB' : 'linear-gradient(135deg, #C59C82 0%, #A67B5B 100%)',
                            color: '#fff', border: 'none', borderRadius: 8, fontSize: 13,
                            fontWeight: 600, cursor: savingDetails ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {savingDetails ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                      <div>
                        <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 4px 0' }}>Service</p>
                        <p style={{ fontSize: '14px', fontWeight: '500', color: '#1F2937', margin: 0 }}>{lead.service || '-'}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 4px 0' }}>Budget</p>
                        <p style={{ fontSize: '14px', fontWeight: '500', color: '#1F2937', margin: 0 }}>{budgetDisplay || '-'}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 4px 0' }}>Property Type</p>
                        <p style={{ fontSize: '14px', fontWeight: '500', color: '#1F2937', margin: 0 }}>{lead.propertyType || '-'}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 4px 0' }}>Area (sq ft)</p>
                        <p style={{ fontSize: '14px', fontWeight: '500', color: '#1F2937', margin: 0 }}>{areaDisplay || '-'}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 4px 0' }}>Source</p>
                        <p style={{ fontSize: '14px', fontWeight: '500', color: '#1F2937', margin: 0 }}>{lead.source || 'Website'}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 4px 0' }}>Assigned To</p>
                        <p style={{ fontSize: '14px', fontWeight: '500', color: '#1F2937', margin: 0 }}>
                          {lead.assignedTo?.name || 'Unassigned'}
                        </p>
                      </div>
                      {/* Floor Plan */}
                      <div style={{ gridColumn: '1 / -1' }}>
                        <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 8px 0' }}>Floor Plan</p>
                        {lead.floorPlan ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {lead.floorPlan.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i) ? (
                              <img
                                src={lead.floorPlan}
                                alt="Floor Plan"
                                style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #E5E7EB' }}
                              />
                            ) : (
                              <div style={{ width: 60, height: 60, background: '#FEF3C7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FileText size={24} style={{ color: '#D97706' }} />
                              </div>
                            )}
                            <a
                              href={lead.floorPlan}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#C59C82', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}
                            >
                              View Floor Plan
                            </a>
                          </div>
                        ) : (
                          <div>
                            <label
                              style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                padding: '20px', border: '2px dashed #D1D5DB', borderRadius: 12, cursor: 'pointer',
                                background: '#F9FAFB', transition: 'border-color 0.2s',
                              }}
                            >
                              <Upload size={24} style={{ color: '#9CA3AF', marginBottom: 8 }} />
                              <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>Upload Floor Plan</span>
                              <span style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>PDF, JPEG, PNG or any image</span>
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                style={{ display: 'none' }}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0]
                                  if (!file) return
                                  try {
                                    await leadsAPI.uploadFloorPlan(id, file)
                                    loadLead()
                                  } catch (err) {
                                    alert(err.message || 'Failed to upload floor plan')
                                  }
                                }}
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })()}

          {/* Revised Budget Card - Sales Pipeline Only */}
          {['meeting_status', 'cold', 'warm', 'hot'].includes(lead.primaryStatus) && (
            <div style={{
              background: '#ffffff', borderRadius: '16px', border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', marginTop: 20,
            }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937', margin: 0 }}>Revised Budget</h3>
                {lead.revisedBudget?.revisedAt && (
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>
                    Updated by {lead.revisedBudget.revisedByName} on {new Date(lead.revisedBudget.revisedAt).toLocaleDateString('en-IN')}
                  </span>
                )}
              </div>
              <div style={{ padding: '20px' }}>
                {(() => {
                  const canEditRevisedBudget =
                    ['super_admin', 'company_admin', 'sales_manager'].includes(user?.role) ||
                    user?.approvalAuthority?.approverRole === 'design_head'

                  return canEditRevisedBudget ? (
                    <div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Min (INR)</label>
                          <input
                            type="number"
                            defaultValue={lead.revisedBudget?.min || ''}
                            id="revisedBudgetMin"
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, outline: 'none' }}
                            placeholder="Min budget"
                          />
                        </div>
                        <span style={{ color: '#9CA3AF', fontSize: 13, marginTop: 20 }}>to</span>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Max (INR)</label>
                          <input
                            type="number"
                            defaultValue={lead.revisedBudget?.max || ''}
                            id="revisedBudgetMax"
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, outline: 'none' }}
                            placeholder="Max budget"
                          />
                        </div>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Notes</label>
                        <textarea
                          defaultValue={lead.revisedBudget?.notes || ''}
                          id="revisedBudgetNotes"
                          rows={2}
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                          placeholder="Budget revision notes..."
                        />
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            const min = parseFloat(document.getElementById('revisedBudgetMin').value) || 0
                            const max = parseFloat(document.getElementById('revisedBudgetMax').value) || 0
                            const notes = document.getElementById('revisedBudgetNotes').value || ''
                            await leadsAPI.updateRevisedBudget(id, { min, max, notes })
                            loadLead()
                          } catch (err) {
                            alert(err.message || 'Failed to update revised budget')
                          }
                        }}
                        style={{
                          padding: '8px 20px', background: 'linear-gradient(135deg, #C59C82 0%, #A67B5B 100%)',
                          color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        Save Revised Budget
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 4px 0' }}>Min Budget</p>
                        <p style={{ fontSize: 14, fontWeight: 500, color: '#1F2937', margin: 0 }}>
                          {lead.revisedBudget?.min ? `INR ${lead.revisedBudget.min.toLocaleString('en-IN')}` : '-'}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 4px 0' }}>Max Budget</p>
                        <p style={{ fontSize: 14, fontWeight: 500, color: '#1F2937', margin: 0 }}>
                          {lead.revisedBudget?.max ? `INR ${lead.revisedBudget.max.toLocaleString('en-IN')}` : '-'}
                        </p>
                      </div>
                      {lead.revisedBudget?.notes && (
                        <div style={{ gridColumn: '1 / -1' }}>
                          <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 4px 0' }}>Notes</p>
                          <p style={{ fontSize: 14, color: '#1F2937', margin: 0 }}>{lead.revisedBudget.notes}</p>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>
          )}

          {/* Requirement Meeting Card - Sales Pipeline Only */}
          {['meeting_status', 'cold', 'warm', 'hot'].includes(lead.primaryStatus) && (
            <div style={{
              background: '#ffffff', borderRadius: '16px', border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden', marginTop: 20,
            }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937', margin: 0 }}>Requirement Meeting</h3>
                {lead.requirementMeeting?.status && (
                  <span style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                    background: lead.requirementMeeting.status === 'completed' ? '#D1FAE5' : lead.requirementMeeting.status === 'cancelled' ? '#FEE2E2' : '#FEF3C7',
                    color: lead.requirementMeeting.status === 'completed' ? '#065F46' : lead.requirementMeeting.status === 'cancelled' ? '#991B1B' : '#92400E',
                  }}>
                    {lead.requirementMeeting.status.charAt(0).toUpperCase() + lead.requirementMeeting.status.slice(1)}
                  </span>
                )}
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Meeting Type</label>
                    <select
                      defaultValue={lead.requirementMeeting?.meetingType || ''}
                      id="reqMeetingType"
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, background: '#fff', cursor: 'pointer' }}
                    >
                      <option value="">Select type...</option>
                      <option value="virtual">Virtual</option>
                      <option value="showroom_visit">Showroom Visit</option>
                      <option value="site_visit">Site Visit</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Scheduled Date</label>
                    <input
                      type="date"
                      defaultValue={lead.requirementMeeting?.scheduledDate ? new Date(lead.requirementMeeting.scheduledDate).toISOString().split('T')[0] : ''}
                      id="reqMeetingDate"
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Location</label>
                    <input
                      defaultValue={lead.requirementMeeting?.location || ''}
                      id="reqMeetingLocation"
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13 }}
                      placeholder="Meeting location"
                    />
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Requirements</label>
                  <textarea
                    defaultValue={lead.requirementMeeting?.requirements || ''}
                    id="reqMeetingRequirements"
                    rows={3}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }}
                    placeholder="Capture all requirements discussed..."
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Notes</label>
                  <textarea
                    defaultValue={lead.requirementMeeting?.notes || ''}
                    id="reqMeetingNotes"
                    rows={2}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }}
                    placeholder="Additional notes..."
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={async () => {
                      try {
                        const meetingType = document.getElementById('reqMeetingType').value
                        const scheduledDate = document.getElementById('reqMeetingDate').value
                        const location = document.getElementById('reqMeetingLocation').value
                        const requirements = document.getElementById('reqMeetingRequirements').value
                        const notes = document.getElementById('reqMeetingNotes').value
                        if (!meetingType) { alert('Please select a meeting type'); return }
                        await leadsAPI.setRequirementMeeting(id, { meetingType, scheduledDate, location, requirements, notes })
                        loadLead()
                      } catch (err) {
                        alert(err.message || 'Failed to save requirement meeting')
                      }
                    }}
                    style={{
                      padding: '8px 20px', background: 'linear-gradient(135deg, #C59C82 0%, #A67B5B 100%)',
                      color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    Save Meeting
                  </button>
                  {lead.requirementMeeting?.meetingType && lead.requirementMeeting?.status === 'scheduled' && (
                    <button
                      onClick={async () => {
                        try {
                          await leadsAPI.updateRequirementMeetingStatus(id, 'completed')
                          loadLead()
                        } catch (err) {
                          alert(err.message || 'Failed to update status')
                        }
                      }}
                      style={{
                        padding: '8px 16px', background: '#D1FAE5', color: '#065F46',
                        border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                      }}
                    >
                      Mark Completed
                    </button>
                  )}
                </div>

                {/* Design Team Assignment - Design Head Only */}
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Users size={16} style={{ color: '#6B7280' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Design Team</span>
                    </div>
                  </div>
                  {lead.departmentAssignments?.design?.employee ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#F0FDF4', borderRadius: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#C59C82', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 600 }}>
                        {lead.departmentAssignments.design.employeeName?.charAt(0) || 'D'}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500, color: '#1F2937', margin: 0 }}>{lead.departmentAssignments.design.employeeName}</p>
                        <p style={{ fontSize: 11, color: '#6B7280', margin: 0 }}>
                          Assigned {lead.departmentAssignments.design.assignedAt ? new Date(lead.departmentAssignments.design.assignedAt).toLocaleDateString('en-IN') : ''}
                        </p>
                      </div>
                    </div>
                  ) : (
                    (user?.approvalAuthority?.approverRole === 'design_head' || ['super_admin', 'company_admin'].includes(user?.role)) ? (
                      <button
                        onClick={async () => {
                          try {
                            const res = await employeesAPI.getAll({ status: 'active', limit: 200 })
                            const allUsers = res.data || []
                            setAvailableDesigners(allUsers.filter(emp =>
                              emp.subDepartment === 'design' || emp.role === 'designer'
                            ))
                          } catch (err) {
                            console.error('Failed to load designers:', err)
                          }
                          setShowDesignerModal(true)
                        }}
                        style={{
                          width: '100%', padding: '10px', background: '#fff', color: '#C59C82',
                          border: '1px dashed #DDC5B0', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}
                      >
                        <UserPlus size={14} />
                        Assign Designer
                      </button>
                    ) : (
                      <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>No designer assigned yet</p>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* CRM Workflow Actions */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #E5E7EB',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937', margin: '0 0 16px 0' }}>
              CRM Workflow
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Interest Area Assignment */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Building2 size={16} style={{ color: '#6B7280' }} />
                  <span style={{ fontSize: '13px', fontWeight: '500', color: '#6B7280' }}>Interest Area</span>
                </div>
                {lead.serviceDepartment ? (
                  <span style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    background: '#DBEAFE',
                    color: '#1D4ED8',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '500',
                  }}>{lead.serviceDepartment}</span>
                ) : (
                  <button
                    onClick={() => setShowDepartmentModal(true)}
                    style={{
                      padding: '10px 16px',
                      background: '#ffffff',
                      color: '#374151',
                      border: '1px solid #E5E7EB',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Building2 size={16} />
                    Assign Interest Area
                  </button>
                )}
              </div>

              {/* Call Status Display */}
              {(lead.callSummary?.lastCallOutcome || callActivities.length > 0) && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <PhoneCall size={16} style={{ color: '#6B7280' }} />
                    <span style={{ fontSize: '13px', fontWeight: '500', color: '#6B7280' }}>Last Call Status</span>
                  </div>
                  {(() => {
                    const lastCall = callActivities[0] || {}
                    const outcome = lastCall.outcome || lead.callSummary?.lastCallOutcome
                    const outcomeColors = {
                      qualified: { bg: '#D1FAE5', text: '#059669' },
                      interested: { bg: '#DBEAFE', text: '#2563EB' },
                      rnr: { bg: '#FEF3C7', text: '#D97706' },
                      not_interested: { bg: '#FEE2E2', text: '#DC2626' },
                      callback: { bg: '#E0E7FF', text: '#4F46E5' },
                      voicemail: { bg: '#F3F4F6', text: '#6B7280' },
                    }
                    const colors = outcomeColors[outcome] || { bg: '#F3F4F6', text: '#6B7280' }
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '6px 12px',
                          background: colors.bg,
                          color: colors.text,
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '500',
                          textTransform: 'capitalize',
                        }}>
                          {outcome?.replace(/_/g, ' ') || 'No calls yet'}
                        </span>
                        {(lastCall.createdAt || lead.callSummary?.lastCallDate) && (
                          <span style={{ fontSize: '12px', color: '#6B7280' }}>
                            {formatRelativeTime(lastCall.createdAt || lead.callSummary?.lastCallDate)}
                          </span>
                        )}
                        {lead.callSummary?.totalAttempts > 0 && (
                          <span style={{ fontSize: '12px', color: '#6B7280' }}>
                            Total attempts: {lead.callSummary.totalAttempts}
                          </span>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* Quick Actions - only show for pre-sales statuses */}
              {PRE_SALES_STATUSES.includes(lead.primaryStatus || lead.status) && !lead.preSalesLocked && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleQualifyLead}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    background: '#ECFDF5',
                    color: '#059669',
                    border: '1px solid #A7F3D0',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <CheckCircle size={16} />
                  Qualify
                </button>
                <button
                  onClick={handleMarkRNR}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    background: '#FEF3C7',
                    color: '#D97706',
                    border: '1px solid #FDE68A',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <PhoneOff size={16} />
                  RNR
                </button>
              </div>
              )}

              {/* Schedule Meeting - shows when lead is qualified and NOT yet in sales pipeline */}
              {lead.primaryStatus === 'qualified' && !lead.preSalesLocked && (
                <button
                  onClick={() => {
                    loadMeetingUsers()
                    setShowScheduleMeetingModal(true)
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <Calendar size={16} />
                  Schedule Meeting
                </button>
              )}

              {/* Meeting Details - shows when lead has a scheduled meeting */}
              {lead.scheduledMeeting?.date && (
                <div style={{
                  padding: '14px',
                  background: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  borderRadius: '10px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <Calendar size={16} style={{ color: '#D97706' }} />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#92400E' }}>Scheduled Meeting</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#374151' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6B7280' }}>Date</span>
                      <span style={{ fontWeight: '500' }}>{formatDate(lead.scheduledMeeting.date)}</span>
                    </div>
                    {lead.scheduledMeeting.time && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6B7280' }}>Time</span>
                        <span style={{ fontWeight: '500' }}>{lead.scheduledMeeting.time}</span>
                      </div>
                    )}
                    {lead.scheduledMeeting.salesPersonName && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6B7280' }}>Sales Person</span>
                        <span style={{ fontWeight: '500' }}>{lead.scheduledMeeting.salesPersonName}</span>
                      </div>
                    )}
                    {lead.scheduledMeeting.designerName && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6B7280' }}>Designer</span>
                        <span style={{ fontWeight: '500' }}>{lead.scheduledMeeting.designerName}</span>
                      </div>
                    )}
                    {lead.scheduledMeeting.meetingType && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6B7280' }}>Type</span>
                        <span style={{ fontWeight: '500', textTransform: 'capitalize' }}>{lead.scheduledMeeting.meetingType.replace(/_/g, ' ')}</span>
                      </div>
                    )}
                    {lead.scheduledMeeting.notes && (
                      <div style={{ marginTop: '4px', padding: '8px', background: '#FEF3C7', borderRadius: '6px' }}>
                        <p style={{ fontSize: '12px', color: '#92400E', margin: 0, fontStyle: 'italic' }}>{lead.scheduledMeeting.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pre-sales locked indicator */}
              {lead.preSalesLocked && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  background: '#FEF3C7',
                  borderRadius: '10px',
                  fontSize: '13px',
                  color: '#92400E',
                  fontWeight: '500',
                }}>
                  <Shield size={16} />
                  Transferred to Sales Team
                </div>
              )}

              {/* Pipeline Status - show current stage for sales pipeline leads */}
              {SALES_STATUSES.includes(lead.primaryStatus) && lead.primaryStatus !== 'won' && (
                <div style={{
                  padding: '12px 14px',
                  background: '#F0F9FF',
                  border: '1px solid #BAE6FD',
                  borderRadius: '10px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Target size={16} style={{ color: '#0284C7' }} />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#0C4A6E' }}>Sales Pipeline</span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {SALES_STATUSES.filter(s => s !== 'won').map(s => (
                      <div key={s} style={{
                        flex: 1,
                        padding: '6px 4px',
                        borderRadius: '6px',
                        textAlign: 'center',
                        fontSize: '11px',
                        fontWeight: lead.primaryStatus === s ? '600' : '400',
                        background: lead.primaryStatus === s ? '#0284C7' : '#E0F2FE',
                        color: lead.primaryStatus === s ? '#fff' : '#64748B',
                      }}>
                        {LEAD_STATUSES[s]?.label || s}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assign Sales Executive - shows when lead is in sales pipeline */}
              {lead.preSalesLocked && !['won'].includes(lead.primaryStatus) && (
                <button
                  onClick={handleOpenSalesExecModal}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <UserPlus size={16} />
                  Assign Sales Executive
                </button>
              )}

              {/* Create Sales Order Link */}
              {SALES_STATUSES.includes(lead.primaryStatus) && lead.primaryStatus !== 'won' && (
                <Link
                  to={`/admin/crm/sales-orders?lead=${id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 16px',
                    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                    color: '#ffffff',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '500',
                    textDecoration: 'none',
                  }}
                >
                  <FileText size={16} />
                  Create Sales Order
                </Link>
              )}
            </div>
          </div>

          {/* Disposition */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #DDC5B0',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937', margin: '0 0 16px 0' }}>
              Disposition
            </h3>

            {/* Current Disposition Display */}
            {lead.disposition && lead.disposition.group ? (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: getDispositionGroupStyle(lead.disposition.category, lead.disposition.group).bg,
                    color: getDispositionGroupStyle(lead.disposition.category, lead.disposition.group).color,
                    border: `1px solid ${getDispositionGroupStyle(lead.disposition.category, lead.disposition.group).border}`,
                  }}>
                    {lead.disposition.groupLabel}
                  </span>
                  <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>
                    {lead.disposition.subDispositionLabel}
                  </span>
                </div>
                {lead.disposition.remarks && (
                  <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 4px 0', fontStyle: 'italic' }}>
                    &ldquo;{lead.disposition.remarks}&rdquo;
                  </p>
                )}
                <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>
                  by {lead.disposition.setByName} {lead.disposition.setAt ? `- ${formatRelativeTime(lead.disposition.setAt)}` : ''}
                </p>
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '0 0 16px 0' }}>No disposition set</p>
            )}

            {/* Disposition Form */}
            {dispositionConfig && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <select
                  value={selectedGroup}
                  onChange={(e) => {
                    setSelectedGroup(e.target.value)
                    setSelectedSubDisposition('')
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #DDC5B0',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#374151',
                    background: '#ffffff',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="">Select disposition group...</option>
                  {dispositionConfig.pre_sales && (
                    <optgroup label="Pre-Sales">
                      {dispositionConfig.pre_sales.groups.map(g => (
                        <option key={`ps_${g.value}`} value={g.value}>{g.label}</option>
                      ))}
                    </optgroup>
                  )}
                  {dispositionConfig.sales && (
                    <optgroup label="Sales">
                      {dispositionConfig.sales.groups.map(g => (
                        <option key={`s_${g.value}`} value={g.value}>{g.label}</option>
                      ))}
                    </optgroup>
                  )}
                </select>

                {selectedGroup && (
                  <select
                    value={selectedSubDisposition}
                    onChange={(e) => setSelectedSubDisposition(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #DDC5B0',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#374151',
                      background: '#ffffff',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    <option value="">Select sub-disposition...</option>
                    {getSubDispositions().map(sd => (
                      <option key={sd.value} value={sd.value}>{sd.label}</option>
                    ))}
                  </select>
                )}

                {selectedGroup && selectedSubDisposition && (
                  <textarea
                    value={dispositionRemarks}
                    onChange={(e) => setDispositionRemarks(e.target.value)}
                    placeholder="Remarks (optional)"
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #DDC5B0',
                      borderRadius: '8px',
                      fontSize: '13px',
                      color: '#374151',
                      resize: 'vertical',
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                )}

                {selectedGroup && selectedSubDisposition && (
                  <button
                    onClick={handleSetDisposition}
                    disabled={savingDisposition}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      background: savingDisposition ? '#D1D5DB' : 'linear-gradient(135deg, #C59C82 0%, #A67B5B 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: savingDisposition ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {savingDisposition ? 'Setting...' : 'Set Disposition'}
                  </button>
                )}
              </div>
            )}

            {/* Disposition History Toggle */}
            {lead.dispositionHistory && lead.dispositionHistory.length > 0 && (
              <div style={{ marginTop: '16px', borderTop: '1px solid #F3F4F6', paddingTop: '12px' }}>
                <button
                  onClick={() => setShowDispositionHistory(!showDispositionHistory)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#C59C82',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {showDispositionHistory ? 'Hide' : 'Show'} History ({lead.dispositionHistory.length})
                </button>

                {showDispositionHistory && (
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[...lead.dispositionHistory].reverse().map((entry, idx) => {
                      const groupStyle = getDispositionGroupStyle(entry.category, entry.group)
                      return (
                        <div key={idx} style={{
                          padding: '10px 12px',
                          background: '#FAFAF9',
                          borderRadius: '8px',
                          borderLeft: `3px solid ${groupStyle.color}`,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '600',
                              background: groupStyle.bg,
                              color: groupStyle.color,
                            }}>
                              {entry.groupLabel}
                            </span>
                            <span style={{ fontSize: '12px', color: '#374151', fontWeight: '500' }}>
                              {entry.subDispositionLabel}
                            </span>
                          </div>
                          {entry.remarks && (
                            <p style={{ fontSize: '11px', color: '#6B7280', margin: '2px 0', fontStyle: 'italic' }}>
                              &ldquo;{entry.remarks}&rdquo;
                            </p>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                            <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                              {entry.setByName}
                            </span>
                            {entry.callAttemptNumber > 0 && (
                              <>
                                <span style={{ fontSize: '11px', color: '#D1D5DB' }}>|</span>
                                <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                                  Call #{entry.callAttemptNumber}
                                </span>
                              </>
                            )}
                            <span style={{ fontSize: '11px', color: '#D1D5DB' }}>|</span>
                            <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                              {formatRelativeTime(entry.setAt)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status Update */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #E5E7EB',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937', margin: '0 0 12px 0' }}>
              Update Status
            </h3>
            <select
              value={lead.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid #E5E7EB',
                borderRadius: '10px',
                fontSize: '14px',
                color: '#374151',
                background: '#ffffff',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Follow-up */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #E5E7EB',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937', margin: 0 }}>
                Follow-up
              </h3>
              {!showFollowUpForm && (
                <button
                  onClick={() => setShowFollowUpForm(true)}
                  style={{
                    padding: '4px 10px',
                    background: '#EFF6FF',
                    color: '#2563EB',
                    border: '1px solid #BFDBFE',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  {lead.nextFollowUp?.date ? 'Reschedule' : 'Schedule'}
                </button>
              )}
            </div>
            {showFollowUpForm ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  type="datetime-local"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  style={{
                    padding: '8px 10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '13px',
                    width: '100%',
                  }}
                />
                <select
                  value={followUpType}
                  onChange={(e) => setFollowUpType(e.target.value)}
                  style={{
                    padding: '8px 10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '13px',
                    width: '100%',
                  }}
                >
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                  <option value="meeting">Meeting</option>
                  <option value="site-visit">Site Visit</option>
                  <option value="proposal">Proposal</option>
                </select>
                <input
                  type="text"
                  placeholder="Notes (optional)"
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  style={{
                    padding: '8px 10px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '13px',
                    width: '100%',
                  }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleScheduleFollowUp}
                    disabled={!followUpDate || savingFollowUp}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: !followUpDate || savingFollowUp ? '#D1D5DB' : '#2563EB',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: !followUpDate || savingFollowUp ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {savingFollowUp ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => { setShowFollowUpForm(false); setFollowUpDate(''); setFollowUpNotes(''); }}
                    style={{
                      padding: '8px 12px',
                      background: '#fff',
                      color: '#6B7280',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : lead.nextFollowUp?.date ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  padding: '10px',
                  background: '#FEF3C7',
                  borderRadius: '10px',
                }}>
                  <Clock size={20} style={{ color: '#D97706' }} />
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: '#1F2937', margin: 0 }}>
                    {formatDate(lead.nextFollowUp.date)}
                  </p>
                  {lead.nextFollowUp.type && (
                    <p style={{ fontSize: '12px', color: '#2563EB', margin: '2px 0 0 0', textTransform: 'capitalize' }}>
                      {lead.nextFollowUp.type.replace(/-/g, ' ')}
                    </p>
                  )}
                  <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0 0' }}>
                    {lead.nextFollowUp.notes || 'No notes'}
                  </p>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '14px', color: '#9CA3AF', margin: 0 }}>No follow-up scheduled</p>
            )}
          </div>

          {/* Assigned Team */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #E5E7EB',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937', margin: '0 0 12px 0' }}>
              Assigned To
            </h3>
            {lead.assignedTo ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Avatar name={lead.assignedTo.name} size="md" />
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '500', color: '#1F2937', margin: 0 }}>
                      {lead.assignedTo.name}
                    </p>
                    <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0 0' }}>
                      {lead.assignedTo.role}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleOpenAssignModal}
                  style={{
                    padding: '6px 12px',
                    background: 'transparent',
                    color: '#C59C82',
                    border: '1px solid #DDC5B0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  Reassign
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <p style={{ fontSize: '14px', color: '#9CA3AF', margin: '0 0 12px 0' }}>No one assigned</p>
                <button
                  onClick={handleOpenAssignModal}
                  style={{
                    padding: '10px 16px',
                    background: '#ffffff',
                    color: '#374151',
                    border: '1px solid #E5E7EB',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <UserPlus size={16} />
                  Assign
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Note Modal */}
      <Modal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        title="Add Note"
        size="md"
      >
        <form onSubmit={handleAddNote}>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write your note..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
            required
          />
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowNoteModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={savingNote}>
              Add Note
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Log Call Modal */}
      <Modal
        isOpen={showCallModal}
        onClose={() => setShowCallModal(false)}
        title="Log Call Activity"
        size="md"
      >
        <form onSubmit={handleLogCall}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Call Outcome *
              </label>
              <Select
                options={callOutcomeOptions}
                value={callOutcome}
                onChange={(e) => setCallOutcome(e.target.value)}
                placeholder="Select outcome..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                placeholder="Add notes about this call..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>
          </div>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCallModal(false)}>
              Cancel
            </Button>
            <Button type="submit" icon={PhoneCall}>
              Log Call
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Assign User Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Lead"
        size="md"
      >
        <form onSubmit={handleAssignUser}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Team Member *
              </label>
              {loadingUsers ? (
                <p className="text-sm text-gray-500 py-3 text-center">Loading users...</p>
              ) : (
                <Select
                  options={assignableUsers.map(u => ({
                    value: u._id,
                    label: `${u.name}${u.designation ? ` — ${u.designation}` : ''}${u.subDepartment ? ` (${u.subDepartment.replace(/_/g, ' ')})` : ''}`,
                  }))}
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                  placeholder="Select a person..."
                  required
                />
              )}
            </div>
          </div>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAssignModal(false)}>
              Cancel
            </Button>
            <Button type="submit" icon={UserPlus} loading={assigningUser} disabled={!selectedAssignee}>
              Assign
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Assign Interest Area Modal */}
      <Modal
        isOpen={showDepartmentModal}
        onClose={() => setShowDepartmentModal(false)}
        title="Assign Interest Area"
        size="sm"
      >
        <form onSubmit={handleAssignDepartment}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Interest Area *
              </label>
              <Select
                options={departmentOptions}
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                placeholder="Select department..."
                required
              />
            </div>
          </div>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDepartmentModal(false)}>
              Cancel
            </Button>
            <Button type="submit" icon={Building2}>
              Assign
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Assign Sales Executive Modal */}
      <Modal
        isOpen={showSalesExecModal}
        onClose={() => setShowSalesExecModal(false)}
        title="Assign Sales Executive"
        size="md"
      >
        <form onSubmit={handleAssignSalesExec}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Assign a sales executive from your team to handle this qualified lead.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Sales Executive *
              </label>
              {loadingSalesExec ? (
                <p className="text-sm text-gray-500 py-3 text-center">Loading sales team...</p>
              ) : salesExecUsers.length === 0 ? (
                <p className="text-sm text-gray-500 py-3 text-center">No sales executives found</p>
              ) : (
                <Select
                  options={salesExecUsers.map(u => ({
                    value: u._id,
                    label: `${u.name}${u.designation ? ` — ${u.designation}` : ''}`,
                  }))}
                  value={selectedSalesExec}
                  onChange={(e) => setSelectedSalesExec(e.target.value)}
                  placeholder="Select a sales executive..."
                  required
                />
              )}
            </div>
          </div>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowSalesExecModal(false)}>
              Cancel
            </Button>
            <Button type="submit" icon={UserPlus} loading={assigningSalesExec} disabled={!selectedSalesExec}>
              Assign Executive
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Call In Progress Floating Bar */}
      {callInProgress && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
        }}>
          <div style={{
            width: 12, height: 12, borderRadius: '50%',
            background: '#34D399',
            animation: 'pulse 1.5s infinite',
          }} />
          <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PhoneCall size={18} style={{ color: '#A7F3D0' }} />
            <span style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>
              Calling {lead.name}
            </span>
          </div>
          <div style={{
            padding: '6px 16px',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 8,
            color: '#A7F3D0',
            fontSize: 18,
            fontWeight: 700,
            fontFamily: 'monospace',
            minWidth: 70,
            textAlign: 'center',
          }}>
            {formatCallTimer(callTimer)}
          </div>
          <button
            onClick={handleEndCall}
            style={{
              padding: '10px 24px',
              background: '#EF4444',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <PhoneOff size={16} />
            End Call
          </button>
        </div>
      )}

      {/* Call Disposition Modal */}
      <Modal
        isOpen={showDispositionModal}
        onClose={() => {
          setShowDispositionModal(false)
          setCallDispGroup('')
          setCallDispSub('')
          setCallDispRemarks('')
        }}
        title="Call Disposition"
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Call Summary */}
          <div style={{
            padding: 14,
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <div style={{ padding: 10, background: '#D1FAE5', borderRadius: 10 }}>
              <PhoneCall size={20} style={{ color: '#059669' }} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#065F46', margin: 0 }}>
                Call to {lead.name}
              </p>
              <p style={{ fontSize: 12, color: '#059669', margin: '2px 0 0' }}>
                Duration: {formatCallTimer(callTimer)} | {lead.phone}
              </p>
            </div>
          </div>

          {/* Disposition Group Selection */}
          {dispositionConfig ? (
            <>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                  Disposition *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {getCallDispGroups().map(g => {
                    const style = getDispositionGroupStyle(g.category, g.value)
                    const isSelected = callDispGroup === g.value
                    return (
                      <button
                        key={`${g.category}_${g.value}`}
                        type="button"
                        onClick={() => {
                          setCallDispGroup(g.value)
                          setCallDispSub('')
                        }}
                        style={{
                          padding: '10px 12px',
                          border: isSelected ? `2px solid ${style.color}` : `1px solid ${style.border}`,
                          borderRadius: 10,
                          background: isSelected ? style.bg : '#fff',
                          cursor: 'pointer',
                          fontSize: 13,
                          fontWeight: isSelected ? 600 : 500,
                          color: isSelected ? style.color : '#374151',
                          transition: 'all 0.15s',
                          textAlign: 'center',
                        }}
                      >
                        {g.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Sub-Disposition Selection */}
              {callDispGroup && (
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                    Sub-Disposition *
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {getCallDispSubDispositions().map(sd => {
                      const groupInfo = getSelectedGroupInfo()
                      const style = getDispositionGroupStyle(groupInfo?.category, callDispGroup)
                      const isSelected = callDispSub === sd.value
                      return (
                        <button
                          key={sd.value}
                          type="button"
                          onClick={() => setCallDispSub(sd.value)}
                          style={{
                            padding: '10px 14px',
                            border: isSelected ? `2px solid ${style.color}` : '1px solid #E5E7EB',
                            borderRadius: 8,
                            background: isSelected ? style.bg : '#fff',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: isSelected ? 600 : 400,
                            color: isSelected ? style.color : '#374151',
                            transition: 'all 0.15s',
                            textAlign: 'left',
                          }}
                        >
                          {sd.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: 12 }}>
              Loading dispositions...
            </p>
          )}

          {/* Remarks */}
          {callDispGroup && callDispSub && (
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Remarks
              </label>
              <textarea
                value={callDispRemarks}
                onChange={(e) => setCallDispRemarks(e.target.value)}
                placeholder="What was discussed? Any key takeaways..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: 10,
                  fontSize: 13,
                  color: '#374151',
                  resize: 'vertical',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          )}
        </div>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowDispositionModal(false)
              setCallDispGroup('')
              setCallDispSub('')
              setCallDispRemarks('')
            }}
          >
            Skip
          </Button>
          <Button
            onClick={handleSubmitDisposition}
            loading={savingCallDisposition}
            disabled={!callDispGroup || !callDispSub}
            icon={CheckCircle}
          >
            Save Disposition
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Schedule Meeting Modal */}
      <Modal
        isOpen={showScheduleMeetingModal}
        onClose={() => setShowScheduleMeetingModal(false)}
        title="Schedule Meeting"
        size="md"
      >
        <form onSubmit={handleScheduleMeeting}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Info banner */}
            <div style={{
              padding: 14,
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: 10,
              fontSize: 13,
              color: '#065F46',
            }}>
              Schedule a meeting for <strong>{lead.name}</strong>. This will transfer the lead to the sales pipeline.
            </div>

            {/* Date & Time */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Meeting Date *
                </label>
                <input
                  type="date"
                  value={meetingForm.date}
                  onChange={(e) => setMeetingForm({ ...meetingForm, date: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: 8,
                    fontSize: 13,
                    color: '#374151',
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Time
                </label>
                <input
                  type="time"
                  value={meetingForm.time}
                  onChange={(e) => setMeetingForm({ ...meetingForm, time: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: 8,
                    fontSize: 13,
                    color: '#374151',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Sales Person */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Assign Sales Person *
              </label>
              {salesUsers.length === 0 ? (
                <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: 8 }}>Loading sales team...</p>
              ) : (
                <select
                  value={meetingForm.salesPersonId}
                  onChange={(e) => setMeetingForm({ ...meetingForm, salesPersonId: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: 8,
                    fontSize: 13,
                    color: '#374151',
                    background: '#fff',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="">Select sales person...</option>
                  {salesUsers.map(u => (
                    <option key={u._id} value={u._id}>
                      {u.name}{u.designation ? ` — ${u.designation}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Designer */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Assign Designer
              </label>
              {designerUsers.length === 0 ? (
                <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: 8 }}>No designers found</p>
              ) : (
                <select
                  value={meetingForm.designerId}
                  onChange={(e) => setMeetingForm({ ...meetingForm, designerId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: 8,
                    fontSize: 13,
                    color: '#374151',
                    background: '#fff',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="">Select designer (optional)...</option>
                  {designerUsers.map(u => (
                    <option key={u._id} value={u._id}>
                      {u.name}{u.designation ? ` — ${u.designation}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Meeting Type */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Meeting Type
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  { value: 'office', label: 'Office' },
                  { value: 'site_visit', label: 'Site Visit' },
                  { value: 'video_call', label: 'Video Call' },
                  { value: 'phone', label: 'Phone' },
                ].map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setMeetingForm({ ...meetingForm, meetingType: t.value })}
                    style={{
                      padding: '8px 10px',
                      border: meetingForm.meetingType === t.value ? '2px solid #C59C82' : '1px solid #E5E7EB',
                      borderRadius: 8,
                      background: meetingForm.meetingType === t.value ? '#FDF2E9' : '#fff',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: meetingForm.meetingType === t.value ? 600 : 400,
                      color: meetingForm.meetingType === t.value ? '#A67B5B' : '#374151',
                      textAlign: 'center',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            {(meetingForm.meetingType === 'office' || meetingForm.meetingType === 'site_visit') && (
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Location
                </label>
                <input
                  type="text"
                  value={meetingForm.location}
                  onChange={(e) => setMeetingForm({ ...meetingForm, location: e.target.value })}
                  placeholder={meetingForm.meetingType === 'office' ? 'Office address...' : 'Site address...'}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: 8,
                    fontSize: 13,
                    color: '#374151',
                    outline: 'none',
                  }}
                />
              </div>
            )}

            {/* Notes */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Notes
              </label>
              <textarea
                value={meetingForm.notes}
                onChange={(e) => setMeetingForm({ ...meetingForm, notes: e.target.value })}
                placeholder="Any notes for the meeting..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: 8,
                  fontSize: 13,
                  color: '#374151',
                  resize: 'vertical',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowScheduleMeetingModal(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={schedulingMeeting}
              disabled={!meetingForm.date || !meetingForm.salesPersonId}
              icon={Calendar}
            >
              Schedule Meeting
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Assign Designer Modal */}
      <Modal
        isOpen={showDesignerModal}
        onClose={() => setShowDesignerModal(false)}
        title="Assign Designer"
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            padding: 14, background: '#F0FDF4', border: '1px solid #BBF7D0',
            borderRadius: 10, fontSize: 13, color: '#065F46',
          }}>
            Select a designer to assign to <strong>{lead?.name}</strong>.
          </div>
          {availableDesigners.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <p style={{ fontSize: 13, color: '#9CA3AF' }}>Loading designers...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
              {availableDesigners.map(d => (
                <button
                  key={d._id}
                  onClick={async () => {
                    try {
                      await leadsAPI.assignDesigner(id, d._id)
                      setShowDesignerModal(false)
                      loadLead()
                    } catch (err) {
                      alert(err.message || 'Failed to assign designer')
                    }
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                    background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10,
                    cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#C59C82'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', background: '#C59C82',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 14, fontWeight: 600, flexShrink: 0,
                  }}>
                    {d.name?.charAt(0) || 'D'}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#1F2937', margin: 0 }}>{d.name}</p>
                    <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{d.designation || d.subDepartment || 'Designer'}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDesignerModal(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default LeadDetail
