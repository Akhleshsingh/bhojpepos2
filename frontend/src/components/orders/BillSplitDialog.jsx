import { useState, useEffect } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Button, IconButton, Checkbox, Chip, Divider,
  TextField, Select, MenuItem, FormControl, InputLabel, CircularProgress
} from '@mui/material'
import { Close, Add, Remove, Receipt, AttachMoney } from '@mui/icons-material'
import { formatCurrency } from '../../utils/formatters'
import apiClient from '../../services/apiClient'

export default function BillSplitDialog({ open, onClose, order, onSplit }) {
  const [splits, setSplits] = useState([{ items: [], payment_method: 'cash' }])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && order) {
      // Initialize with one split containing all items
      setSplits([{ items: order.items?.map(i => i.id) || [], payment_method: 'cash' }])
    }
  }, [open, order])

  const addSplit = () => {
    setSplits([...splits, { items: [], payment_method: 'cash' }])
  }

  const removeSplit = (index) => {
    if (splits.length > 1) {
      setSplits(splits.filter((_, i) => i !== index))
    }
  }

  const toggleItem = (splitIndex, itemId) => {
    setSplits(splits.map((split, i) => {
      if (i === splitIndex) {
        const items = split.items.includes(itemId)
          ? split.items.filter(id => id !== itemId)
          : [...split.items, itemId]
        return { ...split, items }
      }
      // Remove from other splits
      return { ...split, items: split.items.filter(id => id !== itemId) }
    }))
  }

  const updatePaymentMethod = (index, method) => {
    setSplits(splits.map((split, i) => i === index ? { ...split, payment_method: method } : split))
  }

  const calculateSplitTotal = (splitItems) => {
    const items = order?.items?.filter(i => splitItems.includes(i.id)) || []
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0)
    const tax = subtotal * 0.05
    return { subtotal, tax, total: subtotal + tax, itemCount: items.length }
  }

  const handleSplit = async () => {
    // Validate all items are assigned
    const allAssignedItems = splits.flatMap(s => s.items)
    const allItemIds = order?.items?.map(i => i.id) || []
    const unassigned = allItemIds.filter(id => !allAssignedItems.includes(id))
    
    if (unassigned.length > 0) {
      alert('Please assign all items to a split')
      return
    }

    setLoading(true)
    try {
      await apiClient.post(`/orders/${order.id}/split`, { order_id: order.id, splits })
      onSplit?.()
      onClose()
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  if (!order) return null

  const paymentMethods = [
    { value: 'cash', label: 'Cash', icon: '💵' },
    { value: 'card', label: 'Card', icon: '💳' },
    { value: 'upi', label: 'UPI', icon: '📱' },
  ]

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Receipt color="primary" />
          Split Bill - {order.orderNumber}
        </Box>
        <IconButton size="small" onClick={onClose}><Close /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', gap: 3 }}>
          {/* Order Items */}
          <Box sx={{ flex: 1, minWidth: 280 }}>
            <Typography fontWeight={700} color="text.secondary" fontSize={12} sx={{ mb: 1.5, textTransform: 'uppercase' }}>
              Order Items
            </Typography>
            <Box sx={{ bgcolor: '#f9fafb', borderRadius: 2, p: 2 }}>
              {order.items?.map((item, idx) => {
                const assignedTo = splits.findIndex(s => s.items.includes(item.id))
                return (
                  <Box key={item.id || idx} sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    py: 1,
                    borderBottom: idx < order.items.length - 1 ? '1px solid #e5e7eb' : 'none'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ 
                        width: 8, height: 8, borderRadius: '50%', 
                        bgcolor: item.type === 'veg' ? '#22c55e' : '#ef4444' 
                      }} />
                      <Box>
                        <Typography fontWeight={600} fontSize={13}>{item.name}</Typography>
                        <Typography fontSize={11} color="text.secondary">
                          {item.qty} × {formatCurrency(item.price)}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography fontWeight={700} fontSize={13}>
                        {formatCurrency(item.price * item.qty)}
                      </Typography>
                      {assignedTo >= 0 && (
                        <Chip 
                          label={`Split ${assignedTo + 1}`} 
                          size="small" 
                          sx={{ 
                            height: 20, 
                            fontSize: 10, 
                            fontWeight: 700,
                            bgcolor: ['#fef3c7', '#dbeafe', '#d1fae5', '#fce7f3'][assignedTo % 4],
                            color: ['#92400e', '#1e40af', '#065f46', '#9d174d'][assignedTo % 4]
                          }} 
                        />
                      )}
                    </Box>
                  </Box>
                )
              })}
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography fontWeight={700}>Total</Typography>
                <Typography fontWeight={800} color="primary.main">{formatCurrency(order.total)}</Typography>
              </Box>
            </Box>
          </Box>

          {/* Splits */}
          <Box sx={{ flex: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography fontWeight={700} color="text.secondary" fontSize={12} sx={{ textTransform: 'uppercase' }}>
                Bill Splits ({splits.length})
              </Typography>
              <Button size="small" startIcon={<Add />} onClick={addSplit} sx={{ fontSize: 11 }}>
                Add Split
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {splits.map((split, splitIndex) => {
                const totals = calculateSplitTotal(split.items)
                const splitColors = ['#fef3c7', '#dbeafe', '#d1fae5', '#fce7f3']
                const splitBorders = ['#fcd34d', '#93c5fd', '#6ee7b7', '#f9a8d4']
                
                return (
                  <Box 
                    key={splitIndex} 
                    sx={{ 
                      border: `2px solid ${splitBorders[splitIndex % 4]}`,
                      bgcolor: splitColors[splitIndex % 4],
                      borderRadius: 2,
                      p: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography fontWeight={800}>Split {splitIndex + 1}</Typography>
                      {splits.length > 1 && (
                        <IconButton size="small" onClick={() => removeSplit(splitIndex)}>
                          <Remove fontSize="small" />
                        </IconButton>
                      )}
                    </Box>

                    {/* Item selection */}
                    <Box sx={{ mb: 2 }}>
                      <Typography fontSize={11} color="text.secondary" sx={{ mb: 1 }}>
                        Select items for this split:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {order.items?.map((item, idx) => (
                          <Chip
                            key={item.id || idx}
                            label={`${item.qty}x ${item.name}`}
                            size="small"
                            onClick={() => toggleItem(splitIndex, item.id)}
                            sx={{
                              bgcolor: split.items.includes(item.id) ? '#1f2937' : '#fff',
                              color: split.items.includes(item.id) ? '#fff' : '#374151',
                              fontWeight: 600,
                              fontSize: 10,
                              cursor: 'pointer',
                              '&:hover': { opacity: 0.8 }
                            }}
                          />
                        ))}
                      </Box>
                    </Box>

                    {/* Payment method */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                      {paymentMethods.map(pm => (
                        <Button
                          key={pm.value}
                          size="small"
                          variant={split.payment_method === pm.value ? 'contained' : 'outlined'}
                          onClick={() => updatePaymentMethod(splitIndex, pm.value)}
                          sx={{
                            flex: 1,
                            fontSize: 11,
                            fontWeight: 600,
                            bgcolor: split.payment_method === pm.value ? '#1f2937' : 'transparent',
                            borderColor: '#d1d5db'
                          }}
                        >
                          {pm.icon} {pm.label}
                        </Button>
                      ))}
                    </Box>

                    {/* Split total */}
                    <Box sx={{ bgcolor: '#fff', borderRadius: 1.5, p: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span>Items: {totals.itemCount}</span>
                        <span>Subtotal: {formatCurrency(totals.subtotal)}</span>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'text.secondary' }}>
                        <span>Tax (5%)</span>
                        <span>{formatCurrency(totals.tax)}</span>
                      </Box>
                      <Divider sx={{ my: 0.5 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                        <span>Total</span>
                        <span>{formatCurrency(totals.total)}</span>
                      </Box>
                    </Box>
                  </Box>
                )
              })}
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">Cancel</Button>
        <Button 
          onClick={handleSplit} 
          variant="contained" 
          size="large"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <AttachMoney />}
          sx={{ px: 4 }}
        >
          {loading ? 'Splitting...' : `Split into ${splits.length} Bills`}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
