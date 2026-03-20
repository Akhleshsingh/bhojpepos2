import { AppBar, Toolbar, IconButton, Typography, Box, InputBase, Badge, Tooltip, Avatar, Menu, MenuItem, Divider } from '@mui/material'
import { Menu as MenuIcon, Search, Notifications, DarkMode, LightMode, Fullscreen } from '@mui/icons-material'
import { useSelector, useDispatch } from 'react-redux'
import { useState, useRef } from 'react'
import { toggleTheme, toggleSidebar, setGlobalSearch } from '../../features/uiSlice'
import { logout } from '../../features/authSlice'
import { useNavigate } from 'react-router-dom'
import SyncIndicator from '../common/SyncIndicator'
import { getInitials } from '../../utils/formatters'

export default function TopBar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const themeMode = useSelector(s => s.ui.themeMode)
  const user = useSelector(s => s.auth.user)
  const [anchorEl, setAnchorEl] = useState(null)
  const searchRef = useRef()

  return (
    <AppBar position="sticky" elevation={0}
      sx={{ zIndex: (t) => t.zIndex.drawer - 1, bgcolor: 'background.paper', color: 'text.primary',
            borderBottom: '1.5px solid', borderColor: 'divider' }}
    >
      <Toolbar sx={{ gap: 1.5, minHeight: '60px !important' }}>
        {/* Menu toggle */}
        <IconButton size="small" onClick={() => dispatch(toggleSidebar())} sx={{ color: 'text.secondary' }}>
          <MenuIcon />
        </IconButton>

        {/* Search */}
        <Box sx={{ flex: 1, maxWidth: 400, bgcolor: 'action.hover', borderRadius: 2, display: 'flex', alignItems: 'center', px: 1.5, py: 0.5 }}>
          <Search sx={{ fontSize: 18, color: 'text.disabled', mr: 1 }} />
          <InputBase ref={searchRef} placeholder="Search orders, customers, menu…"
            onChange={e => dispatch(setGlobalSearch(e.target.value))}
            sx={{ flex: 1, fontSize: 13.5, fontWeight: 500, '& input': { p: 0 } }} />
        </Box>

        <Box sx={{ flex: 1 }} />

        {/* Right actions */}
        <SyncIndicator />

        <Tooltip title={themeMode === 'light' ? 'Dark mode' : 'Light mode'}>
          <IconButton size="small" onClick={() => dispatch(toggleTheme())} sx={{ color: 'text.secondary' }}>
            {themeMode === 'light' ? <DarkMode fontSize="small" /> : <LightMode fontSize="small" />}
          </IconButton>
        </Tooltip>

        <Tooltip title="Notifications">
          <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <Badge badgeContent={3} color="error">
              <Notifications fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* Avatar menu */}
        <Tooltip title={user?.name}>
          <Avatar onClick={e => setAnchorEl(e.currentTarget)} sx={{ width: 34, height: 34, bgcolor: user?.color || '#FF3D01', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
            {getInitials(user?.name || 'U')}
          </Avatar>
        </Tooltip>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{ sx: { mt: 1, minWidth: 180, borderRadius: 2 } }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography fontWeight={700} fontSize={14}>{user?.name}</Typography>
            <Typography color="text.secondary" fontSize={12} sx={{ textTransform: 'capitalize' }}>{user?.role}</Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { navigate('/settings'); setAnchorEl(null) }} sx={{ fontSize: 13, fontWeight: 600 }}>Settings</MenuItem>
          <Divider />
          <MenuItem onClick={() => { dispatch(logout()); navigate('/login') }} sx={{ fontSize: 13, fontWeight: 700, color: 'error.main' }}>Logout</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  )
}
