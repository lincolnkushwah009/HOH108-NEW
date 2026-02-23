import { useState, useEffect } from 'react'
import { Star, TrendingUp, Clock, BarChart3 } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import { Card, Table, Badge, SearchInput, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { vendorsAPI } from '../../utils/api'

const VendorPerformance = () => {
    const [vendors, setVendors] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')

    useEffect(() => { loadVendors() }, [search, categoryFilter])

    const loadVendors = async () => {
        setLoading(true)
        try {
            const response = await vendorsAPI.getAll({ search, category: categoryFilter, limit: 200 })
            setVendors(response.data || [])
        } catch (err) {
            console.error('Failed to load vendors:', err)
        } finally {
            setLoading(false)
        }
    }

    const getRatingColor = (rating) => {
        if (rating >= 4) return 'green'
        if (rating >= 3) return 'yellow'
        if (rating >= 2) return 'orange'
        return 'red'
    }

    const getRatingStars = (rating) => {
        const r = rating || 0
        return '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r))
    }

    const getDeliveryBadge = (onTimeRate) => {
        if (!onTimeRate && onTimeRate !== 0) return <Badge color="gray">N/A</Badge>
        if (onTimeRate >= 90) return <Badge color="green">{onTimeRate}%</Badge>
        if (onTimeRate >= 75) return <Badge color="yellow">{onTimeRate}%</Badge>
        return <Badge color="red">{onTimeRate}%</Badge>
    }

    // Sort by rating descending
    const sortedVendors = [...vendors].sort((a, b) => (b.performanceRating || b.rating || 0) - (a.performanceRating || a.rating || 0))

    return (
        <div>
            <PageHeader
                title="Vendor Performance"
                description="Track and compare vendor delivery, quality, and pricing performance"
                breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Procurement' }, { label: 'Vendor Performance' }]}
            />

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg"><BarChart3 className="h-5 w-5 text-blue-600" /></div>
                        <div>
                            <p className="text-2xl font-semibold text-gray-900">{vendors.length}</p>
                            <p className="text-sm text-gray-500">Total Vendors</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg"><Star className="h-5 w-5 text-green-600" /></div>
                        <div>
                            <p className="text-2xl font-semibold text-gray-900">{vendors.filter(v => (v.performanceRating || v.rating || 0) >= 4).length}</p>
                            <p className="text-sm text-gray-500">Top Rated (4+)</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg"><Clock className="h-5 w-5 text-yellow-600" /></div>
                        <div>
                            <p className="text-2xl font-semibold text-gray-900">{vendors.filter(v => (v.onTimeDeliveryRate || 0) >= 90).length}</p>
                            <p className="text-sm text-gray-500">On-Time (90%+)</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg"><TrendingUp className="h-5 w-5 text-red-600" /></div>
                        <div>
                            <p className="text-2xl font-semibold text-gray-900">{vendors.filter(v => (v.performanceRating || v.rating || 0) < 3 && (v.performanceRating || v.rating || 0) > 0).length}</p>
                            <p className="text-sm text-gray-500">Needs Improvement</p>
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="mb-6" padding="sm">
                <div className="flex flex-col md:flex-row gap-4 p-4">
                    <SearchInput value={search} onChange={setSearch} placeholder="Search vendor name..." className="flex-1 max-w-md" />
                    <Select
                        options={[
                            { value: '', label: 'All Categories' },
                            { value: 'materials', label: 'Materials' },
                            { value: 'services', label: 'Services' },
                            { value: 'equipment', label: 'Equipment' },
                            { value: 'subcontractor', label: 'Subcontractor' },
                        ]}
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-44"
                    />
                </div>
            </Card>

            <Card padding="none">
                {loading ? <PageLoader /> : sortedVendors.length === 0 ? (
                    <EmptyState icon={BarChart3} title="No vendor data" description="Add vendors to start tracking performance" />
                ) : (
                    <Table>
                        <Table.Header>
                            <Table.Row>
                                <Table.Head>Vendor</Table.Head>
                                <Table.Head>Category</Table.Head>
                                <Table.Head>Rating</Table.Head>
                                <Table.Head>On-Time Delivery</Table.Head>
                                <Table.Head>Quality Score</Table.Head>
                                <Table.Head>Total Orders</Table.Head>
                                <Table.Head>Status</Table.Head>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {sortedVendors.map((vendor) => (
                                <Table.Row key={vendor._id}>
                                    <Table.Cell>
                                        <div>
                                            <p className="font-medium text-gray-900">{vendor.name}</p>
                                            <p className="text-xs text-gray-500">{vendor.vendorId}</p>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell><span className="text-sm text-gray-600 capitalize">{vendor.category || '-'}</span></Table.Cell>
                                    <Table.Cell>
                                        <div className="flex items-center gap-2">
                                            <span className="text-yellow-500 text-sm">{getRatingStars(vendor.performanceRating || vendor.rating)}</span>
                                            <span className="text-sm text-gray-600">{(vendor.performanceRating || vendor.rating || 0).toFixed(1)}</span>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell>{getDeliveryBadge(vendor.onTimeDeliveryRate)}</Table.Cell>
                                    <Table.Cell>
                                        {vendor.qualityScore ? (
                                            <Badge color={getRatingColor(vendor.qualityScore / 20)}>{vendor.qualityScore}%</Badge>
                                        ) : <span className="text-gray-400">N/A</span>}
                                    </Table.Cell>
                                    <Table.Cell><span className="text-sm text-gray-600">{vendor.totalOrders || vendor.orderCount || 0}</span></Table.Cell>
                                    <Table.Cell>
                                        <Badge color={vendor.isActive !== false ? 'green' : 'red'}>
                                            {vendor.isActive !== false ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table>
                )}
            </Card>
        </div>
    )
}

export default VendorPerformance
