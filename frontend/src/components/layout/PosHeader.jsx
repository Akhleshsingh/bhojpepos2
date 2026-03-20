import { useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Box, Typography, Button, Badge, IconButton, Tooltip, Avatar, Chip } from '@mui/material'
import {
  Receipt, TableRestaurant, Add, ShoppingCart, Person,
  Notifications, Wifi, WifiOff, Print, LocalShipping, Kitchen
} from '@mui/icons-material'
import { ROLES } from '../../features/authSlice'
import { getInitials } from '../../utils/formatters'

export default function PosHeader({ showTableView = true }) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useSelector(s => s.auth.user)
  const isOnline = useSelector(s => s.ui.isOnline)
  const orders = useSelector(s => s.orders.items)
  const heldOrders = useSelector(s => s.orders.heldOrders)
  
  const activeOrders = orders.filter(o => ['pending', 'preparing'].includes(o.status)).length
  const roleInfo = ROLES[user?.role] || {}
  
  const isActive = (path) => location.pathname === path

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1,
        bgcolor: '#fff',
        borderBottom: '1px solid #e5e7eb',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
      data-testid="pos-header"
    >
      {/* Left: Logo + Main Nav */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* Logo */}
        <Box 
          sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
          onClick={() => navigate('/tables')}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {[20, 14, 8].map((w, i) => (
              <Box key={i} sx={{ width: w, height: 3, borderRadius: 1, bgcolor: '#E8332A' }} />
            ))}
          </Box>
          <Typography sx={{ fontSize: 22, fontWeight: 900, color: '#E8332A', letterSpacing: '-0.5px' }}>
            Bhojpe
          </Typography>
        </Box>

        {/* Main Navigation Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
          <Button
            variant={isActive('/orders') ? 'contained' : 'outlined'}
            size="small"
            startIcon={<Receipt fontSize="small" />}
            onClick={() => navigate('/orders')}
            sx={{
              borderRadius: '20px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: 13,
              px: 2,
              py: 0.7,
              borderColor: '#e5e7eb',
              color: isActive('/orders') ? '#fff' : '#374151',
              bgcolor: isActive('/orders') ? '#374151' : 'transparent',
              '&:hover': { borderColor: '#d1d5db', bgcolor: isActive('/orders') ? '#4b5563' : '#f9fafb' }
            }}
            data-testid="header-all-order"
          >
            All Order
          </Button>

          {showTableView && (
            <Button
              variant={isActive('/tables') ? 'contained' : 'outlined'}
              size="small"
              startIcon={<TableRestaurant fontSize="small" />}
              onClick={() => navigate('/tables')}
              sx={{
                borderRadius: '20px',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: 13,
                px: 2,
                py: 0.7,
                borderColor: isActive('/tables') ? '#E8332A' : '#e5e7eb',
                color: isActive('/tables') ? '#fff' : '#374151',
                bgcolor: isActive('/tables') ? '#E8332A' : 'transparent',
                '&:hover': { 
                  borderColor: isActive('/tables') ? '#E8332A' : '#E8332A', 
                  bgcolor: isActive('/tables') ? '#e63600' : 'rgba(255,61,1,0.04)' 
                }
              }}
              data-testid="header-table-view"
            >
              Table View
            </Button>
          )}

          <Button
            variant="contained"
            size="small"
            startIcon={<Add fontSize="small" />}
            onClick={() => navigate('/pos')}
            sx={{
              borderRadius: '20px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: 13,
              px: 2,
              py: 0.7,
              bgcolor: '#9a1717',
              color: '#fff',
              boxShadow: 'none',
              '&:hover': { bgcolor: '#b91c1c', boxShadow: 'none' }
            }}
            data-testid="header-new-order"
          >
            New Order
          </Button>
        </Box>
      </Box>

      {/* Right: Utility Icons + User */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Utility Icons */}
        <Tooltip title="Print">
          <IconButton size="small" sx={{ color: '#6b7280' }}>
            <Print fontSize="small" />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Kitchen Display">
          <IconButton 
            size="small" 
            sx={{ color: '#6b7280' }}
            onClick={() => navigate('/kitchen')}
          >
            <Kitchen fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Active Orders">
          <IconButton size="small" sx={{ color: '#6b7280' }}>
            <Badge badgeContent={activeOrders} color="error" max={99}>
              <ShoppingCart fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>

        <Tooltip title="Held Orders">
          <IconButton size="small" sx={{ color: '#6b7280' }}>
            <Badge badgeContent={heldOrders.length} color="warning" max={99}>
              <Receipt fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>

        <Tooltip title="Deliveries">
          <IconButton size="small" sx={{ color: '#6b7280' }}>
            <LocalShipping fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Notifications">
          <IconButton size="small" sx={{ color: '#6b7280' }}>
            <Badge badgeContent={3} color="error" max={99}>
              <Notifications fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>

        <Tooltip title={isOnline ? 'Online' : 'Offline'}>
          <IconButton size="small" sx={{ color: isOnline ? '#186b35' : '#b81c1c' }}>
            {isOnline ? <Wifi fontSize="small" /> : <WifiOff fontSize="small" />}
          </IconButton>
        </Tooltip>

        {/* Divider */}
        <Box sx={{ width: 1, height: 24, bgcolor: '#e5e7eb', mx: 1 }} />

        {/* User Avatar */}
        <Tooltip title={`${user?.name} (${roleInfo.name || user?.role})`}>
          <Avatar 
            sx={{ 
              width: 32, 
              height: 32, 
              bgcolor: roleInfo.color || '#E8332A', 
              fontSize: 12, 
              fontWeight: 700,
              cursor: 'pointer'
            }}
            onClick={() => navigate('/settings')}
          >
            {getInitials(user?.name || 'U')}
          </Avatar>
        </Tooltip>
      </Box>
    </Box>
  )
}
