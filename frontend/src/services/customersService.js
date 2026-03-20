import apiClient from './apiClient'

export const customersService = {
  getAll: () => apiClient.get('/customers'),
  create: (data) => apiClient.post('/customers', data),
  update: (id, data) => apiClient.put(`/customers/${id}`, data),
}
