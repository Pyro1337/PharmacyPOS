import { useEffect, useState } from 'react'
import api, { formatPYG } from '../lib/api'
import { toast } from '../components/Toast'

export default function Medicamentos() {
  const [meds, setMeds] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<any>({ codigo:'', nombre:'', principio_activo:'', presentacion:'', precio_costo:0, precio_venta:0, stock_actual:0, stock_minimo:5, categoria:'', requiere_receta:false })

  const load = async () => {
    const { data } = await api.get('/medicamentos/', { params: { search } })
    setMeds(data)
  }
  useEffect(()=>{ load() }, [])

  const submit = async (e:any) => {
    e.preventDefault()
    try {
      await api.post('/medicamentos/', form)
      toast('Medicamento creado','success')
      setShowForm(false)
      load()
    } catch (err:any) { toast(err.response?.data?.detail || 'Error','error')}
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Medicamentos</h1>
        <button onClick={()=>setShowForm(!showForm)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">{showForm?'Cerrar':'Nuevo Medicamento'}</button>
      </div>
      <div className="flex gap-2">
        <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter' && load()} placeholder="Buscar..." className="flex-1 px-3 py-2 border rounded-lg dark:bg-slate-700" />
        <button onClick={load} className="px-4 bg-slate-800 text-white rounded-lg">Buscar</button>
      </div>
      {showForm && (
        <form onSubmit={submit} className="bg-white dark:bg-slate-800 p-4 rounded-xl grid grid-cols-2 gap-3">
          <input placeholder="Código barras" value={form.codigo} onChange={e=>setForm({...form, codigo:e.target.value})} className="px-3 py-2 border rounded dark:bg-slate-700" required/>
          <input placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} className="px-3 py-2 border rounded dark:bg-slate-700" required/>
          <input placeholder="Principio activo" value={form.principio_activo} onChange={e=>setForm({...form, principio_activo:e.target.value})} className="px-3 py-2 border rounded dark:bg-slate-700"/>
          <input placeholder="Presentación" value={form.presentacion} onChange={e=>setForm({...form, presentacion:e.target.value})} className="px-3 py-2 border rounded dark:bg-slate-700"/>
          <input type="number" placeholder="Precio costo PYG" value={form.precio_costo} onChange={e=>setForm({...form, precio_costo:Number(e.target.value)})} className="px-3 py-2 border rounded dark:bg-slate-700" required/>
          <input type="number" placeholder="Precio venta PYG" value={form.precio_venta} onChange={e=>setForm({...form, precio_venta:Number(e.target.value)})} className="px-3 py-2 border rounded dark:bg-slate-700" required/>
          <input type="number" placeholder="Stock" value={form.stock_actual} onChange={e=>setForm({...form, stock_actual:Number(e.target.value)})} className="px-3 py-2 border rounded dark:bg-slate-700"/>
          <input placeholder="Categoría" value={form.categoria} onChange={e=>setForm({...form, categoria:e.target.value})} className="px-3 py-2 border rounded dark:bg-slate-700"/>
          <label className="flex items-center gap-2 col-span-2"><input type="checkbox" checked={form.requiere_receta} onChange={e=>setForm({...form, requiere_receta:e.target.checked})}/> Requiere receta</label>
          <button type="submit" className="col-span-2 bg-green-600 text-white py-2 rounded-lg">Guardar</button>
        </form>
      )}
      <div className="bg-white dark:bg-slate-800 rounded-xl overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-700"><tr><th className="p-2 text-left">Código</th><th className="p-2 text-left">Nombre</th><th className="p-2">Precio</th><th className="p-2">Stock</th><th className="p-2">Receta</th><th className="p-2">Vence</th></tr></thead>
          <tbody>
            {meds.map(m=>(
              <tr key={m.id} className="border-t dark:border-slate-700">
                <td className="p-2 font-mono text-xs">{m.codigo}</td>
                <td className="p-2"><div className="font-medium">{m.nombre}</div><div className="text-xs text-slate-400">{m.categoria} • {m.principio_activo}</div></td>
                <td className="p-2 text-center">{formatPYG(m.precio_venta)}<div className="text-xs text-slate-400">{m.margen_ganancia}% margen</div></td>
                <td className="p-2 text-center"><span className={m.stock_actual < m.stock_minimo ? 'text-red-600 font-bold' : ''}>{m.stock_actual}</span> / {m.stock_minimo}</td>
                <td className="p-2 text-center">{m.requiere_receta ? 'Sí' : 'No'}</td>
                <td className="p-2 text-center text-xs">{m.fecha_vencimiento || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
