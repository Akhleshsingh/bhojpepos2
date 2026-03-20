import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box, Typography, Button, TextField, Paper, Grid, Card, CardContent,
  Chip, IconButton, Tooltip, InputAdornment, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Switch, FormControlLabel, ToggleButtonGroup, ToggleButton,
} from '@mui/material'
import { Add, Search, Edit, Delete, Restaurant, ViewList, ViewModule, FilterList } from '@mui/icons-material'
import { fetchMenu, createMenuItem, updateMenuItem, deleteMenuItem } from '../../features/menuSlice'
import { showSnackbar, showConfirmDialog, addActivityLog } from '../../features/uiSlice'
import { usePermission } from '../../hooks/usePermission'
import { useDebounce } from '../../hooks/useDebounce'
import { formatCurrency } from '../../utils/formatters'
import { MENU_CATEGORIES } from '../../utils/constants'

const VEG_COLOR = { veg: '#186b35', 'non-veg': '#b81c1c', egg: '#7a5a00' }
const emptyForm = { name: '', category: 'Main Course', price: '', cost: '', type: 'veg', description: '', tax: 5, available: true, popular: false }

function MenuItemDialog({ open, onClose, editData, onSave }) {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  useEffect(() => { setForm(editData ? { ...emptyForm, ...editData } : emptyForm); setErrors({}) }, [editData, open])
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }
  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name required'
    if (!form.price || isNaN(form.price) || form.price <= 0) e.price = 'Valid price required'
    if (!form.category) e.category = 'Category required'
    setErrors(e); return Object.keys(e).length === 0
  }
  const margin = form.price && form.cost ? (((form.price - form.cost) / form.price) * 100).toFixed(1) : null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>{editData ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid item xs={12}><TextField fullWidth label="Item Name *" value={form.name} onChange={e => set('name', e.target.value)} error={!!errors.name} helperText={errors.name} /></Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Category *</InputLabel>
              <Select value={form.category} label="Category *" onChange={e => set('category', e.target.value)}>
                {MENU_CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select value={form.type} label="Type" onChange={e => set('type', e.target.value)}>
                <MenuItem value="veg">🟢 Veg</MenuItem>
                <MenuItem value="non-veg">🔴 Non-Veg</MenuItem>
                <MenuItem value="egg">🟡 Egg</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Selling Price (₹) *" type="number" value={form.price} onChange={e => set('price', e.target.value)} error={!!errors.price} helperText={errors.price} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Cost Price (₹)" type="number" value={form.cost} onChange={e => set('cost', e.target.value)}
              helperText={margin ? `Margin: ${margin}%` : 'Optional'} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Tax (%)" type="number" value={form.tax} onChange={e => set('tax', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', pt: 0.5 }}>
              <FormControlLabel control={<Switch checked={form.available} onChange={e => set('available', e.target.checked)} color="success" />} label={<Typography fontSize={13} fontWeight={600}>Available</Typography>} />
              <FormControlLabel control={<Switch checked={form.popular} onChange={e => set('popular', e.target.checked)} color="warning" />} label={<Typography fontSize={13} fontWeight={600}>Popular</Typography>} />
            </Box>
          </Grid>
          <Grid item xs={12}><TextField fullWidth label="Description" multiline rows={2} value={form.description} onChange={e => set('description', e.target.value)} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" color="inherit" sx={{ flex: 1 }}>Cancel</Button>
        <Button onClick={() => { if (validate()) onSave(form) }} variant="contained" sx={{ flex: 1 }}>{editData ? 'Update' : 'Add Item'}</Button>
      </DialogActions>
    </Dialog>
  )
}

