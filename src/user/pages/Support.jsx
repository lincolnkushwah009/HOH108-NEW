import { useState } from 'react'
import {
  HeadphonesIcon,
  Plus,
  Search,
  Filter,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  ChevronRight,
  Send,
  Paperclip,
  Phone,
  Mail,
  User,
  Calendar,
  Tag,
  X,
  FileText,
  Image,
  HelpCircle,
  Wrench,
  CreditCard,
  Truck,
  Package,
} from 'lucide-react'

const COLORS = {
  dark: '#111111',
  card: '#1A1A1A',
  cardHover: '#222222',
  accent: '#C59C82',
  accentDark: '#A67C5B',
  textMuted: 'rgba(255,255,255,0.6)',
  border: 'rgba(255,255,255,0.1)',
}

const STATUS_CONFIG = {
  open: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', label: 'Open' },
  in_progress: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', label: 'In Progress' },
  resolved: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', label: 'Resolved' },
  closed: { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.15)', label: 'Closed' },
}

const PRIORITY_CONFIG = {
  low: { color: '#10b981', label: 'Low' },
  medium: { color: '#f59e0b', label: 'Medium' },
  high: { color: '#ef4444', label: 'High' },
}

const CATEGORY_CONFIG = {
  general: { icon: HelpCircle, label: 'General Inquiry', color: '#8b5cf6' },
  technical: { icon: Wrench, label: 'Technical Issue', color: '#3b82f6' },
  billing: { icon: CreditCard, label: 'Billing', color: '#10b981' },
  delivery: { icon: Truck, label: 'Delivery', color: '#f59e0b' },
  order: { icon: Package, label: 'Order Issue', color: '#ec4899' },
}

const mockTickets = [
  {
    id: 'TKT-001',
    subject: 'Delay in furniture delivery',
    category: 'delivery',
    status: 'in_progress',
    priority: 'high',
    createdAt: '2024-01-15T10:30:00',
    updatedAt: '2024-01-16T14:20:00',
    project: 'Living Room Renovation',
    assignedTo: { name: 'Rahul Support', avatar: null },
    messages: [
      {
        id: 1,
        sender: 'user',
        message: 'Hi, I was expecting my sofa set to be delivered today but I haven\'t received any update. Order #ORD-2024-001',
        timestamp: '2024-01-15T10:30:00',
      },
      {
        id: 2,
        sender: 'support',
        senderName: 'Rahul Support',
        message: 'Hello! I apologize for the inconvenience. Let me check the status of your order right away.',
        timestamp: '2024-01-15T10:45:00',
      },
      {
        id: 3,
        sender: 'support',
        senderName: 'Rahul Support',
        message: 'I\'ve checked with our logistics team. There was a slight delay due to quality inspection. Your order will be delivered tomorrow between 10 AM - 2 PM. We\'ll share tracking details shortly.',
        timestamp: '2024-01-15T11:00:00',
      },
      {
        id: 4,
        sender: 'user',
        message: 'Thank you for the quick update. Will someone call before delivery?',
        timestamp: '2024-01-15T11:15:00',
      },
      {
        id: 5,
        sender: 'support',
        senderName: 'Rahul Support',
        message: 'Yes, our delivery team will call you 30 minutes before arrival. Is there anything else I can help you with?',
        timestamp: '2024-01-16T14:20:00',
      },
    ],
  },
  {
    id: 'TKT-002',
    subject: 'Question about warranty coverage',
    category: 'general',
    status: 'resolved',
    priority: 'low',
    createdAt: '2024-01-10T09:00:00',
    updatedAt: '2024-01-11T16:30:00',
    project: 'Master Bedroom Design',
    assignedTo: { name: 'Priya Support', avatar: null },
    messages: [
      {
        id: 1,
        sender: 'user',
        message: 'What is the warranty period for the bed frame I ordered?',
        timestamp: '2024-01-10T09:00:00',
      },
      {
        id: 2,
        sender: 'support',
        senderName: 'Priya Support',
        message: 'Your bed frame comes with a 5-year warranty covering manufacturing defects and structural issues. Would you like me to send the detailed warranty terms?',
        timestamp: '2024-01-10T09:30:00',
      },
      {
        id: 3,
        sender: 'user',
        message: 'Yes please, that would be helpful.',
        timestamp: '2024-01-10T10:00:00',
      },
      {
        id: 4,
        sender: 'support',
        senderName: 'Priya Support',
        message: 'I\'ve sent the warranty document to your registered email. Let me know if you have any other questions!',
        timestamp: '2024-01-11T16:30:00',
        attachments: ['Warranty_Terms.pdf'],
      },
    ],
    resolution: 'Warranty information shared with customer via email.',
  },
  {
    id: 'TKT-003',
    subject: 'Payment not reflecting in account',
    category: 'billing',
    status: 'open',
    priority: 'high',
    createdAt: '2024-01-17T15:00:00',
    updatedAt: '2024-01-17T15:00:00',
    project: 'Kitchen Modular',
    assignedTo: null,
    messages: [
      {
        id: 1,
        sender: 'user',
        message: 'I made a payment of ₹50,000 yesterday for my kitchen project but it\'s not showing in my payment history. Transaction ID: TXN123456789',
        timestamp: '2024-01-17T15:00:00',
        attachments: ['payment_screenshot.png'],
      },
    ],
  },
]

