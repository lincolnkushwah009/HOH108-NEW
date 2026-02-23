import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Phone, Mail, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react'
import { customersAPI } from '../../utils/api'
import PageHeader from '../../components/layout/PageHeader'
import {
  Button,
  Card,
  Table,
  Badge,
  Avatar,
  SearchInput,
  Pagination,
  Dropdown,
  Modal,
  Input,
  Select,
} from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatPhone, telHref } from '../../utils/helpers'

const CustomersList = () => {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    type: 'individual',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadCustomers()
  }, [pagination.page, search])

  const loadCustomers = async () => {
    setLoading(true)
    try {
      const response = await customersAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search,
      })
      setCustomers(response.data || [])
      setPagination(prev => ({
        ...prev,
        total: response.total || 0,
        totalPages: response.totalPages || 0,
      }))
    } catch (err) {
      console.error('Failed to load customers:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await customersAPI.create(formData)
      setShowCreateModal(false)
      setFormData({ name: '', email: '', phone: '', type: 'individual' })
      loadCustomers()
    } catch (err) {
      console.error('Failed to create customer:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this customer?')) return
    try {
      await customersAPI.delete(id)
      loadCustomers()
    } catch (err) {
      console.error('Failed to delete customer:', err)
    }
  }

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Manage your customer relationships"
        breadcrumbs={[
          { label: 'Dashboard', path: '/admin' },
          { label: 'Customers' },
        ]}
        actions={
          <Button icon={Plus} onClick={() => setShowCreateModal(true)}>
            Add Customer
          </Button>
        }
      />

      <Card style={{ marginBottom: '24px' }}>
        <div style={{ padding: '4px' }}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search customers..."
          />
        </div>
      </Card>

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : customers.length === 0 ? (
          <EmptyState
            title="No customers found"
            description="Start by adding your first customer"
            action={() => setShowCreateModal(true)}
            actionLabel="Add Customer"
          />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row hover={false}>
                  <Table.Head>Customer</Table.Head>
                  <Table.Head>Contact</Table.Head>
                  <Table.Head>Type</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head>Projects</Table.Head>
                  <Table.Head>Since</Table.Head>
                  <Table.Head style={{ width: '48px' }}></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {customers.map((customer) => (
                  <Table.Row
                    key={customer._id}
                    onClick={() => navigate(`/admin/customers/${customer._id}`)}
                  >
                    <Table.Cell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Avatar name={customer.name} size="sm" />
                        <div>
                          <p style={{ fontWeight: '500', color: '#1e293b', margin: 0 }}>{customer.name}</p>
                          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{customer.customerId}</p>
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                          <Phone style={{ width: '14px', height: '14px' }} />
                          <span style={{ fontSize: '14px' }}>{formatPhone(customer.phone)}</span>
                        </div>
                        {customer.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                            <Mail style={{ width: '14px', height: '14px' }} />
                            <span style={{ fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>{customer.email}</span>
                          </div>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={customer.type === 'business' ? 'purple' : 'blue'}>
                        {customer.type}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={customer.status === 'active' ? 'green' : 'gray'}>
                        {customer.status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <span style={{ fontSize: '14px', color: '#475569' }}>{customer.projectsCount || 0}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span style={{ fontSize: '14px', color: '#64748b' }}>{formatDate(customer.createdAt)}</span>
                    </Table.Cell>
                    <Table.Cell onClick={(e) => e.stopPropagation()}>
                      <Dropdown
                        align="right"
                        trigger={
                          <button
                            style={{
                              padding: '6px',
                              background: 'none',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              color: '#94a3b8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#f1f5f9'
                              e.currentTarget.style.color = '#475569'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'none'
                              e.currentTarget.style.color = '#94a3b8'
                            }}
                          >
                            <MoreVertical style={{ width: '16px', height: '16px' }} />
                          </button>
                        }
                      >
                        <Dropdown.Item icon={Eye} onClick={() => navigate(`/admin/customers/${customer._id}`)}>
                          View Details
                        </Dropdown.Item>
                        <Dropdown.Item icon={Edit}>Edit</Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item icon={Trash2} danger onClick={() => handleDelete(customer._id)}>
                          Delete
                        </Dropdown.Item>
                      </Dropdown>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
            />
          </>
        )}
      </Card>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add Customer">
        <form onSubmit={handleCreate}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Input
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <Select
              label="Type"
              options={[
                { value: 'individual', label: 'Individual' },
                { value: 'business', label: 'Business' },
              ]}
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            />
          </div>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create</Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  )
}

export default CustomersList
