import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { menuService } from '../services/menuService'
import { localDB } from '../offline/localDB'

export const fetchMenu = createAsyncThunk('menu/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const data = await menuService.getAll()
    await localDB.setAll('menu', data)
    return data
  } catch (err) {
    const local = await localDB.getAll('menu')
    return local.length > 0 ? local : rejectWithValue(err.message)
  }
})

export const createMenuItem = createAsyncThunk('menu/create', async (data, { dispatch, getState, rejectWithValue }) => {
  try {
    const result = await menuService.create(data)
    await localDB.set('menu', result.id, result)
    return result
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const updateMenuItem = createAsyncThunk('menu/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    return await menuService.update(id, data)
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const deleteMenuItem = createAsyncThunk('menu/delete', async (id, { rejectWithValue }) => {
  try {
    await menuService.delete(id)
    await localDB.delete('menu', id)
    return id
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

const menuSlice = createSlice({
  name: 'menu',
  initialState: { 
    items: [], 
    categories: [], 
    loading: false, 
    error: null, 
    activeCategory: 'All' 
  },
  reducers: {
    setActiveCategory(s, { payload }) { s.activeCategory = payload },
    setCategories(s, { payload }) { s.categories = payload },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMenu.pending, (s) => { s.loading = true })
      .addCase(fetchMenu.fulfilled, (s, { payload }) => {
        s.loading = false
        s.items = payload
        const cats = [...new Set(payload.map(i => i.category).filter(Boolean))]
        s.categories = cats
      })
      .addCase(fetchMenu.rejected, (s, { payload }) => { 
        s.loading = false
        s.error = payload 
      })
      .addCase(createMenuItem.fulfilled, (s, { payload }) => { 
        s.items.push(payload) 
      })
      .addCase(updateMenuItem.fulfilled, (s, { payload }) => { 
        const i = s.items.findIndex(x => x.id === payload.id)
        if (i !== -1) s.items[i] = payload 
      })
      .addCase(deleteMenuItem.fulfilled, (s, { payload }) => { 
        s.items = s.items.filter(x => x.id !== payload) 
      })
  },
})

export const { setActiveCategory, setCategories } = menuSlice.actions
export default menuSlice.reducer
