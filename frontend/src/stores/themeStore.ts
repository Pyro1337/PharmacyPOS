import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  resolved: 'light' | 'dark'
  setTheme: (t: Theme) => void
}

function getSystem(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
}

function apply(theme: Theme) {
  const resolved = theme === 'system' ? getSystem() : theme
  const isDark = resolved === 'dark'
  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.setAttribute('data-theme', resolved)
  return resolved
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system' as Theme,
      resolved: getSystem(),
      setTheme: (t) => {
        const resolved = apply(t)
        set({ theme: t, resolved })
      }
    }),
    {
      name: 'theme-store',
      onRehydrateStorage: () => (state) => {
        if (state) {
          const r = apply(state.theme)
          state.resolved = r
        }
      }
    }
  )
)

// init and listen to system changes
if (typeof window !== 'undefined') {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = () => {
    const raw = localStorage.getItem('theme-store')
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (parsed?.state?.theme === 'system') {
          const isDark = media.matches
          document.documentElement.classList.toggle('dark', isDark)
        }
      } catch {}
    } else {
      document.documentElement.classList.toggle('dark', media.matches)
    }
  }
  media.addEventListener?.('change', handler)
  // initial apply after load
  setTimeout(() => {
    const raw = localStorage.getItem('theme-store')
    let theme: Theme = 'system'
    if (raw) {
      try { theme = JSON.parse(raw).state.theme } catch {}
    } else {
      // legacy key
      const legacy = localStorage.getItem('theme')
      if (legacy === 'dark' || legacy === 'light') theme = legacy
    }
    apply(theme)
  }, 0)
}