function MenuItemCard({ item, onEdit, onDelete, canEdit }) {
  return (
    <Card sx={{ height: '100%', transition: 'box-shadow 0.15s', '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.1)' } }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', border: `2px solid ${VEG_COLOR[item.type]}`, flexShrink: 0 }}>
                <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: VEG_COLOR[item.type], m: '1px' }} />
              </Box>
              <Typography fontWeight={700} fontSize={13.5} noWrap>{item.name}</Typography>
            </Box>
            <Chip label={item.category} size="small" sx={{ fontSize: 10, fontWeight: 700, height: 20, bgcolor: 'action.hover' }} />
          </Box>
          {item.popular && <Chip label="⭐ Popular" size="small" sx={{ fontSize: 9, fontWeight: 800, height: 18, bgcolor: '#7a5a0012', color: '#7a5a00', border: '1px solid #7a5a0025', flexShrink: 0 }} />}
        </Box>
        {item.description && <Typography fontSize={11.5} color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.4 }} noWrap>{item.description}</Typography>}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography fontWeight={800} fontSize={15} color="primary.main">{formatCurrency(item.price)}</Typography>
            {item.cost && <Typography fontSize={11} color="text.disabled">Cost: {formatCurrency(item.cost)}</Typography>}
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.available ? 'success.main' : 'text.disabled' }} />
            <Typography fontSize={11} color={item.available ? 'success.main' : 'text.disabled'} fontWeight={700}>
              {item.available ? 'Available' : 'Unavailable'}
            </Typography>
            {canEdit && (
              <>
                <Tooltip title="Edit"><IconButton size="small" onClick={() => onEdit(item)} sx={{ ml: 0.5, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}><Edit sx={{ fontSize: 15 }} /></IconButton></Tooltip>
                <Tooltip title="Delete"><IconButton size="small" onClick={() => onDelete(item)} sx={{ color: 'error.light', '&:hover': { color: 'error.main' } }}><Delete sx={{ fontSize: 15 }} /></IconButton></Tooltip>
              </>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default function MenuPage() {
  const dispatch = useDispatch()
  const { items: menu, categories, loading } = useSelector(s => s.menu)
  const canEdit = usePermission('menu')
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('All')
  const [typeFilter, setTypeFilter] = useState('')
  const [viewMode, setViewMode] = useState('grid')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  const debouncedSearch = useDebounce(search)

  useEffect(() => { dispatch(fetchMenu()) }, [dispatch])

  const filtered = menu.filter(item => {
    const q = debouncedSearch.toLowerCase()
    const mq = !q || item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
    const mc = activeCat === 'All' || item.category === activeCat
    const mt = !typeFilter || item.type === typeFilter
    return mq && mc && mt
  })

  const handleSave = async (form) => {
    if (editData) {
      await dispatch(updateMenuItem({ id: editData.id, data: form }))
      dispatch(showSnackbar({ message: `${form.name} updated`, severity: 'success' }))
    } else {
      await dispatch(createMenuItem(form))
      dispatch(showSnackbar({ message: `${form.name} added to menu`, severity: 'success' }))
    }
    dispatch(addActivityLog({ action: editData ? 'MENU_UPDATED' : 'MENU_CREATED', description: `${editData ? 'Updated' : 'Added'} menu item: ${form.name}`, module: 'Menu' }))
    setDialogOpen(false)
  }

  const handleDelete = (item) => {
    dispatch(showConfirmDialog({
      title: 'Delete Menu Item', message: `Remove "${item.name}" from the menu?`,
      onConfirm: () => { dispatch(deleteMenuItem(item.id)); dispatch(showSnackbar({ message: `${item.name} removed`, severity: 'success' })) },
    }))
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Menu Management</Typography>
          <Typography color="text.secondary" fontSize={13}>{menu.length} items across {categories.length} categories</Typography>
        </Box>
        {canEdit && (
          <Button variant="contained" startIcon={<Add />} onClick={() => { setEditData(null); setDialogOpen(true) }}
            sx={{ boxShadow: '0 2px 10px rgba(255,61,1,0.3)' }}>Add Item</Button>
        )}
      </Box>

      {/* Category pills */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        {['All', ...categories].map(cat => (
          <Chip key={cat} label={`${cat}${cat !== 'All' ? ` (${menu.filter(i => i.category === cat).length})` : ''}`}
            onClick={() => setActiveCat(cat)} clickable
            sx={{ fontWeight: 700, fontSize: 12, bgcolor: activeCat === cat ? 'primary.main' : 'background.paper', color: activeCat === cat ? '#fff' : 'text.secondary', border: '1.5px solid', borderColor: activeCat === cat ? 'primary.main' : 'divider', '&:hover': { bgcolor: activeCat === cat ? 'primary.dark' : 'action.hover' } }} />
        ))}
      </Box>

      {/* Filters bar */}
      <Paper sx={{ p: 1.5, mb: 2, display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField size="small" placeholder="Search menu…" value={search} onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }}
          sx={{ flex: '1 1 220px' }} />
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <Select value={typeFilter} displayEmpty onChange={e => setTypeFilter(e.target.value)}>
            <MenuItem value="">All Types</MenuItem>
            <MenuItem value="veg">🟢 Veg</MenuItem>
            <MenuItem value="non-veg">🔴 Non-Veg</MenuItem>
            <MenuItem value="egg">🟡 Egg</MenuItem>
          </Select>
        </FormControl>
        <Typography color="text.secondary" fontSize={12} sx={{ flex: 1, textAlign: 'right' }}>{filtered.length} items</Typography>
        <ToggleButtonGroup size="small" value={viewMode} exclusive onChange={(_, v) => v && setViewMode(v)}>
          <ToggleButton value="grid"><ViewModule fontSize="small" /></ToggleButton>
          <ToggleButton value="list"><ViewList fontSize="small" /></ToggleButton>
        </ToggleButtonGroup>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.disabled' }}>
          <Restaurant sx={{ fontSize: 56, mb: 1.5, opacity: 0.3 }} />
          <Typography fontWeight={700} fontSize={16}>No items found</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filtered.map(item => (
            <Grid item xs={12} sm={viewMode === 'grid' ? 6 : 12} md={viewMode === 'grid' ? 4 : 12} lg={viewMode === 'grid' ? 3 : 12} key={item.id}>
              <MenuItemCard item={item} onEdit={(i) => { setEditData(i); setDialogOpen(true) }} onDelete={handleDelete} canEdit={canEdit} />
            </Grid>
          ))}
        </Grid>
      )}

      <MenuItemDialog open={dialogOpen} onClose={() => setDialogOpen(false)} editData={editData} onSave={handleSave} />
    </Box>
  )
}
