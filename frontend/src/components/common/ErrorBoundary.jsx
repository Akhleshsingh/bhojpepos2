import { Component } from 'react'
import { Box, Typography, Button, Paper } from '@mui/material'
import { BugReport, Refresh } from '@mui/icons-material'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, info: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    this.setState({ info })
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', p: 3 }}>
          <Paper sx={{ maxWidth: 480, width: '100%', p: 4, textAlign: 'center', borderRadius: 3, border: '1.5px solid', borderColor: 'error.light' }}>
            <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: 'error.light', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
              <BugReport sx={{ fontSize: 32, color: 'error.main' }} />
            </Box>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>Something went wrong</Typography>
            <Typography color="text.secondary" fontSize={13} sx={{ mb: 2 }}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </Typography>
            {import.meta.env.DEV && (
              <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1.5, textAlign: 'left', maxHeight: 120, overflowY: 'auto' }}>
                <Typography fontSize={11} fontFamily="monospace" color="error.main" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {this.state.info?.componentStack}
                </Typography>
              </Box>
            )}
            <Button variant="contained" startIcon={<Refresh />} onClick={() => { this.setState({ hasError: false, error: null, info: null }); window.location.reload() }}>
              Reload App
            </Button>
          </Paper>
        </Box>
      )
    }
    return this.props.children
  }
}
