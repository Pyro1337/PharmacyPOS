import { useEffect, useState } from 'react'
import api from '../lib/api'
import { toast } from '../components/Toast'

export default function Clientes() {
  const [clientes, setClientes] = useState<any[]>([])
  const [form, setForm] = useState({ nombre:'', cedula:'', telefono:'', descuento:0 })

  const load = async () => {
    const { data } = await api.get('/clientes/')
    setClientes(data)
  }
  useEffect(()=>{load()}, [])

  const submit = async (e:any) => {
    e.preventDefault()
    try { await api.post('/clientes/', form); toast('Cliente creado','success'); load() } catch (err:any){ toast(err.response?.data?.detail || 'Error','error')}
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Clientes</h1>
      <form onSubmit={submit} className="bg-white dark:bg-slate-800 p-4 rounded-xl grid grid-cols-2 gap-3">
        <input placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} className="px-3 py-2 border rounded dark:bg-slate-700" required/>
        <input placeholder="Cédula 8 dígitos" value={form.cedula} onChange={e=>setForm({...form, cedula:e.target.value})} className="px-3 py-2 border rounded dark:bg-slate-700"/>
        <input placeholder="Teléfono" value={form.telefono} onChange={e=>setForm({...form, telefono:e.target.value})} className="px-3 py-2 border rounded dark:bg-slate-700"/>
        <input type="number" placeholder="Descuento %" value={form.descuento} onChange={e=>setForm({...form, descuento:Number(e.target.value)})} className="px-3 py-2 border rounded dark:bg-slate-700"/>
        <button type="submit" className="col-span-2 bg-blue-600 text-white py-2 rounded-lg">Guardar Cliente</button>
      </form>
      <div className="bg-white dark:bg-slate-800 rounded-xl overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-700"><tr><th className="p-2 text-left">Nombre</th><th className="p-2">Cédula</th><th className="p-2">Teléfono</th><th className="p-2">Descuento</th></tr></thead>
          <tbody>
            {clientes.map(c=>(
              <tr key={c.id} className="border-t dark:border-slate-700"><td className="p-2">{c.nombre}</td><td className="p-2 text-center">{c.cedula || '—'}</td><td className="p-2 text-center">{c.telefono || '—'}</td><td className="p-2 text-center">{c.descuento}%</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
