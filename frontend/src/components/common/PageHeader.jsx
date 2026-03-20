import { Box, Typography, Breadcrumbs, Link } from '@mui/material'
import { NavigateNext } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

export default function PageHeader({ title, subtitle, breadcrumbs = [], actions }) {
  const navigate = useNavigate()
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
      <Box>
        {breadcrumbs.length > 0 && (
          <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 0.5 }}>
            {breadcrumbs.map((b, i) =>
              b.href ? (
                <Link key={i} component="button" underline="hover" color="text.secondary" fontSize={12} fontWeight={600}
                  onClick={() => navigate(b.href)}>{b.label}</Link>
              ) : (
                <Typography key={i} color="text.primary" fontSize={12} fontWeight={700}>{b.label}</Typography>
              )
            )}
          </Breadcrumbs>
        )}
        <Typography variant="h5" fontWeight={800}>{title}</Typography>
        {subtitle && <Typography color="text.secondary" fontSize={13} sx={{ mt: 0.3 }}>{subtitle}</Typography>}
      </Box>
      {actions && <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>{actions}</Box>}
    </Box>
  )
}
