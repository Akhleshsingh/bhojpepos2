import apiClient from './apiClient'

export const modulesService = {
  getAll: () => apiClient.get('/modules'),
  update: (key, active) => apiClient.put(`/modules/${key}`, { active }),
}

export const rolesService = {
  getAll: () => apiClient.get('/roles'),
}

export const reportsService = {
  getDashboard: () => apiClient.get('/reports/dashboard'),
}
