export const ROLES = ['admin', 'manager', 'cashier', 'waiter', 'chef', 'captain']
export const SHIFTS = ['Morning', 'Evening', 'Night', 'Full']
export const ORDER_TYPES = ['dine', 'pickup', 'delivery']
export const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']
export const RESERVATION_STATUSES = ['pending', 'confirmed', 'seated', 'completed', 'cancelled']
export const ITEM_TYPES = ['veg', 'non-veg', 'egg']
export const MENU_CATEGORIES = ['Starters', 'Main Course', 'Rice & Biryani', 'Breads', 'Beverages', 'Desserts', 'Sides']
export const TABLES = Array.from({ length: 20 }, (_, i) => `T${i + 1}`)

export const ROLE_COLORS = {
  admin: '#FF3D01', manager: '#FF3D01', cashier: '#7a5a00',
  waiter: '#1a4fcc', chef: '#7e22ce', captain: '#186b35',
}

export const STATUS_COLORS = {
  pending: 'warning', confirmed: 'info', preparing: 'primary',
  ready: 'success', completed: 'default', cancelled: 'error',
  active: 'success', inactive: 'default', seated: 'info',
}

export const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: '💵' },
  { id: 'upi', label: 'UPI', icon: '📱' },
  { id: 'card', label: 'Card', icon: '💳' },
]

export const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', region: 'Pan India' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी', region: 'North India' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', region: 'West Bengal' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', region: 'Andhra/Telangana' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', region: 'Maharashtra' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', region: 'Tamil Nadu' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', region: 'Gujarat' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', region: 'Karnataka' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', region: 'Kerala' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', region: 'Punjab' },
]