const Support = () => {
  const [tickets, setTickets] = useState(mockTickets)
  const [activeTab, setActiveTab] = useState('all')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [showNewTicketModal, setShowNewTicketModal] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // New ticket form state
  const [newTicket, setNewTicket] = useState({
    subject: '',
    category: 'general',
    priority: 'medium',
    message: '',
  })

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab = activeTab === 'all' ||
                      (activeTab === 'open' && (ticket.status === 'open' || ticket.status === 'in_progress')) ||
                      (activeTab === 'resolved' && (ticket.status === 'resolved' || ticket.status === 'closed'))
    return matchesSearch && matchesTab
  })

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedTicket) return

    const updatedTickets = tickets.map(ticket => {
      if (ticket.id === selectedTicket.id) {
        return {
          ...ticket,
          messages: [
            ...ticket.messages,
            {
              id: ticket.messages.length + 1,
              sender: 'user',
              message: newMessage,
              timestamp: new Date().toISOString(),
            },
          ],
          updatedAt: new Date().toISOString(),
        }
      }
      return ticket
    })

    setTickets(updatedTickets)
    setSelectedTicket(updatedTickets.find(t => t.id === selectedTicket.id))
    setNewMessage('')
  }

  const handleCreateTicket = () => {
    const ticket = {
      id: `TKT-${String(tickets.length + 1).padStart(3, '0')}`,
      subject: newTicket.subject,
      category: newTicket.category,
      status: 'open',
      priority: newTicket.priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      project: 'General',
      assignedTo: null,
      messages: [
        {
          id: 1,
          sender: 'user',
          message: newTicket.message,
          timestamp: new Date().toISOString(),
        },
      ],
    }

    setTickets([ticket, ...tickets])
    setShowNewTicketModal(false)
    setNewTicket({ subject: '', category: 'general', priority: 'medium', message: '' })
  }

  const cardStyle = {
    background: COLORS.card,
    borderRadius: '16px',
    border: `1px solid ${COLORS.border}`,
    overflow: 'hidden',
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 136px)', gap: '24px' }}>
      {/* Tickets List */}
      <div style={{ width: '400px', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h1 style={{ color: 'white', fontSize: '24px', fontWeight: '700', margin: 0 }}>
                Support
              </h1>
              <p style={{ color: COLORS.textMuted, fontSize: '13px', marginTop: '4px' }}>
                Get help with your projects and orders
              </p>
            </div>
            <button
              onClick={() => setShowNewTicketModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 16px',
                background: COLORS.accent,
                border: 'none',
                borderRadius: '10px',
                color: COLORS.dark,
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              <Plus style={{ width: '16px', height: '16px' }} />
              New Ticket
            </button>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <Search style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              color: COLORS.textMuted,
            }} />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                background: COLORS.card,
                border: `1px solid ${COLORS.border}`,
                borderRadius: '10px',
                color: 'white',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {['all', 'open', 'resolved'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: activeTab === tab ? COLORS.accent : 'rgba(255,255,255,0.05)',
                  border: 'none',
                  borderRadius: '8px',
                  color: activeTab === tab ? COLORS.dark : 'white',
                  fontSize: '12px',
                  fontWeight: activeTab === tab ? '600' : '400',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tickets List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredTickets.map((ticket) => {
            const statusConfig = STATUS_CONFIG[ticket.status]
            const categoryConfig = CATEGORY_CONFIG[ticket.category]
            const CategoryIcon = categoryConfig.icon
            const isSelected = selectedTicket?.id === ticket.id

            return (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                style={{
                  padding: '16px',
                  background: isSelected ? `${COLORS.accent}10` : 'transparent',
                  borderLeft: isSelected ? `3px solid ${COLORS.accent}` : '3px solid transparent',
                  borderBottom: `1px solid ${COLORS.border}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: `${categoryConfig.color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <CategoryIcon style={{ width: '16px', height: '16px', color: categoryConfig.color }} />
                    </div>
                    <div>
                      <p style={{ color: 'white', fontSize: '14px', fontWeight: '500', margin: 0 }}>
                        {ticket.subject}
                      </p>
                      <span style={{ color: COLORS.textMuted, fontSize: '11px' }}>{ticket.id}</span>
                    </div>
                  </div>
                  <span style={{
                    padding: '3px 8px',
                    background: statusConfig.bg,
                    color: statusConfig.color,
                    fontSize: '10px',
                    fontWeight: '500',
                    borderRadius: '4px',
                  }}>
                    {statusConfig.label}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: COLORS.textMuted, fontSize: '11px' }}>
                    {ticket.project}
                  </span>
                  <span style={{ color: COLORS.textMuted, fontSize: '11px' }}>
                    {formatDate(ticket.updatedAt)}
                  </span>
                </div>
              </div>
            )
          })}

          {filteredTickets.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <HeadphonesIcon style={{ width: '40px', height: '40px', color: COLORS.textMuted, margin: '0 auto 12px' }} />
              <p style={{ color: 'white', fontSize: '14px', fontWeight: '500', margin: '0 0 4px 0' }}>
                No tickets found
              </p>
              <p style={{ color: COLORS.textMuted, fontSize: '12px', margin: 0 }}>
                Create a new ticket to get help
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, ...cardStyle, display: 'flex', flexDirection: 'column' }}>
        {selectedTicket ? (
          <>
            {/* Ticket Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: `1px solid ${COLORS.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h2 style={{ color: 'white', fontSize: '18px', fontWeight: '600', margin: 0 }}>
                    {selectedTicket.subject}
                  </h2>
                  <span style={{
                    padding: '4px 10px',
                    background: STATUS_CONFIG[selectedTicket.status].bg,
                    color: STATUS_CONFIG[selectedTicket.status].color,
                    fontSize: '12px',
                    fontWeight: '500',
                    borderRadius: '6px',
                  }}>
                    {STATUS_CONFIG[selectedTicket.status].label}
                  </span>
                  <span style={{
                    padding: '4px 10px',
                    background: `${PRIORITY_CONFIG[selectedTicket.priority].color}20`,
                    color: PRIORITY_CONFIG[selectedTicket.priority].color,
                    fontSize: '12px',
                    fontWeight: '500',
                    borderRadius: '6px',
                  }}>
                    {PRIORITY_CONFIG[selectedTicket.priority].label} Priority
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ color: COLORS.textMuted, fontSize: '13px' }}>{selectedTicket.id}</span>
                  <span style={{ color: COLORS.textMuted }}>•</span>
                  <span style={{ color: COLORS.textMuted, fontSize: '13px' }}>{selectedTicket.project}</span>
                  <span style={{ color: COLORS.textMuted }}>•</span>
                  <span style={{ color: COLORS.textMuted, fontSize: '13px' }}>
                    Created {formatDate(selectedTicket.createdAt)}
                  </span>
                </div>
              </div>
              {selectedTicket.assignedTo && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 14px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '10px',
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: `${COLORS.accent}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <User style={{ width: '16px', height: '16px', color: COLORS.accent }} />
                  </div>
                  <div>
                    <p style={{ color: 'white', fontSize: '13px', fontWeight: '500', margin: 0 }}>
                      {selectedTicket.assignedTo.name}
                    </p>
                    <p style={{ color: COLORS.textMuted, fontSize: '11px', margin: 0 }}>
                      Assigned Agent
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
              {selectedTicket.messages.map((msg, index) => {
                const isUser = msg.sender === 'user'
                const showDate = index === 0 ||
                  new Date(msg.timestamp).toDateString() !== new Date(selectedTicket.messages[index - 1].timestamp).toDateString()

                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div style={{
                        textAlign: 'center',
                        margin: '20px 0',
                      }}>
                        <span style={{
                          padding: '6px 14px',
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '20px',
                          color: COLORS.textMuted,
                          fontSize: '12px',
                        }}>
                          {new Date(msg.timestamp).toLocaleDateString('en-IN', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })}
                        </span>
                      </div>
                    )}
                    <div style={{
                      display: 'flex',
                      justifyContent: isUser ? 'flex-end' : 'flex-start',
                      marginBottom: '16px',
                    }}>
                      <div style={{ maxWidth: '70%' }}>
                        {!isUser && (
                          <p style={{ color: COLORS.textMuted, fontSize: '12px', marginBottom: '6px' }}>
                            {msg.senderName}
                          </p>
                        )}
                        <div style={{
                          padding: '14px 18px',
                          background: isUser ? COLORS.accent : 'rgba(255,255,255,0.05)',
                          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          color: isUser ? COLORS.dark : 'white',
                        }}>
                          <p style={{ fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
                            {msg.message}
                          </p>
                          {msg.attachments && (
                            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {msg.attachments.map((file, i) => (
                                <div
                                  key={i}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 10px',
                                    background: isUser ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.05)',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                  }}
                                >
                                  <FileText style={{ width: '14px', height: '14px' }} />
                                  {file}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <p style={{
                          color: COLORS.textMuted,
                          fontSize: '11px',
                          marginTop: '6px',
                          textAlign: isUser ? 'right' : 'left',
                        }}>
                          {formatTime(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}

              {selectedTicket.resolution && (
                <div style={{
                  margin: '20px 0',
                  padding: '16px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <CheckCircle style={{ width: '16px', height: '16px', color: '#10b981' }} />
                    <p style={{ color: '#10b981', fontSize: '13px', fontWeight: '500', margin: 0 }}>
                      Ticket Resolved
                    </p>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', margin: 0 }}>
                    {selectedTicket.resolution}
                  </p>
                </div>
              )}
            </div>

            {/* Message Input */}
            {(selectedTicket.status === 'open' || selectedTicket.status === 'in_progress') && (
              <div style={{
                padding: '20px 24px',
                borderTop: `1px solid ${COLORS.border}`,
              }}>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-end',
                }}>
                  <button
                    style={{
                      padding: '12px',
                      background: 'rgba(255,255,255,0.05)',
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '10px',
                      color: COLORS.textMuted,
                      cursor: 'pointer',
                    }}
                  >
                    <Paperclip style={{ width: '18px', height: '18px' }} />
                  </button>
                  <div style={{ flex: 1 }}>
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'rgba(255,255,255,0.03)',
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none',
                        resize: 'none',
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    style={{
                      padding: '12px 20px',
                      background: newMessage.trim() ? COLORS.accent : 'rgba(255,255,255,0.1)',
                      border: 'none',
                      borderRadius: '10px',
                      color: newMessage.trim() ? COLORS.dark : COLORS.textMuted,
                      cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Send style={{ width: '18px', height: '18px' }} />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              background: `${COLORS.accent}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
            }}>
              <MessageSquare style={{ width: '40px', height: '40px', color: COLORS.accent }} />
            </div>
            <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>
              Select a ticket
            </h3>
            <p style={{ color: COLORS.textMuted, fontSize: '14px', margin: '0 0 24px 0', textAlign: 'center' }}>
              Choose a ticket from the list to view the conversation
            </p>
            <button
              onClick={() => setShowNewTicketModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: COLORS.accent,
                border: 'none',
                borderRadius: '12px',
                color: COLORS.dark,
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              <Plus style={{ width: '18px', height: '18px' }} />
              Create New Ticket
            </button>
          </div>
        )}
      </div>

      {/* New Ticket Modal */}
      {showNewTicketModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '500px',
            background: COLORS.card,
            borderRadius: '20px',
            border: `1px solid ${COLORS.border}`,
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '24px',
              borderBottom: `1px solid ${COLORS.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '600', margin: 0 }}>
                New Support Ticket
              </h2>
              <button
                onClick={() => setShowNewTicketModal(false)}
                style={{
                  padding: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: COLORS.textMuted, fontSize: '13px', marginBottom: '8px' }}>
                  Subject
                </label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  placeholder="Brief description of your issue"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', color: COLORS.textMuted, fontSize: '13px', marginBottom: '8px' }}>
                    Category
                  </label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  >
                    {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                      <option key={key} value={key} style={{ background: COLORS.dark }}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: COLORS.textMuted, fontSize: '13px', marginBottom: '8px' }}>
                    Priority
                  </label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  >
                    {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                      <option key={key} value={key} style={{ background: COLORS.dark }}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: COLORS.textMuted, fontSize: '13px', marginBottom: '8px' }}>
                  Message
                </label>
                <textarea
                  value={newTicket.message}
                  onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                  placeholder="Describe your issue in detail..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>

              <button
                onClick={handleCreateTicket}
                disabled={!newTicket.subject || !newTicket.message}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: (newTicket.subject && newTicket.message) ? COLORS.accent : 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '12px',
                  color: (newTicket.subject && newTicket.message) ? COLORS.dark : COLORS.textMuted,
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: (newTicket.subject && newTicket.message) ? 'pointer' : 'not-allowed',
                }}
              >
                Create Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Support
