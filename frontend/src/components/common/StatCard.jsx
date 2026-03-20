import { Box, Card, Typography } from '@mui/material'
import { TrendingUp, TrendingDown } from '@mui/icons-material'

export default function StatCard({ title, value, subtitle, icon, color = '#FF3D01', trend, trendValue }) {
  const isPositive = trend === 'up'
  return (
    <Card sx={{ p: 2.5, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Box sx={{ width: 44, height: 44, borderRadius: '11px', bgcolor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
          {icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.2 }}>
            {value}
          </Typography>
          {(subtitle || trendValue) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              {trendValue && (
                <Box sx={{ display: 'flex', alignItems: 'center', color: isPositive ? 'success.main' : 'error.main' }}>
                  {isPositive ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
                  <Typography variant="caption" fontWeight={700} color="inherit">{trendValue}</Typography>
                </Box>
              )}
              {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
            </Box>
          )}
        </Box>
      </Box>
    </Card>
  )
}
