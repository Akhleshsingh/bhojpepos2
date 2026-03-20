import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import {
  Box, Typography, Button, TextField, Card, CardContent, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  Select, MenuItem, FormControl, InputLabel, IconButton, Tabs, Tab
} from '@mui/material'
import {
  Add, Event, Person, Phone, Email, Restaurant, Close,
  CheckCircle, Cancel, Schedule
} from '@mui/icons-material'
import { showSnackbar } from '../../features/uiSlice'
import apiClient from '../../services/apiClient'
import { formatDateTime } from '../../utils/formatters'

export default function ReservationsPage() {
  const dispatch = useDispatch()
  
  const [reservations, setReservations] = useState([])
  const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, cancelled: 0 })
  const [loading, setLoading] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingReservation, setEditingReservation] = useState(null)
  
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    date: '',
    time: '',
    guests: 2,
    table_name: '',
    special_requests: '',
    status: 'pending'
  })

  useEffect(() => {
    fetchReservations()
  }, [selectedStatus])

  const fetchReservations = async () => {
    try {
      setLoading(true)
      const params = selectedStatus !== 'all' ? { status: selectedStatus } : {}
      const data = await apiClient.get('/reservations', { params })
      setReservations(data.reservations || [])
      setStats(data.stats || {})
    } catch (err) {
      dispatch(showSnackbar({ message: 'Failed to fetch reservations', severity: 'error' }))
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (reservation = null) => {
    if (reservation) {
      setEditingReservation(reservation)
      setFormData({
        customer_name: reservation.customer_name,
        customer_phone: reservation.customer_phone,
        customer_email: reservation.customer_email || '',
        date: reservation.date,
        time: reservation.time,
        guests: reservation.guests,
        table_name: reservation.table_name || '',
        special_requests: reservation.special_requests || '',
        status: reservation.status
      })
    } else {
      setEditingReservation(null)
      setFormData({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        date: new Date().toISOString().split('T')[0],
        time: '19:00',
        guests: 2,
        table_name: '',
        special_requests: '',
        status: 'pending'
      })
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingReservation(null)
  }

  const handleSave = async () => {
    try {
      if (editingReservation) {
        await apiClient.put(`/reservations/${editingReservation.id}`, formData)
        dispatch(showSnackbar({ message: 'Reservation updated successfully', severity: 'success' }))
      } else {
        await apiClient.post('/reservations', formData)
        dispatch(showSnackbar({ message: 'Reservation created successfully', severity: 'success' }))
      }
      handleCloseDialog()
      fetchReservations()
    } catch (err) {
      dispatch(showSnackbar({ message: 'Failed to save reservation', severity: 'error' }))
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reservation?')) return
    
    try {
      await apiClient.delete(`/reservations/${id}`)
      dispatch(showSnackbar({ message: 'Reservation deleted successfully', severity: 'success' }))
      fetchReservations()
    } catch (err) {
      dispatch(showSnackbar({ message: 'Failed to delete reservation', severity: 'error' }))
    }
  }

  const filteredReservations = reservations.filter(r => 
    r.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.customer_phone.includes(searchQuery) ||
    (r.table_name && r.table_name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const getStatusColor = (status) => {
    switch(status) {
      case 'confirmed': return 'success'
      case 'pending': return 'warning'
      case 'cancelled': return 'error'
      default: return 'default'
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Reservations</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          sx={{ bgcolor: '#22c55e', '&:hover': { bgcolor: '#16a34a' } }}
        >
          New Reservation
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#f0f9ff' }}>
            <CardContent>
              <Typography sx={{ fontSize: 13, color: '#6b7280', mb: 1 }}>Total</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#fef3c7' }}>
            <CardContent>
              <Typography sx={{ fontSize: 13, color: '#6b7280', mb: 1 }}>Pending</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#f59e0b' }}>{stats.pending}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#d1fae5' }}>
            <CardContent>
              <Typography sx={{ fontSize: 13, color: '#6b7280', mb: 1 }}>Confirmed</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#10b981' }}>{stats.confirmed}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#fee2e2' }}>
            <CardContent>
              <Typography sx={{ fontSize: 13, color: '#6b7280', mb: 1 }}>Cancelled</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#ef4444' }}>{stats.cancelled}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <TextField
          size="small"
          placeholder="Search by name, phone, or table..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: 300, mr: 2 }}
        />
        
        <Tabs value={selectedStatus} onChange={(e, v) => setSelectedStatus(v)} sx={{ display: 'inline-flex' }}>
          <Tab label="All" value="all" />
          <Tab label="Pending" value="pending" />
          <Tab label="Confirmed" value="confirmed" />
          <Tab label="Cancelled" value="cancelled" />
        </Tabs>
      </Box>

      {/* Reservations Grid */}
      <Grid container spacing={2}>
        {filteredReservations.map(reservation => (
          <Grid item xs={12} sm={6} md={4} key={reservation.id}>
            <Card sx={{ '&:hover': { boxShadow: 3 } }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Chip 
                    label={reservation.status} 
                    size="small" 
                    color={getStatusColor(reservation.status)}
                  />
                  <IconButton size="small" onClick={() => handleDelete(reservation.id)}>
                    <Close fontSize="small" />
                  </IconButton>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Person sx={{ fontSize: 18, color: '#6b7280' }} />
                  <Typography sx={{ fontWeight: 600 }}>{reservation.customer_name}</Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Phone sx={{ fontSize: 18, color: '#6b7280' }} />
                  <Typography sx={{ fontSize: 14, color: '#6b7280' }}>{reservation.customer_phone}</Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Event sx={{ fontSize: 18, color: '#6b7280' }} />
                  <Typography sx={{ fontSize: 14, color: '#6b7280' }}>
                    {reservation.date} at {reservation.time}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Restaurant sx={{ fontSize: 18, color: '#6b7280' }} />
                  <Typography sx={{ fontSize: 14, color: '#6b7280' }}>
                    {reservation.guests} guests {reservation.table_name && `• Table: ${reservation.table_name}`}
                  </Typography>
                </Box>

                {reservation.special_requests && (
                  <Typography sx={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic', mb: 2 }}>
                    "{reservation.special_requests}"
                  </Typography>
                )}

                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  onClick={() => handleOpenDialog(reservation)}
                >
                  Edit
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingReservation ? 'Edit Reservation' : 'New Reservation'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Customer Name"
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              fullWidth
              required
            />
            
            <TextField
              label="Phone"
              value={formData.customer_phone}
              onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
              fullWidth
              required
            />
            
            <TextField
              label="Email (optional)"
              value={formData.customer_email}
              onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
              fullWidth
            />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            
            <TextField
              label="Number of Guests"
              type="number"
              value={formData.guests}
              onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) })}
              fullWidth
              required
              inputProps={{ min: 1 }}
            />
            
            <TextField
              label="Table (optional)"
              value={formData.table_name}
              onChange={(e) => setFormData({ ...formData, table_name: e.target.value })}
              fullWidth
            />
            
            <TextField
              label="Special Requests"
              value={formData.special_requests}
              onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                label="Status"
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="confirmed">Confirmed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={!formData.customer_name || !formData.customer_phone || !formData.date || !formData.time}
          >
            {editingReservation ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
