import { useEffect, useState } from 'react'
import api from '../lib/api'
import { toast } from '../components/Toast'

export default function Recetas() {
  const [recetas, setRecetas] = useState<any[]>([])
  const [show, setShow] = useState(false)
  const [form, setForm] = useState<any>({ codigo:'', paciente_nombre:'', paciente_cedula:'', fecha_emision:'', fecha_vencimiento:'', prescriptor_nombre:'', medicamento_ids:[] })

  const load = async () => {
    const { data } = await api.get('/recetas/')
    setRecetas(data)
  }
  useEffect(()=>{load()}, [])

  const submit = async (e:any) => {
    e.preventDefault()
    try {
      const medIds = form.medicamento_ids ? form.medicamento_ids.split(',').map((s:string)=>Number(s.trim())).filter(Boolean) : []
      await api.post('/recetas/', { ...form, medicamento_ids: medIds })
      toast('Receta creada','success')
      setShow(false); load()
    } catch (err:any){ toast(err.response?.data?.detail || 'Error','error')}
  }

  const validar = async (id:number) => {
    const { data } = await api.post(`/recetas/${id}/validar`)
    toast(data.valida ? 'Receta válida' : `Inválida: ${data.motivo}`, data.valida ? 'success':'error')
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Recetas</h1>
        <button onClick={()=>setShow(!show)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">{show?'Cerrar':'Nueva Receta'}</button>
      </div>
      {show && (
        <form onSubmit={submit} className="bg-white dark:bg-slate-800 p-4 rounded-xl grid grid-cols-2 gap-3">
          <input placeholder="Código receta" value={form.codigo} onChange={e=>setForm({...form, codigo:e.target.value})} className="px-3 py-2 border rounded dark:bg-slate-700" required/>
          <input placeholder="Paciente nombre" value={form.paciente_nombre} onChange={e=>setForm({...form, paciente_nombre:e.target.value})} className="px-3 py-2 border rounded dark:bg-slate-700" required/>
          <input placeholder="Cédula (6-8 dígitos)" value={form.paciente_cedula} onChange={e=>setForm({...form, paciente_cedula:e.target.value})} className="px-3 py-2 border rounded dark:bg-slate-700" required/>
          <input placeholder="Prescriptor" value={form.prescriptor_nombre} onChange={e=>setForm({...form, prescriptor_nombre:e.target.value})} className="px-3 py-2 border rounded dark:bg-slate-700"/>
          <input type="date" value={form.fecha_emision} onChange={e=>setForm({...form, fecha_emision:e.target.value})} className="px-3 py-2 border rounded dark:bg-slate-700" required/>
          <input type="date" value={form.fecha_vencimiento} onChange={e=>setForm({...form, fecha_vencimiento:e.target.value})} className="px-3 py-2 border rounded dark:bg-slate-700" required/>
          <input placeholder="IDs medicamentos (ej: 1,3)" value={form.medicamento_ids} onChange={e=>setForm({...form, medicamento_ids:e.target.value})} className="px-3 py-2 border rounded dark:bg-slate-700 col-span-2"/>
          <button type="submit" className="col-span-2 bg-green-600 text-white py-2 rounded-lg">Guardar Receta</button>
        </form>
      )}
      <div className="bg-white dark:bg-slate-800 rounded-xl overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-700"><tr><th className="p-2 text-left">Código</th><th className="p-2 text-left">Paciente</th><th className="p-2">Vencimiento</th><th className="p-2">Estado</th><th className="p-2">Acciones</th></tr></thead>
          <tbody>
            {recetas.map(r=>(
              <tr key={r.id} className="border-t dark:border-slate-700">
                <td className="p-2 font-mono">{r.codigo}</td>
                <td className="p-2">{r.paciente_nombre} <div className="text-xs text-slate-400">{r.paciente_cedula}</div></td>
                <td className="p-2 text-center">{r.fecha_vencimiento}</td>
                <td className="p-2 text-center"><span className={`px-2 py-1 rounded text-xs ${r.estado==='vencida'?'bg-red-100 text-red-600': r.estado==='aprobada'?'bg-green-100 text-green-600':'bg-slate-100'}`}>{r.estado}</span></td>
                <td className="p-2 text-center flex gap-1 justify-center">
                  <button onClick={()=>validar(r.id)} className="px-2 py-1 bg-blue-600 text-white rounded text-xs">Validar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
