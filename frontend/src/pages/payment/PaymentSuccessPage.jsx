import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Box, Typography, CircularProgress, Button, Card, Chip } from '@mui/material'
import { CheckCircle, Error, Refresh, Receipt, Home } from '@mui/icons-material'
import apiClient from '../../services/apiClient'

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('checking') // checking, success, failed, error
  const [transaction, setTransaction] = useState(null)
  const [attempts, setAttempts] = useState(0)
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (!sessionId) {
      setStatus('error')
      return
    }

    const checkPaymentStatus = async () => {
      try {
        const data = await apiClient.get(`/payments/status/${sessionId}`)
        setTransaction(data)

        if (data.payment_status === 'paid') {
          setStatus('success')
        } else if (data.status === 'expired') {
          setStatus('failed')
        } else if (attempts < 5) {
          // Continue polling
          setTimeout(() => setAttempts(a => a + 1), 2000)
        } else {
          setStatus('failed')
        }
      } catch (err) {
        console.error('Payment status check error:', err)
        if (attempts < 5) {
          setTimeout(() => setAttempts(a => a + 1), 2000)
        } else {
          setStatus('error')
        }
      }
    }

    checkPaymentStatus()
  }, [sessionId, attempts])

  const handleRetry = () => {
    setAttempts(0)
    setStatus('checking')
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 3,
      }}
      data-testid="payment-success-page"
    >
      <Card sx={{ maxWidth: 480, width: '100%', p: 4, textAlign: 'center', borderRadius: 3 }}>
        {status === 'checking' && (
          <>
            <CircularProgress size={64} sx={{ color: 'primary.main', mb: 3 }} />
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Verifying Payment...
            </Typography>
            <Typography color="text.secondary">
              Please wait while we confirm your payment
            </Typography>
          </>
        )}

        {status === 'success' && (
          <>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'success.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <CheckCircle sx={{ fontSize: 48, color: 'success.main' }} />
            </Box>
            <Typography variant="h4" fontWeight={800} color="success.main" gutterBottom>
              Payment Successful!
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Your order has been confirmed and sent to the kitchen.
            </Typography>

            {transaction && (
              <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 2, mb: 3, textAlign: 'left' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="text.secondary">Order</Typography>
                  <Typography fontWeight={700}>{transaction.order_number}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography color="text.secondary">Amount</Typography>
                  <Typography fontWeight={700}>₹{transaction.amount?.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Status</Typography>
                  <Chip label="PAID" size="small" color="success" sx={{ fontWeight: 700 }} />
                </Box>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Receipt />}
                onClick={() => navigate(`/orders`)}
                data-testid="view-orders-btn"
              >
                View Orders
              </Button>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Home />}
                onClick={() => navigate('/pos')}
                data-testid="new-order-btn"
              >
                New Order
              </Button>
            </Box>
          </>
        )}

        {status === 'failed' && (
          <>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'error.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <Error sx={{ fontSize: 48, color: 'error.main' }} />
            </Box>
            <Typography variant="h4" fontWeight={800} color="error.main" gutterBottom>
              Payment Failed
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Your payment could not be processed. Please try again.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleRetry}
              >
                Check Again
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={() => navigate('/pos')}
              >
                Back to POS
              </Button>
            </Box>
          </>
        )}

        {status === 'error' && (
          <>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'warning.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <Error sx={{ fontSize: 48, color: 'warning.main' }} />
            </Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Something went wrong
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              We couldn't verify your payment status. Please contact support if the issue persists.
            </Typography>

            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate('/pos')}
            >
              Back to POS
            </Button>
          </>
        )}
      </Card>
    </Box>
  )
}
