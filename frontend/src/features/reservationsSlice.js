import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { reservationsService } from '../services/reservationsService'

export const fetchReservations = createAsyncThunk('reservations/fetchAll', async (_, { rejectWithValue }) => {
  try {
    return await reservationsService.getAll()
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const createReservation = createAsyncThunk('reservations/create', async (data, { rejectWithValue }) => {
  try {
    return await reservationsService.create(data)
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const updateReservation = createAsyncThunk('reservations/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    return await reservationsService.update(id, data)
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const deleteReservation = createAsyncThunk('reservations/delete', async (id, { rejectWithValue }) => {
  try {
    return id
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

const reservationsSlice = createSlice({
  name: 'reservations',
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReservations.pending, (state) => { state.loading = true })
      .addCase(fetchReservations.fulfilled, (state, { payload }) => { state.loading = false; state.items = payload })
      .addCase(fetchReservations.rejected, (state, { payload }) => { state.loading = false; state.error = payload })
      .addCase(createReservation.fulfilled, (state, { payload }) => { state.items.push(payload) })
      .addCase(updateReservation.fulfilled, (state, { payload }) => {
        const idx = state.items.findIndex(r => r.id === payload.id)
        if (idx !== -1) state.items[idx] = payload
      })
      .addCase(deleteReservation.fulfilled, (state, { payload }) => {
        state.items = state.items.filter(r => r.id !== payload)
      })
  },
})

export default reservationsSlice.reducer
