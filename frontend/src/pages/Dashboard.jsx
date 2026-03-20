import { useEffect } from 'react'
import { Box, Grid, Typography, Card, CardContent, Divider } from '@mui/material'
import { TrendingUp, Receipt, People, Restaurant, AttachMoney, BookOnline } from '@mui/icons-material'
import { useSelector, useDispatch } from 'react-redux'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { fetchOrders } from '../features/ordersSlice'
import { fetchStaff } from '../features/staffSlice'
import { fetchCustomers } from '../features/customersSlice'
import { fetchReservations } from '../features/reservationsSlice'
import StatCard from '../components/common/StatCard'
import { formatCurrency } from '../utils/formatters'

const revenueData = [
  { day: 'Mon', revenue: 12400, orders: 42 },
  { day: 'Tue', revenue: 15200, orders: 55 },
  { day: 'Wed', revenue: 11800, orders: 38 },
  { day: 'Thu', revenue: 18600, orders: 67 },
  { day: 'Fri', revenue: 22400, orders: 82 },
  { day: 'Sat', revenue: 28900, orders: 104 },
  { day: 'Sun', revenue: 24100, orders: 88 },
]

const categoryData = [
  { name: 'Main Course', value: 38, color: '#E8332A' },
  { name: 'Beverages', value: 22, color: '#1a4fcc' },
  { name: 'Starters', value: 18, color: '#186b35' },
  { name: 'Desserts', value: 12, color: '#7a5a00' },
  { name: 'Breads', value: 10, color: '#7e22ce' },
]

export default function Dashboard() {
  const dispatch = useDispatch()
  const orders = useSelector(s => s.orders.items)
  const staff = useSelector(s => s.staff.items)
  const customers = useSelector(s => s.customers.items)
  const reservations = useSelector(s => s.reservations.items)

  useEffect(() => {
    dispatch(fetchOrders())
    dispatch(fetchStaff())
    dispatch(fetchCustomers())
    dispatch(fetchReservations())
  }, [dispatch])

  const todayRevenue = orders.filter(o => o.status === 'completed').reduce((s, o) => s + (o.total || 0), 0)
  const pendingOrders = orders.filter(o => ['pending', 'preparing'].includes(o.status)).length
  const todayRes = reservations.filter(r => r.date === new Date().toISOString().split('T')[0]).length
  const activeStaff = staff.filter(s => s.status === 'active').length

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={800}>Dashboard</Typography>
        <Typography color="text.secondary" fontSize={13}>Welcome back! Here's what's happening today.</Typography>
      </Box>

      {/* Stats */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { title: "Today's Revenue", value: formatCurrency(todayRevenue || 24800), icon: <AttachMoney />, color: '#E8332A', trend: 'up', trendValue: '+12.5%', subtitle: 'vs yesterday' },
          { title: 'Active Orders', value: pendingOrders || 8, icon: <Receipt />, color: '#1a4fcc', subtitle: 'In progress' },
          { title: "Today's Reservations", value: todayRes || 12, icon: <BookOnline />, color: '#186b35', trend: 'up', trendValue: '+3', subtitle: 'vs last week' },
          { title: 'Active Staff', value: activeStaff || 6, icon: <People />, color: '#7a5a00', subtitle: 'On shift now' },
        ].map((stat, i) => (
          <Grid item xs={12} sm={6} lg={3} key={i}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent sx={{ pb: '16px !important' }}>
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography fontWeight={800} fontSize={15}>Weekly Revenue</Typography>
                  <Typography color="text.secondary" fontSize={12}>Last 7 days performance</Typography>
                </Box>
                <Typography fontWeight={800} color="primary.main" fontSize={18}>{formatCurrency(133400)}</Typography>
              </Box>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E8332A" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#E8332A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--mui-palette-divider)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fontWeight: 600 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => [formatCurrency(v), 'Revenue']} contentStyle={{ borderRadius: 10, fontWeight: 600 }} />
                  <Area type="monotone" dataKey="revenue" stroke="#E8332A" strokeWidth={2.5} fill="url(#revGrad)" dot={{ r: 4, fill: '#E8332A' }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ pb: '16px !important' }}>
              <Typography fontWeight={800} fontSize={15} sx={{ mb: 0.5 }}>Sales by Category</Typography>
              <Typography color="text.secondary" fontSize={12} sx={{ mb: 2 }}>Today's breakdown</Typography>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 12, fontWeight: 600 }}>{v}</span>} />
                  <Tooltip formatter={v => [`${v}%`, 'Share']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Orders & Active Reservations */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={7}>
          <Card>
            <CardContent>
              <Typography fontWeight={800} fontSize={15} sx={{ mb: 2 }}>Recent Orders</Typography>
              {orders.slice(0, 5).map((order, i) => (
                <Box key={order.id}>
                  {i > 0 && <Divider sx={{ my: 1.5 }} />}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: 'rgba(255,61,1,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Receipt sx={{ fontSize: 18, color: 'primary.main' }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={700} fontSize={13.5}>{order.orderNumber}</Typography>
                      <Typography color="text.secondary" fontSize={12} noWrap>
                        {order.items?.slice(0,2).map(i => i.name).join(', ')}{order.items?.length > 2 ? ` +${order.items.length - 2}` : ''}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                      <Typography fontWeight={700} fontSize={14} color="primary.main">{formatCurrency(order.total)}</Typography>
                      <Box sx={{ display: 'inline-block', px: 1, py: 0.3, borderRadius: 1, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px',
                        bgcolor: order.status === 'completed' ? 'success.light' : order.status === 'preparing' ? 'primary.light' : 'warning.light',
                        color: order.status === 'completed' ? 'success.dark' : order.status === 'preparing' ? 'primary.dark' : 'warning.dark' }}>
                        {order.status}
                      </Box>
                    </Box>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography fontWeight={800} fontSize={15} sx={{ mb: 2 }}>Today's Reservations</Typography>
              {reservations.filter(r => r.date === new Date().toISOString().split('T')[0]).slice(0, 4).map((res, i) => (
                <Box key={res.id}>
                  {i > 0 && <Divider sx={{ my: 1.5 }} />}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'rgba(26,79,204,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16, fontWeight: 800, color: '#1a4fcc' }}>
                      {res.guests}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={700} fontSize={13.5} noWrap>{res.name}</Typography>
                      <Typography color="text.secondary" fontSize={12}>{res.time} · Table {res.table || 'TBD'}</Typography>
                    </Box>
                    <Box sx={{ px: 1, py: 0.3, borderRadius: 1, fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                      bgcolor: res.status === 'confirmed' ? 'success.light' : 'warning.light',
                      color: res.status === 'confirmed' ? 'success.dark' : 'warning.dark' }}>
                      {res.status}
                    </Box>
                  </Box>
                </Box>
              ))}
              {reservations.filter(r => r.date === new Date().toISOString().split('T')[0]).length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.disabled' }}>
                  <BookOnline sx={{ fontSize: 40, mb: 1, opacity: 0.4 }} />
                  <Typography fontSize={13} fontWeight={600}>No reservations today</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
// (Dashboard already complete — no append needed)
