import { useLocation, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Typography, Avatar, Tooltip, IconButton, Chip,
} from '@mui/material'
import {
  Dashboard, PointOfSale, Receipt, TableRestaurant, BookOnline,
  People, Restaurant, Group, Kitchen, BarChart, Settings,
  ChevronLeft, Logout, ChevronRight, LocalShipping, Shield,
  RoomService
} from '@mui/icons-material'
import { logout, hasPermission, isModuleActive, ROLES } from '../../features/authSlice'
import { setSidebarOpen, showConfirmDialog } from '../../features/uiSlice'
import { getInitials } from '../../utils/formatters'

const DRAWER_WIDTH = 252

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: <Dashboard />, permission: null, moduleKey: null },
  { path: '/pos', label: 'POS', icon: <PointOfSale />, permission: 'pos', moduleKey: 'pos' },
  { path: '/tables', label: 'Tables', icon: <TableRestaurant />, permission: 'pos', moduleKey: 'tables' },
  { path: '/orders', label: 'Orders & KOT', icon: <Receipt />, permission: 'orders', moduleKey: 'orders' },
  { path: '/waiter-requests', label: 'Waiter Requests', icon: <RoomService />, permission: 'orders', moduleKey: 'orders' },
  { path: '/reservations', label: 'Reservations', icon: <BookOnline />, permission: 'reservations', moduleKey: 'reservations' },
  { path: '/customers', label: 'Customers', icon: <People />, permission: 'customers', moduleKey: 'customers' },
  { path: '/menu', label: 'Menu', icon: <Restaurant />, permission: 'menu', moduleKey: 'menu' },
  { path: '/staff', label: 'Staff', icon: <Group />, permission: 'staff', moduleKey: 'staff' },
  { path: '/kitchen', label: 'Kitchen', icon: <Kitchen />, permission: 'kot', moduleKey: 'kot' },
  { path: '/reports', label: 'Reports', icon: <BarChart />, permission: 'reports', moduleKey: 'reports' },
  { path: '/settings', label: 'Settings', icon: <Settings />, permission: 'settings', moduleKey: 'settings' },
]

