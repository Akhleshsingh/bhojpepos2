import apiClient from './apiClient'

export const reservationsService = {
  getAll: () => apiClient.get('/reservations'),
  create: (data) => apiClient.post('/reservations', data),
  update: (id, data) => apiClient.put(`/reservations/${id}`, data),
}
