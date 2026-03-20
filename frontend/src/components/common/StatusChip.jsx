import { Chip } from '@mui/material'
import { STATUS_COLORS } from '../../utils/constants'

export default function StatusChip({ status, size = 'small' }) {
  const color = STATUS_COLORS[status] || 'default'
  return (
    <Chip
      label={status?.charAt(0).toUpperCase() + status?.slice(1)}
      color={color}
      size={size}
      sx={{ fontWeight: 700, fontSize: '11px', letterSpacing: '0.3px' }}
    />
  )
}
