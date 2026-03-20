export const formatCurrency = (amount, currency = '₹') =>
  `${currency}${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`

export const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const formatTime = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—'
  return `${formatDate(dateStr)} ${formatTime(dateStr)}`
}

export const getInitials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()

export const truncate = (str, n = 30) => str?.length > n ? str.substring(0, n) + '...' : str

export const calcOrderTotals = (items = [], discountPct = 0, taxPct = 5) => {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const discount = (subtotal * discountPct) / 100
  const taxable = subtotal - discount
  const tax = (taxable * taxPct) / 100
  const total = taxable + tax
  return { subtotal, discount, tax, total }
}
