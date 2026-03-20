import { store } from '../app/store'
import { syncPendingChanges } from '../features/syncSlice'
import { setOnlineStatus } from '../features/uiSlice'
import { localDB } from './localDB'

class SyncManager {
  constructor() {
    this.syncInterval = null
    this.SYNC_INTERVAL_MS = 30000 // 30 seconds
  }

  init() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)

    // Update initial status
    store.dispatch(setOnlineStatus(navigator.onLine))

    // Start sync interval if online
    if (navigator.onLine) this.startSyncInterval()

    // Load sync queue count from IndexedDB
    localDB.getSyncQueueCount().then(count => {
      store.dispatch({ type: 'sync/setPendingCount', payload: count })
    })
  }

  handleOnline = () => {
    store.dispatch(setOnlineStatus(true))
    this.startSyncInterval()
    // Immediate sync on reconnect
    store.dispatch(syncPendingChanges())
  }

  handleOffline = () => {
    store.dispatch(setOnlineStatus(false))
    this.stopSyncInterval()
  }

  startSyncInterval() {
    if (this.syncInterval) return
    this.syncInterval = setInterval(() => {
      const state = store.getState()
      if (state.ui.isOnline && state.sync.pendingCount > 0) {
        store.dispatch(syncPendingChanges())
      }
    }, this.SYNC_INTERVAL_MS)
  }

  stopSyncInterval() {
    if (this.syncInterval) { clearInterval(this.syncInterval); this.syncInterval = null }
  }

  destroy() {
    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)
    this.stopSyncInterval()
  }
}

export const syncManager = new SyncManager()
