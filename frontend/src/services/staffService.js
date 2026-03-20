import apiClient from './apiClient'

export const staffService = {
  getAll: () => apiClient.get('/staff'),
  create: (data) => apiClient.post('/staff', data),
  update: (id, data) => apiClient.put(`/staff/${id}`, data),
  delete: (id) => apiClient.delete(`/staff/${id}`),
}
