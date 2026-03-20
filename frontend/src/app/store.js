import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/authSlice'
import ordersReducer from '../features/ordersSlice'
import staffReducer from '../features/staffSlice'
import customersReducer from '../features/customersSlice'
import menuReducer from '../features/menuSlice'
import reservationsReducer from '../features/reservationsSlice'
import syncReducer from '../features/syncSlice'
import uiReducer from '../features/uiSlice'
import tablesReducer from '../features/tablesSlice'
import { registerStoreDispatch } from '../services/apiClient'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    orders: ordersReducer,
    staff: staffReducer,
    customers: customersReducer,
    menu: menuReducer,
    reservations: reservationsReducer,
    sync: syncReducer,
    ui: uiReducer,
    tables: tablesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
})

// Expose dispatch to apiClient without creating an import cycle
registerStoreDispatch(store.dispatch)
