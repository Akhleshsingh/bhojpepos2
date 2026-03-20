import { Box, Chip, CircularProgress, Tooltip } from '@mui/material'
import { Wifi, WifiOff, Sync, CloudDone } from '@mui/icons-material'
import { useSelector, useDispatch } from 'react-redux'
import { syncPendingChanges } from '../../features/syncSlice'

export default function SyncIndicator() {
  const dispatch = useDispatch()
  const isOnline = useSelector(s => s.ui.isOnline)
  const { pendingCount, isSyncing } = useSelector(s => s.sync)

  if (!isOnline) {
    return (
      <Tooltip title="You are offline. Changes will sync when online.">
        <Chip icon={<WifiOff sx={{ fontSize: 14 }} />} label="Offline" size="small"
          sx={{ bgcolor: 'error.light', color: 'error.dark', fontWeight: 700, cursor: 'default', border: '1px solid', borderColor: 'error.main', opacity: 0.85 }} />
      </Tooltip>
    )
  }

  if (isSyncing) {
    return (
      <Chip icon={<CircularProgress size={12} color="inherit" />} label="Syncing..." size="small"
        sx={{ bgcolor: 'info.light', color: 'info.dark', fontWeight: 700 }} />
    )
  }

  if (pendingCount > 0) {
    return (
      <Tooltip title={`${pendingCount} changes pending sync. Click to sync now.`}>
        <Chip icon={<Sync sx={{ fontSize: 14 }} />} label={`${pendingCount} pending`} size="small"
          onClick={() => dispatch(syncPendingChanges())}
          sx={{ bgcolor: 'warning.light', color: 'warning.dark', fontWeight: 700, cursor: 'pointer', border: '1px solid', borderColor: 'warning.main' }} />
      </Tooltip>
    )
  }

  return (
    <Tooltip title="All synced">
      <Chip icon={<CloudDone sx={{ fontSize: 14 }} />} label="Synced" size="small"
        sx={{ bgcolor: 'success.light', color: 'success.dark', fontWeight: 700 }} />
    </Tooltip>
  )
}
