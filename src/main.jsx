import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import EnsureHashRoute from './EnsureHashRoute.jsx'

/**
 * HashRouter reads routes from `location.hash` (e.g. `#/add/quick`) so the app works on GitHub Pages.
 * On the local dev/preview server, if someone opens a path-style URL without a hash
 * (e.g. `http://127.0.0.1:5173/add/quick`), normalize once to `#/add/quick`.
 * (Production on github.io is not treated as "local" here.)
 */
function redirectPathnameToHashIfNeeded() {
  if (typeof window === 'undefined') return
  const { hostname, pathname, search, hash, origin } = window.location
  const localHost =
    hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
  if (!localHost) return
  const hasRouteHash = typeof hash === 'string' && hash.startsWith('#/') && hash.length > 2
  if (hasRouteHash) return
  if (pathname === '/' || pathname === '') return
  window.location.replace(`${origin}/#${pathname}${search}`)
}
redirectPathnameToHashIfNeeded()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <EnsureHashRoute />
      <App />
    </HashRouter>
  </StrictMode>,
)
