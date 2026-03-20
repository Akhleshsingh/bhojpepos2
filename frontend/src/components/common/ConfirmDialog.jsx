import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material'
import { Warning } from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import { hideConfirmDialog } from '../../features/uiSlice'

export default function ConfirmDialog() {
  const dispatch = useDispatch()
  const { open, title, message, onConfirm, severity = 'warning' } = useSelector(s => s.ui.confirmDialog)

  const handleConfirm = () => {
    if (onConfirm) onConfirm()
    dispatch(hideConfirmDialog())
  }

  return (
    <Dialog open={open} onClose={() => dispatch(hideConfirmDialog())} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'error.light', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.15, position: 'absolute' }} />
          <Warning color="error" />
          <Typography fontWeight={800}>{title || 'Are you sure?'}</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography color="text.secondary">{message || 'This action cannot be undone.'}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={() => dispatch(hideConfirmDialog())} variant="outlined" color="inherit" sx={{ flex: 1 }}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained" color="error" sx={{ flex: 1 }}>Confirm</Button>
      </DialogActions>
    </Dialog>
  )
}
