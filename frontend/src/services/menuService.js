import apiClient from './apiClient'

export const menuService = {
  getAll: () => apiClient.get('/menu'),
  create: (data) => apiClient.post('/menu', data),
  update: (id, data) => apiClient.put(`/menu/${id}`, data),
  delete: (id) => apiClient.delete(`/menu/${id}`),
}
