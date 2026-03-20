import axios from 'axios'
import { showSnackbar } from '../features/uiSlice'

let dispatchRef = null
export const registerStoreDispatch = (dispatch) => { dispatchRef = dispatch }

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor - attach token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bhojpe_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - global error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.detail || error.response?.data?.message || error.message || 'Network error'
    
    if (error.response?.status === 401) {
      localStorage.removeItem('bhojpe_token')
      localStorage.removeItem('bhojpe_user')
      window.location.href = '/login'
    } else if (error.response?.status === 403) {
      dispatchRef?.(showSnackbar({ message: 'Permission denied', severity: 'error' }))
    } else if (error.response?.status >= 500) {
      dispatchRef?.(showSnackbar({ message: 'Server error. Please try again.', severity: 'error' }))
    }
    
    return Promise.reject(new Error(message))
  }
)

export default apiClient
