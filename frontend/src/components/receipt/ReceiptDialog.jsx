import { useState, useRef, forwardRef } from 'react'
import { Box, Typography, Divider, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material'
import { Print, Close, Download, QrCode } from '@mui/icons-material'
import { format } from 'date-fns'

const ReceiptContent = forwardRef(({ receipt, showQR = true }, ref) => {
  if (!receipt) return null

  const { restaurant, order, items, summary, footer } = receipt

  return (
    <Box
      ref={ref}
      sx={{
        width: 300,
        bgcolor: '#fff',
        color: '#000',
        p: 2,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 12,
      }}
    >
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography sx={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.5px' }}>
          {restaurant?.name || 'Bhojpe Restaurant'}
        </Typography>
        {restaurant?.address && (
          <Typography sx={{ fontSize: 10, color: '#666', mt: 0.5 }}>
            {restaurant.address}
          </Typography>
        )}
        {restaurant?.phone && (
          <Typography sx={{ fontSize: 10, color: '#666' }}>
            Tel: {restaurant.phone}
          </Typography>
        )}
        {restaurant?.gstin && (
          <Typography sx={{ fontSize: 9, color: '#888', mt: 0.5 }}>
            GSTIN: {restaurant.gstin}
          </Typography>
        )}
      </Box>

      <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

      {/* Order Info */}
      <Box sx={{ mb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography sx={{ fontSize: 11 }}>Order #:</Typography>
          <Typography sx={{ fontSize: 11, fontWeight: 700 }}>{order?.number}</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography sx={{ fontSize: 11 }}>Date:</Typography>
          <Typography sx={{ fontSize: 11 }}>
            {order?.date ? format(new Date(order.date), 'dd/MM/yyyy HH:mm') : '-'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography sx={{ fontSize: 11 }}>Type:</Typography>
          <Typography sx={{ fontSize: 11, textTransform: 'capitalize' }}>{order?.type}</Typography>
        </Box>
        {order?.table && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: 11 }}>Table:</Typography>
            <Typography sx={{ fontSize: 11 }}>{order.table}</Typography>
          </Box>
        )}
        {order?.waiter && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: 11 }}>Served by:</Typography>
            <Typography sx={{ fontSize: 11 }}>{order.waiter}</Typography>
          </Box>
        )}
        {order?.customer && order?.customer !== 'Walk-in' && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: 11 }}>Customer:</Typography>
            <Typography sx={{ fontSize: 11 }}>{order.customer}</Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

      {/* Items Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography sx={{ fontSize: 10, fontWeight: 700, flex: 2 }}>ITEM</Typography>
        <Typography sx={{ fontSize: 10, fontWeight: 700, width: 30, textAlign: 'center' }}>QTY</Typography>
        <Typography sx={{ fontSize: 10, fontWeight: 700, width: 50, textAlign: 'right' }}>AMT</Typography>
      </Box>

      <Divider sx={{ my: 0.5 }} />

      {/* Items */}
      {items?.map((item, idx) => (
        <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.3 }}>
          <Box sx={{ flex: 2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box 
              sx={{ 
                width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                bgcolor: item.type === 'veg' ? '#186b35' : '#b81c1c' 
              }} 
            />
            <Typography sx={{ fontSize: 11, lineHeight: 1.2 }} noWrap>
              {item.name}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 11, width: 30, textAlign: 'center' }}>{item.qty}</Typography>
          <Typography sx={{ fontSize: 11, width: 50, textAlign: 'right' }}>
            ₹{(item.price * item.qty).toFixed(2)}
          </Typography>
        </Box>
      ))}

      <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

      {/* Summary */}
      <Box sx={{ mb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography sx={{ fontSize: 11 }}>Subtotal:</Typography>
          <Typography sx={{ fontSize: 11 }}>₹{summary?.subtotal?.toFixed(2)}</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography sx={{ fontSize: 11 }}>Tax (GST):</Typography>
          <Typography sx={{ fontSize: 11 }}>₹{summary?.tax?.toFixed(2)}</Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 1 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 900 }}>TOTAL:</Typography>
        <Typography sx={{ fontSize: 14, fontWeight: 900 }}>₹{summary?.total?.toFixed(2)}</Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography sx={{ fontSize: 10 }}>Payment:</Typography>
        <Typography sx={{ fontSize: 10, textTransform: 'uppercase' }}>
          {summary?.payment_method} - {summary?.payment_status}
        </Typography>
      </Box>

      <Divider sx={{ borderStyle: 'dashed', my: 1 }} />

      {/* Footer */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography sx={{ fontSize: 11, fontWeight: 600 }}>
          {footer?.message || 'Thank you for dining with us!'}
        </Typography>
        <Typography sx={{ fontSize: 9, color: '#888', mt: 1 }}>
          Powered by Bhojpe POS
        </Typography>
      </Box>
    </Box>
  )
})

ReceiptContent.displayName = 'ReceiptContent'

export function ReceiptDialog({ open, onClose, receipt, loading }) {
  const receiptRef = useRef()

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const receiptHTML = receiptRef.current?.innerHTML || ''
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${receipt?.order?.number || 'Order'}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'JetBrains Mono', monospace;
              width: 80mm;
              padding: 10px;
            }
            @media print {
              body { width: 80mm; }
            }
          </style>
        </head>
        <body>${receiptHTML}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
      printWindow.close()
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography fontWeight={700}>Receipt</Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', justifyContent: 'center', bgcolor: '#f5f5f5', py: 3 }}>
        {loading ? (
          <Typography>Loading receipt...</Typography>
        ) : (
          <ReceiptContent ref={receiptRef} receipt={receipt} />
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button variant="outlined" startIcon={<Download />} onClick={onClose}>
          Download
        </Button>
        <Button variant="contained" startIcon={<Print />} onClick={handlePrint} data-testid="print-receipt-btn">
          Print Receipt
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ReceiptContent
