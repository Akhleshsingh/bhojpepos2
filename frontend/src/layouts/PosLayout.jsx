import { Box } from '@mui/material'
import { Outlet } from 'react-router-dom'
import GlobalSnackbar from '../components/common/GlobalSnackbar'
import ConfirmDialog from '../components/common/ConfirmDialog'

// POS runs in fullscreen mode without sidebar
export default function PosLayout() {
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default', overflow: 'hidden' }}>
      <Outlet />
      <GlobalSnackbar />
      <ConfirmDialog />
    </Box>
  )
}
