import apiClient from './apiClient'

export const authService = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (data) => apiClient.post('/auth/register', data),
  me: () => apiClient.get('/auth/me'),
}
