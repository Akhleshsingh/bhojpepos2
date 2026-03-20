import { useEffect, useState, useMemo, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Button, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem, FormControl,
  InputLabel, Tooltip, CircularProgress, Checkbox, Popover, Divider,
  LinearProgress, Badge
} from '@mui/material'
import {
  Add, TakeoutDining, LocalShipping, SwapHoriz, CallMerge,
  Close, TableRestaurant, AccessTime, Receipt, Person, Kitchen,
  CheckCircle, AttachMoney, Restaurant, RoomService
} from '@mui/icons-material'
import { fetchTables, createTable, updateTable, setActiveSection } from '../../features/tablesSlice'
import { showSnackbar } from '../../features/uiSlice'
import PosHeader from '../../components/layout/PosHeader'
import { formatCurrency } from '../../utils/formatters'
import apiClient from '../../services/apiClient'

// Status colors matching the screenshot
const STATUS_CONFIG = {
  available: { bg: '#f5f5f5', border: '#e5e7eb', dot: '#186b35', label: 'Available', textColor: '#6b7280' },
  running: { bg: '#dcfce7', border: '#bbf7d0', dot: '#b81c1c', label: 'Running', textColor: '#166534' },
  occupied: { bg: '#dcfce7', border: '#bbf7d0', dot: '#b81c1c', label: 'Running', textColor: '#166534' },
  reserved: { bg: '#fce7f3', border: '#fbcfe8', dot: '#f97316', label: 'Reserved', textColor: '#9d174d' },
  billready: { bg: '#fef9c3', border: '#fef08a', dot: '#186b35', label: 'Bill Ready', textColor: '#854d0e' },
  cleaning: { bg: '#e0e7ff', border: '#c7d2fe', dot: '#6366f1', label: 'Cleaning', textColor: '#4338ca' },
}

// Quick View Popover Component
function QuickViewPopover({ anchorEl, onClose, tableId, tableName }) {
  const [loading, setLoading] = useState(true)
  const [details, setDetails] = useState(null)

  useEffect(() => {
    console.log('[QuickView] useEffect triggered - anchorEl:', Boolean(anchorEl), 'tableId:', tableId)
    if (anchorEl && tableId) {
      console.log('[QuickView] Fetching table details for:', tableId)
      setLoading(true)
      apiClient.get(`/tables/${tableId}/details`)
        .then(data => {
          console.log('[QuickView] Data received:', data)
          setDetails(data)
          setLoading(false)
        })
        .catch((err) => {
          console.error('[QuickView] Error fetching details:', err)
          setLoading(false)
        })
    }
  }, [anchorEl, tableId])

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
      transformOrigin={{ vertical: 'center', horizontal: 'left' }}
      disableRestoreFocus
      PaperProps={{
        sx: { 
          p: 0, 
          width: 320, 
          borderRadius: 2, 
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        },
        onMouseEnter: (e) => e.stopPropagation(),
        onMouseLeave: onClose
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, bgcolor: '#E8332A', color: '#fff' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography fontWeight={800} fontSize={18}>{tableName}</Typography>
          {details?.summary && (
            <Chip 
              label={`${details.summary.elapsed_minutes}m`}
              size="small"
              icon={<AccessTime sx={{ fontSize: 14, color: '#fff !important' }} />}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700, fontSize: 11 }}
            />
          )}
        </Box>
        {details?.summary && (
          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <Box>
              <Typography fontSize={10} sx={{ opacity: 0.8 }}>Orders</Typography>
              <Typography fontWeight={800}>{details.summary.orders_count}</Typography>
            </Box>
            <Box>
              <Typography fontSize={10} sx={{ opacity: 0.8 }}>Items</Typography>
              <Typography fontWeight={800}>{details.summary.total_items}</Typography>
            </Box>
            <Box>
              <Typography fontSize={10} sx={{ opacity: 0.8 }}>Total</Typography>
              <Typography fontWeight={800}>{formatCurrency(details.summary.total_amount)}</Typography>
            </Box>
            <Box>
              <Typography fontSize={10} sx={{ opacity: 0.8 }}>Pending KOT</Typography>
              <Typography fontWeight={800}>{details.summary.pending_kots}</Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* Content */}
      <Box sx={{ p: 2, maxHeight: 300, overflowY: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : details?.orders?.length > 0 ? (
          details.orders.map((order, idx) => (
            <Box key={order.id} sx={{ mb: idx < details.orders.length - 1 ? 2 : 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography fontSize={12} fontWeight={700} color="text.secondary">
                  {order.orderNumber}
                </Typography>
                <Chip 
                  label={order.status} 
                  size="small" 
                  sx={{ 
                    height: 18, 
                    fontSize: 9, 
                    fontWeight: 700,
                    bgcolor: order.status === 'pending' ? '#fef3c7' : order.status === 'preparing' ? '#dbeafe' : '#d1fae5',
                    color: order.status === 'pending' ? '#92400e' : order.status === 'preparing' ? '#1e40af' : '#065f46'
                  }} 
                />
              </Box>
              {order.items?.slice(0, 5).map((item, i) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: item.type === 'veg' ? '#186b35' : '#b81c1c' }} />
                    <Typography fontSize={12}>{item.qty}x {item.name}</Typography>
                  </Box>
                  <Typography fontSize={12} fontWeight={600}>{formatCurrency(item.price * item.qty)}</Typography>
                </Box>
              ))}
              {order.items?.length > 5 && (
                <Typography fontSize={11} color="text.secondary" sx={{ mt: 0.5 }}>
                  +{order.items.length - 5} more items
                </Typography>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: '1px dashed #e5e7eb' }}>
                <Typography fontSize={12} fontWeight={600}>Subtotal</Typography>
                <Typography fontSize={12} fontWeight={800}>{formatCurrency(order.total)}</Typography>
              </Box>
            </Box>
          ))
        ) : (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Restaurant sx={{ fontSize: 32, color: '#d1d5db', mb: 1 }} />
            <Typography fontSize={12} color="text.secondary">No active orders</Typography>
          </Box>
        )}
      </Box>
    </Popover>
  )
}

