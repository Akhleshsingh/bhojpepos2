import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { staffService } from '../services/staffService'

export const fetchStaff = createAsyncThunk('staff/fetchAll', async (_, { rejectWithValue }) => {
  try {
    return await staffService.getAll()
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const createStaff = createAsyncThunk('staff/create', async (data, { rejectWithValue }) => {
  try {
    return await staffService.create(data)
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const updateStaff = createAsyncThunk('staff/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    return await staffService.update(id, data)
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const deleteStaff = createAsyncThunk('staff/delete', async (id, { rejectWithValue }) => {
  try {
    await staffService.delete(id)
    return id
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

const staffSlice = createSlice({
  name: 'staff',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStaff.pending, (state) => { state.loading = true })
      .addCase(fetchStaff.fulfilled, (state, { payload }) => {
        state.loading = false
        state.items = payload
      })
      .addCase(fetchStaff.rejected, (state, { payload }) => {
        state.loading = false
        state.error = payload
      })
      .addCase(createStaff.fulfilled, (state, { payload }) => {
        state.items.push(payload)
      })
      .addCase(updateStaff.fulfilled, (state, { payload }) => {
        const idx = state.items.findIndex(s => s.id === payload.id)
        if (idx !== -1) state.items[idx] = payload
      })
      .addCase(deleteStaff.fulfilled, (state, { payload }) => {
        state.items = state.items.filter(s => s.id !== payload)
      })
  },
})

export default staffSlice.reducer
