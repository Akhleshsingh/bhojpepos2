import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { tablesService } from '../services/tablesService'

export const fetchTables = createAsyncThunk('tables/fetchAll', async (_, { rejectWithValue }) => {
  try {
    return await tablesService.getAll()
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const updateTable = createAsyncThunk('tables/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    return await tablesService.update(id, data)
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const createTable = createAsyncThunk('tables/create', async (data, { rejectWithValue }) => {
  try {
    return await tablesService.create(data)
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

const tablesSlice = createSlice({
  name: 'tables',
  initialState: { items: [], loading: false, error: null, activeSection: 'All Area' },
  reducers: {
    updateTableLocal(state, { payload }) {
      const idx = state.items.findIndex(t => t.id === payload.id)
      if (idx !== -1) state.items[idx] = { ...state.items[idx], ...payload }
    },
    setTableStatus(state, { payload }) {
      const { id, status, guestCount, waiter } = payload
      const idx = state.items.findIndex(t => t.id === id)
      if (idx !== -1) {
        state.items[idx].status = status
        if (guestCount !== undefined) state.items[idx].guestCount = guestCount
        if (waiter !== undefined) state.items[idx].waiter = waiter
      }
    },
    setActiveSection(state, { payload }) { state.activeSection = payload },
    clearTable(state, { payload }) {
      const idx = state.items.findIndex(t => t.id === payload)
      if (idx !== -1) { state.items[idx].status = 'cleaning'; state.items[idx].guestCount = 0 }
    },
    markTableAvailable(state, { payload }) {
      const idx = state.items.findIndex(t => t.id === payload)
      if (idx !== -1) { state.items[idx].status = 'available'; state.items[idx].guestCount = 0 }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTables.pending, (state) => { state.loading = true })
      .addCase(fetchTables.fulfilled, (state, { payload }) => { 
        state.loading = false
        state.items = payload.map(t => ({ ...t, id: t.id || t.name, section: t.floor || 'Ground', guestCount: t.guestCount || 0 }))
      })
      .addCase(fetchTables.rejected, (state, { payload }) => { state.loading = false; state.error = payload })
      .addCase(updateTable.fulfilled, (state, { payload }) => {
        const idx = state.items.findIndex(t => t.id === payload.id)
        if (idx !== -1) state.items[idx] = { ...state.items[idx], ...payload }
      })
      .addCase(createTable.fulfilled, (state, { payload }) => {
        state.items.push({ ...payload, id: payload.id || payload.name, section: payload.floor || 'Ground' })
      })
  },
})

export const { updateTableLocal, setTableStatus, setActiveSection, clearTable, markTableAvailable } = tablesSlice.actions
export default tablesSlice.reducer
