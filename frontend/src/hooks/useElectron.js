/**
 * Safe hook to access Electron IPC APIs
 * Returns null-safe stubs when running in browser
 */
export function useElectron() {
  const api = window.electronAPI || null
  const isElectron = Boolean(api)

  return {
    isElectron,
    platform: api?.getPlatform() || 'browser',

    // DB
    dbGet: api?.db?.get || (() => Promise.resolve(null)),
    dbGetAll: api?.db?.getAll || (() => Promise.resolve([])),
    dbSet: api?.db?.set || (() => Promise.resolve({ success: false })),
    dbDelete: api?.db?.delete || (() => Promise.resolve({ success: false })),

    // Print
    print: api?.print || (() => Promise.resolve({ success: false })),
    printKOT: api?.printKOT || (() => Promise.resolve({ success: false })),

    // File
    saveFile: api?.saveFile || (() => Promise.resolve(null)),
    openFile: api?.openFile || (() => Promise.resolve(null)),

    // Window
    minimize: api?.minimize || (() => {}),
    maximize: api?.maximize || (() => {}),
    close: api?.close || (() => {}),
  }
}
