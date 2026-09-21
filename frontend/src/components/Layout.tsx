import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useThemeStore } from '../stores/themeStore'
import { LayoutDashboard, ShoppingCart, Package, FileText, Wallet, BarChart3, Users, Truck, LogOut, Moon, Sun, Monitor } from 'lucide-react'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const { theme, setTheme } = useThemeStore()
  const nav = useNavigate()
  const loc = useLocation()
  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/pos', label: 'POS', icon: ShoppingCart },
    { to: '/medicamentos', label: 'Medicamentos', icon: Package },
    { to: '/recetas', label: 'Recetas', icon: FileText },
    { to: '/caja', label: 'Caja Diaria', icon: Wallet },
    { to: '/finanzas', label: 'Finanzas', icon: BarChart3 },
    { to: '/clientes', label: 'Clientes', icon: Users },
    { to: '/proveedores', label: 'Proveedores', icon: Truck },
  ]
  const cycleTheme = () => {
    const order: Array<'light'|'dark'|'system'> = ['light','dark','system']
    const idx = order.indexOf(theme)
    setTheme(order[(idx+1)%order.length])
  }
  const themeLabel = theme === 'light' ? 'Modo Claro' : theme === 'dark' ? 'Modo Oscuro' : 'Sistema'
  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h1 className="text-xl font-bold text-blue-700 dark:text-blue-400">💊 PharmacyPOS</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Paraguay • PYG</p>
          <p className="text-xs mt-2 font-medium text-slate-700 dark:text-slate-200">{user?.nombre} <span className="text-slate-400">({user?.rol})</span></p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {links.map(l => {
            const active = loc.pathname === l.to
            return (
              <Link key={l.to} to={l.to} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-blue-600 text-white shadow' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                <l.icon size={18} /> {l.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
          <button onClick={cycleTheme} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-sm text-slate-700 dark:text-slate-300 border border-transparent hover:border-slate-200 dark:hover:border-slate-600">
            <ThemeIcon size={16}/> {themeLabel}
          </button>
          <button onClick={async () => { await logout(); nav('/login') }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/30">
            <LogOut size={16}/> Cerrar Sesión
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <span className="font-bold text-slate-800 dark:text-slate-100">PharmacyPOS</span>
          <button onClick={cycleTheme} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">{theme === 'dark' ? <Sun size={18}/> : theme === 'light' ? <Moon size={18}/> : <Monitor size={18}/>}</button>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto bg-slate-50 dark:bg-slate-900">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
