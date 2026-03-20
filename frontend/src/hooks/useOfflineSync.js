import { useSelector, useDispatch } from 'react-redux'
import { useCallback } from 'react'
import { addToQueue } from '../features/syncSlice'
import { showSnackbar } from '../features/uiSlice'

export const useOfflineSync = () => {
  const dispatch = useDispatch()
  const isOnline = useSelector(s => s.ui.isOnline)
  const pendingCount = useSelector(s => s.sync.pendingCount)
  const isSyncing = useSelector(s => s.sync.isSyncing)

  const queueAction = useCallback((method, url, data) => {
    dispatch(addToQueue({ method, url, data }))
    if (!isOnline) {
      dispatch(showSnackbar({ message: '📴 Saved locally — will sync when online', severity: 'info' }))
    }
  }, [dispatch, isOnline])

  return { isOnline, pendingCount, isSyncing, queueAction }
}
