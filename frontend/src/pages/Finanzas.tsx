import { useEffect, useState } from 'react'
import api, { formatPYG } from '../lib/api'
import { toast } from '../components/Toast'

export default function Finanzas() {
  const [ingresos, setIngresos] = useState<any[]>([])
  const [egresos, setEgresos] = useState<any[]>([])
  const [resumen, setResumen] = useState<any>(null)
  const [ingForm, setIngForm] = useState({ monto:0, descripcion:'' })
  const [egrForm, setEgrForm] = useState({ monto:0, descripcion:'', tipo:'otro' })

  const load = async () => {
    const i = await api.get('/finanzas/ingresos'); setIngresos(i.data)
    const e = await api.get('/finanzas/egresos'); setEgresos(e.data)
    const r = await api.get('/finanzas/resumen'); setResumen(r.data)
  }
  useEffect(()=>{ load() }, [])

  const addIng = async () => {
    try { await api.post('/finanzas/ingresos', { monto: ingForm.monto, descripcion: ingForm.descripcion }); toast('Ingreso registrado','success'); load() } catch { toast('Error','error')}
  }
  const addEgr = async () => {
    try { await api.post('/finanzas/egresos', { monto: egrForm.monto, descripcion: egrForm.descripcion, tipo: egrForm.tipo }); toast('Egreso registrado','success'); load() } catch { toast('Error','error')}
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ingresos y Egresos</h1>
      {resumen && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl text-center"><div className="text-sm text-slate-500">Ingresos</div><div className="text-xl font-bold text-green-600">{formatPYG(resumen.total_ingresos)}</div></div>
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl text-center"><div className="text-sm text-slate-500">Egresos</div><div className="text-xl font-bold text-red-600">{formatPYG(resumen.total_egresos)}</div></div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-center"><div className="text-sm text-slate-500">Saldo Neto</div><div className="text-xl font-bold">{formatPYG(resumen.saldo_neto)}</div></div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow">
          <h3 className="font-bold mb-3">Registrar Ingreso</h3>
          <div className="space-y-2">
            <input type="number" placeholder="Monto PYG" value={ingForm.monto} onChange={e=>setIngForm({...ingForm, monto:Number(e.target.value)})} className="w-full px-3 py-2 border rounded dark:bg-slate-700"/>
            <input placeholder="Descripción" value={ingForm.descripcion} onChange={e=>setIngForm({...ingForm, descripcion:e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700"/>
            <button onClick={addIng} className="w-full bg-green-600 text-white py-2 rounded-lg">Agregar Ingreso</button>
          </div>
          <div className="mt-4 space-y-1 max-h-60 overflow-auto">
            {ingresos.map(i=><div key={i.id} className="flex justify-between text-sm border-b py-1"><span>{i.descripcion || i.origen}</span><span className="font-medium text-green-600">{formatPYG(i.monto)}</span></div>)}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow">
          <h3 className="font-bold mb-3">Registrar Egreso</h3>
          <div className="space-y-2">
            <input type="number" placeholder="Monto PYG" value={egrForm.monto} onChange={e=>setEgrForm({...egrForm, monto:Number(e.target.value)})} className="w-full px-3 py-2 border rounded dark:bg-slate-700"/>
            <select value={egrForm.tipo} onChange={e=>setEgrForm({...egrForm, tipo:e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700">
              <option value="compra_proveedor">Compra a proveedor</option><option value="gasto_operativo">Gasto operativo</option><option value="mantenimiento">Mantenimiento</option><option value="otro">Otro</option>
            </select>
            <input placeholder="Descripción" value={egrForm.descripcion} onChange={e=>setEgrForm({...egrForm, descripcion:e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-slate-700"/>
            <button onClick={addEgr} className="w-full bg-red-600 text-white py-2 rounded-lg">Agregar Egreso</button>
          </div>
          <div className="mt-4 space-y-1 max-h-60 overflow-auto">
            {egresos.map(e=><div key={e.id} className="flex justify-between text-sm border-b py-1"><span>{e.descripcion || e.tipo}</span><span className="font-medium text-red-600">{formatPYG(e.monto)}</span></div>)}
          </div>
        </div>
      </div>
    </div>
  )
}
