import { useState, useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useLocation } from 'react-router-dom'
import {
  Box, Typography, TextField, Button, IconButton, Badge, Chip,
  Select, MenuItem, FormControl, InputLabel, Card, CardMedia, CardContent,
  Divider, Radio, RadioGroup, FormControlLabel
} from '@mui/material'
import {
  Search, Add, Remove, Delete, Person, Restaurant, Print,
  LocalShipping
} from '@mui/icons-material'
import PosHeaderNew from '../../components/layout/PosHeaderNew'
import { fetchMenu } from '../../features/menuSlice'
import { createOrder } from '../../features/ordersSlice'
import { showSnackbar } from '../../features/uiSlice'
import { formatCurrency } from '../../utils/formatters'

// Menu item images mapping
const MENU_IMAGES = {
  curry: 'https://images.unsplash.com/photo-1595959524165-0d395008e55b?w=400',
  dal: 'https://images.unsplash.com/photo-1627366422957-3efa9c6df0fc?w=400',
  naan: 'https://images.unsplash.com/photo-1736680056361-6a2f6e35fa50?w=400',
  thali: 'https://images.unsplash.com/photo-1680993032090-1ef7ea9b51e5?w=400',
  shake: 'https://images.pexels.com/photos/3342301/pexels-photo-3342301.jpeg?w=400',
  smoothie: 'https://images.unsplash.com/photo-1687117792212-b218a3786b34?w=400',
  burger: 'https://images.unsplash.com/photo-1677825949038-9e2dea0620d0?w=400',
  sandwich: 'https://images.unsplash.com/photo-1592887774222-f7f78818a60e?w=400',
  default: 'https://images.unsplash.com/photo-1595959524165-0d395008e55b?w=400'
}

function getImageForItem(item) {
  const name = item.name.toLowerCase()
  if (name.includes('shake') || name.includes('lassi')) return MENU_IMAGES.shake
  if (name.includes('burger')) return MENU_IMAGES.burger
  if (name.includes('sandwich')) return MENU_IMAGES.sandwich
  if (name.includes('naan') || name.includes('roti')) return MENU_IMAGES.naan
  if (name.includes('dal')) return MENU_IMAGES.dal
  if (name.includes('paneer') || name.includes('curry')) return MENU_IMAGES.curry
  return MENU_IMAGES.default
}

