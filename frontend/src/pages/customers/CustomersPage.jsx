import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box, Typography, Button, TextField, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Tooltip, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, TablePagination,
  CircularProgress, Avatar, Chip,
} from '@mui/material'
import { Add, Search, Edit, Delete, People, Star, TrendingUp, ShoppingCart } from '@mui/icons-material'
import { fetchCustomers, createCustomer, updateCustomer, deleteCustomer } from '../../features/customersSlice'
import { showSnackbar, showConfirmDialog, addActivityLog } from '../../features/uiSlice'
import { usePermission } from '../../hooks/usePermission'
import { useDebounce } from '../../hooks/useDebounce'
import StatCard from '../../components/common/StatCard'
import { getInitials, formatCurrency, formatDate } from '../../utils/formatters'

const emptyForm = { name: '', email: '', phone: '', address: '', notes: '' }

function CustomerFormDialog({ open, onClose, editData, onSave }) {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  useEffect(() => { setForm(editData ? { ...emptyForm, ...editData } : emptyForm); setErrors({}) }, [editData, open])
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }
  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name required'
    if (!form.phone.trim()) e.phone = 'Phone required'
    setErrors(e); return Object.keys(e).length === 0
  }
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>{editData ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid item xs={12}><TextField fullWidth label="Full Name *" value={form.name} onChange={e => set('name', e.target.value)} error={!!errors.name} helperText={errors.name} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Phone *" value={form.phone} onChange={e => set('phone', e.target.value)} error={!!errors.phone} helperText={errors.phone} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Email" value={form.email} onChange={e => set('email', e.target.value)} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Address" value={form.address} onChange={e => set('address', e.target.value)} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="Notes" multiline rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" color="inherit" sx={{ flex: 1 }}>Cancel</Button>
        <Button onClick={() => { if (validate()) onSave(form) }} variant="contained" sx={{ flex: 1 }}>{editData ? 'Update' : 'Add Customer'}</Button>
      </DialogActions>
    </Dialog>
  )
}

const AVATAR_COLORS = ['#FF3D01','#1a4fcc','#186b35','#7a5a00','#7e22ce','#c2610a','#b81c1c']

export default function CustomersPage() {
  const dispatch = useDispatch()
  const { items: customers, loading } = useSelector(s => s.customers)
  const canEdit = usePermission('customers.view')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  const debouncedSearch = useDebounce(search)

  useEffect(() => { dispatch(fetchCustomers()) }, [dispatch])

  const filtered = customers.filter(c => {
    const q = debouncedSearch.toLowerCase()
    return !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.email || '').toLowerCase().includes(q)
  })

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const handleSave = async (form) => {
    if (editData) {
      await dispatch(updateCustomer({ id: editData.id, data: form }))
      dispatch(showSnackbar({ message: `${form.name} updated`, severity: 'success' }))
    } else {
      await dispatch(createCustomer(form))
      dispatch(showSnackbar({ message: `${form.name} added`, severity: 'success' }))
    }
    dispatch(addActivityLog({ action: editData ? 'CUSTOMER_UPDATED' : 'CUSTOMER_CREATED', description: `${editData ? 'Updated' : 'Added'} customer: ${form.name}`, module: 'Customers' }))
    setDialogOpen(false)
  }

  const handleDelete = (c) => {
    dispatch(showConfirmDialog({
      title: 'Delete Customer', message: `Delete "${c.name}"? All associated data will be lost.`,
      onConfirm: () => { dispatch(deleteCustomer(c.id)); dispatch(showSnackbar({ message: `${c.name} deleted`, severity: 'success' })) },
    }))
  }

  const totalSpent = customers.reduce((s, c) => s + (c.totalSpent || 0), 0)
  const totalOrders = customers.reduce((s, c) => s + (c.orders || 0), 0)
  const vipCount = customers.filter(c => (c.orders || 0) >= 10).length

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Customers</Typography>
          <Typography color="text.secondary" fontSize={13}>Manage your customer database and loyalty</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setEditData(null); setDialogOpen(true) }}
          sx={{ boxShadow: '0 2px 10px rgba(255,61,1,0.3)' }}>Add Customer</Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { title: 'Total Customers', value: customers.length, icon: <People />, color: '#1a4fcc' },
          { title: 'Total Orders', value: totalOrders, icon: <ShoppingCart />, color: '#FF3D01' },
          { title: 'Total Revenue', value: formatCurrency(totalSpent), icon: <TrendingUp />, color: '#186b35' },
          { title: 'VIP Customers', value: vipCount, icon: <Star />, color: '#7a5a00' },
        ].map((s, i) => <Grid item xs={6} sm={3} key={i}><StatCard {...s} /></Grid>)}
      </Grid>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <TextField size="small" placeholder="Search customers…" value={search} onChange={e => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }}
            sx={{ flex: '1 1 260px', maxWidth: 360 }} />
          <Typography color="text.secondary" fontSize={12} sx={{ ml: 'auto' }}>{filtered.length} customer{filtered.length !== 1 ? 's' : ''}</Typography>
        </Box>
      </Paper>

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell>Customer</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Orders</TableCell>
                <TableCell>Total Spent</TableCell>
                <TableCell>Last Visit</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><CircularProgress size={32} /></TableCell></TableRow>
              ) : paginated.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.disabled', fontWeight: 600 }}>No customers found</TableCell></TableRow>
              ) : paginated.map((c, idx) => (
                <TableRow key={c.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 36, height: 36, bgcolor: AVATAR_COLORS[idx % AVATAR_COLORS.length], fontSize: 13, fontWeight: 800 }}>{getInitials(c.name)}</Avatar>
                      <Box>
                        <Typography fontWeight={700} fontSize={13.5}>{c.name}</Typography>
                        {(c.orders || 0) >= 10 && <Chip label="VIP" size="small" sx={{ fontSize: 9, fontWeight: 800, height: 16, bgcolor: '#7a5a0015', color: '#7a5a00', border: '1px solid #7a5a0030' }} />}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell><Typography fontWeight={600} fontSize={13}>{c.phone}</Typography></TableCell>
                  <TableCell><Typography fontSize={13} color="text.secondary">{c.email || '—'}</Typography></TableCell>
                  <TableCell>
                    <Chip label={`${c.orders || 0} orders`} size="small" variant="outlined" color={(c.orders || 0) > 0 ? 'info' : 'default'} sx={{ fontWeight: 700, fontSize: 11 }} />
                  </TableCell>
                  <TableCell><Typography fontWeight={700} fontSize={13} color="primary.main">{formatCurrency(c.totalSpent || 0)}</Typography></TableCell>
                  <TableCell><Typography fontSize={12.5} color="text.secondary">{formatDate(c.lastVisit)}</Typography></TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditData(c); setDialogOpen(true) }} sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}><Edit fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(c)} sx={{ color: 'error.light', '&:hover': { color: 'error.main' } }}><Delete fontSize="small" /></IconButton></Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={filtered.length} page={page} rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={e => { setRowsPerPage(+e.target.value); setPage(0) }}
          rowsPerPageOptions={[5, 10, 25]} sx={{ borderTop: '1px solid', borderColor: 'divider' }} />
      </Paper>

      <CustomerFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} editData={editData} onSave={handleSave} />
    </Box>
  )
}
