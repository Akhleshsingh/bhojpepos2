import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box, Typography, Button, TextField, Paper, Grid, Card, CardContent,
  Chip, IconButton, Tooltip, InputAdornment, Dialog, DialogTitle,
  DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel,
  CircularProgress, Avatar, Divider,
} from '@mui/material'
import { Add, Search, Edit, Delete, BookOnline, People, Check, Schedule, EventSeat } from '@mui/icons-material'
import { fetchReservations, createReservation, updateReservation, deleteReservation } from '../../features/reservationsSlice'
import { showSnackbar, showConfirmDialog, addActivityLog } from '../../features/uiSlice'
import { useDebounce } from '../../hooks/useDebounce'
import StatCard from '../../components/common/StatCard'
import { formatDate } from '../../utils/formatters'
import { TABLES } from '../../utils/constants'

const STATUS_STYLES = {
  pending: { bgcolor: '#fef9c3', color: '#854d0e', border: '1px solid #fde68a' },
  confirmed: { bgcolor: '#dcfce7', color: '#166534', border: '1px solid #86efac' },
  seated: { bgcolor: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' },
  cancelled: { bgcolor: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db' },
  completed: { bgcolor: '#f0fdf4', color: '#166534', border: '1px solid #86efac' },
}

const emptyForm = { name: '', phone: '', email: '', guests: 2, date: new Date().toISOString().split('T')[0], time: '19:00', table: '', status: 'pending', notes: '' }

function ReservationFormDialog({ open, onClose, editData, onSave }) {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  useEffect(() => { setForm(editData ? { ...emptyForm, ...editData } : emptyForm); setErrors({}) }, [editData, open])
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }
  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name required'
    if (!form.phone.trim()) e.phone = 'Phone required'
    if (!form.date) e.date = 'Date required'
    if (!form.time) e.time = 'Time required'
    setErrors(e); return Object.keys(e).length === 0
  }
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>{editData ? 'Edit Reservation' : 'New Reservation'}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid item xs={12}><TextField fullWidth label="Guest Name *" value={form.name} onChange={e => set('name', e.target.value)} error={!!errors.name} helperText={errors.name} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Phone *" value={form.phone} onChange={e => set('phone', e.target.value)} error={!!errors.phone} helperText={errors.phone} /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label="Email" value={form.email} onChange={e => set('email', e.target.value)} /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="Guests" type="number" value={form.guests} onChange={e => set('guests', +e.target.value)} inputProps={{ min: 1, max: 50 }} /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="Date *" type="date" value={form.date} onChange={e => set('date', e.target.value)} error={!!errors.date} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label="Time *" type="time" value={form.time} onChange={e => set('time', e.target.value)} error={!!errors.time} InputLabelProps={{ shrink: true }} /></Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Table</InputLabel>
              <Select value={form.table} label="Table" onChange={e => set('table', e.target.value)}>
                <MenuItem value="">Not assigned</MenuItem>
                {TABLES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select value={form.status} label="Status" onChange={e => set('status', e.target.value)}>
                {Object.keys(STATUS_STYLES).map(s => <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}><TextField fullWidth label="Notes / Special Requests" multiline rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" color="inherit" sx={{ flex: 1 }}>Cancel</Button>
        <Button onClick={() => { if (validate()) onSave(form) }} variant="contained" sx={{ flex: 1 }}>{editData ? 'Update' : 'Create'}</Button>
      </DialogActions>
    </Dialog>
  )
}

function ReservationCard({ res, onEdit, onDelete, onStatusChange }) {
  const style = STATUS_STYLES[res.status] || STATUS_STYLES.pending
  return (
    <Card sx={{ height: '100%', border: '1.5px solid', borderColor: 'divider', '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }, transition: 'box-shadow 0.15s' }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: 'rgba(255,61,1,0.12)', color: 'primary.main', fontSize: 13, fontWeight: 800 }}>
              {res.guests}
            </Avatar>
            <Box>
              <Typography fontWeight={700} fontSize={13.5} noWrap sx={{ maxWidth: 160 }}>{res.name}</Typography>
              <Typography fontSize={12} color="text.secondary">{res.phone}</Typography>
            </Box>
          </Box>
          <Box sx={{ px: 1, py: 0.3, borderRadius: 1, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px', flexShrink: 0, ...style }}>
            {res.status}
          </Box>
        </Box>
        <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1.5, mb: 1.5 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box><Typography fontSize={10} fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', mb: 0.2 }}>Date & Time</Typography>
              <Typography fontWeight={700} fontSize={13} color="error.main">{formatDate(res.date)} · {res.time}</Typography></Box>
            <Box><Typography fontSize={10} fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', mb: 0.2 }}>Table</Typography>
              <Typography fontWeight={700} fontSize={13}>{res.table || 'TBD'}</Typography></Box>
          </Box>
        </Box>
        {res.notes && (
          <Typography fontSize={12} color="text.secondary" sx={{ mb: 1.5, fontStyle: 'italic' }}>"{res.notes}"</Typography>
        )}
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
          {res.status === 'pending' && (
            <Tooltip title="Confirm"><IconButton size="small" onClick={() => onStatusChange(res.id, { ...res, status: 'confirmed' })} sx={{ color: 'success.main', bgcolor: 'success.light', '&:hover': { bgcolor: 'success.main', color: '#fff' } }}><Check fontSize="small" /></IconButton></Tooltip>
          )}
          <Tooltip title="Edit"><IconButton size="small" onClick={() => onEdit(res)} sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}><Edit fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton size="small" onClick={() => onDelete(res)} sx={{ color: 'error.light', '&:hover': { color: 'error.main' } }}><Delete fontSize="small" /></IconButton></Tooltip>
        </Box>
      </CardContent>
    </Card>
  )
}

export default function ReservationsPage() {
  const dispatch = useDispatch()
  const { items: reservations, loading } = useSelector(s => s.reservations)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  const debouncedSearch = useDebounce(search)

  useEffect(() => { dispatch(fetchReservations()) }, [dispatch])

  const today = new Date().toISOString().split('T')[0]
  const filtered = reservations.filter(r => {
    const q = debouncedSearch.toLowerCase()
    const mq = !q || r.name.toLowerCase().includes(q) || r.phone.includes(q)
    return mq && (!statusFilter || r.status === statusFilter)
  })

  const handleSave = async (form) => {
    if (editData) { await dispatch(updateReservation({ id: editData.id, data: form })); dispatch(showSnackbar({ message: 'Reservation updated', severity: 'success' })) }
    else { await dispatch(createReservation(form)); dispatch(showSnackbar({ message: 'Reservation created', severity: 'success' })) }
    dispatch(addActivityLog({ action: editData ? 'RES_UPDATED' : 'RES_CREATED', description: `Reservation for ${form.name}`, module: 'Reservations' }))
    setDialogOpen(false)
  }

  const handleDelete = (res) => {
    dispatch(showConfirmDialog({
      title: 'Cancel Reservation', message: `Cancel reservation for "${res.name}"?`,
      onConfirm: () => { dispatch(deleteReservation(res.id)); dispatch(showSnackbar({ message: 'Reservation cancelled', severity: 'success' })) },
    }))
  }

  const handleStatusChange = (id, data) => {
    dispatch(updateReservation({ id, data }))
    dispatch(showSnackbar({ message: `Reservation confirmed`, severity: 'success' }))
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Reservations</Typography>
          <Typography color="text.secondary" fontSize={13}>Manage table bookings and guest reservations</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setEditData(null); setDialogOpen(true) }}
          sx={{ boxShadow: '0 2px 10px rgba(255,61,1,0.3)' }}>New Reservation</Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { title: "Today's", value: reservations.filter(r => r.date === today).length, icon: <Schedule />, color: '#FF3D01' },
          { title: 'Pending', value: reservations.filter(r => r.status === 'pending').length, icon: <BookOnline />, color: '#7a5a00' },
          { title: 'Confirmed', value: reservations.filter(r => r.status === 'confirmed').length, icon: <Check />, color: '#186b35' },
          { title: 'Total Guests', value: reservations.filter(r => r.date === today).reduce((s, r) => s + (r.guests || 0), 0), icon: <People />, color: '#1a4fcc' },
        ].map((s, i) => <Grid item xs={6} sm={3} key={i}><StatCard {...s} /></Grid>)}
      </Grid>

      <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField size="small" placeholder="Search by name or phone…" value={search} onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }}
          sx={{ flex: '1 1 220px' }} />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <Select value={statusFilter} displayEmpty onChange={e => setStatusFilter(e.target.value)}>
            <MenuItem value="">All Status</MenuItem>
            {Object.keys(STATUS_STYLES).map(s => <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>)}
          </Select>
        </FormControl>
        <Typography color="text.secondary" fontSize={12} sx={{ ml: 'auto' }}>{filtered.length} reservations</Typography>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.disabled' }}>
          <BookOnline sx={{ fontSize: 56, mb: 1.5, opacity: 0.3 }} />
          <Typography fontWeight={700} fontSize={16}>No reservations found</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filtered.map(res => (
            <Grid item xs={12} sm={6} lg={4} key={res.id}>
              <ReservationCard res={res} onEdit={r => { setEditData(r); setDialogOpen(true) }} onDelete={handleDelete} onStatusChange={handleStatusChange} />
            </Grid>
          ))}
        </Grid>
      )}
      <ReservationFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} editData={editData} onSave={handleSave} />
    </Box>
  )
}
