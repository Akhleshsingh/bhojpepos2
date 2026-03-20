export const MOCK_STAFF = [
  { id: 'S001', name: 'Sanjay Kumar', email: 'sanjay@bhojpe.com', phone: '+919876543201', role: 'Manager', shift: 'Full', salary: 25000, join: '2024-01-15', status: 'active', orders: 142, color: '#FF3D01' },
  { id: 'S002', name: 'Raju Singh', email: 'raju@bhojpe.com', phone: '+918765432102', role: 'Waiter', shift: 'Morning', salary: 14000, join: '2024-03-10', status: 'active', orders: 89, color: '#1a4fcc' },
  { id: 'S003', name: 'Arjun Sharma', email: 'arjun@bhojpe.com', phone: '+917654321003', role: 'Waiter', shift: 'Evening', salary: 14000, join: '2024-04-05', status: 'active', orders: 76, color: '#186b35' },
  { id: 'S004', name: 'Pooja Verma', email: 'pooja@bhojpe.com', phone: '+916543210904', role: 'Cashier', shift: 'Full', salary: 18000, join: '2024-02-20', status: 'active', orders: 210, color: '#7a5a00' },
  { id: 'S005', name: 'Ramesh Yadav', email: 'ramesh@bhojpe.com', phone: '+915432109805', role: 'Chef', shift: 'Morning', salary: 22000, join: '2023-11-01', status: 'active', orders: 0, color: '#7e22ce' },
  { id: 'S006', name: 'Suresh Patel', email: 'suresh@bhojpe.com', phone: '+914321098706', role: 'Chef', shift: 'Evening', salary: 20000, join: '2024-01-08', status: 'active', orders: 0, color: '#c2610a' },
  { id: 'S007', name: 'Priya Rao', email: 'priya.rao@bhojpe.com', phone: '+913210987607', role: 'Waiter', shift: 'Night', salary: 13000, join: '2024-06-01', status: 'inactive', orders: 34, color: '#b81c1c' },
  { id: 'S008', name: 'Deepak Mishra', email: 'deepak.m@bhojpe.com', phone: '+912109876508', role: 'Captain', shift: 'Evening', salary: 19000, join: '2024-05-15', status: 'active', orders: 95, color: '#186b35' },
]

export const MOCK_CUSTOMERS = [
  { id: 'C001', name: 'Rahul Gupta', email: 'rahul.gupta@gmail.com', phone: '+919876501234', orders: 15, totalSpent: 8750, lastVisit: '2024-07-10', status: 'active' },
  { id: 'C002', name: 'Priya Sharma', email: 'priya.s@yahoo.com', phone: '+918765401235', orders: 8, totalSpent: 4200, lastVisit: '2024-07-08', status: 'active' },
  { id: 'C003', name: 'Amit Patel', email: 'amit.p@hotmail.com', phone: '+917654301236', orders: 23, totalSpent: 14500, lastVisit: '2024-07-12', status: 'active' },
  { id: 'C004', name: 'Sunita Rao', email: 'sunita@gmail.com', phone: '+916543201237', orders: 5, totalSpent: 2100, lastVisit: '2024-06-20', status: 'active' },
  { id: 'C005', name: 'Vikram Singh', email: 'vikram.s@gmail.com', phone: '+915432101238', orders: 31, totalSpent: 22000, lastVisit: '2024-07-13', status: 'active' },
  { id: 'C006', name: 'Meena Joshi', email: 'meena.j@gmail.com', phone: '+914321001239', orders: 2, totalSpent: 890, lastVisit: '2024-05-15', status: 'inactive' },
]

