import { Box, Typography, Button } from '@mui/material'

export default function EmptyState({ icon, title, description, actionLabel, onAction }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, px: 4, textAlign: 'center', color: 'text.disabled' }}>
      <Box sx={{ fontSize: 64, mb: 2, opacity: 0.3, lineHeight: 1 }}>{icon}</Box>
      <Typography fontWeight={800} fontSize={16} color="text.secondary" sx={{ mb: 0.5 }}>{title}</Typography>
      {description && <Typography fontSize={13} color="text.disabled" sx={{ mb: 2.5, maxWidth: 320 }}>{description}</Typography>}
      {actionLabel && onAction && (
        <Button variant="outlined" onClick={onAction} sx={{ fontWeight: 700 }}>{actionLabel}</Button>
      )}
    </Box>
  )
}
