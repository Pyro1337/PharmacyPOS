import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthStore } from './stores/authStore'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import POS from './pages/POS'
import Medicamentos from './pages/Medicamentos'
import Recetas from './pages/Recetas'
import Caja from './pages/Caja'
import Finanzas from './pages/Finanzas'
import Clientes from './pages/Clientes'
import Proveedores from './pages/Proveedores'
import Layout from './components/Layout'

function Protected({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, fetchMe } = useAuthStore()
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (isAuthenticated && !user) {
      fetchMe().finally(() => setLoading(false))
    } else setLoading(false)
  }, [])
  if (loading) return <div className="p-8 text-center">Cargando...</div>
  if (!isAuthenticated) return <Navigate to="/login" />
  return <>{children}</>
}

export default function App() {
  const [dark, setDark] = useState(localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches))
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])
  return (
    <div className={dark ? 'dark bg-slate-900 text-slate-100 min-h-screen' : 'bg-slate-50 text-slate-900 min-h-screen'}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Protected><Layout dark={dark} toggle={() => setDark(!dark)} /></Protected>}>
          <Route index element={<Dashboard />} />
          <Route path="pos" element={<POS />} />
          <Route path="medicamentos" element={<Medicamentos />} />
          <Route path="recetas" element={<Recetas />} />
          <Route path="caja" element={<Caja />} />
          <Route path="finanzas" element={<Finanzas />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="proveedores" element={<Proveedores />} />
        </Route>
      </Routes>
    </div>
  )
}
