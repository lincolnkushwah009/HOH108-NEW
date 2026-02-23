import { useState, useEffect } from 'react'
import { Plus, Mail, MoreVertical, Eye, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { mailTemplatesAPI } from '../../utils/api'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, Dropdown, Modal, Input, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate } from '../../utils/helpers'

const MailTemplates = () => {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    category: 'lead',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const response = await mailTemplatesAPI.getAll()
      setTemplates(response.data || [])
    } catch (err) {
      console.error('Failed to load templates:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await mailTemplatesAPI.create(formData)
      setShowCreateModal(false)
      setFormData({ name: '', subject: '', body: '', category: 'lead' })
      loadTemplates()
    } catch (err) {
      console.error('Failed to create template:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (id) => {
    try {
      await mailTemplatesAPI.toggle(id)
      loadTemplates()
    } catch (err) {
      console.error('Failed to toggle template:', err)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this template?')) return
    try {
      await mailTemplatesAPI.delete(id)
      loadTemplates()
    } catch (err) {
      console.error('Failed to delete template:', err)
    }
  }

  const handlePreview = (template) => {
    setSelectedTemplate(template)
    setShowPreviewModal(true)
  }

  const categoryOptions = [
    { value: 'lead', label: 'Lead' },
    { value: 'welcome', label: 'Welcome' },
    { value: 'follow-up', label: 'Follow-up' },
    { value: 'proposal', label: 'Proposal' },
    { value: 'notification', label: 'Notification' },
    { value: 'marketing', label: 'Marketing' },
  ]

  const categoryColors = {
    lead: 'blue',
    welcome: 'green',
    'follow-up': 'orange',
    proposal: 'purple',
    notification: 'yellow',
    marketing: 'pink',
  }

  return (
    <div>
      <PageHeader
        title="Mail Templates"
        description="Manage email templates"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Mail Templates' }]}
        actions={<Button icon={Plus} onClick={() => setShowCreateModal(true)}>New Template</Button>}
      />

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : templates.length === 0 ? (
          <EmptyState icon={Mail} title="No templates" description="Create your first email template" action={() => setShowCreateModal(true)} actionLabel="New Template" />
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>Template</Table.Head>
                <Table.Head>Subject</Table.Head>
                <Table.Head>Category</Table.Head>
                <Table.Head>Status</Table.Head>
                <Table.Head>Updated</Table.Head>
                <Table.Head className="w-12"></Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {templates.map((template) => (
                <Table.Row key={template._id}>
                  <Table.Cell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Mail className="h-5 w-5 text-gray-600" />
                      </div>
                      <p className="font-medium text-gray-900">{template.name}</p>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-sm text-gray-600">{template.subject}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color={categoryColors[template.category] || 'gray'}>
                      {template.category}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <button onClick={() => handleToggle(template._id)} className="flex items-center gap-2">
                      {template.isActive ? (
                        <>
                          <ToggleRight className="h-5 w-5 text-green-500" />
                          <span className="text-sm text-green-600">Active</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-500">Inactive</span>
                        </>
                      )}
                    </button>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="text-sm text-gray-500">{formatDate(template.updatedAt)}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <Dropdown align="right" trigger={<button className="p-1 hover:bg-gray-100 rounded"><MoreVertical className="h-4 w-4 text-gray-400" /></button>}>
                      <Dropdown.Item icon={Eye} onClick={() => handlePreview(template)}>Preview</Dropdown.Item>
                      <Dropdown.Item icon={Edit}>Edit</Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item icon={Trash2} danger onClick={() => handleDelete(template._id)}>Delete</Dropdown.Item>
                    </Dropdown>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Card>

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Template" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Template Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <Input label="Subject" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required />
          <Select label="Category" options={categoryOptions} value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Body</label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 font-mono text-sm"
              placeholder="Use {{variable}} for dynamic content..."
              required
            />
          </div>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create</Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Preview Modal */}
      <Modal isOpen={showPreviewModal} onClose={() => setShowPreviewModal(false)} title="Template Preview" size="lg">
        {selectedTemplate && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Subject</p>
              <p className="font-medium text-gray-900">{selectedTemplate.subject}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Body</p>
              <div className="p-4 bg-gray-50 rounded-lg">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">{selectedTemplate.body}</pre>
              </div>
            </div>
            {selectedTemplate.variables?.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Variables</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.variables.map((v, i) => (
                    <Badge key={i} color="blue">{`{{${v}}}`}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default MailTemplates
