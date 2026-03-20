import MockAdapter from 'axios-mock-adapter'
import { MOCK_STAFF } from '../utils/mockData'
import { MOCK_CUSTOMERS } from '../utils/mockData'
import { MOCK_MENU } from '../utils/mockData'
import { MOCK_ORDERS } from '../utils/mockData'
import { MOCK_RESERVATIONS } from '../utils/mockData'
import apiClient from './apiClient'

let mock

export const setupMockApi = () => {
  mock = new MockAdapter(apiClient, { delayResponse: 400 })

  // Auth
  mock.onPost('auth/login').reply((config) => {
    const { username, password, role } = JSON.parse(config.data)
    const users = {
      admin: { id: 'U001', name: 'Admin User', role: 'admin', email: 'admin@bhojpe.com', color: '#FF3D01', shift: 'Full' },
      manager: { id: 'U002', name: 'Sanjay Kumar', role: 'manager', email: 'manager@bhojpe.com', color: '#1a4fcc', shift: 'Morning' },
      cashier: { id: 'U003', name: 'Pooja Verma', role: 'cashier', email: 'cashier@bhojpe.com', color: '#186b35', shift: 'Full' },
      waiter: { id: 'U004', name: 'Raju Singh', role: 'waiter', email: 'waiter@bhojpe.com', color: '#7a5a00', shift: 'Evening' },
    }
    if (password === '1234' || password === 'demo123') {
      const user = users[username] || users.admin
      return [200, { user, token: `mock-token-${Date.now()}` }]
    }
    return [401, { message: 'Invalid credentials' }]
  })

  // Staff CRUD
  let staffData = [...MOCK_STAFF]
  mock.onGet('staff').reply(200, staffData)
  mock.onPost('staff').reply((config) => { const d = JSON.parse(config.data); staffData.push(d); return [201, d] })
  mock.onPut(/staff\/.*/).reply((config) => { const d = JSON.parse(config.data); staffData = staffData.map(s => s.id === d.id ? d : s); return [200, d] })
  mock.onDelete(/staff\/.*/).reply((config) => { const id = config.url.split('/').pop(); staffData = staffData.filter(s => s.id !== id); return [200, { id }] })

  // Customers CRUD
  let custData = [...MOCK_CUSTOMERS]
  mock.onGet('customers').reply(200, custData)
  mock.onPost('customers').reply((config) => { const d = JSON.parse(config.data); custData.push(d); return [201, d] })
  mock.onPut(/customers\/.*/).reply((config) => { const d = JSON.parse(config.data); custData = custData.map(c => c.id === d.id ? d : c); return [200, d] })
  mock.onDelete(/customers\/.*/).reply((config) => { const id = config.url.split('/').pop(); custData = custData.filter(c => c.id !== id); return [200, { id }] })

  // Menu CRUD
  let menuData = [...MOCK_MENU]
  mock.onGet('menu').reply(200, menuData)
  mock.onPost('menu').reply((config) => { const d = JSON.parse(config.data); menuData.push(d); return [201, d] })
  mock.onPut(/menu\/.*/).reply((config) => { const d = JSON.parse(config.data); menuData = menuData.map(m => m.id === d.id ? d : m); return [200, d] })
  mock.onDelete(/menu\/.*/).reply((config) => { const id = config.url.split('/').pop(); menuData = menuData.filter(m => m.id !== id); return [200, { id }] })

  // Orders
  let ordersData = [...MOCK_ORDERS]
  mock.onGet('orders').reply(200, ordersData)
  mock.onPost('orders').reply((config) => { const d = JSON.parse(config.data); ordersData.unshift(d); return [201, d] })
  mock.onPut(/orders\/.*\/status/).reply((config) => { const parts = config.url.split('/'); const id = parts[parts.length - 2]; const { status } = JSON.parse(config.data); ordersData = ordersData.map(o => o.id === id ? { ...o, status } : o); return [200, { id, status }] })

  // Reservations
  let resData = [...MOCK_RESERVATIONS]
  mock.onGet('reservations').reply(200, resData)
  mock.onPost('reservations').reply((config) => { const d = JSON.parse(config.data); resData.unshift(d); return [201, d] })
  mock.onPut(/reservations\/.*/).reply((config) => { const d = JSON.parse(config.data); resData = resData.map(r => r.id === d.id ? d : r); return [200, d] })
  mock.onDelete(/reservations\/.*/).reply((config) => { const id = config.url.split('/').pop(); resData = resData.filter(r => r.id !== id); return [200, { id }] })
}
