import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authService } from '../services/authService'

// Role-based permissions map (matches backend)
export const PERMISSIONS = {
  super_admin: ['*'],
  admin: ['dashboard', 'pos', 'orders', 'kot', 'tables', 'reservations', 'customers', 'menu', 'staff', 'reports', 'settings', 'modules'],
  manager: ['dashboard', 'pos', 'orders', 'kot', 'tables', 'reservations', 'customers', 'menu', 'staff.view', 'reports', 'settings.view'],
  cashier: ['dashboard.view', 'pos', 'orders', 'customers.view', 'reports.basic'],
  waiter: ['pos', 'orders.view', 'orders.create', 'tables', 'reservations.view'],
  chef: ['orders.view', 'kot'],
  delivery_boy: ['orders.view', 'orders.delivery'],
}

export const ROLES = {
  super_admin: { name: 'Super Admin', level: 100, color: '#E8332A' },
  admin: { name: 'Admin', level: 90, color: '#E8332A' },
  manager: { name: 'Manager', level: 70, color: '#1a4fcc' },
  cashier: { name: 'Cashier', level: 50, color: '#186b35' },
  waiter: { name: 'Waiter', level: 30, color: '#7a5a00' },
  chef: { name: 'Chef', level: 40, color: '#7e22ce' },
  delivery_boy: { name: 'Delivery Boy', level: 20, color: '#b81c1c' },
}

export const loginAsync = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    return await authService.login(credentials)
  } catch (err) {
    return rejectWithValue(err.message || 'Login failed')
  }
})

export const registerAsync = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    return await authService.register(data)
  } catch (err) {
    return rejectWithValue(err.message || 'Registration failed')
  }
})

export const fetchCurrentUser = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    return await authService.me()
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

const savedUser = (() => { try { return JSON.parse(localStorage.getItem('bhojpe_user')) } catch { return null } })()
const savedToken = localStorage.getItem('bhojpe_token')

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: savedUser,
    isAuthenticated: !!(savedUser && savedToken),
    loading: false,
    error: null,
    modules: savedUser?.modules || [],
  },
  reducers: {
    logout(state) {
      state.user = null
      state.isAuthenticated = false
      state.modules = []
      localStorage.removeItem('bhojpe_user')
      localStorage.removeItem('bhojpe_token')
    },
    clearError(state) { state.error = null },
    updateUser(state, { payload }) {
      state.user = { ...state.user, ...payload }
      localStorage.setItem('bhojpe_user', JSON.stringify(state.user))
    },
    setModules(state, { payload }) {
      state.modules = payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAsync.pending, (state) => { state.loading = true; state.error = null })
      .addCase(loginAsync.fulfilled, (state, { payload }) => {
        state.loading = false
        state.user = payload.user
        state.isAuthenticated = true
        state.modules = payload.user.modules || []
        localStorage.setItem('bhojpe_user', JSON.stringify(payload.user))
        localStorage.setItem('bhojpe_token', payload.token)
      })
      .addCase(loginAsync.rejected, (state, { payload }) => {
        state.loading = false
        state.error = payload
      })
      .addCase(registerAsync.pending, (state) => { state.loading = true; state.error = null })
      .addCase(registerAsync.fulfilled, (state, { payload }) => {
        state.loading = false
        state.user = payload.user
        state.isAuthenticated = true
        state.modules = payload.user.modules || []
        localStorage.setItem('bhojpe_user', JSON.stringify(payload.user))
        localStorage.setItem('bhojpe_token', payload.token)
      })
      .addCase(registerAsync.rejected, (state, { payload }) => {
        state.loading = false
        state.error = payload
      })
      .addCase(fetchCurrentUser.fulfilled, (state, { payload }) => {
        state.user = payload
        state.modules = payload.modules || []
        localStorage.setItem('bhojpe_user', JSON.stringify(payload))
      })
  },
})

export const { logout, clearError, updateUser, setModules } = authSlice.actions

// Permission checker - matches backend RBAC logic
export const hasPermission = (user, permission) => {
  if (!user) return false
  const perms = PERMISSIONS[user.role] || []
  
  // Super admin has all permissions
  if (perms.includes('*')) return true
  
  // Check exact match
  if (perms.includes(permission)) return true
  
  // Check prefix match (e.g., "orders" grants "orders.view", "orders.create")
  const basePermission = permission.split('.')[0]
  if (perms.includes(basePermission)) return true
  
  // Check if user has a more specific permission that covers this
  for (const p of perms) {
    // e.g., "orders.view" should match when checking "orders.view"
    if (permission === p) return true
    // e.g., "orders.view" grants access when we only need "orders"
    if (p.startsWith(basePermission + '.')) return true
  }
  
  return false
}

// Check if module is active
export const isModuleActive = (modules, moduleKey) => {
  if (!modules || modules.length === 0) return true
  const module = modules.find(m => m.key === moduleKey)
  return module ? module.active : true
}

export default authSlice.reducer