export default function Sidebar({ open }) {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const user = useSelector(s => s.auth.user)
  const modules = useSelector(s => s.auth.modules)
  const tables = useSelector(s => s.tables?.items || [])

  const handleLogout = () => {
    dispatch(showConfirmDialog({
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      onConfirm: () => { dispatch(logout()); navigate('/login') },
    }))
  }

  // Filter items based on permissions and active modules
  const visibleItems = navItems.filter(item => {
    // Check permission
    if (item.permission && !hasPermission(user, item.permission)) return false
    // Check if module is active
    if (item.moduleKey && !isModuleActive(modules, item.moduleKey)) return false
    return true
  })

  const occupiedCount = tables.filter(t => t.status === 'occupied').length
  const roleInfo = ROLES[user?.role] || {}

  return (
    <Drawer
      variant="permanent"
      open={open}
      sx={{
        width: open ? DRAWER_WIDTH : 68,
        flexShrink: 0,
        transition: 'width 0.28s cubic-bezier(.4,0,.2,1)',
        '& .MuiDrawer-paper': {
          width: open ? DRAWER_WIDTH : 68,
          overflowX: 'hidden',
          transition: 'width 0.28s cubic-bezier(.4,0,.2,1)',
          border: 'none',
          bgcolor: '#0f1117',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#0f1117', color: '#fff' }}>
        {/* Logo */}
        <Box sx={{
          p: open ? 2.5 : 1.5,
          display: 'flex', alignItems: 'center', gap: 1.5,
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          flexShrink: 0, minHeight: 60,
          justifyContent: open ? 'flex-start' : 'center',
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
            {[24, 17, 11].map(w => (
              <Box key={w} sx={{ width: w, height: 3.5, borderRadius: 1, bgcolor: '#FF3D01' }} />
            ))}
          </Box>
          {open && (
            <>
              <Box>
                <Typography sx={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                  Bhojpe
                </Typography>
                <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
                  POSS v1.0
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={() => dispatch(setSidebarOpen(false))}
                sx={{ ml: 'auto', color: 'rgba(255,255,255,0.35)', '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.08)' } }}
                data-testid="sidebar-collapse"
              >
                <ChevronLeft fontSize="small" />
              </IconButton>
            </>
          )}
        </Box>

        {/* Nav Items */}
        <Box sx={{ flex: 1, overflowY: 'auto', py: 1, '&::-webkit-scrollbar': { display: 'none' } }}>
          <List dense disablePadding>
            {visibleItems.map(item => {
              const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
              const badge = item.path === '/tables' && occupiedCount > 0 ? occupiedCount : null

              return (
                <Tooltip key={item.path} title={!open ? item.label : ''} placement="right">
                  <ListItem disablePadding sx={{ mb: 0.2 }}>
                    <ListItemButton
                      onClick={() => navigate(item.path)}
                      data-testid={`nav-${item.path.slice(1)}`}
                      sx={{
                        mx: 0.8, borderRadius: 1.5,
                        px: open ? 1.5 : 1,
                        py: 1,
                        minHeight: 42,
                        bgcolor: active ? '#FF3D01' : 'transparent',
                        color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                        justifyContent: open ? 'flex-start' : 'center',
                        '&:hover': {
                          bgcolor: active ? '#dd3400' : 'rgba(255,255,255,0.07)',
                          color: active ? '#fff' : 'rgba(255,255,255,0.9)',
                        },
                        transition: 'all 0.14s',
                      }}
                    >
                      <ListItemIcon sx={{ color: 'inherit', minWidth: open ? 36 : 'auto' }}>
                        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                          {item.icon}
                          {badge && (
                            <Box sx={{ position: 'absolute', top: -6, right: -8, minWidth: 16, height: 16, borderRadius: 8, bgcolor: '#b81c1c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#fff', px: 0.5 }}>
                              {badge}
                            </Box>
                          )}
                        </Box>
                      </ListItemIcon>
                      {open && (
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{ fontSize: 13, fontWeight: active ? 700 : 600 }}
                        />
                      )}
                    </ListItemButton>
                  </ListItem>
                </Tooltip>
              )
            })}
          </List>
        </Box>

        {/* Expand button (collapsed state) */}
        {!open && (
          <Box sx={{ p: 1, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <Tooltip title="Expand sidebar" placement="right">
              <IconButton onClick={() => dispatch(setSidebarOpen(true))}
                sx={{ width: '100%', borderRadius: 1.5, color: 'rgba(255,255,255,0.4)', '&:hover': { bgcolor: 'rgba(255,255,255,0.07)', color: '#fff' } }}
                data-testid="sidebar-expand">
                <ChevronRight fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* User Footer */}
        <Box sx={{
          p: open ? 2 : 1,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          bgcolor: '#161b27', flexShrink: 0,
          display: 'flex', alignItems: 'center',
          gap: open ? 1.5 : 0,
          justifyContent: open ? 'flex-start' : 'center',
        }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: roleInfo.color || '#FF3D01', fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
            {getInitials(user?.name || 'U')}
          </Avatar>
          {open && (
            <>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.2 }} noWrap>{user?.name}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Chip 
                    size="small" 
                    label={roleInfo.name || user?.role} 
                    sx={{ 
                      height: 18, 
                      fontSize: 9, 
                      fontWeight: 700, 
                      bgcolor: `${roleInfo.color}30`, 
                      color: roleInfo.color,
                      textTransform: 'uppercase'
                    }} 
                  />
                </Box>
              </Box>
              <Tooltip title="Logout">
                <IconButton size="small" onClick={handleLogout}
                  sx={{ color: 'rgba(255,255,255,0.35)', '&:hover': { color: '#FF3D01', bgcolor: 'rgba(255,61,1,0.1)' } }}
                  data-testid="logout-btn">
                  <Logout fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </Box>
    </Drawer>
  )
}