export default function PosPageNew() {
  const dispatch = useDispatch()
  const location = useLocation()
  
  const menu = useSelector(s => s.menu.items)
  const user = useSelector(s => s.auth.user)
  
  const [cart, setCart] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All Items')
  const [filterVeg, setFilterVeg] = useState(null) // null = all, true = veg, false = non-veg
  const [orderType, setOrderType] = useState('dine') // dine, pickup, delivery
  const [tableNo, setTableNo] = useState('')
  const [pax, setPax] = useState(1)
  const [waiter, setWaiter] = useState(user?.name || '')
  const [customerDetails, setCustomerDetails] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('cash')

  const tableInfo = location.state

  useEffect(() => {
    dispatch(fetchMenu())
    if (tableInfo?.tableId) {
      setTableNo(tableInfo.tableName)
    }
  }, [dispatch, tableInfo])

  // Group menu by category
  const categories = useMemo(() => {
    const cats = {}
    menu.forEach(item => {
      const cat = item.category || 'Other'
      if (!cats[cat]) cats[cat] = []
      cats[cat].push(item)
    })
    return cats
  }, [menu])

  const categoryList = [
    { name: 'All Items', count: menu.length },
    ...Object.keys(categories).map(cat => ({
      name: cat,
      count: categories[cat].length
    }))
  ]

  // Filter menu items
  const filteredMenu = useMemo(() => {
    let items = menu

    // Filter by category
    if (selectedCategory !== 'All Items') {
      items = items.filter(i => i.category === selectedCategory)
    }

    // Filter by veg/non-veg
    if (filterVeg !== null) {
      items = items.filter(i => i.type === (filterVeg ? 'veg' : 'non-veg'))
    }

    // Filter by search
    if (searchQuery) {
      items = items.filter(i => 
        i.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return items
  }, [menu, selectedCategory, filterVeg, searchQuery])

  const addToCart = (item) => {
    const existing = cart.find(c => c.id === item.id)
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c))
    } else {
      setCart([...cart, { ...item, qty: 1 }])
    }
  }

  const updateQty = (itemId, delta) => {
    setCart(cart.map(c => {
      if (c.id === itemId) {
        const newQty = c.qty + delta
        return newQty > 0 ? { ...c, qty: newQty } : null
      }
      return c
    }).filter(Boolean))
  }

  const removeFromCart = (itemId) => {
    setCart(cart.filter(c => c.id !== itemId))
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0)
  const tax = subtotal * 0.05
  const total = subtotal + tax

  const handlePlaceOrder = async (action = 'complete') => {
    if (cart.length === 0) {
      dispatch(showSnackbar({ message: 'Cart is empty', severity: 'warning' }))
      return
    }

    const orderData = {
      items: cart.map(c => ({ ...c, id: c.id })),
      orderType,
      tableNo,
      subtotal,
      tax,
      total,
      paymentMethod,
      status: action === 'hold' ? 'held' : action === 'draft' ? 'draft' : 'pending',
      waiter,
      pax
    }

    try {
      await dispatch(createOrder(orderData)).unwrap()
      dispatch(showSnackbar({ 
        message: `Order ${action === 'hold' ? 'held' : action === 'draft' ? 'saved as draft' : 'placed'} successfully`, 
        severity: 'success' 
      }))
      setCart([])
    } catch (err) {
      dispatch(showSnackbar({ message: 'Failed to place order', severity: 'error' }))
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>
      <PosHeaderNew />

      <Box sx={{ display: 'flex', height: 'calc(100vh - 65px)' }}>
        {/* Left Sidebar - Categories */}
        <Box 
          sx={{ 
            width: 200, 
            bgcolor: '#fff', 
            borderRight: '1px solid #e5e7eb',
            overflowY: 'auto',
            py: 2
          }}
        >
          <Typography sx={{ px: 2, pb: 1, fontSize: 11, fontWeight: 700, color: '#FF3D01', textTransform: 'uppercase' }}>
            Category
          </Typography>
          <Divider />
          <Box sx={{ pt: 1 }}>
            {categoryList.map(cat => (
              <Box
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                sx={{
                  px: 2,
                  py: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  bgcolor: selectedCategory === cat.name ? '#fef3c7' : 'transparent',
                  borderLeft: selectedCategory === cat.name ? '3px solid #FF3D01' : '3px solid transparent',
                  '&:hover': { bgcolor: '#f9fafb' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Restaurant sx={{ fontSize: 16, color: '#6b7280' }} />
                  <Typography sx={{ fontSize: 13, fontWeight: selectedCategory === cat.name ? 700 : 500, color: '#374151' }}>
                    {cat.name}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>
                  {cat.count}
                </Typography>
              </Box>
            ))}
          </Box>

          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ px: 2 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#6b7280', mb: 1 }}>MENU</Typography>
            <Typography sx={{ fontSize: 13, py: 1, color: '#9ca3af', cursor: 'pointer', '&:hover': { color: '#374151' } }}>
              All Items
            </Typography>
          </Box>
        </Box>

        {/* Main Content - Menu Items */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
          {/* Search & Filters */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <TextField
                size="small"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: '#9ca3af' }} />
                }}
                sx={{ flex: 1, maxWidth: 400 }}
              />

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant={filterVeg === true ? 'contained' : 'outlined'}
                  onClick={() => setFilterVeg(filterVeg === true ? null : true)}
                  sx={{
                    borderColor: '#22c55e',
                    color: filterVeg === true ? '#fff' : '#22c55e',
                    bgcolor: filterVeg === true ? '#22c55e' : 'transparent',
                    '&:hover': { bgcolor: filterVeg === true ? '#16a34a' : 'rgba(34, 197, 94, 0.1)' }
                  }}
                >
                  🟢 Veg
                </Button>
                <Button
                  size="small"
                  variant={filterVeg === false ? 'contained' : 'outlined'}
                  onClick={() => setFilterVeg(filterVeg === false ? null : false)}
                  sx={{
                    borderColor: '#ef4444',
                    color: filterVeg === false ? '#fff' : '#ef4444',
                    bgcolor: filterVeg === false ? '#ef4444' : 'transparent',
                    '&:hover': { bgcolor: filterVeg === false ? '#dc2626' : 'rgba(239, 68, 68, 0.1)' }
                  }}
                >
                  🔴 Non-Veg
                </Button>
              </Box>

              <Typography sx={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>
                {filteredMenu.length} Items
              </Typography>
            </Box>

            {/* Order Type Tabs */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              {['DINE IN', 'PICKUP', 'DELIVERY'].map(type => (
                <Button
                  key={type}
                  size="small"
                  variant={orderType === type.toLowerCase().replace(' ', '') ? 'contained' : 'outlined'}
                  onClick={() => setOrderType(type.toLowerCase().replace(' ', ''))}
                  sx={{
                    textTransform: 'uppercase',
                    fontSize: 11,
                    fontWeight: 700,
                    bgcolor: orderType === type.toLowerCase().replace(' ', '') ? '#FF3D01' : 'transparent',
                    color: orderType === type.toLowerCase().replace(' ', '') ? '#fff' : '#6b7280',
                    borderColor: '#e5e7eb',
                    '&:hover': {
                      bgcolor: orderType === type.toLowerCase().replace(' ', '') ? '#e63600' : '#f9fafb'
                    }
                  }}
                >
                  {type}
                </Button>
              ))}
            </Box>
          </Box>

          {/* Menu Grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 2 }}>
            {filteredMenu.map(item => (
              <Card
                key={item.id}
                sx={{
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                  }
                }}
                onClick={() => addToCart(item)}
              >
                <Box sx={{ position: 'relative' }}>
                  {item.available && Math.random() > 0.5 && (
                    <Chip
                      label="OFPOPULAR"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        bgcolor: '#ef4444',
                        color: '#fff',
                        fontSize: 9,
                        fontWeight: 700,
                        height: 20,
                        zIndex: 1
                      }}
                    />
                  )}
                  <CardMedia
                    component="img"
                    height="140"
                    image={getImageForItem(item)}
                    alt={item.name}
                    sx={{ objectFit: 'cover' }}
                  />
                </Box>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mb: 0.5 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        border: `2px solid ${item.type === 'veg' ? '#22c55e' : '#ef4444'}`,
                        flexShrink: 0,
                        mt: 0.3
                      }}
                    />
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#1f2937', lineHeight: 1.3 }}>
                      {item.name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#FF3D01' }}>
                      {formatCurrency(item.price)}
                    </Typography>
                    <IconButton size="small" sx={{ bgcolor: '#f3f4f6', '&:hover': { bgcolor: '#e5e7eb' } }}>
                      <Add fontSize="small" sx={{ color: '#374151' }} />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>

        {/* Right Sidebar - Order Panel */}
        <Box
          sx={{
            width: 350,
            bgcolor: '#fff',
            borderLeft: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Order Header */}
          <Box sx={{ p: 2, borderBottom: '1px solid #e5e7eb' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 800 }}>Order # 1</Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography sx={{ fontSize: 12, color: '#6b7280' }}>Pax</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#f3f4f6', borderRadius: 1 }}>
                  <IconButton size="small" onClick={() => setPax(Math.max(1, pax - 1))}>
                    <Remove fontSize="small" />
                  </IconButton>
                  <Typography sx={{ px: 1, fontSize: 14, fontWeight: 700 }}>{pax}</Typography>
                  <IconButton size="small" onClick={() => setPax(pax + 1)}>
                    <Add fontSize="small" />
                  </IconButton>
                </Box>
                <IconButton size="small">
                  <Restaurant fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            <FormControl fullWidth size="small" sx={{ mb: 1 }}>
              <InputLabel>Add Customer Details</InputLabel>
              <Select label="Add Customer Details">
                <MenuItem value="">None</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Select Waiter</InputLabel>
              <Select value={waiter} onChange={(e) => setWaiter(e.target.value)} label="Select Waiter">
                <MenuItem value={user?.name}>{user?.name}</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Cart Items */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
            {cart.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Restaurant sx={{ fontSize: 64, color: '#d1d5db', mb: 2 }} />
                <Typography sx={{ color: '#9ca3af', fontSize: 14 }}>
                  Cart khali hai
                </Typography>
                <Typography sx={{ color: '#d1d5db', fontSize: 12 }}>
                  Lail orde se items add karo
                </Typography>
              </Box>
            ) : (
              cart.map(item => (
                <Box key={item.id} sx={{ mb: 2, p: 1.5, bgcolor: '#f9fafb', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{item.name}</Typography>
                      <Typography sx={{ fontSize: 12, color: '#6b7280' }}>
                        {formatCurrency(item.price)} × {item.qty}
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => removeFromCart(item.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#fff', borderRadius: 1 }}>
                      <IconButton size="small" onClick={() => updateQty(item.id, -1)}>
                        <Remove fontSize="small" />
                      </IconButton>
                      <Typography sx={{ px: 2, fontSize: 14, fontWeight: 700 }}>{item.qty}</Typography>
                      <IconButton size="small" onClick={() => updateQty(item.id, 1)}>
                        <Add fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography sx={{ fontSize: 14, fontWeight: 800 }}>
                      {formatCurrency(item.price * item.qty)}
                    </Typography>
                  </Box>
                </Box>
              ))
            )}
          </Box>

          {/* Order Total */}
          <Box sx={{ p: 2, bgcolor: '#1f2937', color: '#fff' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ fontSize: 13 }}>Subtotal</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{formatCurrency(subtotal)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography sx={{ fontSize: 13 }}>GST (5%)</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{formatCurrency(tax)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 800 }}>Total</Typography>
              <Typography sx={{ fontSize: 18, fontWeight: 900 }}>{formatCurrency(total)}</Typography>
            </Box>

            <Divider sx={{ borderColor: '#374151', my: 2 }} />

            {/* Payment Method */}
            <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 1, color: '#9ca3af' }}>PAYMENT METHOD</Typography>
            <RadioGroup row value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              {['Cash', 'UPI', 'Card', 'Due', 'E-Bill'].map(method => (
                <Button
                  key={method}
                  size="small"
                  variant={paymentMethod === method.toLowerCase() ? 'contained' : 'outlined'}
                  onClick={() => setPaymentMethod(method.toLowerCase())}
                  sx={{
                    flex: 1,
                    textTransform: 'none',
                    fontSize: 11,
                    fontWeight: 700,
                    bgcolor: paymentMethod === method.toLowerCase() ? '#FF3D01' : 'transparent',
                    color: paymentMethod === method.toLowerCase() ? '#fff' : '#9ca3af',
                    borderColor: '#374151',
                    mr: method === 'E-Bill' ? 0 : 1,
                    '&:hover': {
                      bgcolor: paymentMethod === method.toLowerCase() ? '#e63600' : '#374151'
                    }
                  }}
                >
                  {method}
                </Button>
              ))}
            </RadioGroup>

            {/* Action Buttons */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 1, my: 2 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => handlePlaceOrder('hold')}
                sx={{
                  textTransform: 'none',
                  borderColor: '#374151',
                  color: '#9ca3af',
                  display: 'flex',
                  flexDirection: 'column',
                  py: 1,
                  '&:hover': { borderColor: '#6b7280', bgcolor: '#374151' }
                }}
              >
                <Restaurant fontSize="small" />
                <Typography sx={{ fontSize: 10, mt: 0.5 }}>Hold</Typography>
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => handlePlaceOrder('draft')}
                sx={{
                  textTransform: 'none',
                  borderColor: '#374151',
                  color: '#9ca3af',
                  display: 'flex',
                  flexDirection: 'column',
                  py: 1,
                  '&:hover': { borderColor: '#6b7280', bgcolor: '#374151' }
                }}
              >
                <Restaurant fontSize="small" />
                <Typography sx={{ fontSize: 10, mt: 0.5 }}>Draft</Typography>
              </Button>
              <Button
                variant="outlined"
                size="small"
                sx={{
                  textTransform: 'none',
                  borderColor: '#374151',
                  color: '#9ca3af',
                  display: 'flex',
                  flexDirection: 'column',
                  py: 1,
                  '&:hover': { borderColor: '#6b7280', bgcolor: '#374151' }
                }}
              >
                <Restaurant fontSize="small" />
                <Typography sx={{ fontSize: 10, mt: 0.5 }}>KOT</Typography>
              </Button>
              <Button
                variant="outlined"
                size="small"
                sx={{
                  textTransform: 'none',
                  borderColor: '#374151',
                  color: '#9ca3af',
                  display: 'flex',
                  flexDirection: 'column',
                  py: 1,
                  '&:hover': { borderColor: '#6b7280', bgcolor: '#374151' }
                }}
              >
                <Restaurant fontSize="small" />
                <Typography sx={{ fontSize: 9, mt: 0.5 }}>KOT Full</Typography>
              </Button>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                sx={{
                  textTransform: 'none',
                  borderColor: '#374151',
                  color: '#9ca3af',
                  fontWeight: 700,
                  '&:hover': { borderColor: '#6b7280', bgcolor: '#374151' }
                }}
              >
                <Restaurant sx={{ mr: 0.5, fontSize: 16 }} />
                Bill
              </Button>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                sx={{
                  textTransform: 'none',
                  borderColor: '#374151',
                  color: '#9ca3af',
                  fontWeight: 700,
                  '&:hover': { borderColor: '#6b7280', bgcolor: '#374151' }
                }}
              >
                <Print sx={{ mr: 0.5, fontSize: 16 }} />
                Bill & Print
              </Button>
            </Box>

            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={() => handlePlaceOrder('complete')}
              disabled={cart.length === 0}
              sx={{
                textTransform: 'none',
                bgcolor: '#ef4444',
                color: '#fff',
                fontWeight: 800,
                fontSize: 16,
                py: 1.5,
                '&:hover': { bgcolor: '#dc2626' }
              }}
            >
              Bill & Pay
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
