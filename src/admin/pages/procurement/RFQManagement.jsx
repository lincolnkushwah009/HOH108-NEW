import { useState, useEffect } from 'react'
import { Plus, MoreVertical, FileText, Eye, Send, Award, Trash2 } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Dropdown, Modal, Input, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatCurrency } from '../../utils/helpers'
import { rfqAPI, vendorsAPI } from '../../utils/api'

const RFQManagement = () => {
    const [rfqs, setRfqs] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
    const [showCreate, setShowCreate] = useState(false)
    const [formData, setFormData] = useState({ title: '', description: '', items: [], dueDate: '' })
    const [vendors, setVendors] = useState([])

    useEffect(() => { loadRFQs() }, [pagination.page, search, statusFilter])
    useEffect(() => { loadVendors() }, [])

    const loadRFQs = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await rfqAPI.getAll({ page: pagination.page, limit: pagination.limit, search, status: statusFilter })
            setRfqs(response.data || [])
            setPagination(prev => ({
                ...prev,
                total: response.pagination?.total || 0,
                totalPages: response.pagination?.pages || 1,
            }))
        } catch (err) {
            console.error('Failed to load RFQs:', err)
            setError('Failed to load requests for quotation')
        } finally {
            setLoading(false)
        }
    }

    const loadVendors = async () => {
        try {
            const response = await vendorsAPI.getAll({ limit: 200 })
            setVendors(response.data || [])
        } catch (err) { /* ignore */ }
    }

    const handleCreate = async () => {
        try {
            await rfqAPI.create(formData)
            setShowCreate(false)
            setFormData({ title: '', description: '', items: [], dueDate: '' })
            loadRFQs()
        } catch (err) {
            console.error('Failed to create RFQ:', err)
        }
    }

    const handleSend = async (id) => {
        try {
            await rfqAPI.send(id)
            loadRFQs()
        } catch (err) { console.error('Failed to send RFQ:', err) }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this RFQ?')) return
        try {
            await rfqAPI.delete(id)
            loadRFQs()
        } catch (err) { console.error('Failed to delete RFQ:', err) }
    }

    const statusColors = { draft: 'gray', sent: 'blue', quoted: 'yellow', awarded: 'green', closed: 'purple', cancelled: 'red' }
    const statusLabels = { draft: 'Draft', sent: 'Sent', quoted: 'Quoted', awarded: 'Awarded', closed: 'Closed', cancelled: 'Cancelled' }

    return (
        <div>
            <PageHeader
                title="Request for Quotation (RFQ)"
                description="Create and manage RFQs to vendors for pricing"
                breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Procurement' }, { label: 'RFQ' }]}
                actions={<Button icon={Plus} onClick={() => setShowCreate(true)}>New RFQ</Button>}
            />

            <Card className="mb-6" padding="sm">
                <div className="flex flex-col md:flex-row gap-4 p-4">
                    <SearchInput value={search} onChange={setSearch} placeholder="Search RFQ number, title..." className="flex-1 max-w-md" />
                    <Select
                        options={[
                            { value: '', label: 'All Status' },
                            { value: 'draft', label: 'Draft' },
                            { value: 'sent', label: 'Sent' },
                            { value: 'quoted', label: 'Quoted' },
                            { value: 'awarded', label: 'Awarded' },
                            { value: 'closed', label: 'Closed' },
                        ]}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-40"
                    />
                </div>
            </Card>

            <Card padding="none">
                {loading ? <PageLoader /> : rfqs.length === 0 ? (
                    <EmptyState icon={FileText} title="No RFQs found" description="Create a request for quotation to get vendor pricing" action={() => setShowCreate(true)} actionLabel="New RFQ" />
                ) : (
                    <>
                        <Table>
                            <Table.Header>
                                <Table.Row>
                                    <Table.Head>RFQ ID</Table.Head>
                                    <Table.Head>Title</Table.Head>
                                    <Table.Head>Vendors</Table.Head>
                                    <Table.Head>Due Date</Table.Head>
                                    <Table.Head>Status</Table.Head>
                                    <Table.Head className="w-12"></Table.Head>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {rfqs.map((rfq) => (
                                    <Table.Row key={rfq._id}>
                                        <Table.Cell><span className="font-medium text-gray-900">{rfq.rfqNumber || rfq.rfqId || '-'}</span></Table.Cell>
                                        <Table.Cell><span className="text-sm text-gray-900">{rfq.title || '-'}</span></Table.Cell>
                                        <Table.Cell><span className="text-sm text-gray-600">{rfq.vendors?.length || 0} vendor(s)</span></Table.Cell>
                                        <Table.Cell><span className="text-sm text-gray-900">{formatDate(rfq.dueDate)}</span></Table.Cell>
                                        <Table.Cell><Badge color={statusColors[rfq.status] || 'gray'}>{statusLabels[rfq.status] || rfq.status}</Badge></Table.Cell>
                                        <Table.Cell>
                                            <Dropdown align="right" trigger={<button className="p-1 hover:bg-gray-100 rounded"><MoreVertical className="h-4 w-4 text-gray-400" /></button>}>
                                                <Dropdown.Item icon={Eye}>View Details</Dropdown.Item>
                                                {rfq.status === 'draft' && <Dropdown.Item icon={Send} onClick={() => handleSend(rfq._id)}>Send to Vendors</Dropdown.Item>}
                                                {rfq.status === 'quoted' && <Dropdown.Item icon={Award}>Award Vendor</Dropdown.Item>}
                                                <Dropdown.Item icon={Trash2} onClick={() => handleDelete(rfq._id)}>Delete</Dropdown.Item>
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

            <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Request for Quotation" size="md">
                <div className="space-y-4">
                    <Input label="Title" value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="RFQ title" />
                    <Input label="Description" value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Description" />
                    <Input label="Due Date" type="date" value={formData.dueDate} onChange={e => setFormData(prev => ({ ...prev, dueDate: e.target.value }))} />
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
                        <Button onClick={handleCreate}>Create RFQ</Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default RFQManagement
