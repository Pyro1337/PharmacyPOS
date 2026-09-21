import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function Login() {
  const [email, setEmail] = useState('admin@farmacia.py')
  const [password, setPassword] = useState('Admin123!')
  const [error, setError] = useState('')
  const login = useAuthStore(s => s.login)
  const nav = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      nav('/')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al iniciar sesión')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-800 p-4">
      <form onSubmit={submit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">💊 PharmacyPOS</h1>
          <p className="text-sm text-slate-500">Paraguay • Guaraní (PYG)</p>
        </div>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
        <div>
          <label className="text-sm font-medium">Email</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" className="w-full mt-1 px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
        </div>
        <div>
          <label className="text-sm font-medium">Contraseña</label>
          <input value={password} onChange={e=>setPassword(e.target.value)} type="password" className="w-full mt-1 px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition">Ingresar</button>
        <div className="text-xs text-center text-slate-400">
          Usuarios demo: admin@farmacia.py / vendedor@farmacia.py / farmaceutico@farmacia.py (pass: ver seed.py)
        </div>
      </form>
    </div>
  )
}
