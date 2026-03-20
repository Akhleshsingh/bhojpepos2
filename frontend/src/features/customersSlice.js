import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { customersService } from '../services/customersService'

export const fetchCustomers = createAsyncThunk('customers/fetchAll', async (_, { rejectWithValue }) => {
  try {
    return await customersService.getAll()
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const createCustomer = createAsyncThunk('customers/create', async (data, { rejectWithValue }) => {
  try {
    return await customersService.create(data)
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const updateCustomer = createAsyncThunk('customers/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    return await customersService.update(id, data)
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const deleteCustomer = createAsyncThunk('customers/delete', async (id, { rejectWithValue }) => {
  try {
    return id
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

const customersSlice = createSlice({
  name: 'customers',
  initialState: { items: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => { state.loading = true })
      .addCase(fetchCustomers.fulfilled, (state, { payload }) => { state.loading = false; state.items = payload })
      .addCase(fetchCustomers.rejected, (state, { payload }) => { state.loading = false; state.error = payload })
      .addCase(createCustomer.fulfilled, (state, { payload }) => { state.items.push(payload) })
      .addCase(updateCustomer.fulfilled, (state, { payload }) => {
        const idx = state.items.findIndex(c => c.id === payload.id)
        if (idx !== -1) state.items[idx] = payload
      })
      .addCase(deleteCustomer.fulfilled, (state, { payload }) => {
        state.items = state.items.filter(c => c.id !== payload)
      })
  },
})

export default customersSlice.reducer
