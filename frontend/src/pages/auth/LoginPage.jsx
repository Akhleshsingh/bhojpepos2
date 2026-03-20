import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Typography, TextField, Button, InputAdornment, IconButton, Alert, CircularProgress, Chip, Tabs, Tab } from '@mui/material'
import { Person, Lock, Visibility, VisibilityOff, Dialpad, Business } from '@mui/icons-material'
import { loginAsync, registerAsync, clearError, ROLES } from '../../features/authSlice'
import { useNavigate } from 'react-router-dom'

const DEMO_USERS = [
  { role: 'admin', username: 'admin', password: 'demo123', color: '#E8332A', label: 'Admin' },
  { role: 'manager', username: 'manager', password: 'demo123', color: '#1a4fcc', label: 'Manager' },
  { role: 'cashier', username: 'cashier', password: 'demo123', color: '#186b35', label: 'Cashier' },
  { role: 'waiter', username: 'waiter', password: 'demo123', color: '#7a5a00', label: 'Waiter' },
  { role: 'chef', username: 'chef', password: 'demo123', color: '#7e22ce', label: 'Chef' },
  { role: 'super_admin', username: 'superadmin', password: 'admin123', color: '#b81c1c', label: 'Super Admin' },
]

function PasscodeInput({ onSubmit }) {
  const [code, setCode] = useState([])
  const add = (n) => { 
    if (code.length < 4) { 
      const c = [...code, n]
      setCode(c)
      if (c.length === 4) { 
        onSubmit(c.join(''))
        setTimeout(() => setCode([]), 400) 
      } 
    } 
  }
  const del = () => setCode(c => c.slice(0, -1))
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
        {[0,1,2,3].map(i => (
          <Box key={i} sx={{ 
            width: 18, height: 18, borderRadius: '50%', border: '2px solid', 
            borderColor: code[i] !== undefined ? '#E8332A' : 'divider', 
            bgcolor: code[i] !== undefined ? '#E8332A' : 'transparent', 
            transition: 'all 0.2s',
            transform: code[i] !== undefined ? 'scale(1.15)' : 'scale(1)',
            boxShadow: code[i] !== undefined ? '0 2px 8px rgba(255,61,1,0.4)' : 'none'
          }} />
        ))}
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, mb: 2 }}>
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <Button key={n} onClick={() => add(n)} variant="outlined" color="inherit"
            sx={{ py: 2, fontSize: 22, fontWeight: 700, borderRadius: 2, borderColor: 'divider', bgcolor: 'background.paper', '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' } }}>
            {n}
          </Button>
        ))}
        <Box />
        <Button onClick={() => add(0)} variant="outlined" color="inherit"
          sx={{ py: 2, fontSize: 22, fontWeight: 700, borderRadius: 2, borderColor: 'divider', bgcolor: 'background.paper', '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' } }}>
          0
        </Button>
        <Button onClick={del} variant="outlined" color="inherit"
          sx={{ py: 2, borderRadius: 2, borderColor: 'divider', bgcolor: 'background.paper', color: 'text.secondary', '&:hover': { color: 'error.main', borderColor: 'error.main' } }}>
          ⌫
        </Button>
      </Box>
    </Box>
  )
}

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector(s => s.auth)
  const [mode, setMode] = useState('login') // login or register
  const [tab, setTab] = useState(0)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  
  // Registration fields
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regUsername, setRegUsername] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [restaurantName, setRestaurantName] = useState('')

  const handleLogin = async (creds) => {
    dispatch(clearError())
    const result = await dispatch(loginAsync(creds))
    if (loginAsync.fulfilled.match(result)) navigate('/tables')
  }

  const handleRegister = async () => {
    dispatch(clearError())
    const result = await dispatch(registerAsync({
      name: regName,
      email: regEmail,
      username: regUsername,
      password: regPassword,
      restaurant_name: restaurantName,
      role: 'admin'
    }))
    if (registerAsync.fulfilled.match(result)) navigate('/tables')
  }

  const handlePasswordLogin = () => handleLogin({ username, password })
  const handlePasscode = (code) => handleLogin({ username: 'admin', password: code })
  const handleDemo = (u) => handleLogin({ username: u.username, password: u.password })

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
      {/* Left illustration */}
      <Box sx={{ flex: 1, display: { xs: 'none', md: 'flex' }, alignItems: 'center', justifyContent: 'center', bgcolor: 'background.paper', borderRight: '1px solid', borderColor: 'divider', p: 6 }}>
        <Box sx={{ textAlign: 'center', maxWidth: 420 }}>
          <Box sx={{ fontSize: 100, mb: 3 }}>🍽️</Box>
          <Typography variant="h3" fontWeight={900} color="text.primary" sx={{ mb: 1, letterSpacing: '-1px' }}>
            Bhojpe POSS
          </Typography>
          <Typography color="text.secondary" fontSize={16}>
            Complete Restaurant Point of Sale System — Manage orders, staff, reservations & more
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['POS', 'KOT', 'RBAC', 'Multi-tenant', 'Offline', 'WebSocket'].map(f => (
              <Chip key={f} label={f} size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(255,61,1,0.08)', color: 'primary.main', border: '1px solid rgba(255,61,1,0.2)' }} />
            ))}
          </Box>
        </Box>
      </Box>

      {/* Right login form */}
      <Box sx={{ width: { xs: '100%', md: '52%' }, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', bgcolor: 'background.default', overflowY: 'auto', p: { xs: 3, md: 6 } }}>
        <Box sx={{ width: '100%', maxWidth: 460, pt: 4 }}>
          
          {mode === 'login' ? (
            <>
              <Typography variant="h4" fontWeight={900} sx={{ mb: 0.5, letterSpacing: '-0.8px' }}>Welcome back 👋</Typography>
              <Typography color="text.secondary" sx={{ mb: 4 }}>Sign in to your restaurant dashboard</Typography>

              {/* Login type tabs */}
              <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
                {[{ label: 'Password', icon: <Lock />, key: 0 }, { label: 'Passcode', icon: <Dialpad />, key: 1 }].map(t => (
                  <Box key={t.key} onClick={() => setTab(t.key)} data-testid={`login-tab-${t.label.toLowerCase()}`}
                    sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, p: 2, borderRadius: 2, cursor: 'pointer', border: '2px solid', borderColor: tab === t.key ? 'primary.main' : 'divider', bgcolor: tab === t.key ? 'rgba(255,61,1,0.04)' : 'background.paper', transition: 'all 0.2s' }}>
                    <Box sx={{ width: 44, height: 44, borderRadius: '10px', bgcolor: tab === t.key ? 'rgba(255,61,1,0.1)' : 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tab === t.key ? 'primary.main' : 'text.secondary', transition: 'all 0.2s' }}>
                      {t.icon}
                    </Box>
                    <Typography fontSize={12.5} fontWeight={700} color={tab === t.key ? 'primary.main' : 'text.secondary'}>{t.label}</Typography>
                  </Box>
                ))}
              </Box>

              {error && <Alert severity="error" sx={{ mb: 2, fontWeight: 600 }} data-testid="login-error">{error}</Alert>}

              {tab === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <TextField fullWidth placeholder="Username or Email" value={username} onChange={e => setUsername(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                    sx={{ mb: 1.5 }} data-testid="login-username" />
                  <TextField fullWidth placeholder="Password" type={showPass ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePasswordLogin()}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><Lock sx={{ color: 'text.disabled' }} /></InputAdornment>,
                      endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowPass(!showPass)}>{showPass ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>,
                    }}
                    sx={{ mb: 2 }} data-testid="login-password" />
                  <Button fullWidth variant="contained" size="large" onClick={handlePasswordLogin} disabled={loading}
                    sx={{ py: 1.8, fontSize: 16, fontWeight: 800, borderRadius: 2, boxShadow: '0 4px 16px rgba(255,61,1,0.3)', mb: 0.5 }} data-testid="login-submit">
                    {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
                  </Button>
                </Box>
              ) : (
                <PasscodeInput onSubmit={handlePasscode} />
              )}

              {/* Demo credentials */}
              <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(255,61,1,0.04)', border: '1.5px solid rgba(255,61,1,0.15)', borderRadius: 2 }}>
                <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: 'primary.main', textTransform: 'uppercase', letterSpacing: '0.6px', mb: 1.5 }}>
                  Demo Credentials — Click to login
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {DEMO_USERS.map(u => (
                    <Button key={u.role} size="small" onClick={() => handleDemo(u)} data-testid={`demo-${u.role}`}
                      sx={{ fontSize: 11.5, fontWeight: 700, borderRadius: 1.5, bgcolor: `${u.color}15`, color: u.color, border: `1px solid ${u.color}30`, '&:hover': { bgcolor: `${u.color}25` } }}>
                      {u.label}
                    </Button>
                  ))}
                </Box>
                <Typography sx={{ fontSize: 11, color: 'text.disabled', mt: 1.5 }}>
                  Super Admin: <strong style={{ fontFamily: 'monospace', color: '#E8332A' }}>superadmin / admin123</strong>
                </Typography>
              </Box>

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography color="text.secondary" fontSize={13}>
                  Don't have an account?{' '}
                  <Button variant="text" onClick={() => setMode('register')} sx={{ fontWeight: 700 }}>
                    Register Restaurant
                  </Button>
                </Typography>
              </Box>
            </>
          ) : (
            <>
              <Typography variant="h4" fontWeight={900} sx={{ mb: 0.5, letterSpacing: '-0.8px' }}>Create Account 🚀</Typography>
              <Typography color="text.secondary" sx={{ mb: 4 }}>Register your restaurant to get started</Typography>

              {error && <Alert severity="error" sx={{ mb: 2, fontWeight: 600 }}>{error}</Alert>}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <TextField fullWidth placeholder="Your Name" value={regName} onChange={e => setRegName(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                  data-testid="register-name" />
                <TextField fullWidth placeholder="Email" type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)}
                  data-testid="register-email" />
                <TextField fullWidth placeholder="Username" value={regUsername} onChange={e => setRegUsername(e.target.value)}
                  data-testid="register-username" />
                <TextField fullWidth placeholder="Password" type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Lock sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                  data-testid="register-password" />
                <TextField fullWidth placeholder="Restaurant Name" value={restaurantName} onChange={e => setRestaurantName(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Business sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                  data-testid="register-restaurant" />
                <Button fullWidth variant="contained" size="large" onClick={handleRegister} disabled={loading}
                  sx={{ py: 1.8, fontSize: 16, fontWeight: 800, borderRadius: 2, boxShadow: '0 4px 16px rgba(255,61,1,0.3)', mt: 1 }}
                  data-testid="register-submit">
                  {loading ? <CircularProgress size={22} color="inherit" /> : 'Create Restaurant'}
                </Button>
              </Box>

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography color="text.secondary" fontSize={13}>
                  Already have an account?{' '}
                  <Button variant="text" onClick={() => setMode('login')} sx={{ fontWeight: 700 }}>
                    Sign In
                  </Button>
                </Typography>
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Box>
  )
}
