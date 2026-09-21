import { useEffect, useState } from 'react'

let listeners: ((msg: string, type: string) => void)[] = []
export const toast = (msg: string, type: 'success'|'error'|'info' = 'info') => listeners.forEach(l => l(msg, type))

export function ToastContainer() {
  const [toasts, setToasts] = useState<{id:number, msg:string, type:string}[]>([])
  useEffect(() => {
    const fn = (msg:string, type:string) => {
      const id = Date.now()
      setToasts(s => [...s, {id, msg, type}])
      setTimeout(() => setToasts(s => s.filter(t => t.id !== id)), 3000)
    }
    listeners.push(fn)
    return () => { listeners = listeners.filter(l => l!==fn)}
  }, [])
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(t => (
        <div key={t.id} className={`px-4 py-3 rounded-lg shadow-lg text-sm text-white ${t.type==='success'?'bg-green-600': t.type==='error'?'bg-red-600':'bg-slate-800'}`}>
          {t.msg}
        </div>
      ))}
    </div>
  )
}
