import { useEffect, useState } from 'react'
import api from '../lib/api'
import { toast } from '../components/Toast'
import { FileText, Search, Plus, X, CheckCircle, XCircle, Clock, AlertTriangle, Pill, Calendar, User, Stethoscope, Pencil, Trash2, ScanLine } from 'lucide-react'

export default function Recetas() {
  const [recetas, setRecetas] = useState<any[]>([])
  const [meds, setMeds] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [show, setShow] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState<any>({ codigo:'', paciente_nombre:'', paciente_cedula:'', paciente_fecha_nacimiento:'', prescriptor_nombre:'', prescriptor_cedula:'', prescriptor_especialidad:'', fecha_emision:'', fecha_vencimiento:'', notas:'', medicamento_ids:[] as number[] })
  const [filterEstado, setFilterEstado] = useState('')

  const load = async (q=search, estado=filterEstado) => {
    const { data } = await api.get('/recetas/', { params: { search: q || undefined, estado: estado || undefined } })
    setRecetas(data)
  }
  const loadMeds = async () => { const { data } = await api.get('/medicamentos/', { params: { limit: 100 } }); setMeds(data) }
  useEffect(()=>{ load(); loadMeds() }, [])

  const openCreate = () => { setEditing(null); setForm({ codigo:`REC-${Date.now().toString().slice(-6)}`, paciente_nombre:'', paciente_cedula:'', paciente_fecha_nacimiento:'', prescriptor_nombre:'', prescriptor_cedula:'', prescriptor_especialidad:'', fecha_emision:new Date().toISOString().slice(0,10), fecha_vencimiento:new Date(Date.now()+30*86400000).toISOString().slice(0,10), notas:'', medicamento_ids:[] }); setShow(true) }
  const openEdit = (r:any) => { setEditing(r); setForm({ ...r, medicamento_ids: (r.medicamentos||[]).map((m:any)=>m.id), paciente_fecha_nacimiento: r.paciente_fecha_nacimiento || '', fecha_emision: r.fecha_emision?.slice(0,10) || '', fecha_vencimiento: r.fecha_vencimiento?.slice(0,10) || '' }); setShow(true) }

  const toggleMed = (id:number) => setForm((f:any)=> ({ ...f, medicamento_ids: f.medicamento_ids.includes(id) ? f.medicamento_ids.filter((x:number)=>x!==id) : [...f.medicamento_ids, id] }))

  const submit = async (e:any) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.put(`/recetas/${editing.id}`, { estado: form.estado, notas: form.notas, medicamento_ids: form.medicamento_ids })
        toast('Receta actualizada','success')
      } else {
        await api.post('/recetas/', { ...form, medicamento_ids: form.medicamento_ids })
        toast('Receta creada','success')
      }
      setShow(false); load()
    } catch (err:any){ toast(err.response?.data?.detail || 'Error','error')}
  }
  const remove = async (id:number) => { if(!confirm('¿Eliminar receta?')) return; try{ await api.delete(`/recetas/${id}`); toast('Eliminada','success'); load() } catch{ toast('Error','error') } }
  const validar = async (id:number) => { const { data } = await api.post(`/recetas/${id}/validar`); toast(data.valida ? 'Receta válida ✓' : `Inválida: ${data.motivo}`, data.valida ? 'success':'error'); load() }
  const cambiarEstado = async (id:number, estado:string) => { try{ await api.put(`/recetas/${id}`, { estado }); toast(`Estado -> ${estado}`,'success'); load() } catch(err:any){ toast(err.response?.data?.detail||'Error','error') } }

  const estadoBadge = (estado:string, venc:string) => {
    const isVenc = venc && new Date(venc) < new Date(new Date().setHours(0,0,0,0))
    if (isVenc || estado==='vencida') return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
    if (estado==='aprobada' || estado==='completada') return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800'
    if (estado==='pendiente') return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
    if (estado==='rechazada') return 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
    return 'bg-slate-100 text-slate-600 border-slate-200'
  }
  const estadoIcon = (e:string) => e==='aprobada' ? <CheckCircle size={12}/> : e==='rechazada' ? <XCircle size={12}/> : e==='vencida' ? <AlertTriangle size={12}/> : <Clock size={12}/>

  const vigentes = recetas.filter(r=> r.estado!=='vencida' && r.estado!=='rechazada' && new Date(r.fecha_vencimiento) >= new Date(new Date().setHours(0,0,0,0))).length

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 rounded-[24px] p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-white/10 rounded-full blur-3xl"/>
        <div className="relative flex flex-col md:flex-row justify-between gap-4">
          <div className="flex gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center"><FileText size={28}/></div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Recetas</h1>
              <p className="text-violet-100 text-sm mt-1">{recetas.length} recetas • {vigentes} vigentes • Validación 30 días • Controlados requieren receta</p>
            </div>
          </div>
          <button onClick={openCreate} className="bg-white text-violet-700 px-6 py-3 rounded-2xl font-semibold shadow-lg hover:scale-[1.02] transition flex items-center gap-2 self-start md:self-auto"><Plus size={18}/> Nueva Receta</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3.5 top-3 text-slate-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()} placeholder="Buscar código, paciente, cédula..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm"/>
        </div>
        <select value={filterEstado} onChange={e=>{setFilterEstado(e.target.value); load(search, e.target.value)}} className="px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm">
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="aprobada">Aprobada</option>
          <option value="completada">Completada</option>
          <option value="vencida">Vencida</option>
          <option value="rechazada">Rechazada</option>
        </select>
        <button onClick={()=>load()} className="px-6 bg-slate-900 dark:bg-slate-700 text-white rounded-xl font-medium">Buscar</button>
      </div>

      {recetas.length===0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-dashed"><ScanLine className="mx-auto text-slate-300 mb-3" size={32}/><p className="font-medium">Sin recetas</p><p className="text-sm text-slate-400">Crea recetas para vender controlados en POS</p></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {recetas.map(r=>{
            const dias = Math.ceil((new Date(r.fecha_vencimiento).getTime() - Date.now())/86400000)
            const isVenc = dias < 0
            return (
            <div key={r.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-900/10 dark:to-indigo-900/10 rounded-bl-[32px]"/>
              <div className="relative">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center font-mono text-xs font-bold">{r.codigo.slice(-4)}</div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100 font-mono text-sm">{r.codigo}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><User size={12}/> {r.paciente_nombre} • {r.paciente_cedula}</div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${estadoBadge(r.estado, r.fecha_vencimiento)}`}>{estadoIcon(r.estado)} {r.estado}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-2.5 border border-slate-200 dark:border-slate-600"><div className="text-slate-400 flex items-center gap-1"><Stethoscope size={12}/> Prescriptor</div><div className="font-medium text-slate-900 dark:text-slate-100">{r.prescriptor_nombre || '—'} <span className="text-slate-400 font-normal">{r.prescriptor_especialidad || ''}</span></div></div>
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-2.5 border border-slate-200 dark:border-slate-600"><div className="text-slate-400 flex items-center gap-1"><Calendar size={12}/> Vigencia</div><div className="font-medium">{new Date(r.fecha_emision).toLocaleDateString('es-PY')} → {new Date(r.fecha_vencimiento).toLocaleDateString('es-PY')} <span className={dias<7 ? 'text-red-600 font-bold' : dias<15 ? 'text-amber-600 font-bold' : 'text-emerald-600'}>({isVenc ? `${Math.abs(dias)}d vencida` : `${dias}d`})</span></div></div>
                </div>
                <div className="mt-3">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1"><Pill size={12}/> Medicamentos ({r.medicamentos.length})</div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {r.medicamentos.length ? r.medicamentos.map((m:any)=><span key={m.id} className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-1 rounded-full">{m.nombre}</span>) : <span className="text-xs text-slate-400">Sin medicamentos asignados</span>}
                  </div>
                </div>
                {r.notas && <div className="mt-3 text-xs bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-2.5 text-amber-800 dark:text-amber-300">“{r.notas}”</div>}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button onClick={()=>validar(r.id)} className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-xs font-semibold">Validar</button>
                  <button onClick={()=>openEdit(r)} className="bg-slate-900 dark:bg-slate-700 text-white py-2 rounded-xl text-xs flex items-center justify-center gap-1"><Pencil size={12}/> Editar</button>
                  <button onClick={()=>remove(r.id)} className="bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-800 py-2 rounded-xl text-xs flex items-center justify-center gap-1"><Trash2 size={12}/> Borrar</button>
                </div>
                <div className="mt-2 flex gap-1.5">
                  <button onClick={()=>cambiarEstado(r.id, 'aprobada')} className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 py-1.5 rounded-xl text-xs font-medium">Aprobar</button>
                  <button onClick={()=>cambiarEstado(r.id, 'rechazada')} className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border py-1.5 rounded-xl text-xs">Rechazar</button>
                  <button onClick={()=>cambiarEstado(r.id, 'completada')} className="flex-1 bg-violet-50 dark:bg-violet-900/20 text-violet-700 border border-violet-200 dark:border-violet-800 py-1.5 rounded-xl text-xs">Completada</button>
                </div>
              </div>
            </div>
          )})}
        </div>
      )}

      {show && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-auto">
          <div className="bg-white dark:bg-slate-800 rounded-[24px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto border border-slate-200 dark:border-slate-700">
            <div className="sticky top-0 bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white flex justify-between items-center">
              <div><h3 className="font-bold text-lg">{editing ? 'Editar Receta' : 'Nueva Receta'}</h3><p className="text-xs text-violet-100">Paciente • prescriptor • medicamentos controlados</p></div>
              <button onClick={()=>setShow(false)} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"><X size={16}/></button>
            </div>
            <form onSubmit={submit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold">Código *</label><input value={form.codigo} onChange={e=>setForm({...form, codigo:e.target.value})} className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border rounded-xl text-sm font-mono" required/></div>
                <div><label className="text-xs font-semibold">Estado {editing && '(editable)'}</label>{editing ? <select value={form.estado} onChange={e=>setForm({...form, estado:e.target.value})} className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border rounded-xl text-sm"><option value="pendiente">Pendiente</option><option value="aprobada">Aprobada</option><option value="completada">Completada</option><option value="rechazada">Rechazada</option><option value="vencida">Vencida</option></select> : <div className="mt-1 px-3 py-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl text-sm text-slate-500">Se crea como pendiente</div>}</div>
                <div><label className="text-xs font-semibold">Paciente nombre *</label><input value={form.paciente_nombre} onChange={e=>setForm({...form, paciente_nombre:e.target.value})} className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border rounded-xl text-sm" required/></div>
                <div><label className="text-xs font-semibold">Cédula (6-8 díg) *</label><input value={form.paciente_cedula} onChange={e=>setForm({...form, paciente_cedula:e.target.value})} className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border rounded-xl text-sm" required/></div>
                <div><label className="text-xs font-semibold">Nacimiento</label><input type="date" value={form.paciente_fecha_nacimiento} onChange={e=>setForm({...form, paciente_fecha_nacimiento:e.target.value})} className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border rounded-xl text-sm"/></div>
                <div><label className="text-xs font-semibold">Prescriptor</label><input value={form.prescriptor_nombre} onChange={e=>setForm({...form, prescriptor_nombre:e.target.value})} className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border rounded-xl text-sm" placeholder="Dra. Maria"/></div>
                <div><label className="text-xs font-semibold">Cédula prescriptor</label><input value={form.prescriptor_cedula} onChange={e=>setForm({...form, prescriptor_cedula:e.target.value})} className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border rounded-xl text-sm"/></div>
                <div><label className="text-xs font-semibold">Especialidad</label><input value={form.prescriptor_especialidad} onChange={e=>setForm({...form, prescriptor_especialidad:e.target.value})} className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border rounded-xl text-sm" placeholder="Clínica Médica"/></div>
                <div><label className="text-xs font-semibold">Emisión *</label><input type="date" value={form.fecha_emision} onChange={e=>setForm({...form, fecha_emision:e.target.value})} className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border rounded-xl text-sm" required/></div>
                <div><label className="text-xs font-semibold">Vencimiento *</label><input type="date" value={form.fecha_vencimiento} onChange={e=>setForm({...form, fecha_vencimiento:e.target.value})} className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border rounded-xl text-sm" required/></div>
                <div className="md:col-span-2"><label className="text-xs font-semibold">Notas</label><textarea value={form.notas} onChange={e=>setForm({...form, notas:e.target.value})} className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border rounded-xl text-sm" rows={2} placeholder="Solo vender con presentación original..."/></div>
              </div>
              <div>
                <label className="text-xs font-semibold flex items-center gap-1"><Pill size={12}/> Medicamentos prescritos *</label>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-52 overflow-auto p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                  {meds.map((m:any)=>(
                    <label key={m.id} className={`flex gap-2 p-2 rounded-xl border cursor-pointer ${form.medicamento_ids.includes(m.id) ? 'bg-violet-600 text-white border-violet-600 shadow' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:border-violet-300'}`}>
                      <input type="checkbox" checked={form.medicamento_ids.includes(m.id)} onChange={()=>toggleMed(m.id)} className="mt-0.5"/>
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-semibold truncate ${form.medicamento_ids.includes(m.id) ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>{m.nombre}</div>
                        <div className={`text-[11px] truncate ${form.medicamento_ids.includes(m.id) ? 'text-violet-100' : 'text-slate-500'}`}>{m.codigo} • {m.categoria} {m.requiere_receta && '• RECETA'}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1">{form.medicamento_ids.length} seleccionados • Se validará stock y receta en POS</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShow(false)} className="flex-1 bg-slate-100 dark:bg-slate-700 py-3 rounded-xl font-medium">Cancelar</button>
                <button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-semibold shadow">{editing ? 'Guardar cambios' : 'Crear receta'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
