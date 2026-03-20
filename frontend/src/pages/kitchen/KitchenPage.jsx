import { useState, useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  Box, Typography, Grid, Card, CardContent, Chip, IconButton,
  Button, LinearProgress, Badge, Divider, Avatar, Tooltip
} from '@mui/material'
import {
  Kitchen, Timer, CheckCircle, LocalFireDepartment,
  Refresh, ArrowForward, Restaurant, AccessTime, Person
} from '@mui/icons-material'
import { showSnackbar } from '../../features/uiSlice'
import apiClient from '../../services/apiClient'

const STATUS_CONFIG = {
  pending: { color: '#FF3D01', label: 'NEW', bgColor: 'rgba(255,61,1,0.1)' },
  preparing: { color: '#f59e0b', label: 'COOKING', bgColor: 'rgba(245,158,11,0.1)' },
  ready: { color: '#10b981', label: 'READY', bgColor: 'rgba(16,185,129,0.1)' },
  served: { color: '#6b7280', label: 'SERVED', bgColor: 'rgba(107,114,128,0.1)' },
}

const PRIORITY_CONFIG = {
  urgent: { color: '#dc2626', icon: <LocalFireDepartment /> },
  high: { color: '#f59e0b', icon: <LocalFireDepartment /> },
  normal: { color: '#3b82f6', icon: null },
}

