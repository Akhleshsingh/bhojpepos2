import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box, Typography, Button, TextField, MenuItem, Select, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Avatar, Chip, IconButton, Tooltip, InputAdornment, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, TablePagination, CircularProgress,
} from '@mui/material'
import { Add, Search, Edit, Delete, People, TrendingUp, Group, LocalDining } from '@mui/icons-material'
import { useDispatch as useRDispatch } from 'react-redux'
import { fetchStaff, createStaff, updateStaff, deleteStaff } from '../../features/staffSlice'
import { showSnackbar, showConfirmDialog, addActivityLog } from '../../features/uiSlice'
import { usePermission } from '../../hooks/usePermission'
import { useDebounce } from '../../hooks/useDebounce'
import StatusChip from '../../components/common/StatusChip'
import StatCard from '../../components/common/StatCard'
import { getInitials, formatCurrency, formatDate } from '../../utils/formatters'
import { ROLES, SHIFTS } from '../../utils/constants'

const ROLE_COLORS = { Manager: '#E8332A', Waiter: '#1a4fcc', Chef: '#7e22ce', Cashier: '#7a5a00', Captain: '#186b35' }
const emptyForm = { name: '', email: '', phone: '', role: 'Waiter', shift: 'Morning', salary: '', status: 'active', color: '#1a4fcc' }

