import apiClient from './apiClient'

export const ordersService = {
  getAll: (params) => apiClient.get('/orders', { params }),
  create: (data) => apiClient.post('/orders', data),
  updateStatus: (id, status) => apiClient.put(`/orders/${id}/status`, { status }),
}
