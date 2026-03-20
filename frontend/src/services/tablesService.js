import apiClient from './apiClient'

export const tablesService = {
  getAll: () => apiClient.get('/tables'),
  create: (data) => apiClient.post('/tables', data),
  update: (id, data) => apiClient.put(`/tables/${id}`, data),
}
