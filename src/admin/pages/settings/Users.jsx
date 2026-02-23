import { useState, useEffect } from 'react'
import { Plus, MoreVertical, Shield, Edit, Trash2, Key } from 'lucide-react'
import { usersAPI } from '../../utils/api'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, Avatar, SearchInput, Pagination, Dropdown, Modal, Input, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate } from '../../utils/helpers'
import { USER_ROLES } from '../../utils/constants'

const Users = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'viewer' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [pagination.page, search])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const response = await usersAPI.getAll({ page: pagination.page, limit: pagination.limit, search })
      setUsers(response.data || [])
      setPagination(prev => ({ ...prev, total: response.total || 0, totalPages: response.totalPages || 0 }))
    } catch (err) {
      console.error('Failed to load users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await usersAPI.create(formData)
      setShowCreateModal(false)
      setFormData({ name: '', email: '', password: '', role: 'viewer' })
      loadUsers()
    } catch (err) {
      console.error('Failed to create user:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return
    try {
      await usersAPI.delete(id)
      loadUsers()
    } catch (err) {
      console.error('Failed to delete user:', err)
    }
  }

  const roleOptions = Object.entries(USER_ROLES).map(([value, { label }]) => ({ value, label }))

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage admin users and permissions"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Users' }]}
        actions={<Button icon={Plus} onClick={() => setShowCreateModal(true)}>Add User</Button>}
      />

      <Card className="mb-6" padding="sm">
        <div className="p-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search users..." className="max-w-md" />
        </div>
      </Card>

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : users.length === 0 ? (
          <EmptyState icon={Shield} title="No users found" description="Add admin users" action={() => setShowCreateModal(true)} actionLabel="Add User" />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>User</Table.Head>
                  <Table.Head>Email</Table.Head>
                  <Table.Head>Role</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head>Last Active</Table.Head>
                  <Table.Head className="w-12"></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {users.map((user) => (
                  <Table.Row key={user._id}>
                    <Table.Cell>
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} src={user.avatar} size="sm" />
                        <p className="font-medium text-gray-900">{user.name}</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-600">{user.email}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={USER_ROLES[user.role]?.color || 'gray'}>
                        {USER_ROLES[user.role]?.label || user.role}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={user.isActive ? 'green' : 'red'} dot>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-500">{user.lastActive ? formatDate(user.lastActive) : 'Never'}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <Dropdown align="right" trigger={<button className="p-1 hover:bg-gray-100 rounded"><MoreVertical className="h-4 w-4 text-gray-400" /></button>}>
                        <Dropdown.Item icon={Edit}>Edit</Dropdown.Item>
                        <Dropdown.Item icon={Key}>Reset Password</Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item icon={Trash2} danger onClick={() => handleDelete(user._id)}>Delete</Dropdown.Item>
                      </Dropdown>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
            <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} totalItems={pagination.total} itemsPerPage={pagination.limit} onPageChange={(page) => setPagination(prev => ({ ...prev, page }))} />
          </>
        )}
      </Card>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add User">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
          <Input label="Password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
          <Select label="Role" options={roleOptions} value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} />
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create User</Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  )
}

export default Users
