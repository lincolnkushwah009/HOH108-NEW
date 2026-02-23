import { useState, useEffect } from 'react'
import { Gamepad2, Gift, Phone, Star, Check, Clock, Truck } from 'lucide-react'
import { gameEntriesAPI } from '../../utils/api'
import PageHeader from '../../components/layout/PageHeader'
import { Button, Card, Table, Badge, SearchInput, Pagination, Select } from '../../components/ui'
import { PageLoader } from '../../components/ui/LoadingSpinner'
import EmptyState from '../../components/ui/EmptyState'
import { formatDate, formatDateTime, formatPhone } from '../../utils/helpers'

const GameEntries = () => {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [prizeFilter, setPrizeFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })

  useEffect(() => {
    loadEntries()
  }, [pagination.page, search, prizeFilter])

  const loadEntries = async () => {
    setLoading(true)
    try {
      const response = await gameEntriesAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search,
        prizeStatus: prizeFilter,
      })
      setEntries(response.data || [])
      setPagination(prev => ({ ...prev, total: response.total || 0, totalPages: response.totalPages || 0 }))
    } catch (err) {
      console.error('Failed to load entries:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePrize = async (id, status) => {
    try {
      await gameEntriesAPI.updatePrize(id, status)
      loadEntries()
    } catch (err) {
      console.error('Failed to update prize status:', err)
    }
  }

  const prizeStatusColors = {
    pending: 'yellow',
    claimed: 'blue',
    delivered: 'green',
    cancelled: 'red',
  }

  const prizeStatusIcons = {
    pending: Clock,
    claimed: Check,
    delivered: Truck,
    cancelled: null,
  }

  const stats = {
    total: entries.length,
    pending: entries.filter(e => e.prizeStatus === 'pending').length,
    claimed: entries.filter(e => e.prizeStatus === 'claimed').length,
    delivered: entries.filter(e => e.prizeStatus === 'delivered').length,
  }

  return (
    <div>
      <PageHeader
        title="Game Entries"
        description="Spin wheel game participants and prizes"
        breadcrumbs={[{ label: 'Dashboard', path: '/admin' }, { label: 'Game Entries' }]}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Gamepad2 className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{pagination.total}</p>
              <p className="text-sm text-gray-500">Total Entries</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Check className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.claimed}</p>
              <p className="text-sm text-gray-500">Claimed</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Truck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.delivered}</p>
              <p className="text-sm text-gray-500">Delivered</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6" padding="sm">
        <div className="flex flex-col md:flex-row gap-4 p-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name or phone..." className="flex-1 max-w-md" />
          <Select
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'pending', label: 'Pending' },
              { value: 'claimed', label: 'Claimed' },
              { value: 'delivered', label: 'Delivered' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            value={prizeFilter}
            onChange={(e) => setPrizeFilter(e.target.value)}
            className="w-40"
          />
        </div>
      </Card>

      <Card padding="none">
        {loading ? (
          <PageLoader />
        ) : entries.length === 0 ? (
          <EmptyState icon={Gamepad2} title="No game entries" description="No one has played the spin wheel game yet" />
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Participant</Table.Head>
                  <Table.Head>Prize Won</Table.Head>
                  <Table.Head>Rating</Table.Head>
                  <Table.Head>Prize Status</Table.Head>
                  <Table.Head>Played At</Table.Head>
                  <Table.Head>Actions</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {entries.map((entry) => (
                  <Table.Row key={entry._id}>
                    <Table.Cell>
                      <div>
                        <p className="font-medium text-gray-900">{entry.name}</p>
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <Phone className="h-3.5 w-3.5" />
                          <span className="text-sm">{formatPhone(entry.phone)}</span>
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        <Gift className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium text-gray-900">{entry.prizeWon || 'No prize'}</span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      {entry.rating ? (
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < entry.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={prizeStatusColors[entry.prizeStatus] || 'gray'}>
                        {entry.prizeStatus}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-gray-500">{formatDateTime(entry.createdAt)}</span>
                    </Table.Cell>
                    <Table.Cell>
                      {entry.prizeStatus === 'pending' && entry.prizeWon && (
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleUpdatePrize(entry._id, 'claimed')}>
                            Mark Claimed
                          </Button>
                        </div>
                      )}
                      {entry.prizeStatus === 'claimed' && (
                        <Button size="sm" variant="success" onClick={() => handleUpdatePrize(entry._id, 'delivered')}>
                          Mark Delivered
                        </Button>
                      )}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
            <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} totalItems={pagination.total} itemsPerPage={pagination.limit} onPageChange={(page) => setPagination(prev => ({ ...prev, page }))} />
          </>
        )}
      </Card>
    </div>
  )
}

export default GameEntries
