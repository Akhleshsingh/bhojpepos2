import { useSelector } from 'react-redux'
import { useState } from 'react'
import {
  Box, Typography, Grid, Card, CardContent, Paper, Divider,
  Tabs, Tab, Chip, Select, MenuItem, FormControl,
} from '@mui/material'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts'
import { TrendingUp, Receipt, People, Restaurant, AttachMoney } from '@mui/icons-material'
import StatCard from '../../components/common/StatCard'
import { formatCurrency } from '../../utils/formatters'

const weekly = [
  { day: 'Mon', revenue: 12400, orders: 42, avgOrder: 295 },
  { day: 'Tue', revenue: 15200, orders: 55, avgOrder: 276 },
  { day: 'Wed', revenue: 11800, orders: 38, avgOrder: 310 },
  { day: 'Thu', revenue: 18600, orders: 67, avgOrder: 277 },
  { day: 'Fri', revenue: 22400, orders: 82, avgOrder: 273 },
  { day: 'Sat', revenue: 28900, orders: 104, avgOrder: 278 },
  { day: 'Sun', revenue: 24100, orders: 88, avgOrder: 273 },
]

const monthly = [
  { month: 'Jan', revenue: 285000 }, { month: 'Feb', revenue: 312000 },
  { month: 'Mar', revenue: 298000 }, { month: 'Apr', revenue: 345000 },
  { month: 'May', revenue: 378000 }, { month: 'Jun', revenue: 412000 },
  { month: 'Jul', revenue: 433400 },
]

const topItems = [
  { name: 'Butter Chicken',        sold: 148, revenue: 47360, margin: 65 },
  { name: 'Chicken Biryani',       sold: 132, revenue: 46200, margin: 66 },
  { name: 'Paneer Butter Masala',  sold: 121, revenue: 33880, margin: 68 },
  { name: 'Dal Makhani',           sold: 98,  revenue: 21560, margin: 70 },
  { name: 'Chole Bhature',         sold: 87,  revenue: 13920, margin: 72 },
  { name: 'Garlic Naan',           sold: 246, revenue: 14760, margin: 75 },
]

const catData = [
  { name: 'Main Course',   value: 42, color: '#E8332A' },
  { name: 'Beverages',     value: 20, color: '#1a4fcc' },
  { name: 'Starters',      value: 18, color: '#186b35' },
  { name: 'Rice & Biryani',value: 12, color: '#7a5a00' },
  { name: 'Breads',        value: 8,  color: '#7e22ce' },
]

const paymentData = [
  { name: 'UPI',  value: 48, color: '#1a4fcc' },
  { name: 'Cash', value: 31, color: '#186b35' },
  { name: 'Card', value: 21, color: '#E8332A' },
]

const orderTypeData = [
  { name: 'Dine In',  value: 58, color: '#E8332A' },
  { name: 'Pickup',   value: 22, color: '#7a5a00' },
  { name: 'Delivery', value: 20, color: '#186b35' },
]

const staffPerf = [
  { name: 'Raju Singh',   orders: 89, revenue: 24820, rating: 4.8 },
  { name: 'Arjun Sharma', orders: 76, revenue: 21280, rating: 4.6 },
  { name: 'Deepak Mishra',orders: 95, revenue: 26600, rating: 4.9 },
  { name: 'Pooja Verma',  orders: 210, revenue: 58800, rating: 4.7 },
]

function TabPanel({ children, value, index }) {
  return value === index ? <Box>{children}</Box> : null
}

const CUSTOM_TOOLTIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <Paper sx={{ p: 1.5, borderRadius: 2, border: '1.5px solid', borderColor: 'divider', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
      {label && <Typography fontWeight={700} fontSize={12} sx={{ mb: 0.5 }}>{label}</Typography>}
      {payload.map(p => (
        <Box key={p.dataKey} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.3 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.color }} />
          <Typography fontSize={12} fontWeight={600} color="text.secondary">{p.name}:</Typography>
          <Typography fontSize={12} fontWeight={800}>{typeof p.value === 'number' && p.value > 999 ? formatCurrency(p.value) : p.value}</Typography>
        </Box>
      ))}
    </Paper>
  )
}

