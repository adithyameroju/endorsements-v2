import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/** Empty hash → `#/` so the dashboard loads. */
export default function EnsureHashRoute() {
  const navigate = useNavigate()
  useEffect(() => {
    const h = window.location.hash
    if (h === '' || h === '#') {
      navigate('/', { replace: true })
    }
  }, [navigate])
  return null
}
