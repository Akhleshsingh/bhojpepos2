import { useState, useEffect } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Box, Typography } from '@mui/material'
import { Note } from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import { setOrderNote, setOrderTable } from '../../features/ordersSlice'
import { TABLES } from '../../utils/constants'

export default function OrderNoteDialog({ open, onClose }) {
  const dispatch = useDispatch()
  const { currentOrder } = useSelector(s => s.orders)
  const [note, setNote] = useState(currentOrder.note || '')
  const [table, setTable] = useState(currentOrder.tableNo || '')

  useEffect(() => {
    if (open) { setNote(currentOrder.note || ''); setTable(currentOrder.tableNo || '') }
  }, [open, currentOrder])

  const handleSave = () => {
    dispatch(setOrderNote(note))
    dispatch(setOrderTable(table || null))
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Note color="primary" /> Order Details
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
          {currentOrder.orderType === 'dine' && (
            <Box>
              <Typography fontSize={12} fontWeight={700} color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Table Number</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                {TABLES.map(t => (
                  <Box key={t} onClick={() => setTable(table === t ? '' : t)}
                    sx={{ px: 1.5, py: 0.8, borderRadius: 1.5, cursor: 'pointer', border: '1.5px solid', fontWeight: 700, fontSize: 12.5,
                      borderColor: table === t ? 'primary.main' : 'divider',
                      bgcolor: table === t ? 'rgba(255,61,1,0.06)' : 'background.paper',
                      color: table === t ? 'primary.main' : 'text.secondary',
                      transition: 'all 0.12s',
                    }}>
                    {t}
                  </Box>
                ))}
              </Box>
            </Box>
          )}
          <TextField
            fullWidth multiline rows={3} label="Order Note / Special Instructions"
            value={note} onChange={e => setNote(e.target.value)}
            placeholder="e.g. No onions, extra spicy, allergy info…"
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" color="inherit" sx={{ flex: 1 }}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" sx={{ flex: 1 }}>Save</Button>
      </DialogActions>
    </Dialog>
  )
}
