import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Tooltip, TextField, Select,
  MenuItem, FormControl, TablePagination, CircularProgress, Button,
  InputAdornment, Grid, Dialog, DialogTitle, DialogContent, DialogActions, Divider,
} from '@mui/material'
import { Search, Visibility, CheckCircle, Cancel, Receipt, LocalShipping, TableRestaurant, TakeoutDining } from '@mui/icons-material'
import { fetchOrders, updateOrderStatus } from '../../features/ordersSlice'
import { showSnackbar, addActivityLog } from '../../features/uiSlice'
import { useDebounce } from '../../hooks/useDebounce'
import StatusChip from '../../components/common/StatusChip'
import StatCard from '../../components/common/StatCard'
import { formatCurrency, formatDateTime } from '../../utils/formatters'

const ORDER_TYPE_ICONS = { dine: <TableRestaurant sx={{ fontSize: 15 }} />, pickup: <TakeoutDining sx={{ fontSize: 15 }} />, delivery: <LocalShipping sx={{ fontSize: 15 }} /> }
const STATUS_FLOW = { pending: 'confirmed', confirmed: 'preparing', preparing: 'ready', ready: 'completed' }

function OrderDetailDialog({ order, open, onClose, onStatusChange }) {
  if (!order) return null
  const nextStatus = STATUS_FLOW[order.status]
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 800, pb: 1 }}>
        <span>{order.orderNumber}</span>
        <StatusChip status={order.status} />
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {[
            { label: 'Type', value: order.type?.charAt(0).toUpperCase() + order.type?.slice(1) },
            { label: 'Table', value: order.table || '—' },
            { label: 'Payment', value: order.paymentMethod?.toUpperCase() || 'Pending' },
            { label: 'Time', value: formatDateTime(order.createdAt) },
          ].map(({ label, value }) => (
            <Box key={label} sx={{ flex: '1 1 120px', p: 1.5, bgcolor: 'action.hover', borderRadius: 1.5 }}>
              <Typography fontSize={10.5} fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</Typography>
              <Typography fontWeight={700} fontSize={13}>{value}</Typography>
            </Box>
          ))}
        </Box>
        <Typography fontWeight={700} fontSize={13} sx={{ mb: 1.5 }}>Items ({order.items?.length})</Typography>
        {order.items?.map((item, i) => (
          <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box>
              <Typography fontWeight={600} fontSize={13}>{item.name}</Typography>
              <Typography fontSize={12} color="text.secondary">{formatCurrency(item.price)} × {item.qty}</Typography>
            </Box>
            <Typography fontWeight={700} fontSize={13}>{formatCurrency(item.price * item.qty)}</Typography>
          </Box>
        ))}
        <Box sx={{ mt: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1.5 }}>
          {[
            ['Subtotal', formatCurrency(order.subtotal)],
            ['Tax', formatCurrency(order.tax)],
          ].map(([k, v]) => (
            <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography fontSize={13} color="text.secondary">{k}</Typography>
              <Typography fontSize={13}>{v}</Typography>
            </Box>
          ))}
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography fontWeight={800} fontSize={15}>Total</Typography>
            <Typography fontWeight={800} fontSize={15} color="primary.main">{formatCurrency(order.total)}</Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">Close</Button>
        {nextStatus && (
          <Button onClick={() => { onStatusChange(order.id, nextStatus); onClose() }} variant="contained" startIcon={<CheckCircle />}>
            Mark as {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
          </Button>
        )}
        {order.status !== 'cancelled' && order.status !== 'completed' && (
          <Button onClick={() => { onStatusChange(order.id, 'cancelled'); onClose() }} variant="outlined" color="error" startIcon={<Cancel />}>Cancel</Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default function OrdersPage() {
  const dispatch = useDispatch()
  const { items: orders, loading } = useSelector(s => s.orders)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const debouncedSearch = useDebounce(search)

  useEffect(() => { dispatch(fetchOrders()) }, [dispatch])

  const filtered = orders.filter(o => {
    const q = debouncedSearch.toLowerCase()
    const mq = !q || o.orderNumber?.toLowerCase().includes(q) || o.table?.toLowerCase().includes(q)
    return mq && (!statusFilter || o.status === statusFilter) && (!typeFilter || o.type === typeFilter)
  })

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const handleStatusChange = (id, status) => {
    dispatch(updateOrderStatus({ id, status }))
    dispatch(showSnackbar({ message: `Order marked as ${status}`, severity: 'success' }))
    dispatch(addActivityLog({ action: 'ORDER_STATUS_CHANGED', description: `Order ${id} → ${status}`, module: 'Orders' }))
  }

  const stats = [
    { title: 'Total Orders', value: orders.length, icon: <Receipt />, color: '#FF3D01' },
    { title: 'Pending', value: orders.filter(o => o.status === 'pending').length, icon: <Receipt />, color: '#7a5a00' },
    { title: 'Preparing', value: orders.filter(o => o.status === 'preparing').length, icon: <Receipt />, color: '#1a4fcc' },
    { title: 'Completed', value: orders.filter(o => o.status === 'completed').length, icon: <CheckCircle />, color: '#186b35' },
  ]

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={800}>Orders & KOT</Typography>
        <Typography color="text.secondary" fontSize={13}>Track and manage all restaurant orders</Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.map((s, i) => <Grid item xs={6} sm={3} key={i}><StatCard {...s} /></Grid>)}
      </Grid>

      <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField size="small" placeholder="Search orders…" value={search} onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }}
          sx={{ flex: '1 1 220px' }} />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select value={statusFilter} displayEmpty onChange={e => setStatusFilter(e.target.value)}>
            <MenuItem value="">All Status</MenuItem>
            {['pending','confirmed','preparing','ready','completed','cancelled'].map(s => <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <Select value={typeFilter} displayEmpty onChange={e => setTypeFilter(e.target.value)}>
            <MenuItem value="">All Types</MenuItem>
            <MenuItem value="dine">Dine In</MenuItem>
            <MenuItem value="pickup">Pickup</MenuItem>
            <MenuItem value="delivery">Delivery</MenuItem>
          </Select>
        </FormControl>
        <Typography color="text.secondary" fontSize={12} sx={{ ml: 'auto' }}>{filtered.length} orders</Typography>
      </Paper>

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell>Order #</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Time</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><CircularProgress size={32} /></TableCell></TableRow>
              ) : paginated.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.disabled', fontWeight: 600 }}>No orders found</TableCell></TableRow>
              ) : paginated.map(order => (
                <TableRow key={order.id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelectedOrder(order)}>
                  <TableCell><Typography fontWeight={700} fontSize={13.5} color="primary.main">{order.orderNumber}</Typography></TableCell>
                  <TableCell>
                    <Chip icon={ORDER_TYPE_ICONS[order.type]} label={order.type?.charAt(0).toUpperCase() + order.type?.slice(1)}
                      size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: 11 }} />
                  </TableCell>
                  <TableCell>
                    <Typography fontSize={12.5} color="text.secondary" noWrap sx={{ maxWidth: 180 }}>
                      {order.items?.slice(0,2).map(i => i.name).join(', ')}{order.items?.length > 2 ? ` +${order.items.length - 2}` : ''}
                    </Typography>
                  </TableCell>
                  <TableCell><Typography fontWeight={700} color="primary.main">{formatCurrency(order.total)}</Typography></TableCell>
                  <TableCell>
                    <Chip label={order.paymentMethod?.toUpperCase() || 'PENDING'} size="small"
                      sx={{ fontSize: 10, fontWeight: 800, bgcolor: order.paymentMethod ? 'success.light' : 'warning.light', color: order.paymentMethod ? 'success.dark' : 'warning.dark' }} />
                  </TableCell>
                  <TableCell onClick={e => e.stopPropagation()}><StatusChip status={order.status} /></TableCell>
                  <TableCell><Typography fontSize={12} color="text.secondary">{formatDateTime(order.createdAt)}</Typography></TableCell>
                  <TableCell align="right" onClick={e => e.stopPropagation()}>
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => setSelectedOrder(order)} sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={filtered.length} page={page} rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={e => { setRowsPerPage(+e.target.value); setPage(0) }}
          rowsPerPageOptions={[5, 10, 25, 50]} sx={{ borderTop: '1px solid', borderColor: 'divider' }} />
      </Paper>

      <OrderDetailDialog order={selectedOrder} open={Boolean(selectedOrder)} onClose={() => setSelectedOrder(null)} onStatusChange={handleStatusChange} />
    </Box>
  )
}
