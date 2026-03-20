import { useMemo, useEffect } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { useSelector } from 'react-redux'
import { getTheme } from './theme'
import AppRoutes from './routes'
import { syncManager } from './offline/syncManager'
import ErrorBoundary from './components/common/ErrorBoundary'

export default function App() {
  const themeMode = useSelector(s => s.ui.themeMode)
  const theme = useMemo(() => getTheme(themeMode), [themeMode])

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
