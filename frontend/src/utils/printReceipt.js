import { formatCurrency, formatDateTime } from './formatters'

/**
 * Generate receipt HTML string for thermal printer
 * Also works as browser print fallback
 */
export function buildReceiptHTML(order, restaurantInfo = {}) {
  const { orderNumber, items = [], subtotal, tax, total, paymentMethod, createdAt, type, table, waiter } = order
  const { name = 'Bhojpe Restaurant', address = '', phone = '', gst = '' } = restaurantInfo

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; padding: 4mm; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .large { font-size: 16px; }
        .divider { border-top: 1px dashed #000; margin: 4px 0; }
        .row { display: flex; justify-content: space-between; margin: 2px 0; }
        .total-row { font-size: 14px; font-weight: bold; margin-top: 4px; }
        .footer { margin-top: 8px; text-align: center; font-size: 11px; }
      </style>
    </head>
    <body>
      <div class="center bold large">${name}</div>
      ${address ? `<div class="center">${address}</div>` : ''}
      ${phone ? `<div class="center">Tel: ${phone}</div>` : ''}
      ${gst ? `<div class="center">GST: ${gst}</div>` : ''}
      <div class="divider"></div>
      <div class="row"><span>Order: <b>${orderNumber}</b></span><span>${type?.toUpperCase()}</span></div>
      ${table ? `<div class="row"><span>Table: ${table}</span></div>` : ''}
      ${waiter ? `<div class="row"><span>Staff: ${waiter}</span></div>` : ''}
      <div class="row"><span>${formatDateTime(createdAt)}</span></div>
      <div class="divider"></div>
      <div class="row bold"><span>Item</span><span>Qty</span><span>Amt</span></div>
      <div class="divider"></div>
      ${items.map(item => `
        <div class="row">
          <span style="flex:1">${item.name}</span>
          <span style="width:30px;text-align:center">${item.qty}</span>
          <span style="width:55px;text-align:right">${formatCurrency(item.price * item.qty)}</span>
        </div>
      `).join('')}
      <div class="divider"></div>
      <div class="row"><span>Subtotal</span><span>${formatCurrency(subtotal)}</span></div>
      <div class="row"><span>GST (5%)</span><span>${formatCurrency(tax)}</span></div>
      <div class="divider"></div>
      <div class="row total-row"><span>TOTAL</span><span>${formatCurrency(total)}</span></div>
      <div class="row"><span>Payment</span><span>${paymentMethod?.toUpperCase() || 'PENDING'}</span></div>
      <div class="divider"></div>
      <div class="footer">
        <div>Thank you for visiting!</div>
        <div>Powered by Bhojpe POSS</div>
      </div>
    </body>
    </html>
  `
}

export function buildKOTHTML(order, kitchenName = 'Kitchen') {
  const { orderNumber, items = [], type, table, waiter, createdAt } = order
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; font-size: 13px; width: 80mm; padding: 4mm; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .xl { font-size: 20px; }
        .divider { border-top: 2px dashed #000; margin: 6px 0; }
        .item-row { display: flex; justify-content: space-between; font-size: 14px; padding: 3px 0; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="center bold" style="font-size:11px">KOT — ${kitchenName}</div>
      <div class="divider"></div>
      <div class="center bold xl">${orderNumber}</div>
      <div class="center" style="font-size:13px">${type?.toUpperCase()} ${table ? '· Table ' + table : ''}</div>
      ${waiter ? `<div class="center" style="font-size:11px">Waiter: ${waiter}</div>` : ''}
      <div class="divider"></div>
      ${items.map(item => `
        <div class="item-row">
          <span>[${item.qty}x] ${item.name}</span>
        </div>
      `).join('')}
      <div class="divider"></div>
      <div class="center" style="font-size:11px">${new Date(createdAt).toLocaleTimeString()}</div>
    </body>
    </html>
  `
}

/**
 * Print via Electron IPC if available, else browser print
 */
export async function printReceipt(order, restaurantInfo) {
  const html = buildReceiptHTML(order, restaurantInfo)
  if (window.electronAPI?.print) {
    return window.electronAPI.print(html)
  }
  // Browser fallback
  const w = window.open('', '_blank', 'width=400,height=600')
  w.document.write(html)
  w.document.close()
  w.focus()
  w.print()
  setTimeout(() => w.close(), 1000)
}

export async function printKOT(order, kitchenName) {
  const html = buildKOTHTML(order, kitchenName)
  if (window.electronAPI?.printKOT) {
    return window.electronAPI.printKOT(html)
  }
  const w = window.open('', '_blank', 'width=400,height=600')
  w.document.write(html)
  w.document.close()
  w.focus()
  w.print()
  setTimeout(() => w.close(), 1000)
}
