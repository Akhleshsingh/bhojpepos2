import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { ordersService } from '../services/ordersService'
import { localDB } from '../offline/localDB'

export const fetchOrders = createAsyncThunk('orders/fetchAll', async (params, { rejectWithValue, getState }) => {
  try {
    const data = await ordersService.getAll(params)
    await localDB.setAll('orders', data)
    return data
  } catch (err) {
    const local = await localDB.getAll('orders')
    return local.length > 0 ? local : rejectWithValue(err.message)
  }
})

export const createOrder = createAsyncThunk('orders/create', async (data, { dispatch, getState, rejectWithValue }) => {
  const { ui } = getState()
  
  if (ui.isOnline) {
    try {
      const result = await ordersService.create(data)
      await localDB.set('orders', result.id, result)
      return result
    } catch (err) {
      // Fall through to offline handling
    }
  }
  
  // Offline handling
  const newOrder = {
    ...data,
    id: `ORD${Date.now()}`,
    orderNumber: `#${Math.floor(10000 + Math.random() * 90000)}`,
    createdAt: new Date().toISOString(),
    status: 'pending',
    synced: false,
  }
  await localDB.set('orders', newOrder.id, newOrder)
  dispatch({ type: 'sync/addToQueue', payload: { method: 'POST', url: '/orders', data: newOrder } })
  return newOrder
})

export const updateOrderStatus = createAsyncThunk('orders/updateStatus', async ({ id, status }, { dispatch, getState, rejectWithValue }) => {
  const { ui } = getState()
  
  if (ui.isOnline) {
    try {
      return await ordersService.updateStatus(id, status)
    } catch (err) {
      // Fall through
    }
  }
  
  const updated = { id, status, updatedAt: new Date().toISOString() }
  dispatch({ type: 'sync/addToQueue', payload: { method: 'PUT', url: `/orders/${id}/status`, data: { status } } })
  return updated
})

const ordersSlice = createSlice({
  name: 'orders',
  initialState: {
    items: [],
    loading: false,
    error: null,
    currentOrder: { items: [], orderType: 'dine', tableNo: null, note: '' },
    heldOrders: [],
  },
  reducers: {
    addToCurrentOrder(state, { payload }) {
      const existing = state.currentOrder.items.find(i => i.id === payload.id)
      if (existing) existing.qty += 1
      else state.currentOrder.items.push({ ...payload, qty: 1 })
    },
    removeFromCurrentOrder(state, { payload }) {
      state.currentOrder.items = state.currentOrder.items.filter(i => i.id !== payload)
    },
    updateItemQty(state, { payload: { id, qty } }) {
      const item = state.currentOrder.items.find(i => i.id === id)
      if (item) qty <= 0 ? (state.currentOrder.items = state.currentOrder.items.filter(i => i.id !== id)) : (item.qty = qty)
    },
    clearCurrentOrder(state) { 
      state.currentOrder = { items: [], orderType: 'dine', tableNo: null, note: '' } 
    },
    setOrderType(state, { payload }) { state.currentOrder.orderType = payload },
    setOrderNote(state, { payload }) { state.currentOrder.note = payload },
    setOrderTable(state, { payload }) { state.currentOrder.tableNo = payload },
    holdOrder(state) {
      if (state.currentOrder.items.length > 0) {
        state.heldOrders.push({ ...state.currentOrder, heldAt: new Date().toISOString(), id: Date.now() })
        state.currentOrder = { items: [], orderType: 'dine', tableNo: null, note: '' }
      }
    },
    restoreHeldOrder(state, { payload }) {
      const order = state.heldOrders.find(o => o.id === payload)
      if (order) {
        state.currentOrder = order
        state.heldOrders = state.heldOrders.filter(o => o.id !== payload)
      }
    },
    updateOrderInList(state, { payload }) {
      const idx = state.items.findIndex(o => o.id === payload.id)
      if (idx !== -1) state.items[idx] = { ...state.items[idx], ...payload }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => { state.loading = true })
      .addCase(fetchOrders.fulfilled, (state, { payload }) => { 
        state.loading = false
        state.items = payload 
      })
      .addCase(fetchOrders.rejected, (state, { payload }) => { 
        state.loading = false
        state.error = payload 
      })
      .addCase(createOrder.fulfilled, (state, { payload }) => { 
        state.items.unshift(payload) 
      })
      .addCase(updateOrderStatus.fulfilled, (state, { payload }) => {
        const idx = state.items.findIndex(i => i.id === payload.id)
        if (idx !== -1) state.items[idx] = { ...state.items[idx], ...payload }
      })
  },
})

export const {
  addToCurrentOrder, removeFromCurrentOrder, updateItemQty, clearCurrentOrder,
  setOrderType, setOrderNote, setOrderTable, holdOrder, restoreHeldOrder, updateOrderInList,
} = ordersSlice.actions

export default ordersSlice.reducer
