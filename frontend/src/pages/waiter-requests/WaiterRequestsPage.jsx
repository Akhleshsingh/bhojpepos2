import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Button, TextField, Card, CardContent, Chip,
  Grid, IconButton, Tabs, Tab, Badge
} from '@mui/material'
import {
  Restaurant, CheckCircle, LocalDrink, Receipt, 
  Help, NavigateNext, Refresh
} from '@mui/icons-material'
import { showSnackbar } from '../../features/uiSlice'
import apiClient from '../../services/apiClient'
import { formatDateTime } from '../../utils/formatters'

export default function WaiterRequestsPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  
  const [requests, setRequests] = useState([])
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, high_urgency: 0 })
  const [loading, setLoading] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('pending')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchRequests()
    
    // Poll for new requests every 10 seconds
    const interval = setInterval(fetchRequests, 10000)
    return () => clearInterval(interval)
  }, [selectedStatus])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const params = { status: selectedStatus }
      const data = await apiClient.get('/waiter-requests', { params })
      setRequests(data.requests || [])
      setStats(data.stats || {})
    } catch (err) {
      console.error('Failed to fetch waiter requests', err)
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async (id) => {
    try {
      await apiClient.put(`/waiter-requests/${id}/resolve`)
      dispatch(showSnackbar({ message: 'Request resolved successfully', severity: 'success' }))
      fetchRequests()
    } catch (err) {
      dispatch(showSnackbar({ message: 'Failed to resolve request', severity: 'error' }))
    }
  }

  const handleGoToTable = (tableId, tableName) => {
    navigate('/tables', { state: { highlightTable: tableId } })
  }

  const filteredRequests = requests.filter(r => 
    r.table_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.request_type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getUrgencyColor = (urgency) => {
    switch(urgency) {
      case 'high': return '#b81c1c'
      case 'normal': return '#c2610a'
      case 'low': return '#186b35'
      default: return '#6b7280'
    }
  }

  const getRequestIcon = (type) => {
    switch(type) {
      case 'bill': return <Receipt />
      case 'water': return <LocalDrink />
      case 'service': return <Restaurant />
      default: return <Help />
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>Waiter Requests</Typography>
          <Typography sx={{ fontSize: 14, color: '#6b7280', mt: 0.5 }}>
            Real-time service requests from tables
          </Typography>
        </Box>
        <IconButton onClick={fetchRequests} sx={{ bgcolor: '#f3f4f6' }}>
          <Refresh />
        </IconButton>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#f0f9ff' }}>
            <CardContent>
              <Typography sx={{ fontSize: 13, color: '#6b7280', mb: 1 }}>Total Requests</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#fef3c7' }}>
            <CardContent>
              <Typography sx={{ fontSize: 13, color: '#6b7280', mb: 1 }}>Pending</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#c2610a' }}>{stats.pending}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#fee2e2' }}>
            <CardContent>
              <Typography sx={{ fontSize: 13, color: '#6b7280', mb: 1 }}>High Urgency</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#b81c1c' }}>{stats.high_urgency}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#d1fae5' }}>
            <CardContent>
              <Typography sx={{ fontSize: 13, color: '#6b7280', mb: 1 }}>Resolved Today</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#186b35' }}>{stats.resolved}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <TextField
          size="small"
          placeholder="Search by table or request type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: 300 }}
        />
        
        <Tabs value={selectedStatus} onChange={(e, v) => setSelectedStatus(v)}>
          <Tab 
            label={
              <Badge badgeContent={stats.pending} color="error">
                Pending
              </Badge>
            } 
            value="pending" 
          />
          <Tab label="Resolved" value="resolved" />
        </Tabs>
      </Box>

      {/* Requests Grid */}
      {filteredRequests.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Restaurant sx={{ fontSize: 64, color: '#d1d5db', mb: 2 }} />
          <Typography sx={{ color: '#9ca3af', fontSize: 16 }}>
            {selectedStatus === 'pending' ? 'No pending requests' : 'No resolved requests'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filteredRequests.map(request => (
            <Grid item xs={12} sm={6} md={4} key={request.id}>
              <Card 
                sx={{ 
                  '&:hover': { boxShadow: 3 },
                  borderLeft: `4px solid ${getUrgencyColor(request.urgency)}`
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: 2, 
                        bgcolor: '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: getUrgencyColor(request.urgency)
                      }}>
                        {getRequestIcon(request.request_type)}
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: 18, fontWeight: 700 }}>{request.table_name}</Typography>
                        <Typography sx={{ fontSize: 12, color: '#6b7280', textTransform: 'capitalize' }}>
                          {request.request_type}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Chip 
                      label={request.urgency} 
                      size="small"
                      sx={{ 
                        bgcolor: getUrgencyColor(request.urgency),
                        color: '#fff',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        fontSize: 10
                      }}
                    />
                  </Box>

                  {request.note && (
                    <Typography sx={{ fontSize: 14, color: '#6b7280', mb: 2, fontStyle: 'italic' }}>
                      "{request.note}"
                    </Typography>
                  )}

                  <Typography sx={{ fontSize: 12, color: '#9ca3af', mb: 2 }}>
                    {new Date(request.created_at).toLocaleTimeString()}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {request.status === 'pending' ? (
                      <>
                        <Button
                          fullWidth
                          size="small"
                          variant="contained"
                          startIcon={<CheckCircle />}
                          onClick={() => handleResolve(request.id)}
                          sx={{ bgcolor: '#186b35', '&:hover': { bgcolor: '#145028' } }}
                        >
                          Resolve
                        </Button>
                        <IconButton 
                          size="small"
                          onClick={() => handleGoToTable(request.table_id, request.table_name)}
                          sx={{ bgcolor: '#f3f4f6' }}
                        >
                          <NavigateNext />
                        </IconButton>
                      </>
                    ) : (
                      <Chip 
                        label={`Resolved by ${request.resolved_by}`}
                        size="small"
                        color="success"
                        sx={{ width: '100%' }}
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}