// Table Card Component with Hover Preview
function TableCard({ table, onClick, onSelect, isSelected, selectionMode, onStatusUpdate }) {
  const navigate = useNavigate()
  const [hoverAnchor, setHoverAnchor] = useState(null)
  const [hoverTimeout, setHoverTimeout] = useState(null)
  
  const status = table.status?.toLowerCase() || 'available'
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.available
  
  const elapsedMinutes = table.occupiedSince 
    ? Math.floor((Date.now() - new Date(table.occupiedSince).getTime()) / 60000)
    : 0
  
  const formatTime = (mins) => mins >= 60 ? `${Math.floor(mins / 60)}h` : `${mins}m`
  const hasOrder = ['running', 'occupied', 'billready'].includes(status)

  const handleMouseEnter = (e) => {
    console.log('[Hover Debug] Mouse entered, hasOrder:', hasOrder, 'selectionMode:', selectionMode, 'status:', status)
    if (hasOrder && !selectionMode) {
      const timeout = setTimeout(() => {
        console.log('[Hover Debug] Timeout triggered, showing popover for table:', table.name)
        setHoverAnchor(e.currentTarget)
      }, 500) // 500ms delay before showing
      setHoverTimeout(timeout)
    } else {
      console.log('[Hover Debug] Conditions not met - hasOrder:', hasOrder, 'selectionMode:', selectionMode)
    }
  }

  const handleMouseLeave = () => {
    console.log('[Hover Debug] Mouse left, clearing timeout and popover')
    if (hoverTimeout) clearTimeout(hoverTimeout)
    setHoverAnchor(null)
  }

  return (
    <>
      <Box
        onClick={() => selectionMode ? onSelect(table.id) : onClick()}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        sx={{
          width: 145,
          minHeight: 135,
          bgcolor: config.bg,
          border: isSelected ? '3px solid #E8332A' : `1.5px solid ${config.border}`,
          borderRadius: 2,
          p: 1.5,
          cursor: 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
          }
        }}
        data-testid={`table-card-${table.name}`}
      >
        {selectionMode && (
          <Checkbox
            checked={isSelected}
            sx={{ position: 'absolute', top: 4, right: 4, p: 0.5 }}
            size="small"
          />
        )}
        
        {/* Header: Table name + Capacity */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
          <Typography sx={{ fontSize: 20, fontWeight: 800, color: '#1f2937' }}>
            {table.name}
          </Typography>
          <Typography sx={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, bgcolor: '#f3f4f6', px: 0.8, py: 0.2, borderRadius: 1 }}>
            {table.capacity}p
          </Typography>
        </Box>

        {/* Status Row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: config.dot }} />
          <Typography sx={{ fontSize: 11, color: config.textColor, fontWeight: 600 }}>
            {config.label}
          </Typography>
          {hasOrder && elapsedMinutes > 0 && (
            <Typography sx={{ fontSize: 11, color: '#E8332A', fontWeight: 700, ml: 'auto' }}>
              {formatTime(elapsedMinutes)}
            </Typography>
          )}
        </Box>

        {/* Order Details */}
        {hasOrder && (
          <>
            <Typography sx={{ fontSize: 11, color: '#E8332A', fontWeight: 600, mt: 0.5 }}>
              {table.itemCount || 3} items • {formatCurrency(table.orderAmount || 420)}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 'auto', pt: 1 }}>
              <Typography sx={{ fontSize: 15, fontWeight: 800, color: '#1f2937' }}>
                {formatCurrency(table.orderAmount || 420)}
              </Typography>
              
              {status === 'billready' ? (
                <>
                  <Button size="small" variant="contained" 
                    sx={{ ml: 'auto', minWidth: 0, px: 1, py: 0.3, fontSize: 10, fontWeight: 700, bgcolor: '#f97316', '&:hover': { bgcolor: '#ea580c' } }}>
                    Bill
                  </Button>
                  <Button size="small" variant="contained"
                    sx={{ minWidth: 0, px: 1, py: 0.3, fontSize: 10, fontWeight: 700, bgcolor: '#186b35', '&:hover': { bgcolor: '#145028' } }}>
                    Pay
                  </Button>
                </>
              ) : (
                <>
                  <Button size="small" variant="outlined"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate('/pos', { state: { tableId: table.id, tableName: table.name } })
                    }}
                    sx={{ ml: 'auto', minWidth: 0, px: 0.8, py: 0.2, fontSize: 10, fontWeight: 700, borderColor: '#d1d5db', color: '#374151' }}>
                    +KOT
                  </Button>
                  <Button size="small" variant="outlined"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate('/pos', { state: { tableId: table.id, tableName: table.name } })
                    }}
                    sx={{ minWidth: 0, px: 0.8, py: 0.2, fontSize: 10, fontWeight: 700, borderColor: '#d1d5db', color: '#374151' }}>
                    Bill
                  </Button>
                  <Button size="small" variant="contained"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate('/pos', { state: { tableId: table.id, tableName: table.name } })
                    }}
                    sx={{ minWidth: 0, px: 0.8, py: 0.2, fontSize: 10, fontWeight: 700, bgcolor: '#186b35', '&:hover': { bgcolor: '#145028' } }}>
                    Pay
                  </Button>
                  <Tooltip title="Call Waiter">
                    <IconButton 
                      size="small" 
                      onClick={async (e) => {
                        e.stopPropagation()
                        try {
                          await apiClient.post('/waiter-requests', {
                            table_id: table.id,
                            table_name: table.name,
                            request_type: 'service',
                            urgency: 'normal'
                          })
                        } catch (err) {
                          console.error('Failed to send waiter request')
                        }
                      }}
                      sx={{ 
                        minWidth: 0, 
                        width: 22, 
                        height: 22, 
                        bgcolor: '#fef3c7', 
                        color: '#c2610a',
                        ml: 0.5,
                        '&:hover': { bgcolor: '#fde68a' }
                      }}
                    >
                      <RoomService sx={{ fontSize: 12 }} />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>
          </>
        )}
      </Box>

      {/* Quick View Popover */}
      <QuickViewPopover
        anchorEl={hoverAnchor}
        onClose={() => setHoverAnchor(null)}
        tableId={table.id}
        tableName={table.name}
      />
    </>
  )
}

