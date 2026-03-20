import { createSlice } from '@reduxjs/toolkit'

const savedTheme = localStorage.getItem('bhojpe_theme') || 'light'

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    themeMode: savedTheme,
    sidebarOpen: true,
    currentLang: localStorage.getItem('bhojpe_lang') || 'en',
    snackbar: { open: false, message: '', severity: 'success' },
    confirmDialog: { open: false, title: '', message: '', onConfirm: null },
    isOnline: navigator.onLine,
    globalSearch: '',
    activityLog: [],
  },
  reducers: {
    toggleTheme(state) {
      state.themeMode = state.themeMode === 'light' ? 'dark' : 'light'
      localStorage.setItem('bhojpe_theme', state.themeMode)
    },
    setTheme(state, { payload }) {
      state.themeMode = payload
      localStorage.setItem('bhojpe_theme', payload)
    },
    toggleSidebar(state) { state.sidebarOpen = !state.sidebarOpen },
    setSidebarOpen(state, { payload }) { state.sidebarOpen = payload },
    setLanguage(state, { payload }) {
      state.currentLang = payload
      localStorage.setItem('bhojpe_lang', payload)
    },
    showSnackbar(state, { payload }) {
      state.snackbar = { open: true, message: payload.message, severity: payload.severity || 'success' }
    },
    hideSnackbar(state) { state.snackbar.open = false },
    showConfirmDialog(state, { payload }) {
      state.confirmDialog = { open: true, ...payload }
    },
    hideConfirmDialog(state) { state.confirmDialog.open = false },
    setOnlineStatus(state, { payload }) { state.isOnline = payload },
    setGlobalSearch(state, { payload }) { state.globalSearch = payload },
    addActivityLog(state, { payload }) {
      state.activityLog.unshift({ ...payload, timestamp: new Date().toISOString(), id: Date.now() })
      if (state.activityLog.length > 100) state.activityLog.pop()
    },
  },
})

export const {
  toggleTheme, setTheme, toggleSidebar, setSidebarOpen, setLanguage,
  showSnackbar, hideSnackbar, showConfirmDialog, hideConfirmDialog,
  setOnlineStatus, setGlobalSearch, addActivityLog,
} = uiSlice.actions
export default uiSlice.reducer
