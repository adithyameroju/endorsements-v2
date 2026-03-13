import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileHeart, FileText, Wallet, Shield, BarChart3, Bell,
  ChevronDown, Building2, HelpCircle
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: FileHeart, label: 'Claims', path: '/claims' },
  { icon: FileText, label: 'Endorsements', path: '/' },
  { icon: Wallet, label: 'CD Balance', path: '/cd-balance' },
  { icon: Shield, label: 'Policy Management', path: '/policy-management' },
  { icon: BarChart3, label: 'Reports', path: '/reports' },
]

const endorsementPaths = ['/', '/add', '/update', '/delete', '/hrms-sync']

function isEndorsementRoute(pathname) {
  return endorsementPaths.some(p =>
    p === '/' ? pathname === '/' : pathname.startsWith(p)
  )
}

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside
        className={`${collapsed ? 'w-[72px]' : 'w-[250px]'} bg-sidebar flex flex-col transition-all duration-200 flex-shrink-0`}
      >
        <div className={`flex items-center gap-3 px-5 h-16 border-b border-white/10 ${collapsed ? 'justify-center px-0' : ''}`}>
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 size={18} className="text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">ACKO</p>
              <p className="text-indigo-300 text-xs truncate">Employer Portal</p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.path === '/'
              ? isEndorsementRoute(location.pathname)
              : location.pathname.startsWith(item.path)
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer
                  ${isActive
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'text-indigo-200 hover:bg-sidebar-hover hover:text-white'
                  }
                  ${collapsed ? 'justify-center' : ''}`}
              >
                <Icon size={20} className="flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-indigo-200 hover:bg-sidebar-hover hover:text-white transition-colors cursor-pointer ${collapsed ? 'justify-center' : ''}`}
          >
            <ChevronDown
              size={20}
              className={`flex-shrink-0 transition-transform ${collapsed ? 'rotate-90' : '-rotate-90'}`}
            />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          <div />
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
              <HelpCircle size={20} />
            </button>
            <div className="h-6 w-px bg-gray-200 mx-1" />
            <div className="flex items-center gap-3 pl-1 cursor-pointer">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-indigo-600">AM</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900 leading-tight">Adithya M.</p>
                <p className="text-xs text-gray-500 leading-tight">HR Admin</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
