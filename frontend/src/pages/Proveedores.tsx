import { useEffect, useState } from 'react'
import api from '../lib/api'
import { toast } from '../components/Toast'

export default function Proveedores() {
  const [provs, setProvs] = useState<any[]>([])
  const [form, setForm] = useState({ nombre:'', contacto:'', telefono:'', ruc:'' })

  const load = async () => {
    const { data } = await api.get('/proveedores/')
    setProvs(data)
  }
  useEffect(()=>{load()}, [])

  const submit = async (e:any) => {
    e.preventDefault()
    try { await api.post('/proveedores/', form); toast('Proveedor creado','success'); load() } catch { toast('Error','error')}
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Proveedores</h1>
      <form onSubmit={submit} className="bg-white dark:bg-slate-800 p-4 rounded-xl grid grid-cols-2 gap-3">
        <input placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} className="px-3 py-2 border rounded dark:bg-slate-700" required/>
        <input placeholder="Contacto" value={form.contacto} onChange={e=>setForm({...form, contacto:e.target.value})} className="px-3 py-2 border rounded dark:bg-slate-700"/>
        <input placeholder="Teléfono" value={form.telefono} onChange={e=>setForm({...form, telefono:e.target.value})} className="px-3 py-2 border rounded dark:bg-slate-700"/>
        <input placeholder="RUC" value={form.ruc} onChange={e=>setForm({...form, ruc:e.target.value})} className="px-3 py-2 border rounded dark:bg-slate-700"/>
        <button type="submit" className="col-span-2 bg-blue-600 text-white py-2 rounded-lg">Guardar Proveedor</button>
      </form>
      <div className="bg-white dark:bg-slate-800 rounded-xl overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-700"><tr><th className="p-2 text-left">Nombre</th><th className="p-2">Contacto</th><th className="p-2">Teléfono</th><th className="p-2">RUC</th></tr></thead>
          <tbody>
            {provs.map(p=>(
              <tr key={p.id} className="border-t dark:border-slate-700"><td className="p-2">{p.nombre}</td><td className="p-2 text-center">{p.contacto || '—'}</td><td className="p-2 text-center">{p.telefono || '—'}</td><td className="p-2 text-center">{p.ruc || '—'}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
