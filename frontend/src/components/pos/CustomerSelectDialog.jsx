import { useState, useEffect } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,
  Box, Typography, Avatar, InputAdornment, Chip, CircularProgress, IconButton,
} from '@mui/material'
import { Search, Person, Close, PersonAdd } from '@mui/icons-material'
import { useSelector, useDispatch } from 'react-redux'
import { fetchCustomers, createCustomer } from '../../features/customersSlice'
import { showSnackbar } from '../../features/uiSlice'
import { getInitials } from '../../utils/formatters'
import { useDebounce } from '../../hooks/useDebounce'

const COLORS = ['#FF3D01','#1a4fcc','#186b35','#7a5a00','#7e22ce','#c2610a']

export default function CustomerSelectDialog({ open, onClose, onSelect }) {
  const dispatch = useDispatch()
  const { items: customers, loading } = useSelector(s => s.customers)
  const [search, setSearch] = useState('')
  const [addMode, setAddMode] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const debouncedSearch = useDebounce(search, 200)

  useEffect(() => {
    if (open) { setSearch(''); setAddMode(false); dispatch(fetchCustomers()) }
  }, [open, dispatch])

  const filtered = customers.filter(c => {
    const q = debouncedSearch.toLowerCase()
    return !q || c.name.toLowerCase().includes(q) || c.phone.includes(q)
  }).slice(0, 8)

  const handleAdd = async () => {
    if (!newName.trim() || !newPhone.trim()) return
    const result = await dispatch(createCustomer({ name: newName.trim(), phone: newPhone.trim() }))
    if (createCustomer.fulfilled.match(result)) {
      dispatch(showSnackbar({ message: `${newName} added`, severity: 'success' }))
      onSelect(result.payload)
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Person color="primary" fontSize="small" /> Select Customer
        </Box>
        <IconButton size="small" onClick={onClose}><Close fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {!addMode ? (
          <>
            <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
              <TextField fullWidth size="small" placeholder="Search by name or phone…" value={search}
                onChange={e => setSearch(e.target.value)} autoFocus
                InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment> }} />
            </Box>
            <Box sx={{ maxHeight: 320, overflowY: 'auto' }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
              ) : filtered.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.disabled' }}>
                  <Typography fontWeight={600} fontSize={13}>No customers found</Typography>
                  <Typography fontSize={12} sx={{ mt: 0.5 }}>Try a different search or add new</Typography>
                </Box>
              ) : filtered.map((c, idx) => (
                <Box key={c.id} onClick={() => { onSelect(c); onClose() }}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, cursor: 'pointer',
                    borderBottom: '1px solid', borderColor: 'divider',
                    '&:hover': { bgcolor: 'action.hover' }, transition: 'background 0.12s' }}>
                  <Avatar sx={{ width: 34, height: 34, bgcolor: COLORS[idx % COLORS.length], fontSize: 12, fontWeight: 800 }}>
                    {getInitials(c.name)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography fontWeight={700} fontSize={13.5}>{c.name}</Typography>
                    <Typography fontSize={12} color="text.secondary">{c.phone} · {c.orders || 0} orders</Typography>
                  </Box>
                  {(c.orders || 0) >= 10 && (
                    <Chip label="VIP" size="small" sx={{ fontSize: 9, fontWeight: 800, height: 16, bgcolor: '#7a5a0015', color: '#7a5a00' }} />
                  )}
                </Box>
              ))}
            </Box>
          </>
        ) : (
          <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <TextField fullWidth size="small" label="Customer Name *" value={newName}
              onChange={e => setNewName(e.target.value)} autoFocus />
            <TextField fullWidth size="small" label="Phone Number *" value={newPhone}
              onChange={e => setNewPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5, gap: 1 }}>
        {!addMode ? (
          <>
            <Button onClick={() => setAddMode(true)} startIcon={<PersonAdd />} variant="outlined" size="small" sx={{ fontWeight: 700 }}>
              New Customer
            </Button>
            <Box sx={{ flex: 1 }} />
            <Button onClick={() => { onSelect(null); onClose() }} color="inherit" size="small">Skip</Button>
          </>
        ) : (
          <>
            <Button onClick={() => setAddMode(false)} color="inherit" size="small" sx={{ fontWeight: 700 }}>← Back</Button>
            <Box sx={{ flex: 1 }} />
            <Button onClick={handleAdd} variant="contained" size="small"
              disabled={!newName.trim() || !newPhone.trim()} sx={{ fontWeight: 700 }}>
              Add & Select
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}
