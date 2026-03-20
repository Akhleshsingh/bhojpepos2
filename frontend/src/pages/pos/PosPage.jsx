import { useEffect, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box, Typography, AppBar, Toolbar, IconButton, Tooltip, Button,
  TextField, InputAdornment, Chip, Card, CardContent, Divider,
  Badge, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Avatar,
} from '@mui/material'
import {
  Search, Add, Remove, Delete, ShoppingCart, Pause, Payment,
  TableRestaurant, TakeoutDining, LocalShipping, ArrowBack,
  Close, CheckCircle, Receipt, Note, Person, PlaylistAdd, CreditCard,
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  addToCurrentOrder, removeFromCurrentOrder, updateItemQty,
  clearCurrentOrder, setOrderType, setOrderTable, holdOrder, createOrder,
} from '../../features/ordersSlice'
import { updateTable } from '../../features/tablesSlice'
import { fetchMenu } from '../../features/menuSlice'
import { showSnackbar, addActivityLog } from '../../features/uiSlice'
import SyncIndicator from '../../components/common/SyncIndicator'
import HeldOrdersPanel from '../../components/pos/HeldOrdersPanel'
import OrderNoteDialog from '../../components/pos/OrderNoteDialog'
import CustomerSelectDialog from '../../components/pos/CustomerSelectDialog'
import { ReceiptDialog } from '../../components/receipt/ReceiptDialog'
import { useDebounce } from '../../hooks/useDebounce'
import { formatCurrency, calcOrderTotals, getInitials } from '../../utils/formatters'
import { PAYMENT_METHODS } from '../../utils/constants'
import { printReceipt, printKOT } from '../../utils/printReceipt'
import apiClient from '../../services/apiClient'

const VEG_COLORS = { veg: '#186b35', 'non-veg': '#b81c1c', egg: '#7a5a00' }
const ORDER_TYPE_CFG = {
  dine:     { label: 'Dine In',  icon: <TableRestaurant sx={{ fontSize: 14 }} />, color: '#E8332A' },
  pickup:   { label: 'Pickup',   icon: <TakeoutDining   sx={{ fontSize: 14 }} />, color: '#1a4fcc' },
  delivery: { label: 'Delivery', icon: <LocalShipping   sx={{ fontSize: 14 }} />, color: '#186b35' },
}