function StaffFormDialog({ open, onClose, editData, onSave }) {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    setForm(editData ? { ...emptyForm, ...editData } : emptyForm)
    setErrors({})
  }, [editData, open])

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.phone.trim()) e.phone = 'Phone is required'
    if (!form.role) e.role = 'Role is required'
    if (!form.salary || isNaN(form.salary)) e.salary = 'Valid salary required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => { if (validate()) onSave(form) }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>{editData ? 'Edit Staff Member' : 'Add New Staff'}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid item xs={12}>
            <TextField fullWidth label="Full Name *" value={form.name} onChange={e => set('name', e.target.value)} error={!!errors.name} helperText={errors.name} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Email" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Phone *" value={form.phone} onChange={e => set('phone', e.target.value)} error={!!errors.phone} helperText={errors.phone} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Role *</InputLabel>
              <Select value={form.role} label="Role *" onChange={e => { set('role', e.target.value); set('color', ROLE_COLORS[e.target.value] || '#1a4fcc') }}>
                {ROLES.filter(r => r !== 'admin').map(r => <MenuItem key={r} value={r} sx={{ textTransform: 'capitalize' }}>{r.charAt(0).toUpperCase() + r.slice(1)}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Shift</InputLabel>
              <Select value={form.shift} label="Shift" onChange={e => set('shift', e.target.value)}>
                {SHIFTS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Monthly Salary (₹) *" type="number" value={form.salary} onChange={e => set('salary', e.target.value)} error={!!errors.salary} helperText={errors.salary} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select value={form.status} label="Status" onChange={e => set('status', e.target.value)}>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} color="inherit" variant="outlined" sx={{ flex: 1 }}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" sx={{ flex: 1 }}>{editData ? 'Update' : 'Add Staff'}</Button>
      </DialogActions>
    </Dialog>
  )
}

export default function StaffPage() {
  const dispatch = useDispatch()
  const { items: staff, loading } = useSelector(s => s.staff)
  const canEdit = usePermission('staff.edit')

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editData, setEditData] = useState(null)

  const debouncedSearch = useDebounce(search)

  useEffect(() => { dispatch(fetchStaff()) }, [dispatch])

  const filtered = staff.filter(s => {
    const q = debouncedSearch.toLowerCase()
    const mq = !q || s.name.toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q) || s.phone.includes(q)
    const mr = !roleFilter || s.role === roleFilter
    const ms = !statusFilter || s.status === statusFilter
    return mq && mr && ms
  })

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const handleSave = async (form) => {
    if (editData) {
      await dispatch(updateStaff({ id: editData.id, data: form }))
      dispatch(showSnackbar({ message: `${form.name} updated successfully`, severity: 'success' }))
      dispatch(addActivityLog({ action: 'STAFF_UPDATED', description: `Updated staff: ${form.name}`, module: 'Staff' }))
    } else {
      await dispatch(createStaff(form))
      dispatch(showSnackbar({ message: `${form.name} added to staff`, severity: 'success' }))
      dispatch(addActivityLog({ action: 'STAFF_CREATED', description: `Added staff: ${form.name} (${form.role})`, module: 'Staff' }))
    }
    setDialogOpen(false)
  }

  const handleDelete = (member) => {
    dispatch(showConfirmDialog({
      title: 'Remove Staff Member',
      message: `Remove "${member.name}" from staff? This action cannot be undone.`,
      onConfirm: async () => {
        await dispatch(deleteStaff(member.id))
        dispatch(showSnackbar({ message: `${member.name} removed`, severity: 'success' }))
        dispatch(addActivityLog({ action: 'STAFF_DELETED', description: `Removed staff: ${member.name}`, module: 'Staff' }))
      },
    }))
  }

  const stats = [
    { title: 'Total Staff', value: staff.length, icon: <Group />, color: '#1a4fcc' },
    { title: 'Active', value: staff.filter(s => s.status === 'active').length, icon: <People />, color: '#186b35' },
    { title: 'Waiters', value: staff.filter(s => s.role === 'Waiter').length, icon: <TrendingUp />, color: '#7a5a00' },
    { title: 'Chefs', value: staff.filter(s => s.role === 'Chef').length, icon: <LocalDining />, color: '#7e22ce' },
  ]

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Staff Management</Typography>
          <Typography color="text.secondary" fontSize={13}>Manage your restaurant team, roles and shifts</Typography>
        </Box>
        {canEdit && (
          <Button variant="contained" startIcon={<Add />} onClick={() => { setEditData(null); setDialogOpen(true) }}
            sx={{ boxShadow: '0 2px 10px rgba(255,61,1,0.3)' }}>
            Add Staff
          </Button>
        )}
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.map((s, i) => <Grid item xs={6} sm={3} key={i}><StatCard {...s} /></Grid>)}
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField size="small" placeholder="Search staff…" value={search} onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }}
          sx={{ flex: '1 1 220px' }} />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select value={roleFilter} displayEmpty onChange={e => setRoleFilter(e.target.value)}>
            <MenuItem value="">All Roles</MenuItem>
            {ROLES.filter(r => r !== 'admin').map(r => <MenuItem key={r} value={r.charAt(0).toUpperCase() + r.slice(1)}>{r.charAt(0).toUpperCase() + r.slice(1)}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <Select value={statusFilter} displayEmpty onChange={e => setStatusFilter(e.target.value)}>
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
        <Typography color="text.secondary" fontSize={12} sx={{ ml: 'auto' }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </Typography>
      </Paper>

      {/* Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell>Staff Member</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Shift</TableCell>
                <TableCell>Salary</TableCell>
                <TableCell>Orders</TableCell>
                <TableCell>Status</TableCell>
                {canEdit && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><CircularProgress size={32} /></TableCell></TableRow>
              ) : paginated.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.disabled', fontWeight: 600 }}>No staff found</TableCell></TableRow>
              ) : paginated.map(member => (
                <TableRow key={member.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 38, height: 38, bgcolor: member.color || '#E8332A', fontSize: 13, fontWeight: 800 }}>
                        {getInitials(member.name)}
                      </Avatar>
                      <Box>
                        <Typography fontWeight={700} fontSize={13.5}>{member.name}</Typography>
                        <Typography color="text.secondary" fontSize={11.5}>{member.shift} Shift</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography fontSize={13} color="text.secondary">{member.email || '—'}</Typography>
                    <Typography fontSize={13} fontWeight={600}>{member.phone}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={member.role} size="small"
                      sx={{ fontWeight: 700, fontSize: 11, bgcolor: `${ROLE_COLORS[member.role] || '#888'}18`, color: ROLE_COLORS[member.role] || '#888', border: `1px solid ${ROLE_COLORS[member.role] || '#888'}30` }} />
                  </TableCell>
                  <TableCell><Typography fontSize={13}>{member.shift}</Typography></TableCell>
                  <TableCell><Typography fontWeight={700} fontSize={13}>{formatCurrency(member.salary)}</Typography></TableCell>
                  <TableCell>
                    <Chip label={`${member.orders || 0} orders`} size="small" variant="outlined"
                      color={member.orders > 0 ? 'info' : 'default'} sx={{ fontWeight: 700, fontSize: 11 }} />
                  </TableCell>
                  <TableCell><StatusChip status={member.status} /></TableCell>
                  {canEdit && (
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => { setEditData(member); setDialogOpen(true) }}
                            sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'rgba(255,61,1,0.06)' } }}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove">
                          <IconButton size="small" onClick={() => handleDelete(member)}
                            sx={{ color: 'error.light', '&:hover': { color: 'error.main', bgcolor: 'rgba(184,28,28,0.06)' } }}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div" count={filtered.length} page={page} rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => setPage(p)} onRowsPerPageChange={e => { setRowsPerPage(+e.target.value); setPage(0) }}
          rowsPerPageOptions={[5, 10, 25]} sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        />
      </Paper>

      <StaffFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} editData={editData} onSave={handleSave} />
    </Box>
  )
}