function KOTCard({ kot, onStatusUpdate }) {
  const [updating, setUpdating] = useState(false)
  const config = STATUS_CONFIG[kot.status] || STATUS_CONFIG.pending
  const priorityConfig = PRIORITY_CONFIG[kot.priority] || PRIORITY_CONFIG.normal
  
  const elapsedMinutes = kot.created_at 
    ? Math.floor((Date.now() - new Date(kot.created_at).getTime()) / 60000) 
    : 0

  const handleStatusChange = async (newStatus) => {
    setUpdating(true)
    try {
      await onStatusUpdate(kot.id, newStatus)
    } finally {
      setUpdating(false)
    }
  }

  const getNextStatus = () => {
    const statusFlow = ['pending', 'preparing', 'ready', 'served']
    const currentIndex = statusFlow.indexOf(kot.status)
    return currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : null
  }

  const nextStatus = getNextStatus()

  return (
    <Card
      sx={{
        bgcolor: config.bgColor,
        border: `2px solid ${config.color}`,
        borderRadius: 2,
        transition: 'all 0.3s',
        position: 'relative',
        overflow: 'visible',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 8px 24px ${config.color}30` }
      }}
    >
      {updating && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0 }} />}
      
      {/* Header */}
      <Box sx={{ p: 2, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: config.color, width: 40, height: 40, fontWeight: 800 }}>
            {kot.order_id?.slice(-4) || 'KOT'}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>
              #{kot.order_id?.slice(-6)?.toUpperCase()}
            </Typography>
            <Chip 
              label={config.label} 
              size="small" 
              sx={{ 
                bgcolor: config.color, 
                color: '#fff', 
                fontWeight: 700, 
                fontSize: 10, 
                height: 20 
              }} 
            />
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {priorityConfig.icon && (
            <Tooltip title={`Priority: ${kot.priority}`}>
              <Box sx={{ color: priorityConfig.color }}>{priorityConfig.icon}</Box>
            </Tooltip>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: elapsedMinutes > 15 ? 'error.main' : 'text.secondary' }}>
            <AccessTime fontSize="small" />
            <Typography fontWeight={700} fontSize={14}>{elapsedMinutes}m</Typography>
          </Box>
        </Box>
      </Box>

      {/* Items */}
      <CardContent sx={{ pt: 1 }}>
        <Box sx={{ bgcolor: 'background.paper', borderRadius: 1.5, p: 1.5 }}>
          {kot.items?.map((item, idx) => (
            <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box 
                  sx={{ 
                    width: 8, height: 8, borderRadius: '50%', 
                    bgcolor: item.type === 'veg' ? '#22c55e' : '#ef4444' 
                  }} 
                />
                <Typography fontWeight={600} fontSize={14}>{item.name}</Typography>
              </Box>
              <Chip 
                label={`×${item.qty}`} 
                size="small" 
                sx={{ bgcolor: 'action.hover', fontWeight: 700, minWidth: 36 }} 
              />
            </Box>
          ))}
        </Box>
        
        {kot.notes && (
          <Box sx={{ mt: 1.5, p: 1, bgcolor: 'warning.light', borderRadius: 1, opacity: 0.8 }}>
            <Typography fontSize={12} fontWeight={600} color="warning.dark">
              Note: {kot.notes}
            </Typography>
          </Box>
        )}

        {/* Action Buttons */}
        {nextStatus && (
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={() => handleStatusChange(nextStatus)}
            disabled={updating}
            startIcon={nextStatus === 'preparing' ? <Kitchen /> : nextStatus === 'ready' ? <CheckCircle /> : <ArrowForward />}
            sx={{
              mt: 2,
              py: 1.5,
              fontWeight: 800,
              bgcolor: STATUS_CONFIG[nextStatus]?.color || 'primary.main',
              '&:hover': { bgcolor: STATUS_CONFIG[nextStatus]?.color, filter: 'brightness(0.9)' }
            }}
            data-testid={`kot-${kot.id}-${nextStatus}`}
          >
            {nextStatus === 'preparing' ? 'Start Cooking' : nextStatus === 'ready' ? 'Mark Ready' : 'Complete'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default function KitchenPage() {
  const dispatch = useDispatch()
  const user = useSelector(s => s.auth.user)
  const [kots, setKots] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('active')

  const fetchKOTs = useCallback(async () => {
    try {
      const statusParam = filter === 'active' ? '' : `?status=${filter}`
      const data = await apiClient.get(`/kot${statusParam}`)
      setKots(data)
    } catch (err) {
      console.error('Failed to fetch KOTs:', err)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchKOTs()
    const interval = setInterval(fetchKOTs, 10000) // Auto-refresh every 10s
    return () => clearInterval(interval)
  }, [fetchKOTs])

  // WebSocket for real-time updates
  useEffect(() => {
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ws/${user?.restaurant_id}?user_id=${user?.id}`
    let ws
    
    try {
      ws = new WebSocket(wsUrl)
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data)
        if (message.type === 'NEW_KOT') {
          setKots(prev => [message.data, ...prev])
          dispatch(showSnackbar({ message: 'New order received!', severity: 'info' }))
          // Play sound notification
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1NOTYwLSorLTA5QExgcYKQm6GlpqOhm5WPiYR+eHNuaWVhXltZV1ZVVFRTUlJSUlJSUlJSU1RVVlhbXmFlaW5ze4CEio+UmZ+jpqinnpaNgnVoW08/Myoj')
          audio.play().catch(() => {})
        } else if (message.type === 'KOT_STATUS_UPDATE') {
          setKots(prev => prev.map(k => k.id === message.data.id ? message.data : k))
        }
      }
    } catch (e) {
      console.log('WebSocket connection not available')
    }
    
    return () => ws?.close()
  }, [user, dispatch])

  const handleStatusUpdate = async (kotId, newStatus) => {
    try {
      await apiClient.put(`/kot/${kotId}/status`, { status: newStatus })
      setKots(prev => prev.map(k => k.id === kotId ? { ...k, status: newStatus } : k))
      dispatch(showSnackbar({ message: `Order marked as ${newStatus}`, severity: 'success' }))
    } catch (err) {
      dispatch(showSnackbar({ message: 'Failed to update order', severity: 'error' }))
    }
  }

  const pendingKots = kots.filter(k => k.status === 'pending')
  const preparingKots = kots.filter(k => k.status === 'preparing')
  const readyKots = kots.filter(k => k.status === 'ready')

  return (
    <Box sx={{ p: 3, minHeight: '100vh', bgcolor: 'background.default' }} data-testid="kitchen-page">
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Kitchen sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight={900}>Kitchen Display</Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {['active', 'pending', 'preparing', 'ready'].map(f => (
              <Chip
                key={f}
                label={f.toUpperCase()}
                onClick={() => setFilter(f)}
                color={filter === f ? 'primary' : 'default'}
                sx={{ fontWeight: 700 }}
              />
            ))}
          </Box>
          <IconButton onClick={fetchKOTs} color="primary" data-testid="refresh-kot">
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'New Orders', count: pendingKots.length, color: '#FF3D01' },
          { label: 'Cooking', count: preparingKots.length, color: '#f59e0b' },
          { label: 'Ready to Serve', count: readyKots.length, color: '#10b981' },
        ].map(stat => (
          <Grid item xs={4} key={stat.label}>
            <Box sx={{ 
              p: 2, 
              bgcolor: `${stat.color}15`, 
              borderRadius: 2, 
              border: `2px solid ${stat.color}30`,
              textAlign: 'center' 
            }}>
              <Typography variant="h3" fontWeight={900} color={stat.color}>{stat.count}</Typography>
              <Typography fontWeight={600} color="text.secondary">{stat.label}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* KOT Columns */}
      {loading ? (
        <LinearProgress />
      ) : kots.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Restaurant sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" color="text.secondary" fontWeight={600}>
            No orders in kitchen
          </Typography>
          <Typography color="text.disabled">New orders will appear here automatically</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Pending Column */}
          <Grid item xs={12} md={4}>
            <Box sx={{ bgcolor: 'rgba(255,61,1,0.05)', borderRadius: 2, p: 2, minHeight: 400 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Badge badgeContent={pendingKots.length} color="error">
                  <Typography variant="h6" fontWeight={800} color="error.main">NEW ORDERS</Typography>
                </Badge>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {pendingKots.map(kot => (
                  <KOTCard key={kot.id} kot={kot} onStatusUpdate={handleStatusUpdate} />
                ))}
              </Box>
            </Box>
          </Grid>

          {/* Preparing Column */}
          <Grid item xs={12} md={4}>
            <Box sx={{ bgcolor: 'rgba(245,158,11,0.05)', borderRadius: 2, p: 2, minHeight: 400 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Badge badgeContent={preparingKots.length} color="warning">
                  <Typography variant="h6" fontWeight={800} color="warning.main">COOKING</Typography>
                </Badge>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {preparingKots.map(kot => (
                  <KOTCard key={kot.id} kot={kot} onStatusUpdate={handleStatusUpdate} />
                ))}
              </Box>
            </Box>
          </Grid>

          {/* Ready Column */}
          <Grid item xs={12} md={4}>
            <Box sx={{ bgcolor: 'rgba(16,185,129,0.05)', borderRadius: 2, p: 2, minHeight: 400 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Badge badgeContent={readyKots.length} color="success">
                  <Typography variant="h6" fontWeight={800} color="success.main">READY TO SERVE</Typography>
                </Badge>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {readyKots.map(kot => (
                  <KOTCard key={kot.id} kot={kot} onStatusUpdate={handleStatusUpdate} />
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>
      )}
    </Box>
  )
}
