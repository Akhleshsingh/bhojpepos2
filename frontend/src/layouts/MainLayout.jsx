import { Box } from '@mui/material'
import { Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Sidebar from '../components/layout/Sidebar'
import TopBar from '../components/layout/TopBar'
import GlobalSnackbar from '../components/common/GlobalSnackbar'
import ConfirmDialog from '../components/common/ConfirmDialog'

export default function MainLayout() {
  const sidebarOpen = useSelector(s => s.ui.sidebarOpen)

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
      <Sidebar open={sidebarOpen} />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <TopBar />
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
          <Outlet />
        </Box>
      </Box>
      <GlobalSnackbar />
      <ConfirmDialog />
    </Box>
  )
}
