import { Box } from '@mui/material'
import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <Box sx={{ height: '100vh', bgcolor: 'background.default', overflow: 'hidden' }}>
      <Outlet />
    </Box>
  )
}
