import { Box, CircularProgress, Typography } from '@mui/material'

export default function LoadingScreen({ message = 'Loading…' }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 2, bgcolor: 'background.default' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px', mb: 1 }}>
        {[24, 17, 11].map(w => (
          <Box key={w} sx={{ width: w, height: 3.5, borderRadius: 1, bgcolor: '#E8332A' }} />
        ))}
      </Box>
      <CircularProgress size={36} thickness={4} sx={{ color: '#E8332A' }} />
      <Typography fontWeight={700} color="text.secondary" fontSize={14}>{message}</Typography>
    </Box>
  )
}
