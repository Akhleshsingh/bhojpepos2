import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box, Typography, Grid, Card, CardContent, TextField, Button,
  Switch, FormControlLabel, Select, MenuItem, FormControl, InputLabel,
  Divider, List, ListItem, ListItemText, ListItemSecondaryAction,
  Chip, Paper, Tabs, Tab, Avatar, Badge,
} from '@mui/material'
import {
  Save, Business, Print, Language, Palette, Security,
  Storage, VerifiedUser, Notifications,
} from '@mui/icons-material'
import { toggleTheme, setLanguage, showSnackbar } from '../../features/uiSlice'
import { LANGUAGES, ROLES } from '../../utils/constants'
import { useRole } from '../../hooks/usePermission'
import { syncPendingChanges } from '../../features/syncSlice'
import { PERMISSIONS } from '../../features/authSlice'

function TabPanel({ children, value, index }) {
  return value === index ? <Box>{children}</Box> : null
}

export default function SettingsPage() {
  const dispatch = useDispatch()
  const themeMode = useSelector(s => s.ui.themeMode)
  const currentLang = useSelector(s => s.ui.currentLang)
  const { pendingCount, lastSyncAt, isSyncing } = useSelector(s => s.sync)
  const isOnline = useSelector(s => s.ui.isOnline)
  const activityLog = useSelector(s => s.ui.activityLog)
  const role = useRole()

  const [tab, setTab] = useState(0)
  const [form, setForm] = useState({
    restaurantName: 'Bhojpe Restaurant',
    gst: '22ABCDE1234F1Z5',
    address: '123, MG Road, Indore, Madhya Pradesh - 452001',
    phone: '+91-731-4567890',
    email: 'contact@bhojpe.com',
    taxRate: '5',
    currency: '₹',
  })
  const [printReceipt, setPrintReceipt] = useState(true)
  const [printKOT, setPrintKOT] = useState(true)
  const [autoSync, setAutoSync] = useState(true)
  const [kotSound, setKotSound] = useState(true)
  const [lowStockAlert, setLowStockAlert] = useState(true)

  const isAdmin = role === 'admin' || role === 'manager'
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    dispatch(showSnackbar({ message: '✅ Settings saved successfully!', severity: 'success' }))
  }

  const TABS = [
    { label: 'Restaurant', icon: <Business fontSize="small" /> },
    { label: 'Appearance', icon: <Palette fontSize="small" /> },
    { label: 'Language',   icon: <Language fontSize="small" /> },
    { label: 'Printing',   icon: <Print fontSize="small" /> },
    { label: 'Sync & Data',icon: <Storage fontSize="small" /> },
    { label: 'Permissions',icon: <VerifiedUser fontSize="small" /> },
    { label: 'Activity',   icon: <Security fontSize="small" /> },
  ]

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Settings</Typography>
          <Typography color="text.secondary" fontSize={13}>Configure your Bhojpe POSS installation</Typography>
        </Box>
        {isAdmin && (
          <Button variant="contained" startIcon={<Save />} onClick={handleSave}
            sx={{ boxShadow: '0 2px 10px rgba(255,61,1,0.3)' }}>Save All Changes</Button>
        )}
      </Box>

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
          sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 1 }}>
          {TABS.map(({ label, icon }) => (
            <Tab key={label} label={label} icon={icon} iconPosition="start"
              sx={{ fontWeight: 700, fontSize: 12.5, textTransform: 'none', minHeight: 50, gap: 0.7 }} />
          ))}
        </Tabs>

        <Box sx={{ p: { xs: 2, sm: 3 } }}>

          {/* ── Restaurant Info ── */}
          <TabPanel value={tab} index={0}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Restaurant Name" value={form.restaurantName} onChange={e => set('restaurantName', e.target.value)} disabled={!isAdmin} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="GST / Tax Number" value={form.gst} onChange={e => set('gst', e.target.value)} disabled={!isAdmin} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={2} label="Address" value={form.address} onChange={e => set('address', e.target.value)} disabled={!isAdmin} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Phone" value={form.phone} onChange={e => set('phone', e.target.value)} disabled={!isAdmin} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Email" value={form.email} onChange={e => set('email', e.target.value)} disabled={!isAdmin} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth type="number" label="Default Tax Rate (%)" value={form.taxRate} onChange={e => set('taxRate', e.target.value)} disabled={!isAdmin} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Currency Symbol" value={form.currency} onChange={e => set('currency', e.target.value)} disabled={!isAdmin} inputProps={{ maxLength: 3 }} />
              </Grid>
            </Grid>
          </TabPanel>

          {/* ── Appearance ── */}
          <TabPanel value={tab} index={1}>
            <List disablePadding>
              <ListItem disablePadding sx={{ py: 1.5 }}>
                <ListItemText
                  primary={<Typography fontWeight={700}>Dark Mode</Typography>}
                  secondary="Switch between light and dark interface theme" />
                <ListItemSecondaryAction>
                  <Switch checked={themeMode === 'dark'} onChange={() => dispatch(toggleTheme())} color="primary" />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              <ListItem disablePadding sx={{ py: 1.5 }}>
                <ListItemText
                  primary={<Typography fontWeight={700}>Active Theme</Typography>}
                  secondary="Current interface colour scheme" />
                <ListItemSecondaryAction>
                  <Chip label={themeMode === 'dark' ? '🌙 Dark' : '☀️ Light'} size="small"
                    sx={{ fontWeight: 700, bgcolor: themeMode === 'dark' ? '#1a1e2e' : '#fff8f5', color: themeMode === 'dark' ? '#fff' : '#E8332A', border: '1.5px solid', borderColor: themeMode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(255,61,1,0.25)' }} />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </TabPanel>

          {/* ── Language ── */}
          <TabPanel value={tab} index={2}>
            <Typography fontWeight={700} sx={{ mb: 2.5 }}>Select Interface Language</Typography>
            <Grid container spacing={1.5}>
              {LANGUAGES.map(lang => (
                <Grid item xs={12} sm={6} md={4} key={lang.code}>
                  <Paper elevation={0} onClick={() => {
                    dispatch(setLanguage(lang.code))
                    dispatch(showSnackbar({ message: `🌐 Language set to ${lang.name}`, severity: 'success' }))
                  }}
                    sx={{ p: 2, cursor: 'pointer', border: '2px solid',
                      borderColor: currentLang === lang.code ? 'primary.main' : 'divider',
                      borderRadius: 2,
                      bgcolor: currentLang === lang.code ? 'rgba(255,61,1,0.04)' : 'background.paper',
                      transition: 'all 0.15s',
                      '&:hover': { borderColor: 'primary.main', transform: 'translateY(-1px)', boxShadow: '0 2px 12px rgba(255,61,1,0.12)' },
                    }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography fontWeight={800} fontSize={17} sx={{ lineHeight: 1.2 }}>{lang.native}</Typography>
                        <Typography fontSize={12} color="text.secondary" sx={{ mt: 0.3 }}>{lang.name} · {lang.region}</Typography>
                      </Box>
                      {currentLang === lang.code && (
                        <Chip label="Active" size="small" color="primary" sx={{ fontWeight: 800, fontSize: 10 }} />
                      )}
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          {/* ── Printing ── */}
          <TabPanel value={tab} index={3}>
            <List disablePadding>
              {[
                { label: 'Auto-print Receipt', desc: 'Print receipt automatically when payment is collected', val: printReceipt, set: setPrintReceipt },
                { label: 'Auto-print KOT', desc: 'Send Kitchen Order Ticket to printer automatically', val: printKOT, set: setPrintKOT },
                { label: 'KOT Sound Alert', desc: 'Play a sound when a new KOT arrives in kitchen', val: kotSound, set: setKotSound },
              ].map(({ label, desc, val, set: setter }, i) => (
                <Box key={label}>
                  {i > 0 && <Divider />}
                  <ListItem disablePadding sx={{ py: 1.5 }}>
                    <ListItemText primary={<Typography fontWeight={700}>{label}</Typography>} secondary={desc} />
                    <ListItemSecondaryAction><Switch checked={val} onChange={e => setter(e.target.checked)} color="primary" /></ListItemSecondaryAction>
                  </ListItem>
                </Box>
              ))}
            </List>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ p: 2.5, bgcolor: 'action.hover', borderRadius: 2 }}>
              <Typography fontWeight={700} fontSize={14} sx={{ mb: 0.5 }}>🖨️ Thermal Printer Setup</Typography>
              <Typography fontSize={13} color="text.secondary" sx={{ mb: 2 }}>
                Connect printers via USB, Bluetooth, WiFi (LAN), or Network IP. Supported: Epson TM series, Star TSP, Xprinter, Rongta, Hoin and most ESC/POS compatible devices.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {['USB', 'Bluetooth', 'WiFi', 'LAN/Network'].map(type => (
                  <Chip key={type} label={type} size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: 11 }} />
                ))}
              </Box>
              <Typography fontSize={12} color="text.secondary" sx={{ mt: 1.5, fontStyle: 'italic' }}>
                Printer configuration is available in the Electron desktop app via the printer settings panel.
              </Typography>
            </Box>
          </TabPanel>

          {/* ── Sync & Data ── */}
          <TabPanel value={tab} index={4}>
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <Paper sx={{ p: 2.5, border: '2px solid', borderRadius: 2,
                  borderColor: isOnline ? 'success.main' : 'error.main',
                  bgcolor: isOnline ? 'rgba(24,107,53,0.04)' : 'rgba(184,28,28,0.04)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Box>
                      <Typography fontWeight={800} fontSize={16} color={isOnline ? 'success.main' : 'error.main'}>
                        {isOnline ? '🟢 Online' : '🔴 Offline Mode'}
                      </Typography>
                      <Typography fontSize={13} color="text.secondary" sx={{ mt: 0.3 }}>
                        {pendingCount > 0
                          ? `${pendingCount} change${pendingCount > 1 ? 's' : ''} pending sync`
                          : 'All data synced with server'}
                        {lastSyncAt && ` · Last sync: ${new Date(lastSyncAt).toLocaleTimeString()}`}
                      </Typography>
                    </Box>
                    <Button variant="outlined" size="small" startIcon={isSyncing ? undefined : <Storage />}
                      onClick={() => dispatch(syncPendingChanges())}
                      disabled={!isOnline || (pendingCount === 0 && !isSyncing) || isSyncing}
                      sx={{ fontWeight: 700, minWidth: 110 }}>
                      {isSyncing ? 'Syncing…' : 'Sync Now'}
                    </Button>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12}>
                <List disablePadding>
                  {[
                    { label: 'Auto-sync on reconnect', desc: 'Automatically sync pending changes when internet is restored', val: autoSync, set: setAutoSync },
                    { label: 'Low stock alerts', desc: 'Show warnings when menu items run low', val: lowStockAlert, set: setLowStockAlert },
                  ].map(({ label, desc, val, set: setter }, i) => (
                    <Box key={label}>
                      {i > 0 && <Divider />}
                      <ListItem disablePadding sx={{ py: 1.5 }}>
                        <ListItemText primary={<Typography fontWeight={700}>{label}</Typography>} secondary={desc} />
                        <ListItemSecondaryAction><Switch checked={val} onChange={e => setter(e.target.checked)} color="primary" /></ListItemSecondaryAction>
                      </ListItem>
                    </Box>
                  ))}
                </List>
              </Grid>
            </Grid>
          </TabPanel>

          {/* ── Permissions ── */}
          <TabPanel value={tab} index={5}>
            <Typography fontWeight={700} sx={{ mb: 2 }}>Role-Based Access Control</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {Object.entries(PERMISSIONS).map(([r, perms]) => (
                <Paper key={r} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Avatar sx={{ width: 34, height: 34, bgcolor: r === 'admin' ? '#E8332A' : r === 'manager' ? '#1a4fcc' : r === 'chef' ? '#7e22ce' : r === 'cashier' ? '#7a5a00' : r === 'captain' ? '#186b35' : '#c2610a', fontSize: 12, fontWeight: 800, textTransform: 'capitalize' }}>
                      {r[0].toUpperCase()}
                    </Avatar>
                    <Typography fontWeight={800} fontSize={14} sx={{ textTransform: 'capitalize' }}>{r}</Typography>
                    {r === 'admin' && <Chip label="Super Admin" size="small" color="error" sx={{ fontWeight: 700, fontSize: 10, height: 18 }} />}
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                    {perms[0] === '*' ? (
                      <Chip label="✓ All permissions" size="small" color="error" sx={{ fontWeight: 700, fontSize: 11 }} />
                    ) : perms.map(p => (
                      <Chip key={p} label={p} size="small" variant="outlined"
                        sx={{ fontWeight: 600, fontSize: 10, height: 20, fontFamily: 'monospace' }} />
                    ))}
                  </Box>
                </Paper>
              ))}
            </Box>
          </TabPanel>

          {/* ── Activity Log ── */}
          <TabPanel value={tab} index={6}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography fontWeight={700} fontSize={15}>Activity Log</Typography>
              <Chip label={`${activityLog.length} entries`} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
            </Box>
            {activityLog.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6, color: 'text.disabled' }}>
                <Security sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                <Typography fontWeight={700}>No activity recorded yet</Typography>
                <Typography fontSize={13} sx={{ mt: 0.5 }}>Actions like creating orders, updating staff, etc. will appear here</Typography>
              </Box>
            ) : (
              <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', maxHeight: 480, overflowY: 'auto' }}>
                {activityLog.slice(0, 100).map((log, i) => (
                  <Box key={log.id}>
                    {i > 0 && <Divider />}
                    <Box sx={{ px: 2, py: 1.5, display: 'flex', gap: 2, alignItems: 'flex-start', '&:hover': { bgcolor: 'action.hover' } }}>
                      <Chip label={log.module} size="small"
                        sx={{ fontWeight: 700, fontSize: 9, height: 18, flexShrink: 0, mt: 0.2,
                          bgcolor: log.module === 'POS' ? 'rgba(255,61,1,0.1)' : log.module === 'Staff' ? 'rgba(26,79,204,0.1)' : 'action.selected',
                          color: log.module === 'POS' ? 'primary.main' : log.module === 'Staff' ? '#1a4fcc' : 'text.secondary',
                        }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography fontSize={13} fontWeight={600} noWrap>{log.description}</Typography>
                        <Typography fontSize={11.5} color="text.secondary">{new Date(log.timestamp).toLocaleString('en-IN')}</Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Paper>
            )}
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  )
}