export default function ReportsPage() {
  const orders = useSelector(s => s.orders.items)
  const customers = useSelector(s => s.customers.items)
  const staff = useSelector(s => s.staff.items)
  const menu = useSelector(s => s.menu.items)
  const [tab, setTab] = useState(0)
  const [period, setPeriod] = useState('week')

  const completedOrders = orders.filter(o => o.status === 'completed')
  const totalRevenue = completedOrders.reduce((s, o) => s + (o.total || 0), 0)
  const avgOrder = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0

  const stats = [
    { title: 'Total Revenue',  value: formatCurrency(totalRevenue || 133400), icon: <AttachMoney />, color: '#E8332A', trend: 'up', trendValue: '+18.2%', subtitle: 'vs last week' },
    { title: 'Total Orders',   value: orders.length || 476, icon: <Receipt />,    color: '#1a4fcc', trend: 'up', trendValue: '+12.5%' },
    { title: 'Avg Order Value',value: formatCurrency(avgOrder || 280), icon: <TrendingUp />, color: '#186b35' },
    { title: 'Customers',      value: customers.length || 142, icon: <People />,  color: '#7a5a00', trend: 'up', trendValue: '+8.3%' },
  ]

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Reports & Analytics</Typography>
          <Typography color="text.secondary" fontSize={13}>Business performance insights</Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <Select value={period} onChange={e => setPeriod(e.target.value)}>
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="week">This Week</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
            <MenuItem value="year">This Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Stats */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {stats.map((s, i) => <Grid item xs={6} sm={3} key={i}><StatCard {...s} /></Grid>)}
      </Grid>

      {/* Tabs */}
      <Paper sx={{ borderRadius: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          {['Revenue', 'Orders', 'Menu', 'Staff'].map((t, i) => (
            <Tab key={t} label={t} sx={{ fontWeight: 700, fontSize: 13, textTransform: 'none', minHeight: 48 }} />
          ))}
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Revenue tab */}
          <TabPanel value={tab} index={0}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} lg={8}>
                <Typography fontWeight={800} fontSize={14} sx={{ mb: 0.5 }}>Daily Revenue</Typography>
                <Typography color="text.secondary" fontSize={12} sx={{ mb: 2 }}>This week · Total {formatCurrency(133400)}</Typography>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={weekly}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E8332A" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#E8332A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fontWeight: 600 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<CUSTOM_TOOLTIP />} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#E8332A" strokeWidth={2.5} fill="url(#revGrad)" dot={{ r: 4, fill: '#E8332A', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </Grid>
              <Grid item xs={12} lg={4}>
                <Typography fontWeight={800} fontSize={14} sx={{ mb: 0.5 }}>Payment Methods</Typography>
                <Typography color="text.secondary" fontSize={12} sx={{ mb: 2 }}>Revenue split</Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={paymentData} cx="50%" cy="50%" outerRadius={72} paddingAngle={3} dataKey="value">
                      {paymentData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 12, fontWeight: 600 }}>{v}</span>} />
                    <Tooltip formatter={v => [`${v}%`, 'Share']} />
                  </PieChart>
                </ResponsiveContainer>
                <Divider sx={{ my: 2 }} />
                <Typography fontWeight={800} fontSize={14} sx={{ mb: 1 }}>Monthly Revenue</Typography>
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={monthly}>
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis hide />
                    <Tooltip formatter={v => [formatCurrency(v), 'Revenue']} />
                    <Line type="monotone" dataKey="revenue" stroke="#E8332A" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Orders tab */}
          <TabPanel value={tab} index={1}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={7}>
                <Typography fontWeight={800} fontSize={14} sx={{ mb: 2 }}>Orders per Day</Typography>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={weekly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fontWeight: 600 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip content={<CUSTOM_TOOLTIP />} />
                    <Bar dataKey="orders" name="Orders" fill="#1a4fcc" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Grid>
              <Grid item xs={12} md={5}>
                <Typography fontWeight={800} fontSize={14} sx={{ mb: 2 }}>Order Types</Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={orderTypeData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                      {orderTypeData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 12, fontWeight: 600 }}>{v}</span>} />
                    <Tooltip formatter={v => [`${v}%`, 'Share']} />
                  </PieChart>
                </ResponsiveContainer>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Menu tab */}
          <TabPanel value={tab} index={2}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={7}>
                <Typography fontWeight={800} fontSize={14} sx={{ mb: 2 }}>Top Selling Items</Typography>
                {topItems.map((item, i) => (
                  <Box key={i}>
                    {i > 0 && <Divider sx={{ my: 1.5 }} />}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography fontWeight={800} fontSize={13} color="text.disabled" sx={{ width: 22 }}>#{i + 1}</Typography>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography fontWeight={700} fontSize={13.5}>{item.name}</Typography>
                          <Typography fontWeight={700} fontSize={13} color="primary.main">{formatCurrency(item.revenue)}</Typography>
                        </Box>
                        <Box sx={{ height: 5, borderRadius: 3, bgcolor: 'action.hover', overflow: 'hidden' }}>
                          <Box sx={{ height: '100%', borderRadius: 3, bgcolor: 'primary.main', width: `${(item.sold / topItems[0].sold) * 100}%`, transition: 'width 0.6s ease' }} />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          <Typography fontSize={11.5} color="text.secondary">{item.sold} sold</Typography>
                          <Chip label={`${item.margin}% margin`} size="small" sx={{ height: 16, fontSize: 9, fontWeight: 700, bgcolor: 'success.light', color: 'success.dark' }} />
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Grid>
              <Grid item xs={12} md={5}>
                <Typography fontWeight={800} fontSize={14} sx={{ mb: 2 }}>Sales by Category</Typography>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={catData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                      {catData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 11, fontWeight: 600 }}>{v}</span>} />
                    <Tooltip formatter={v => [`${v}%`]} />
                  </PieChart>
                </ResponsiveContainer>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Staff tab */}
          <TabPanel value={tab} index={3}>
            <Typography fontWeight={800} fontSize={14} sx={{ mb: 2 }}>Staff Performance</Typography>
            {staffPerf.map((s, i) => (
              <Box key={i}>
                {i > 0 && <Divider sx={{ my: 1.5 }} />}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: `hsl(${i * 60},70%,50%)25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: `hsl(${i * 60},60%,35%)`, flexShrink: 0 }}>
                    {s.name.split(' ').map(w => w[0]).join('')}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography fontWeight={700} fontSize={13.5}>{s.name}</Typography>
                      <Typography fontWeight={700} color="primary.main">{formatCurrency(s.revenue)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <Chip label={`${s.orders} orders`} size="small" sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: 'rgba(26,79,204,0.1)', color: '#1a4fcc' }} />
                      <Chip label={`⭐ ${s.rating}`} size="small" sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: 'rgba(122,90,0,0.1)', color: '#7a5a00' }} />
                    </Box>
                  </Box>
                </Box>
              </Box>
            ))}
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  )
}
