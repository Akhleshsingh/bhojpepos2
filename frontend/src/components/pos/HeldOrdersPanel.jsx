import { Box, Typography, Chip, Button, Divider, Drawer, IconButton } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { restoreHeldOrder, clearCurrentOrder } from '../../features/ordersSlice'
import { showSnackbar } from '../../features/uiSlice'
import { Close, AccessTime, ShoppingCart } from '@mui/icons-material'
import { formatCurrency } from '../../utils/formatters'

export default function HeldOrdersPanel({ open, onClose }) {
  const dispatch = useDispatch()
  const { heldOrders } = useSelector(s => s.orders)

  const handleRestore = (id) => {
    dispatch(restoreHeldOrder(id))
    dispatch(showSnackbar({ message: 'Order restored to cart', severity: 'info' }))
    onClose()
  }

  const elapsed = (ts) => {
    const m = Math.floor((Date.now() - new Date(ts)) / 60000)
    return m < 1 ? 'Just now' : `${m}m ago`
  }

  return (
    <Drawer anchor="right" open={open} onClose={onClose}
      PaperProps={{ sx: { width: 320, bgcolor: 'background.paper', p: 0 } }}>
      <Box sx={{ p: 2.5, borderBottom: '1.5px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography fontWeight={800} fontSize={15}>Held Orders</Typography>
          <Typography color="text.secondary" fontSize={12}>{heldOrders.length} order{heldOrders.length !== 1 ? 's' : ''} on hold</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}><Close fontSize="small" /></IconButton>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>
        {heldOrders.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: 'text.disabled' }}>
            <ShoppingCart sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
            <Typography fontWeight={600} fontSize={13}>No held orders</Typography>
          </Box>
        ) : (
          heldOrders.map((order) => (
            <Box key={order.id} sx={{ mb: 1.5, p: 2, border: '1.5px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'action.hover' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Chip label={order.orderType} size="small"
                  sx={{ fontWeight: 700, fontSize: 10, textTransform: 'capitalize', bgcolor: 'rgba(255,61,1,0.1)', color: 'primary.main' }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                  <AccessTime sx={{ fontSize: 12 }} />
                  <Typography fontSize={11} fontWeight={600}>{elapsed(order.heldAt)}</Typography>
                </Box>
              </Box>
              <Typography fontSize={12.5} color="text.secondary" sx={{ mb: 1 }} noWrap>
                {order.items.map(i => `${i.qty}× ${i.name}`).join(', ')}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography fontWeight={800} fontSize={14} color="primary.main">
                  {formatCurrency(order.items.reduce((s, i) => s + i.price * i.qty, 0))}
                </Typography>
                <Button size="small" variant="contained" onClick={() => handleRestore(order.id)}
                  sx={{ fontSize: 11, fontWeight: 700, py: 0.5, px: 1.5 }}>
                  Restore
                </Button>
              </Box>
            </Box>
          ))
        )}
      </Box>
    </Drawer>
  )
}