/* ─── Payment Dialog ─── */
function PaymentDialog({ open, onClose, onConfirm, onStripePayment, orderTotals, loading }) {
  const [method, setMethod] = useState('cash')
  const [received, setReceived] = useState('')
  const change = method === 'cash' && received ? Math.max(0, parseFloat(received || 0) - orderTotals.total) : 0

  useEffect(() => { if (open) { setMethod('cash'); setReceived('') } }, [open])

  const handleConfirm = () => {
    if (method === 'stripe') {
      onStripePayment()
    } else {
      onConfirm(method)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        Collect Payment
        <IconButton size="small" onClick={onClose}><Close fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {/* Order total summary */}
        <Box sx={{ mb: 2.5, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
          {[['Subtotal', orderTotals.subtotal], ['Tax (5%)', orderTotals.tax]].map(([k, v]) => (
            <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography color="text.secondary" fontSize={13}>{k}</Typography>
              <Typography fontSize={13}>{formatCurrency(v)}</Typography>
            </Box>
          ))}
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography fontWeight={800} fontSize={18}>Total</Typography>
            <Typography fontWeight={900} fontSize={20} color="primary.main">{formatCurrency(orderTotals.total)}</Typography>
          </Box>
        </Box>

        {/* Payment method */}
        <Typography fontWeight={700} fontSize={12} color="text.secondary" sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Payment Method
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap' }}>
          {PAYMENT_METHODS.map(pm => (
            <Box key={pm.id} onClick={() => setMethod(pm.id)}
              sx={{ flex: '1 1 calc(33% - 8px)', minWidth: 80, p: 1.5, textAlign: 'center', cursor: 'pointer', borderRadius: 2, border: '2px solid',
                borderColor: method === pm.id ? 'primary.main' : 'divider',
                bgcolor: method === pm.id ? 'rgba(255,61,1,0.05)' : 'background.paper',
                transition: 'all 0.15s',
                boxShadow: method === pm.id ? '0 0 0 3px rgba(255,61,1,0.12)' : 'none',
              }}>
              <Typography fontSize={22} sx={{ mb: 0.5, lineHeight: 1 }}>{pm.icon}</Typography>
              <Typography fontWeight={700} fontSize={12} color={method === pm.id ? 'primary.main' : 'text.secondary'}>
                {pm.label}
              </Typography>
            </Box>
          ))}
          {/* Stripe Payment Option */}
          <Box onClick={() => setMethod('stripe')}
            sx={{ flex: '1 1 calc(33% - 8px)', minWidth: 80, p: 1.5, textAlign: 'center', cursor: 'pointer', borderRadius: 2, border: '2px solid',
              borderColor: method === 'stripe' ? '#635BFF' : 'divider',
              bgcolor: method === 'stripe' ? 'rgba(99,91,255,0.05)' : 'background.paper',
              transition: 'all 0.15s',
              boxShadow: method === 'stripe' ? '0 0 0 3px rgba(99,91,255,0.12)' : 'none',
            }}
            data-testid="stripe-payment-option">
            <CreditCard sx={{ fontSize: 22, color: method === 'stripe' ? '#635BFF' : 'text.secondary' }} />
            <Typography fontWeight={700} fontSize={12} color={method === 'stripe' ? '#635BFF' : 'text.secondary'}>
              Card (Stripe)
            </Typography>
          </Box>
        </Box>

        {/* Cash tendered */}
        {method === 'cash' && (
          <Box>
            <TextField fullWidth size="small" label="Cash Received (₹)" type="number"
              value={received} onChange={e => setReceived(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
              sx={{ mb: 1 }} autoFocus />
            {received && parseFloat(received) >= orderTotals.total && (
              <Box sx={{ p: 1.5, bgcolor: 'success.light', borderRadius: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography fontWeight={700} color="success.dark" fontSize={14}>Change to return</Typography>
                <Typography fontWeight={900} color="success.dark" fontSize={20}>{formatCurrency(change)}</Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Stripe info */}
        {method === 'stripe' && (
          <Box sx={{ p: 1.5, bgcolor: 'rgba(99,91,255,0.08)', borderRadius: 1.5, border: '1px solid rgba(99,91,255,0.2)' }}>
            <Typography fontSize={12} color="text.secondary">
              Customer will be redirected to secure Stripe checkout to complete payment with card.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" color="inherit" sx={{ flex: 1 }}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained" size="large"
          disabled={loading || (method === 'cash' && received && parseFloat(received) < orderTotals.total)}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : method === 'stripe' ? <CreditCard /> : <CheckCircle />}
          sx={{ flex: 2, py: 1.4, fontSize: 15, fontWeight: 800, 
            bgcolor: method === 'stripe' ? '#635BFF' : 'primary.main',
            boxShadow: method === 'stripe' ? '0 4px 16px rgba(99,91,255,0.35)' : '0 4px 16px rgba(255,61,1,0.35)',
            '&:hover': { bgcolor: method === 'stripe' ? '#4f46e5' : 'primary.dark' }
          }}
          data-testid="collect-payment-btn">
          {loading ? 'Processing…' : method === 'stripe' ? 'Pay with Stripe' : `Collect ${formatCurrency(orderTotals.total)}`}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

/* ─── Success Dialog ─── */
function SuccessDialog({ open, order, onNewOrder, onPrint }) {
  return (
    <Dialog open={open} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3, textAlign: 'center' } }}>
      <DialogContent sx={{ py: 4, px: 3 }}>
        <Box sx={{ width: 68, height: 68, borderRadius: '50%', bgcolor: 'rgba(24,107,53,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
          <CheckCircle sx={{ fontSize: 38, color: 'success.main' }} />
        </Box>
        <Typography variant="h6" fontWeight={900} sx={{ mb: 0.5 }}>Payment Successful! 🎉</Typography>
        {order && (
          <Typography color="text.secondary" fontSize={13} sx={{ mb: 2.5 }}>
            {order.orderNumber} · {formatCurrency(order.total)} · {order.paymentMethod?.toUpperCase()}
          </Typography>
        )}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Receipt />} onClick={onPrint} sx={{ flex: 1, fontWeight: 700 }}>
            Print
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={onNewOrder} sx={{ flex: 1, fontWeight: 700 }}>
            New Order
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Main POS Page ─── */
export default function PosPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { items: menu, loading: menuLoading } = useSelector(s => s.menu)
  const { currentOrder, heldOrders } = useSelector(s => s.orders)
  const user = useSelector(s => s.auth.user)

  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('All')
  const [payDialog, setPayDialog] = useState(false)
  const [successDialog, setSuccessDialog] = useState(false)
  const [heldPanel, setHeldPanel] = useState(false)
  const [noteDialog, setNoteDialog] = useState(false)
  const [custDialog, setCustDialog] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [lastOrder, setLastOrder] = useState(null)
  const [payLoading, setPayLoading] = useState(false)
  const [receiptDialog, setReceiptDialog] = useState(false)
  const [receiptData, setReceiptData] = useState(null)
  const [receiptLoading, setReceiptLoading] = useState(false)
  const [currentTableId, setCurrentTableId] = useState(null)

  const debouncedSearch = useDebounce(search, 180)

  useEffect(() => { dispatch(fetchMenu()) }, [dispatch])

  // Read table context from navigation state (when clicking from Tables page)
  useEffect(() => {
    if (location.state?.tableId) {
      setCurrentTableId(location.state.tableId)
      dispatch(setOrderType('dine'))
      dispatch(setOrderTable(location.state.tableName))
    }
  }, [location.state, dispatch])

  const categories = ['All', ...new Set(menu.map(i => i.category).filter(Boolean))]

  const filteredMenu = menu.filter(item => {
    const q = debouncedSearch.toLowerCase()
    return item.available &&
      (!q || item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)) &&
      (activeCat === 'All' || item.category === activeCat)
  })

  const orderTotals = calcOrderTotals(currentOrder.items)
  const itemCount = currentOrder.items.reduce((s, i) => s + i.qty, 0)

  const handleQty = useCallback((itemId, delta) => {
    const item = currentOrder.items.find(i => i.id === itemId)
    if (!item) return
    const newQty = item.qty + delta
    if (newQty <= 0) dispatch(removeFromCurrentOrder(itemId))
    else dispatch(updateItemQty({ id: itemId, qty: newQty }))
  }, [currentOrder.items, dispatch])

  const handlePay = async (paymentMethod) => {
    setPayLoading(true)
    const orderData = {
      ...currentOrder,
      ...orderTotals,
      paymentMethod,
      customerId: selectedCustomer?.id || null,
      customerName: selectedCustomer?.name || null,
      waiter: user?.name,
      orderNumber: `#${Math.floor(10000 + Math.random() * 90000)}`,
    }
    const result = await dispatch(createOrder(orderData))
    setPayLoading(false)

    if (createOrder.fulfilled.match(result)) {
      // Mark table as available after payment
      if (currentTableId) {
        try {
          await apiClient.put(`/tables/${currentTableId}`, { status: 'available', guestCount: 0 })
          dispatch(updateTable({ id: currentTableId, data: { status: 'available', guestCount: 0 } }))
        } catch (e) { console.log('Table status update failed:', e) }
        setCurrentTableId(null)
      }
      setLastOrder(result.payload)
      dispatch(clearCurrentOrder())
      setSelectedCustomer(null)
      setPayDialog(false)
      setSuccessDialog(true)
      dispatch(showSnackbar({ message: '🎉 Order placed successfully!', severity: 'success' }))
      dispatch(addActivityLog({
        action: 'ORDER_CREATED',
        description: `${currentOrder.orderType} order ${orderData.orderNumber} · ${formatCurrency(orderTotals.total)} · ${paymentMethod}`,
        module: 'POS',
      }))
      // Create KOT and auto-print
      try {
        await apiClient.post('/kot', {
          order_id: result.payload.id,
          items: result.payload.items,
          priority: 'normal',
          notes: result.payload.note
        })
      } catch (e) { console.log('KOT creation failed:', e) }
      printKOT(result.payload).catch(() => {})
    }
  }

  const handleStripePayment = async () => {
    setPayLoading(true)
    try {
      // First create the order
      const orderData = {
        ...currentOrder,
        ...orderTotals,
        paymentMethod: 'stripe',
        customerId: selectedCustomer?.id || null,
        customerName: selectedCustomer?.name || null,
        waiter: user?.name,
        orderNumber: `#${Math.floor(10000 + Math.random() * 90000)}`,
      }
      const result = await dispatch(createOrder(orderData))
      
      if (createOrder.fulfilled.match(result)) {
        // Create Stripe checkout session
        const response = await apiClient.post('/payments/checkout', {
          order_id: result.payload.id,
          origin_url: window.location.origin
        })
        
        if (response.url) {
          // Redirect to Stripe checkout
          window.location.href = response.url
        } else {
          throw new Error('Failed to create checkout session')
        }
      }
    } catch (err) {
      dispatch(showSnackbar({ message: `Payment failed: ${err.message}`, severity: 'error' }))
      setPayLoading(false)
    }
  }

  const handlePrintReceipt = async () => {
    if (lastOrder) {
      setReceiptLoading(true)
      try {
        const data = await apiClient.get(`/orders/${lastOrder.id}/receipt`)
        setReceiptData(data)
        setReceiptDialog(true)
      } catch (err) {
        // Fallback to local receipt
        printReceipt(lastOrder, { name: 'Bhojpe Restaurant' }).catch(() => {})
      }
      setReceiptLoading(false)
    }
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default', overflow: 'hidden' }}>

      {/* ── Top Bar ── */}
      <AppBar position="static" elevation={0}
        sx={{ bgcolor: 'background.paper', color: 'text.primary', borderBottom: '1.5px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Toolbar sx={{ gap: 1, minHeight: '58px !important', px: 2 }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '3px', mr: 0.5, flexShrink: 0 }}>
            {[22, 15, 9].map(w => <Box key={w} sx={{ width: w, height: 3, borderRadius: 1, bgcolor: 'primary.main' }} />)}
          </Box>
          <Box sx={{ lineHeight: 1, mr: 1, flexShrink: 0 }}>
            <Typography fontWeight={800} fontSize={17} sx={{ letterSpacing: '-0.5px' }}>Bhojpe</Typography>
            <Typography fontSize={9} color="text.disabled" fontWeight={500}>POS</Typography>
          </Box>
          <Box sx={{ width: 1.5, height: 28, bgcolor: 'divider', mx: 0.5, borderRadius: 1, flexShrink: 0 }} />

          {/* Order type pills */}
          <Box sx={{ display: 'flex', gap: 0.7 }}>
            {Object.entries(ORDER_TYPE_CFG).map(([type, cfg]) => (
              <Chip key={type} icon={cfg.icon} label={cfg.label} size="small" clickable
                onClick={() => dispatch(setOrderType(type))}
                sx={{ fontWeight: 700, fontSize: 11,
                  bgcolor: currentOrder.orderType === type ? cfg.color : 'action.hover',
                  color: currentOrder.orderType === type ? '#fff' : 'text.secondary',
                  border: '1.5px solid', borderColor: currentOrder.orderType === type ? cfg.color : 'divider',
                  boxShadow: currentOrder.orderType === type ? `0 2px 8px ${cfg.color}40` : 'none',
                }} />
            ))}
          </Box>

          <Box sx={{ flex: 1 }} />
          <SyncIndicator />

          {/* Customer chip */}
          {selectedCustomer ? (
            <Chip
              avatar={<Avatar sx={{ bgcolor: '#1a4fcc !important', fontSize: '11px !important', fontWeight: '800 !important' }}>{getInitials(selectedCustomer.name)}</Avatar>}
              label={selectedCustomer.name}
              onDelete={() => setSelectedCustomer(null)}
              size="small" variant="outlined"
              sx={{ fontWeight: 700, fontSize: 11, maxWidth: 130 }}
            />
          ) : (
            <Tooltip title="Attach customer">
              <IconButton size="small" onClick={() => setCustDialog(true)}
                sx={{ border: '1.5px solid', borderColor: 'divider', color: 'text.secondary' }}>
                <Person fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {/* Held orders badge */}
          <Tooltip title={heldOrders.length > 0 ? `${heldOrders.length} held order(s)` : 'No held orders'}>
            <span>
              <IconButton size="small" onClick={() => setHeldPanel(true)} disabled={heldOrders.length === 0}
                sx={{ border: '1.5px solid', borderColor: heldOrders.length > 0 ? 'warning.main' : 'divider', color: heldOrders.length > 0 ? 'warning.main' : 'text.disabled' }}>
                <Badge badgeContent={heldOrders.length || null} color="warning" sx={{ '& .MuiBadge-badge': { fontSize: 9, fontWeight: 900, minWidth: 14, height: 14 } }}>
                  <Pause fontSize="small" />
                </Badge>
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Back to Dashboard">
            <IconButton size="small" onClick={() => navigate('/dashboard')}
              sx={{ border: '1.5px solid', borderColor: 'divider', color: 'text.secondary' }}>
              <ArrowBack fontSize="small" />
            </IconButton>
          </Tooltip>

          <Avatar sx={{ width: 32, height: 32, bgcolor: user?.color || 'primary.main', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
            {getInitials(user?.name || 'U')}
          </Avatar>
        </Toolbar>
      </AppBar>

      {/* ── Body ── */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* LEFT — Menu panel */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1.5px solid', borderColor: 'divider', minWidth: 0 }}>

          {/* Search bar */}
          <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', flexShrink: 0 }}>
            <TextField fullWidth size="small" placeholder="Search menu…" value={search} onChange={e => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 17, color: 'text.disabled' }} /></InputAdornment>,
                endAdornment: search ? <InputAdornment position="end"><IconButton size="small" onClick={() => setSearch('')}><Close sx={{ fontSize: 16 }} /></IconButton></InputAdornment> : null,
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'action.hover' }, '& fieldset': { border: 'none' } }}
            />
          </Box>

          {/* Category tabs */}
          <Box sx={{ display: 'flex', gap: 0.8, p: 1, overflowX: 'auto', flexShrink: 0, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', '&::-webkit-scrollbar': { height: 0 } }}>
            {categories.map(cat => {
              const count = cat === 'All' ? menu.filter(i => i.available).length : menu.filter(i => i.category === cat && i.available).length
              return (
                <Chip key={cat} label={`${cat} (${count})`} size="small" clickable onClick={() => setActiveCat(cat)}
                  sx={{ flexShrink: 0, fontWeight: 700, fontSize: 11,
                    bgcolor: activeCat === cat ? 'primary.main' : 'action.hover',
                    color: activeCat === cat ? '#fff' : 'text.secondary',
                    border: '1.5px solid', borderColor: activeCat === cat ? 'primary.main' : 'transparent',
                  }} />
              )
            })}
          </Box>

          {/* Menu grid */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>
            {menuLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress /></Box>
            ) : filteredMenu.length === 0 ? (
              <Box sx={{ textAlign: 'center', pt: 8, color: 'text.disabled' }}>
                <Typography fontWeight={700}>No items found</Typography>
                <Typography fontSize={12.5}>Try a different search or category</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: 1.2 }}>
                {filteredMenu.map(item => {
                  const inCart = currentOrder.items.find(i => i.id === item.id)
                  const vegDot = VEG_COLORS[item.type]
                  return (
                    <Card key={item.id} onClick={() => dispatch(addToCurrentOrder(item))}
                      sx={{ cursor: 'pointer', border: '1.5px solid',
                        borderColor: inCart ? 'primary.main' : 'divider',
                        bgcolor: inCart ? 'rgba(255,61,1,0.025)' : 'background.paper',
                        transition: 'all 0.14s',
                        '&:hover': { borderColor: 'primary.main', boxShadow: '0 2px 14px rgba(255,61,1,0.14)', transform: 'translateY(-1px)' },
                        '&:active': { transform: 'scale(0.97)' },
                      }}>
                      <CardContent sx={{ p: '12px !important' }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.8, mb: 0.8 }}>
                          {/* Veg/non-veg indicator */}
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', border: `1.5px solid ${vegDot}`, mt: 0.3, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: vegDot }} />
                          </Box>
                          <Typography fontWeight={700} fontSize={12.5} sx={{ flex: 1, lineHeight: 1.35 }}>{item.name}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography fontWeight={900} fontSize={14} color="primary.main">{formatCurrency(item.price)}</Typography>
                          {inCart ? (
                            <Chip label={inCart.qty} size="small" color="primary"
                              sx={{ fontWeight: 900, height: 20, minWidth: 30, fontSize: 12 }} />
                          ) : (
                            <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: 'rgba(255,61,1,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main' }}>
                              <Add sx={{ fontSize: 14 }} />
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  )
                })}
              </Box>
            )}
          </Box>
        </Box>

        {/* RIGHT — Cart */}
        <Box sx={{ width: { xs: 290, sm: 330, md: 370 }, display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', flexShrink: 0, minHeight: 0 }}>

          {/* Cart header */}
          <Box sx={{ px: 2, py: 1.5, borderBottom: '1.5px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Badge badgeContent={itemCount || null} color="primary" sx={{ '& .MuiBadge-badge': { fontWeight: 800, fontSize: 10 } }}>
                <ShoppingCart sx={{ color: 'primary.main', fontSize: 20 }} />
              </Badge>
              <Typography fontWeight={800} fontSize={14}>Order</Typography>
              {currentOrder.tableNo && (
                <Chip label={`Table ${currentOrder.tableNo}`} size="small"
                  sx={{ fontWeight: 700, fontSize: 10, height: 20, bgcolor: 'rgba(255,61,1,0.08)', color: 'primary.main' }} />
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="Order note / table">
                <IconButton size="small" onClick={() => setNoteDialog(true)}
                  sx={{ color: currentOrder.note ? 'primary.main' : 'text.secondary', border: '1.5px solid', borderColor: currentOrder.note ? 'primary.main' : 'divider' }}>
                  <Note sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              {itemCount > 0 && (
                <Tooltip title="Hold order">
                  <IconButton size="small" onClick={() => { dispatch(holdOrder()); dispatch(showSnackbar({ message: '✋ Order held', severity: 'info' })) }}
                    sx={{ color: 'warning.main', border: '1.5px solid', borderColor: 'warning.light' }}>
                    <Pause sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              )}
              {itemCount > 0 && (
                <Tooltip title="Clear cart">
                  <IconButton size="small" onClick={() => dispatch(clearCurrentOrder())}
                    sx={{ color: 'error.light', border: '1.5px solid', borderColor: 'error.light', '&:hover': { bgcolor: 'error.light', color: '#fff' } }}>
                    <Delete sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>

          {/* Note preview */}
          {currentOrder.note && (
            <Box sx={{ px: 2, py: 1, bgcolor: 'rgba(255,61,1,0.04)', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
              <Typography fontSize={11.5} color="primary.main" fontWeight={600} noWrap>📝 {currentOrder.note}</Typography>
            </Box>
          )}

          {/* Cart items */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5, minHeight: 0 }}>
            {currentOrder.items.length === 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.disabled', gap: 1.5, py: 4 }}>
                <ShoppingCart sx={{ fontSize: 48, opacity: 0.2 }} />
                <Typography fontWeight={700} fontSize={14}>Cart is empty</Typography>
                <Typography fontSize={12.5} textAlign="center">Tap any menu item to add it</Typography>
              </Box>
            ) : (
              currentOrder.items.map(item => (
                <Box key={item.id}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1.2, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 'none' } }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography fontWeight={700} fontSize={13} noWrap>{item.name}</Typography>
                    <Typography fontSize={11.5} color="text.secondary">{formatCurrency(item.price)} × {item.qty}</Typography>
                  </Box>
                  {/* Qty controls */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                    <IconButton size="small" onClick={() => handleQty(item.id, -1)}
                      sx={{ width: 24, height: 24, bgcolor: 'action.hover', borderRadius: 1, '&:hover': { bgcolor: 'error.light', color: '#fff' } }}>
                      <Remove sx={{ fontSize: 13 }} />
                    </IconButton>
                    <Typography fontWeight={800} fontSize={13.5} sx={{ minWidth: 22, textAlign: 'center' }}>{item.qty}</Typography>
                    <IconButton size="small" onClick={() => handleQty(item.id, 1)}
                      sx={{ width: 24, height: 24, bgcolor: 'action.hover', borderRadius: 1, '&:hover': { bgcolor: 'primary.main', color: '#fff' } }}>
                      <Add sx={{ fontSize: 13 }} />
                    </IconButton>
                  </Box>
                  <Typography fontWeight={800} fontSize={13} sx={{ minWidth: 54, textAlign: 'right' }} color="primary.main">
                    {formatCurrency(item.price * item.qty)}
                  </Typography>
                </Box>
              ))
            )}
          </Box>

          {/* Totals + Pay */}
          {currentOrder.items.length > 0 && (
            <Box sx={{ p: 2, borderTop: '1.5px solid', borderColor: 'divider', flexShrink: 0 }}>
              <Box sx={{ mb: 1.5 }}>
                {[['Subtotal', orderTotals.subtotal], ['GST (5%)', orderTotals.tax]].map(([k, v]) => (
                  <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                    <Typography fontSize={12.5} color="text.secondary">{k}</Typography>
                    <Typography fontSize={12.5}>{formatCurrency(v)}</Typography>
                  </Box>
                ))}
                <Divider sx={{ my: 0.8 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography fontWeight={800} fontSize={16}>Total</Typography>
                  <Typography fontWeight={900} fontSize={18} color="primary.main">{formatCurrency(orderTotals.total)}</Typography>
                </Box>
              </Box>
              <Button fullWidth variant="contained" size="large" startIcon={<Payment />}
                onClick={() => setPayDialog(true)}
                sx={{ py: 1.5, fontSize: 15, fontWeight: 800, borderRadius: 2, boxShadow: '0 4px 16px rgba(255,61,1,0.35)', letterSpacing: '0.2px' }}>
                Pay {formatCurrency(orderTotals.total)}
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* ── Dialogs & Panels ── */}
      <PaymentDialog
        open={payDialog} onClose={() => setPayDialog(false)}
        onConfirm={handlePay} onStripePayment={handleStripePayment}
        orderTotals={orderTotals} loading={payLoading}
      />
      <SuccessDialog
        open={successDialog} order={lastOrder}
        onNewOrder={() => setSuccessDialog(false)}
        onPrint={() => { handlePrintReceipt(); setSuccessDialog(false) }}
      />
      <HeldOrdersPanel open={heldPanel} onClose={() => setHeldPanel(false)} />
      <OrderNoteDialog open={noteDialog} onClose={() => setNoteDialog(false)} />
      <CustomerSelectDialog
        open={custDialog} onClose={() => setCustDialog(false)}
        onSelect={(c) => { setSelectedCustomer(c); if (c) dispatch(showSnackbar({ message: `Customer: ${c.name}`, severity: 'info' })) }}
      />
      <ReceiptDialog
        open={receiptDialog}
        onClose={() => setReceiptDialog(false)}
        receipt={receiptData}
        loading={receiptLoading}
      />
    </Box>
  )
}
