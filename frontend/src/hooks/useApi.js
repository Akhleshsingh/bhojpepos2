import { useState, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { showSnackbar } from '../features/uiSlice'

export const useApi = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const dispatch = useDispatch()

  const execute = useCallback(async (asyncFn, options = {}) => {
    const { successMsg, errorMsg, onSuccess, onError } = options
    setLoading(true)
    setError(null)
    try {
      const result = await asyncFn()
      if (successMsg) dispatch(showSnackbar({ message: successMsg, severity: 'success' }))
      if (onSuccess) onSuccess(result)
      return result
    } catch (err) {
      const msg = errorMsg || err.message || 'Something went wrong'
      setError(msg)
      dispatch(showSnackbar({ message: msg, severity: 'error' }))
      if (onError) onError(err)
      return null
    } finally {
      setLoading(false)
    }
  }, [dispatch])

  return { loading, error, execute }
}
