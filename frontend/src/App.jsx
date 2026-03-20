import { useMemo, useEffect } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { useSelector } from 'react-redux'
import { createTheme } from '@mui/material/styles'
import { muiThemeOverride } from './theme/bhojpeTheme'
import AppRoutes from './routes'
import { syncManager } from './offline/syncManager'
import ErrorBoundary from './components/common/ErrorBoundary'

export default function App() {
  const theme = useMemo(() => createTheme(muiThemeOverride), [])

  useEffect(() => {
    syncManager.init()
    return () => syncManager.destroy()
  }, [])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
    </ThemeProvider>
  )
}