export const MOCK_MENU = [
  { id: 'M001', name: 'Paneer Butter Masala', category: 'Main Course', price: 280, cost: 90, type: 'veg', available: true, popular: true, description: 'Rich creamy tomato-based curry with soft paneer', tax: 5 },
  { id: 'M002', name: 'Dal Makhani', category: 'Main Course', price: 220, cost: 65, type: 'veg', available: true, popular: true, description: 'Slow cooked black lentils with butter and cream', tax: 5 },
  { id: 'M003', name: 'Butter Chicken', category: 'Main Course', price: 320, cost: 110, type: 'non-veg', available: true, popular: true, description: 'Tender chicken in rich buttery tomato sauce', tax: 5 },
  { id: 'M004', name: 'Biryani (Veg)', category: 'Rice & Biryani', price: 250, cost: 80, type: 'veg', available: true, popular: false, description: 'Aromatic basmati rice with vegetables and spices', tax: 5 },
  { id: 'M005', name: 'Chicken Biryani', category: 'Rice & Biryani', price: 350, cost: 120, type: 'non-veg', available: true, popular: true, description: 'Fragrant basmati rice layered with chicken', tax: 5 },
  { id: 'M006', name: 'Garlic Naan', category: 'Breads', price: 60, cost: 15, type: 'veg', available: true, popular: false, description: 'Soft naan bread with garlic and butter', tax: 5 },
  { id: 'M007', name: 'Butter Naan', category: 'Breads', price: 50, cost: 12, type: 'veg', available: true, popular: true, description: 'Soft fluffy naan with butter', tax: 5 },
  { id: 'M008', name: 'Lassi (Sweet)', category: 'Beverages', price: 80, cost: 20, type: 'veg', available: true, popular: false, description: 'Chilled sweetened yogurt drink', tax: 12 },
  { id: 'M009', name: 'Masala Chai', category: 'Beverages', price: 40, cost: 10, type: 'veg', available: true, popular: true, description: 'Spiced Indian tea with milk', tax: 12 },
  { id: 'M010', name: 'Gulab Jamun', category: 'Desserts', price: 90, cost: 25, type: 'veg', available: true, popular: true, description: 'Soft milk-solid dumplings in sugar syrup', tax: 5 },
  { id: 'M011', name: 'Kadai Chicken', category: 'Main Course', price: 340, cost: 115, type: 'non-veg', available: true, popular: false, description: 'Spicy chicken cooked in a kadai with peppers', tax: 5 },
  { id: 'M012', name: 'Chole Bhature', category: 'Starters', price: 160, cost: 45, type: 'veg', available: true, popular: true, description: 'Spicy chickpea curry with deep-fried bread', tax: 5 },
  { id: 'M013', name: 'Samosa (2 pcs)', category: 'Starters', price: 60, cost: 18, type: 'veg', available: true, popular: true, description: 'Crispy fried pastry with spiced potato filling', tax: 5 },
  { id: 'M014', name: 'Chicken Tikka', category: 'Starters', price: 280, cost: 95, type: 'non-veg', available: true, popular: true, description: 'Marinated chicken pieces grilled in tandoor', tax: 5 },
  { id: 'M015', name: 'Raita', category: 'Sides', price: 60, cost: 15, type: 'veg', available: true, popular: false, description: 'Yogurt with cucumber and spices', tax: 5 },
]

const today = new Date()
const fmtDate = (d) => d.toISOString().split('T')[0]
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }

export const MOCK_ORDERS = [
  { id: 'ORD001', orderNumber: '#10234', type: 'dine', table: 'T4', items: [{ id: 'M003', name: 'Butter Chicken', qty: 2, price: 320 }, { id: 'M007', name: 'Butter Naan', qty: 4, price: 50 }], subtotal: 840, tax: 42, total: 882, status: 'completed', paymentMethod: 'upi', createdAt: new Date(Date.now() - 3600000).toISOString(), waiter: 'Raju Singh' },
  { id: 'ORD002', orderNumber: '#10235', type: 'dine', table: 'T2', items: [{ id: 'M001', name: 'Paneer Butter Masala', qty: 1, price: 280 }, { id: 'M002', name: 'Dal Makhani', qty: 1, price: 220 }, { id: 'M006', name: 'Garlic Naan', qty: 3, price: 60 }], subtotal: 680, tax: 34, total: 714, status: 'preparing', paymentMethod: null, createdAt: new Date(Date.now() - 1800000).toISOString(), waiter: 'Arjun Sharma' },
  { id: 'ORD003', orderNumber: '#10236', type: 'delivery', table: null, items: [{ id: 'M005', name: 'Chicken Biryani', qty: 2, price: 350 }, { id: 'M010', name: 'Gulab Jamun', qty: 2, price: 90 }], subtotal: 880, tax: 44, total: 924, status: 'pending', paymentMethod: 'cash', createdAt: new Date(Date.now() - 900000).toISOString(), rider: 'Delivery Boy' },
  { id: 'ORD004', orderNumber: '#10237', type: 'pickup', table: null, items: [{ id: 'M012', name: 'Chole Bhature', qty: 2, price: 160 }, { id: 'M009', name: 'Masala Chai', qty: 2, price: 40 }], subtotal: 400, tax: 20, total: 420, status: 'ready', paymentMethod: 'cash', createdAt: new Date(Date.now() - 600000).toISOString() },
]

export const MOCK_RESERVATIONS = [
  { id: 'RES001', name: 'Sharma Family', phone: '+919876543210', email: 'sharma@gmail.com', guests: 6, date: fmtDate(today), time: '19:30', table: 'T6', status: 'confirmed', notes: 'Birthday celebration - need cake', waiter: 'Raju Singh' },
  { id: 'RES002', name: 'Priya Mehta', phone: '+918765432109', email: 'priya@gmail.com', guests: 2, date: fmtDate(today), time: '20:00', table: 'T2', status: 'pending', notes: 'Anniversary dinner', waiter: null },
  { id: 'RES003', name: 'Corporate Lunch - TCS', phone: '+917654321098', email: 'hr@tcs.com', guests: 12, date: fmtDate(addDays(today, 1)), time: '13:00', table: 'T8', status: 'confirmed', notes: 'Corporate client - best service', waiter: 'Arjun Sharma' },
  { id: 'RES004', name: 'Gupta Ji', phone: '+916543210987', email: '', guests: 4, date: fmtDate(addDays(today, 2)), time: '21:00', table: null, status: 'pending', notes: '', waiter: null },
]
