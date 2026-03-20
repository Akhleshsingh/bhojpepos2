import Dexie from 'dexie'

const db = new Dexie('BhojpePOSS')

db.version(1).stores({
  staff: 'id, name, role, status',
  customers: 'id, name, phone',
  orders: 'id, status, createdAt',
  menu: 'id, category, name',
  reservations: 'id, status, date',
  syncQueue: '++id, timestamp, method, url, retries',
  settings: 'key',
})

export const localDB = {
  getAll: async (store) => { try { return await db[store].toArray() } catch { return [] } },
  get: async (store, id) => { try { return await db[store].get(id) } catch { return null } },
  set: async (store, id, value) => { try { await db[store].put({ ...value, id }); return true } catch { return false } },
  setAll: async (store, items) => { try { await db[store].bulkPut(items); return true } catch { return false } },
  delete: async (store, id) => { try { await db[store].delete(id); return true } catch { return false } },
  clear: async (store) => { try { await db[store].clear(); return true } catch { return false } },
  getSyncQueue: async () => { try { return await db.syncQueue.orderBy('timestamp').toArray() } catch { return [] } },
  addToSyncQueue: async (item) => { try { await db.syncQueue.add({ ...item, timestamp: new Date().toISOString(), retries: 0 }); return true } catch { return false } },
  removeSyncQueueItem: async (id) => { try { await db.syncQueue.delete(id); return true } catch { return false } },
  updateSyncQueueItem: async (item) => { try { await db.syncQueue.put(item); return true } catch { return false } },
  getSyncQueueCount: async () => { try { return await db.syncQueue.count() } catch { return 0 } },
  getSetting: async (key) => { try { const r = await db.settings.get(key); return r?.value } catch { return null } },
  setSetting: async (key, value) => { try { await db.settings.put({ key, value }); return true } catch { return false } },
}
