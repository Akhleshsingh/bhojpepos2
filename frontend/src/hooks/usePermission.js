import { useSelector } from 'react-redux'
import { hasPermission } from '../features/authSlice'

export const usePermission = (permission) => {
  const user = useSelector(s => s.auth.user)
  return hasPermission(user, permission)
}

export const useRole = () => {
  const user = useSelector(s => s.auth.user)
  return user?.role || null
}
