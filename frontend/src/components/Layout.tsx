import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { LayoutDashboard, ShoppingCart, Package, FileText, Wallet, BarChart3, Users, Truck, LogOut, Moon, Sun } from 'lucide-react'

export default function Layout({ dark, toggle }: { dark: boolean, toggle: () => void }) {
  const { user, logout } = useAuthStore()
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
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-white dark:bg-slate-800 border-r dark:border-slate-700 hidden md:flex flex-col">
        <div className="p-6 border-b dark:border-slate-700">
          <h1 className="text-xl font-bold text-blue-700 dark:text-blue-400">💊 PharmacyPOS</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Paraguay • PYG</p>
          <p className="text-xs mt-2 font-medium">{user?.nombre} <span className="text-slate-400">({user?.rol})</span></p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {links.map(l => {
            const active = loc.pathname === l.to
            return (
              <Link key={l.to} to={l.to} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${active ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                <l.icon size={18} /> {l.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t dark:border-slate-700 space-y-2">
          <button onClick={toggle} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-sm">
            {dark ? <Sun size={16}/> : <Moon size={16}/>} {dark ? 'Modo Claro' : 'Modo Oscuro'}
          </button>
          <button onClick={async () => { await logout(); nav('/login') }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            <LogOut size={16}/> Cerrar Sesión
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b">
          <span className="font-bold">PharmacyPOS</span>
          <button onClick={toggle}>{dark ? <Sun size={18}/> : <Moon size={18}/>}</button>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