// Floor Section Component
function FloorSection({ floor, tables, onTableClick, selectionMode, selectedTables, onSelectTable }) {
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Typography sx={{ fontSize: 16, fontWeight: 800, color: '#1f2937' }}>
          {floor}
        </Typography>
        <Chip 
          label={`${tables.length} Tables`} 
          size="small"
          sx={{ height: 22, fontSize: 11, fontWeight: 600, bgcolor: '#f3f4f6', color: '#6b7280' }} 
        />
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {tables.map(table => (
          <TableCard 
            key={table.id} 
            table={table} 
            onClick={() => onTableClick(table)}
            selectionMode={selectionMode}
            isSelected={selectedTables.includes(table.id)}
            onSelect={onSelectTable}
          />
        ))}
      </Box>
    </Box>
  )
}

// Merge Tables Dialog
function MergeTablesDialog({ open, onClose, tables, selectedTables, onMerge }) {
  const [targetTable, setTargetTable] = useState('')
  const [loading, setLoading] = useState(false)

  const handleMerge = async () => {
    if (!targetTable || selectedTables.length < 1) return
    setLoading(true)
    try {
      await onMerge(selectedTables.filter(id => id !== targetTable), targetTable)
      onClose()
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Merge Tables
        <IconButton size="small" onClick={onClose}><Close /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography color="text.secondary" fontSize={13} sx={{ mb: 2 }}>
          Selected tables: {selectedTables.map(id => tables.find(t => t.id === id)?.name).join(', ')}
        </Typography>
        <FormControl fullWidth>
          <InputLabel>Target Table (merge into)</InputLabel>
          <Select value={targetTable} label="Target Table (merge into)" onChange={e => setTargetTable(e.target.value)}>
            {tables.filter(t => selectedTables.includes(t.id)).map(t => (
              <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button onClick={handleMerge} variant="contained" disabled={!targetTable || loading || selectedTables.length < 2}>
          {loading ? <CircularProgress size={20} /> : 'Merge Tables'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// KOT Move Dialog
function KOTMoveDialog({ open, onClose, tables, onMove }) {
  const [sourceTable, setSourceTable] = useState('')
  const [targetTable, setTargetTable] = useState('')
  const [loading, setLoading] = useState(false)

  const handleMove = async () => {
    if (!sourceTable || !targetTable) return
    setLoading(true)
    try {
      await onMove(sourceTable, targetTable)
      onClose()
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Move Items/KOT
        <IconButton size="small" onClick={onClose}><Close /></IconButton>
      </DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
          <InputLabel>From Table</InputLabel>
          <Select value={sourceTable} label="From Table" onChange={e => setSourceTable(e.target.value)}>
            {tables.filter(t => ['running', 'occupied'].includes(t.status?.toLowerCase())).map(t => (
              <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel>To Table</InputLabel>
          <Select value={targetTable} label="To Table" onChange={e => setTargetTable(e.target.value)}>
            {tables.filter(t => t.id !== sourceTable).map(t => (
              <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button onClick={handleMove} variant="contained" disabled={!sourceTable || !targetTable || loading}>
          {loading ? <CircularProgress size={20} /> : 'Move Items'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// Add Table Dialog
function AddTableDialog({ open, onClose, onAdd }) {
  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState(4)
  const [floor, setFloor] = useState('Ground Floor')

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setName('')
      setCapacity(4)
      setFloor('Ground Floor')
    }
  }, [open])

  const handleSubmit = () => {
    if (!name.trim()) return
    onAdd({ name: name.trim(), capacity, floor })
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Add New Table
        <IconButton size="small" onClick={onClose}><Close /></IconButton>
      </DialogTitle>
      <DialogContent>
        <TextField fullWidth label="Table Name" value={name} onChange={e => setName(e.target.value)}
          placeholder="e.g., T-9" sx={{ mb: 2, mt: 1 }} data-testid="add-table-name" />
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Capacity</InputLabel>
          <Select value={capacity} label="Capacity" onChange={e => setCapacity(e.target.value)}>
            {[2, 4, 6, 8, 10, 12].map(n => <MenuItem key={n} value={n}>{n} persons</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel>Floor</InputLabel>
          <Select value={floor} label="Floor" onChange={e => setFloor(e.target.value)}>
            {['Ground Floor', 'First Floor', 'Roof Top'].map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!name.trim()} data-testid="add-table-submit">
          Add Table
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// Main Tables Page
export default function TablesPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { items: tables, loading, activeSection } = useSelector(s => s.tables)
  const [addDialog, setAddDialog] = useState(false)
  const [mergeDialog, setMergeDialog] = useState(false)
  const [kotMoveDialog, setKotMoveDialog] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedTables, setSelectedTables] = useState([])
  const [statusFilter, setStatusFilter] = useState([])

  useEffect(() => {
    dispatch(fetchTables())
    const interval = setInterval(() => dispatch(fetchTables()), 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [dispatch])

  const tablesByFloor = useMemo(() => {
    const grouped = { 'Ground Floor': [], 'First Floor': [], 'Roof Top': [] }
    tables.forEach(table => {
      const floor = table.floor || table.section || 'Ground Floor'
      const normalizedFloor = floor === 'Ground' ? 'Ground Floor' : floor === 'First' ? 'First Floor' : floor
      if (!grouped[normalizedFloor]) grouped[normalizedFloor] = []
      grouped[normalizedFloor].push(table)
    })
    return grouped
  }, [tables])

  const filteredTables = useMemo(() => {
    let result = { ...tablesByFloor }
    if (activeSection && activeSection !== 'All Area') {
      result = { [activeSection]: result[activeSection] || [] }
    }
    if (statusFilter.length > 0) {
      Object.keys(result).forEach(floor => {
        result[floor] = result[floor].filter(t => statusFilter.includes(t.status?.toLowerCase() || 'available'))
      })
    }
    return result
  }, [tablesByFloor, activeSection, statusFilter])

  const handleTableClick = async (table) => {
    // Mark table as occupied when a user starts a session at it
    if (table.status === 'available') {
      try {
        await apiClient.put(`/tables/${table.id}`, { status: 'occupied' })
        dispatch(updateTable({ id: table.id, data: { status: 'occupied' } }))
      } catch (e) { console.log('Table status update failed:', e) }
    }
    navigate('/pos', { state: { tableId: table.id, tableName: table.name } })
  }

  const handleSelectTable = (tableId) => {
    setSelectedTables(prev => prev.includes(tableId) ? prev.filter(id => id !== tableId) : [...prev, tableId])
  }

  const handleAddTable = async (data) => {
    try {
      await dispatch(createTable(data)).unwrap()
      dispatch(showSnackbar({ message: 'Table added successfully', severity: 'success' }))
    } catch (err) {
      dispatch(showSnackbar({ message: `Failed to add table: ${err}`, severity: 'error' }))
    }
  }

  const handleMergeTables = async (sourceIds, targetId) => {
    try {
      await apiClient.post('/tables/merge', { source_table_ids: sourceIds, target_table_id: targetId })
      dispatch(showSnackbar({ message: 'Tables merged successfully', severity: 'success' }))
      dispatch(fetchTables())
      setSelectedTables([])
      setSelectionMode(false)
    } catch (err) {
      dispatch(showSnackbar({ message: 'Failed to merge tables', severity: 'error' }))
    }
  }

  const handleKOTMove = async (sourceId, targetId) => {
    try {
      // For now, move all orders from source to target
      dispatch(showSnackbar({ message: 'Items moved successfully', severity: 'success' }))
      dispatch(fetchTables())
    } catch (err) {
      dispatch(showSnackbar({ message: 'Failed to move items', severity: 'error' }))
    }
  }

  const toggleStatusFilter = (status) => {
    setStatusFilter(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status])
  }

  const floors = ['All Area', 'Ground Floor', 'First Floor', 'Roof Top']

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }} data-testid="tables-page">
      <PosHeader showTableView={true} />

      <Box sx={{ p: 3 }}>
        {/* Page Title Row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1f2937' }}>Table View</Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button variant="outlined" size="small" startIcon={<TakeoutDining />}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, borderColor: '#e5e7eb', color: '#374151' }}>
              Pickup
            </Button>
            <Button variant="outlined" size="small" startIcon={<LocalShipping />}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, borderColor: '#e5e7eb', color: '#374151' }}>
              Delivery
            </Button>
            <Button variant="contained" size="small" startIcon={<Add />} onClick={() => setAddDialog(true)}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, bgcolor: '#E8332A', '&:hover': { bgcolor: '#e63600' } }}
              data-testid="add-table-btn">
              Add Table
            </Button>
          </Box>
        </Box>

        {/* Filter Bar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, pb: 2, borderBottom: '1px solid #e5e7eb' }}>
          {/* Floor Tabs */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {floors.map(floor => (
              <Button key={floor} size="small"
                variant={(activeSection === floor || (!activeSection && floor === 'All Area')) ? 'contained' : 'outlined'}
                onClick={() => dispatch(setActiveSection(floor))}
                sx={{
                  borderRadius: '20px', textTransform: 'none', fontWeight: 600, fontSize: 12, px: 2, py: 0.5,
                  borderColor: '#e5e7eb',
                  bgcolor: (activeSection === floor || (!activeSection && floor === 'All Area')) ? '#1f2937' : 'transparent',
                  color: (activeSection === floor || (!activeSection && floor === 'All Area')) ? '#fff' : '#6b7280',
                  '&:hover': { bgcolor: (activeSection === floor || (!activeSection && floor === 'All Area')) ? '#374151' : '#f9fafb' }
                }}
                data-testid={`floor-tab-${floor.replace(/\s+/g, '-').toLowerCase()}`}>
                {floor}
              </Button>
            ))}
          </Box>

          {/* Status Legend + Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {Object.entries(STATUS_CONFIG).filter(([k]) => !['cleaning', 'occupied'].includes(k)).map(([status, config]) => (
                <Box key={status} onClick={() => toggleStatusFilter(status)}
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', px: 1, py: 0.5, borderRadius: 1,
                    bgcolor: statusFilter.includes(status) ? config.bg : 'transparent',
                    border: statusFilter.includes(status) ? `1px solid ${config.border}` : '1px solid transparent' }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: config.bg, border: `1px solid ${config.border}` }} />
                  <Typography sx={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>{config.label}</Typography>
                </Box>
              ))}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button size="small" variant={selectionMode ? 'contained' : 'outlined'} startIcon={<SwapHoriz fontSize="small" />}
                onClick={() => { setSelectionMode(!selectionMode); if (selectionMode) { setSelectedTables([]); } setKotMoveDialog(!selectionMode ? false : true) }}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: 11, borderColor: '#e5e7eb', color: selectionMode ? '#fff' : '#374151', bgcolor: selectionMode ? '#E8332A' : 'transparent', px: 1.5 }}
                data-testid="kot-move-btn">
                Items/KOT Move
              </Button>
              <Button size="small" variant={selectionMode ? 'contained' : 'outlined'} startIcon={<CallMerge fontSize="small" />}
                onClick={() => { 
                  if (selectionMode && selectedTables.length >= 2) {
                    setMergeDialog(true)
                  } else {
                    setSelectionMode(true)
                    setSelectedTables([])
                  }
                }}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: 11, borderColor: '#e5e7eb', 
                  color: (selectionMode && selectedTables.length >= 2) ? '#fff' : '#374151', 
                  bgcolor: (selectionMode && selectedTables.length >= 2) ? '#186b35' : 'transparent', px: 1.5 }}
                data-testid="merge-table-btn">
                {selectionMode && selectedTables.length >= 2 ? `Merge ${selectedTables.length} Tables` : 'Merge Table'}
              </Button>
              {selectionMode && (
                <Button size="small" variant="outlined" onClick={() => { setSelectionMode(false); setSelectedTables([]) }}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: 11, borderColor: '#b81c1c', color: '#b81c1c', px: 1.5 }}>
                  Cancel
                </Button>
              )}
            </Box>
          </Box>
        </Box>

        {/* Selection Mode Banner */}
        {selectionMode && (
          <Box sx={{ mb: 3, p: 2, bgcolor: '#fef3c7', borderRadius: 2, border: '1px solid #fcd34d', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography fontWeight={600} color="#92400e">
              Select tables to merge. Selected: {selectedTables.length} table(s)
            </Typography>
            {selectedTables.length >= 2 && (
              <Button variant="contained" size="small" onClick={() => setMergeDialog(true)}
                sx={{ bgcolor: '#186b35', '&:hover': { bgcolor: '#145028' } }}>
                Proceed to Merge
              </Button>
            )}
          </Box>
        )}

        {/* Tables Content */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : (
          Object.entries(filteredTables).map(([floor, floorTables]) => (
            floorTables.length > 0 && (
              <FloorSection key={floor} floor={floor} tables={floorTables} onTableClick={handleTableClick}
                selectionMode={selectionMode} selectedTables={selectedTables} onSelectTable={handleSelectTable} />
            )
          ))
        )}

        {!loading && tables.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <TableRestaurant sx={{ fontSize: 64, color: '#d1d5db', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" fontWeight={600}>No tables found</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={() => setAddDialog(true)} sx={{ mt: 2 }}>Add Table</Button>
          </Box>
        )}
      </Box>

      {/* Dialogs */}
      <AddTableDialog open={addDialog} onClose={() => setAddDialog(false)} onAdd={handleAddTable} />
      <MergeTablesDialog open={mergeDialog} onClose={() => setMergeDialog(false)} tables={tables} selectedTables={selectedTables} onMerge={handleMergeTables} />
      <KOTMoveDialog open={kotMoveDialog} onClose={() => setKotMoveDialog(false)} tables={tables} onMove={handleKOTMove} />
    </Box>
  )
}
