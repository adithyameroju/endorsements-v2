import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, useNavigate } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

/** HashRouter matches routes in the hash. Empty hash → send user to #/ without touching the module graph. */
function EnsureHashRoute() {
  const navigate = useNavigate()
  useEffect(() => {
    const h = window.location.hash
    if (h === '' || h === '#') {
      navigate('/', { replace: true })
    }
  }, [navigate])
  return null
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <EnsureHashRoute />
      <App />
    </HashRouter>
  </StrictMode>,
)
