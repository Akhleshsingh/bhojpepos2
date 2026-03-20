import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { localDB } from '../offline/localDB'
import apiClient from '../services/apiClient'

export const syncPendingChanges = createAsyncThunk('sync/syncPending', async (_, { getState, rejectWithValue }) => {
  try {
    const queue = await localDB.getSyncQueue()
    const results = []
    for (const item of queue) {
      try {
        let res
        switch (item.method) {
          case 'POST': res = await apiClient.post(item.url, item.data); break
          case 'PUT': res = await apiClient.put(item.url, item.data); break
          case 'DELETE': res = await apiClient.delete(item.url); break
          default: continue
        }
        await localDB.removeSyncQueueItem(item.id)
        results.push({ id: item.id, success: true })
      } catch (e) {
        item.retries = (item.retries || 0) + 1
        await localDB.updateSyncQueueItem(item)
        results.push({ id: item.id, success: false, error: e.message })
      }
    }
    return results
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

const syncSlice = createSlice({
  name: 'sync',
  initialState: {
    pendingCount: 0,
    lastSyncAt: null,
    isSyncing: false,
    syncError: null,
    queue: [],
  },
  reducers: {
    addToQueue(state, { payload }) {
      state.queue.push({ ...payload, id: Date.now(), retries: 0, timestamp: new Date().toISOString() })
      state.pendingCount = state.queue.length
      // Persist to IndexedDB
      localDB.addToSyncQueue(payload).catch(console.error)
    },
    removeFromQueue(state, { payload }) {
      state.queue = state.queue.filter(item => item.id !== payload)
      state.pendingCount = state.queue.length
    },
    setPendingCount(state, { payload }) { state.pendingCount = payload },
    setQueue(state, { payload }) { state.queue = payload; state.pendingCount = payload.length },
  },
  extraReducers: (builder) => {
    builder
      .addCase(syncPendingChanges.pending, (state) => { state.isSyncing = true; state.syncError = null })
      .addCase(syncPendingChanges.fulfilled, (state, { payload }) => {
        state.isSyncing = false
        state.lastSyncAt = new Date().toISOString()
        const failed = payload.filter(r => !r.success)
        state.pendingCount = failed.length
      })
      .addCase(syncPendingChanges.rejected, (state, { payload }) => {
        state.isSyncing = false
        state.syncError = payload
      })
  },
})

export const { addToQueue, removeFromQueue, setPendingCount, setQueue } = syncSlice.actions
export default syncSlice.reducer
