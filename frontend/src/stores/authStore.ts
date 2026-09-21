import { create } from 'zustand'
import api from '../lib/api'

interface User {
  id: number
  email: string
  nombre: string
  rol: 'admin' | 'farmaceutico' | 'vendedor' | 'contador'
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('access_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    set({ token: data.access_token, isAuthenticated: true })
    const me = await api.get('/auth/me')
    set({ user: me.data })
  },
  logout: async () => {
    const refresh = localStorage.getItem('refresh_token')
    try {
      if (refresh) await api.post('/auth/logout', { refresh_token: refresh })
    } catch {}
    localStorage.clear()
    set({ user: null, token: null, isAuthenticated: false })
  },
  fetchMe: async () => {
    try {
      const { data } = await api.get('/auth/me')
      set({ user: data, isAuthenticated: true })
    } catch {
      set({ user: null, isAuthenticated: false })
    }
  }
}))
