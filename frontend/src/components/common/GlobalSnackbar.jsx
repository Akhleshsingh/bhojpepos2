import { Snackbar, Alert } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { hideSnackbar } from '../../features/uiSlice'

export default function GlobalSnackbar() {
  const dispatch = useDispatch()
  const { open, message, severity } = useSelector(s => s.ui.snackbar)
  return (
    <Snackbar open={open} autoHideDuration={3500} onClose={() => dispatch(hideSnackbar())} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
      <Alert onClose={() => dispatch(hideSnackbar())} severity={severity} variant="filled" sx={{ fontWeight: 600 }}>
        {message}
      </Alert>
    </Snackbar>
  )
}
