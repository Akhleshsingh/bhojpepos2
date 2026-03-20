import { useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Box, Typography, Button, Badge, IconButton, Avatar } from '@mui/material'
import {
  Receipt, TableRestaurant, Add, ShoppingCart, Person,
  Notifications, Description, Apps, ListAlt, Menu as MenuIcon
} from '@mui/icons-material'

export default function PosHeaderNew() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useSelector(s => s.auth.user)
  const orders = useSelector(s => s.orders.items)
  
  const activeOrders = orders.filter(o => ['pending', 'preparing'].includes(o.status)).length
  const isActive = (path) => location.pathname === path

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 3,
        py: 1.5,
        bgcolor: '#fff',
        borderBottom: '1px solid #e5e7eb',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}
    >
      {/* Left: Logo + Main Actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton size="small" sx={{ color: '#E8332A' }}>
            <MenuIcon />
          </IconButton>
          <Typography 
            sx={{ fontSize: 24, fontWeight: 900, color: '#1f2937', cursor: 'pointer' }}
            onClick={() => navigate('/tables')}
          >
            Bhojpe
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Receipt />}
            onClick={() => navigate('/orders')}
            sx={{
              textTransform: 'none',
              borderColor: '#d1d5db',
              color: '#374151',
              fontWeight: 600,
              fontSize: 13,
              borderRadius: 2,
              px: 2,
              '&:hover': { borderColor: '#9ca3af', bgcolor: '#f9fafb' }
            }}
          >
            All Order
          </Button>

          <Button
            size="small"
            variant="contained"
            startIcon={<TableRestaurant />}
            onClick={() => navigate('/tables')}
            sx={{
              textTransform: 'none',
              bgcolor: isActive('/tables') ? '#E8332A' : '#fff',
              color: isActive('/tables') ? '#fff' : '#6b5c4e',
              border: isActive('/tables') ? 'none' : '1px solid #e8ddd5',
              fontWeight: 600,
              fontSize: 13,
              borderRadius: 2,
              px: 2,
              '&:hover': {
                bgcolor: isActive('/tables') ? '#c8271f' : '#f9fafb'
              }
            }}
          >
            Table View
          </Button>

          <Button
            size="small"
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/pos')}
            sx={{
              textTransform: 'none',
              bgcolor: '#186b35',
              color: '#fff',
              fontWeight: 600,
              fontSize: 13,
              borderRadius: 2,
              px: 2,
              '&:hover': { bgcolor: '#145028' }
            }}
          >
            New Order
          </Button>
        </Box>
      </Box>

      {/* Right: Quick Actions + User */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Icon Buttons */}
        <IconButton size="small" sx={{ color: '#6b7280' }}>
          <Description fontSize="small" />
        </IconButton>
        
        <IconButton size="small" sx={{ color: '#6b7280' }}>
          <Apps fontSize="small" />
        </IconButton>
        
        <IconButton size="small" sx={{ color: '#6b7280' }}>
          <ListAlt fontSize="small" />
        </IconButton>
        
        <IconButton size="small" sx={{ color: '#6b7280' }}>
          <ShoppingCart fontSize="small" />
        </IconButton>

        <Badge badgeContent={activeOrders} color="error">
          <IconButton size="small" sx={{ color: '#6b7280' }}>
            <Notifications fontSize="small" />
          </IconButton>
        </Badge>

        <Badge badgeContent={0} color="warning">
          <IconButton size="small" sx={{ color: '#6b7280' }}>
            <Person fontSize="small" />
          </IconButton>
        </Badge>

        {/* User Avatar */}
        <Avatar 
          sx={{ 
            width: 32, 
            height: 32, 
            bgcolor: '#E8332A', 
            fontSize: 13, 
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          {user?.name?.charAt(0)?.toUpperCase() || 'A'}
        </Avatar>
      </Box>
    </Box>
  )
}
