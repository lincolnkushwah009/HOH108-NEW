import { useState, useEffect } from 'react'
import { FileText, Upload, History, Shield, Tag, Plus, Eye, Edit2 } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Modal, Input, Select, Textarea } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate } from '../../utils/helpers'
import { apiRequest } from '../../utils/api'

const DocumentManager = () => {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [entityTypeFilter, setEntityTypeFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })

  // Upload modal
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newDoc, setNewDoc] = useState({
    title: '',
    entityType: 'project',
    entityId: '',
    fileUrl: '',
    tags: '',
  })

  // Version history modal
  const [showVersionModal, setShowVersionModal] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [versions, setVersions] = useState([])
  const [loadingVersions, setLoadingVersions] = useState(false)

  // Audit trail modal
  const [showAuditModal, setShowAuditModal] = useState(false)
  const [auditLog, setAuditLog] = useState([])
  const [loadingAudit, setLoadingAudit] = useState(false)

  // New version modal
  const [showNewVersionModal, setShowNewVersionModal] = useState(false)
  const [newVersion, setNewVersion] = useState({ fileUrl: '', changeNotes: '' })
  const [savingVersion, setSavingVersion] = useState(false)

  // Edit tags modal
  const [showTagModal, setShowTagModal] = useState(false)
  const [editingTags, setEditingTags] = useState('')
  const [savingTags, setSavingTags] = useState(false)

  useEffect(() => {
    loadDocuments()
  }, [pagination.page, search, entityTypeFilter, tagFilter])

  const loadDocuments = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      })
      if (search) params.set('search', search)
      if (entityTypeFilter) params.set('entityType', entityTypeFilter)
      if (tagFilter) params.set('tags', tagFilter)

      const response = await apiRequest(`/documents?${params.toString()}`)
      const data = response.data || response.documents || []
      setDocuments(data)
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || data.length,
        totalPages: response.pagination?.pages || 1,
      }))
    } catch (err) {
      console.error('Failed to load documents:', err)
      setError('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadDocument = async () => {
    if (!newDoc.title.trim() || !newDoc.fileUrl.trim()) return
    setSaving(true)
    try {
      const tags = newDoc.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)

      await apiRequest('/documents', {
        method: 'POST',
        body: JSON.stringify({
          title: newDoc.title,
          entityType: newDoc.entityType,
          entityId: newDoc.entityId || undefined,
          fileUrl: newDoc.fileUrl,
          tags,
        }),
      })
      setShowUploadModal(false)
      setNewDoc({ title: '', entityType: 'project', entityId: '', fileUrl: '', tags: '' })
      await loadDocuments()
    } catch (err) {
      console.error('Failed to upload document:', err)
      setError('Failed to upload document')
    } finally {
      setSaving(false)
    }
  }

  const handleViewVersions = async (doc) => {
    setSelectedDoc(doc)
    setShowVersionModal(true)
    setLoadingVersions(true)
    try {
      const response = await apiRequest(`/documents/${doc._id}/versions`)
      setVersions(response.data || response.versions || [])
    } catch (err) {
      console.error('Failed to load versions:', err)
      setVersions([])
    } finally {
      setLoadingVersions(false)
    }
  }

  const handleViewAudit = async (doc) => {
    setSelectedDoc(doc)
    setShowAuditModal(true)
    setLoadingAudit(true)
    try {
      const response = await apiRequest(`/documents/${doc._id}/audit`)
      setAuditLog(response.data || response.auditLog || [])
    } catch (err) {
      console.error('Failed to load audit log:', err)
      setAuditLog([])
    } finally {
      setLoadingAudit(false)
    }
  }

  const handleNewVersion = async () => {
    if (!newVersion.fileUrl.trim()) return
    setSavingVersion(true)
    try {
      await apiRequest(`/documents/${selectedDoc._id}/versions`, {
        method: 'POST',
        body: JSON.stringify({
          fileUrl: newVersion.fileUrl,
          changeNotes: newVersion.changeNotes,
        }),
      })
      setShowNewVersionModal(false)
      setNewVersion({ fileUrl: '', changeNotes: '' })
      await loadDocuments()
      // Refresh versions if version modal is open
      if (showVersionModal && selectedDoc) {
        handleViewVersions(selectedDoc)
      }
    } catch (err) {
      console.error('Failed to create version:', err)
    } finally {
      setSavingVersion(false)
    }
  }

  const handleSaveTags = async () => {
    setSavingTags(true)
    try {
      const tags = editingTags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)

      await apiRequest(`/documents/${selectedDoc._id}`, {
        method: 'PUT',
        body: JSON.stringify({ tags }),
      })
      setShowTagModal(false)
      await loadDocuments()
    } catch (err) {
      console.error('Failed to update tags:', err)
    } finally {
      setSavingTags(false)
    }
  }

  const openTagEditor = (doc) => {
    setSelectedDoc(doc)
    setEditingTags((doc.tags || []).join(', '))
    setShowTagModal(true)
  }

  const openNewVersionModal = (doc) => {
    setSelectedDoc(doc)
    setNewVersion({ fileUrl: '', changeNotes: '' })
    setShowNewVersionModal(true)
  }

  const getEntityTypeColor = (type) => {
    const colors = {
      project: 'blue',
      vendor: 'purple',
      customer: 'green',
      hr: 'orange',
      compliance: 'red',
    }
    return colors[type] || 'gray'
  }

  if (loading && documents.length === 0) return <PageLoader />

  return (
    <div>
      <PageHeader
        title="Document Manager"
        description="Centralized document management with versioning and audit trails"
        breadcrumbs={[
          { label: 'Settings', path: '/admin/settings' },
          { label: 'Documents' },
        ]}
        actions={
          <Button icon={Upload} onClick={() => setShowUploadModal(true)}>
            Upload Document
          </Button>
        }
      />

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Card.Content style={{ padding: 20 }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: '200px' }}>
              <SearchInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search documents by title..."
              />
            </div>
            <div style={{ flex: 1, minWidth: '160px' }}>
              <Select
                label="Entity Type"
                value={entityTypeFilter}
                onChange={(e) => { setEntityTypeFilter(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
              >
                <option value="">All Types</option>
                <option value="project">Project</option>
                <option value="vendor">Vendor</option>
                <option value="customer">Customer</option>
                <option value="hr">HR</option>
                <option value="compliance">Compliance</option>
              </Select>
            </div>
            <div style={{ flex: 1, minWidth: '160px' }}>
              <Input
                label="Filter by Tag"
                value={tagFilter}
                onChange={(e) => { setTagFilter(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
                placeholder="e.g., contract"
              />
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Documents Table */}
      <Card>
        <Card.Header title="Documents" />
        <Card.Content style={{ padding: 20 }}>
          {error && (
            <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {documents.length === 0 ? (
            <EmptyState
              title="No documents found"
              description="Upload your first document to get started."
            />
          ) : (
            <>
              <Table>
                <Table.Header>
                  <Table.Row hover={false}>
                    <Table.Head>Title</Table.Head>
                    <Table.Head>Entity Type</Table.Head>
                    <Table.Head>Entity</Table.Head>
                    <Table.Head>Version</Table.Head>
                    <Table.Head>Tags</Table.Head>
                    <Table.Head>Uploaded By</Table.Head>
                    <Table.Head>Date</Table.Head>
                    <Table.Head style={{ textAlign: 'right' }}>Actions</Table.Head>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {documents.map((doc) => (
                    <Table.Row key={doc._id}>
                      <Table.Cell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ padding: '6px', backgroundColor: '#FDF8F4', borderRadius: '8px' }}>
                            <FileText style={{ width: '16px', height: '16px', color: '#C59C82' }} />
                          </div>
                          <span style={{ fontWeight: '600', color: '#1e293b' }}>{doc.title || '-'}</span>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={getEntityTypeColor(doc.entityType)}>
                          {doc.entityType || '-'}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <span style={{ color: '#475569', fontSize: '13px' }}>
                          {doc.entityName || doc.entityId || '-'}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span
                          style={{ fontWeight: '600', color: '#C59C82', cursor: 'pointer' }}
                          onClick={() => handleViewVersions(doc)}
                        >
                          v{doc.version || doc.currentVersion || 1}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {(doc.tags || []).slice(0, 3).map((tag, i) => (
                            <span
                              key={i}
                              onClick={() => openTagEditor(doc)}
                              style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                backgroundColor: '#f1f5f9',
                                color: '#475569',
                                fontSize: '11px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: '500',
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                          {(doc.tags || []).length > 3 && (
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                              +{doc.tags.length - 3}
                            </span>
                          )}
                          {(!doc.tags || doc.tags.length === 0) && (
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>--</span>
                          )}
                        </div>
                      </Table.Cell>
                      <Table.Cell>{doc.uploadedBy?.name || doc.uploadedByName || '-'}</Table.Cell>
                      <Table.Cell>{formatDate(doc.createdAt || doc.uploadedAt)}</Table.Cell>
                      <Table.Cell style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                          <Button variant="ghost" size="sm" icon={History} onClick={() => handleViewVersions(doc)}>
                            Versions
                          </Button>
                          <Button variant="ghost" size="sm" icon={Shield} onClick={() => handleViewAudit(doc)}>
                            Audit
                          </Button>
                          <Button variant="ghost" size="sm" icon={Plus} onClick={() => openNewVersionModal(doc)}>
                            New Version
                          </Button>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>

              {pagination.totalPages > 1 && (
                <div style={{ marginTop: '16px' }}>
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
                  />
                </div>
              )}
            </>
          )}
        </Card.Content>
      </Card>

      {/* Upload Document Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Document"
        description="Add a new document to the system"
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Document Title"
            value={newDoc.title}
            onChange={(e) => setNewDoc(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Project Agreement v1"
          />

          <Select
            label="Entity Type"
            value={newDoc.entityType}
            onChange={(e) => setNewDoc(prev => ({ ...prev, entityType: e.target.value }))}
          >
            <option value="project">Project</option>
            <option value="vendor">Vendor</option>
            <option value="customer">Customer</option>
            <option value="hr">HR</option>
            <option value="compliance">Compliance</option>
          </Select>

          <Input
            label="Entity ID (optional)"
            value={newDoc.entityId}
            onChange={(e) => setNewDoc(prev => ({ ...prev, entityId: e.target.value }))}
            placeholder="Link to a specific entity..."
          />

          <Input
            label="File URL"
            value={newDoc.fileUrl}
            onChange={(e) => setNewDoc(prev => ({ ...prev, fileUrl: e.target.value }))}
            placeholder="https://example.com/document.pdf"
          />

          <Input
            label="Tags (comma-separated)"
            value={newDoc.tags}
            onChange={(e) => setNewDoc(prev => ({ ...prev, tags: e.target.value }))}
            placeholder="contract, legal, signed"
          />
        </div>

        <Modal.Footer>
          <Button variant="ghost" onClick={() => setShowUploadModal(false)}>Cancel</Button>
          <Button onClick={handleUploadDocument} disabled={saving || !newDoc.title.trim() || !newDoc.fileUrl.trim()}>
            {saving ? 'Uploading...' : 'Upload Document'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Version History Modal */}
      <Modal
        isOpen={showVersionModal}
        onClose={() => { setShowVersionModal(false); setSelectedDoc(null); setVersions([]); }}
        title={selectedDoc ? `Version History: ${selectedDoc.title}` : 'Version History'}
        size="lg"
      >
        {loadingVersions ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Loading versions...</div>
        ) : versions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>No version history available</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {versions.map((ver, index) => (
              <div key={ver._id || index} style={{
                padding: '16px',
                backgroundColor: index === 0 ? '#FDF8F4' : '#f8fafc',
                borderRadius: '12px',
                border: index === 0 ? '1px solid #C59C82' : '1px solid #f1f5f9',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Badge color={index === 0 ? 'purple' : 'gray'}>
                      v{ver.version || versions.length - index}
                    </Badge>
                    {index === 0 && (
                      <span style={{ fontSize: '11px', color: '#C59C82', fontWeight: '600' }}>CURRENT</span>
                    )}
                  </div>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {formatDate(ver.createdAt || ver.uploadedAt)}
                  </span>
                </div>
                {ver.changeNotes && (
                  <p style={{ fontSize: '13px', color: '#475569', margin: '8px 0 0 0' }}>{ver.changeNotes}</p>
                )}
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>
                  Uploaded by {ver.uploadedBy?.name || ver.uploadedByName || 'Unknown'}
                </p>
              </div>
            ))}
          </div>
        )}

        <Modal.Footer>
          <Button variant="ghost" onClick={() => { setShowVersionModal(false); setSelectedDoc(null); setVersions([]); }}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Audit Trail Modal */}
      <Modal
        isOpen={showAuditModal}
        onClose={() => { setShowAuditModal(false); setSelectedDoc(null); setAuditLog([]); }}
        title={selectedDoc ? `Audit Trail: ${selectedDoc.title}` : 'Audit Trail'}
        size="lg"
      >
        {loadingAudit ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Loading audit trail...</div>
        ) : auditLog.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>No audit records found</div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row hover={false}>
                <Table.Head>Action</Table.Head>
                <Table.Head>User</Table.Head>
                <Table.Head>Details</Table.Head>
                <Table.Head>Date</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {auditLog.map((entry, index) => (
                <Table.Row key={entry._id || index}>
                  <Table.Cell>
                    <Badge color={
                      entry.action === 'viewed' ? 'blue' :
                      entry.action === 'downloaded' ? 'green' :
                      entry.action === 'updated' ? 'yellow' :
                      entry.action === 'created' ? 'purple' :
                      entry.action === 'deleted' ? 'red' : 'gray'
                    }>
                      {entry.action || '-'}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <span style={{ fontWeight: '500', color: '#1e293b' }}>
                      {entry.userName || entry.user?.name || 'Unknown'}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>
                      {entry.details || entry.description || '-'}
                    </span>
                  </Table.Cell>
                  <Table.Cell>{formatDate(entry.timestamp || entry.createdAt)}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}

        <Modal.Footer>
          <Button variant="ghost" onClick={() => { setShowAuditModal(false); setSelectedDoc(null); setAuditLog([]); }}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* New Version Modal */}
      <Modal
        isOpen={showNewVersionModal}
        onClose={() => setShowNewVersionModal(false)}
        title={selectedDoc ? `New Version: ${selectedDoc.title}` : 'New Version'}
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="File URL"
            value={newVersion.fileUrl}
            onChange={(e) => setNewVersion(prev => ({ ...prev, fileUrl: e.target.value }))}
            placeholder="https://example.com/document-v2.pdf"
          />

          <Textarea
            label="Change Notes"
            value={newVersion.changeNotes}
            onChange={(e) => setNewVersion(prev => ({ ...prev, changeNotes: e.target.value }))}
            placeholder="Describe what changed in this version..."
            rows={3}
          />
        </div>

        <Modal.Footer>
          <Button variant="ghost" onClick={() => setShowNewVersionModal(false)}>Cancel</Button>
          <Button onClick={handleNewVersion} disabled={savingVersion || !newVersion.fileUrl.trim()}>
            {savingVersion ? 'Saving...' : 'Upload Version'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Tags Modal */}
      <Modal
        isOpen={showTagModal}
        onClose={() => setShowTagModal(false)}
        title="Edit Tags"
        size="sm"
      >
        <Input
          label="Tags (comma-separated)"
          value={editingTags}
          onChange={(e) => setEditingTags(e.target.value)}
          placeholder="contract, legal, signed"
        />

        <Modal.Footer>
          <Button variant="ghost" onClick={() => setShowTagModal(false)}>Cancel</Button>
          <Button onClick={handleSaveTags} disabled={savingTags}>
            {savingTags ? 'Saving...' : 'Save Tags'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default DocumentManager
