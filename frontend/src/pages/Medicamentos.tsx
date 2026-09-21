import { useEffect, useState } from 'react'
import api, { formatPYG } from '../lib/api'
import { toast } from '../components/Toast'
import { Package, Upload, Image as ImageIcon, AlertTriangle, Search, Plus, X, Pencil, Trash2, Building2, Calendar, Pill, Tag, Eye, Filter } from 'lucide-react'

export default function Medicamentos() {
  const [meds, setMeds] = useState<any[]>([])
  const [provs, setProvs] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [categoria, setCategoria] = useState('')
  const [show, setShow] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState<any>({ codigo:'', nombre:'', principio_activo:'', presentacion:'', precio_costo:0, precio_venta:0, stock_actual:0, stock_minimo:5, stock_maximo:100, categoria:'', proveedor_id:'', requiere_receta:false, fecha_vencimiento:'', activo:true })
  const [uploading, setUploading] = useState<number | null>(null)
  const [pendingImage, setPendingImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const load = async () => {
    const { data } = await api.get('/medicamentos/', { params: { search: search || undefined, categoria: categoria || undefined } })
    setMeds(data)
  }
  const loadProvs = async () => { try{ const {data}=await api.get('/proveedores/'); setProvs(data) } catch{} }
  useEffect(()=>{ load(); loadProvs() }, [])

  const handleFile = (f: File | null) => {
    if (!f) return
    if (!f.type.startsWith('image/')) return toast('Solo imágenes','error')
    if (f.size > 5*1024*1024) return toast('Máx 5MB','error')
    setPendingImage(f); setPreview(URL.createObjectURL(f))
  }

  const openCreate = () => { setEditing(null); setForm({ codigo:'', nombre:'', principio_activo:'', presentacion:'', precio_costo:0, precio_venta:0, stock_actual:0, stock_minimo:5, stock_maximo:100, categoria:'', proveedor_id:'', requiere_receta:false, fecha_vencimiento:'', activo:true }); setPendingImage(null); setPreview(null); setShow(true) }
  const openEdit = (m:any) => {
    setEditing(m)
    setForm({ codigo:m.codigo, nombre:m.nombre, principio_activo:m.principio_activo||'', presentacion:m.presentacion||'', precio_costo:m.precio_costo, precio_venta:m.precio_venta, stock_actual:m.stock_actual, stock_minimo:m.stock_minimo, stock_maximo:m.stock_maximo, categoria:m.categoria||'', proveedor_id:m.proveedor_id||'', requiere_receta:m.requiere_receta, fecha_vencimiento:m.fecha_vencimiento||'', activo:m.activo })
    setPreview(m.imagen_url || null); setPendingImage(null); setShow(true)
  }

  const submit = async (e:any) => {
    e.preventDefault()
    try {
      const payload:any = { ...form }
      if (!payload.fecha_vencimiento) delete payload.fecha_vencimiento
      if (!payload.categoria) delete payload.categoria
      if (!payload.proveedor_id) delete payload.proveedor_id; else payload.proveedor_id = Number(payload.proveedor_id)
      if (!payload.principio_activo) delete payload.principio_activo
      if (!payload.presentacion) delete payload.presentacion
      let id = editing?.id
      if (editing) {
        const { codigo, ...rest } = payload
        await api.put(`/medicamentos/${editing.id}`, rest)
        toast('Medicamento actualizado','success')
      } else {
        const { data } = await api.post('/medicamentos/', payload)
        id = data.id
        toast('Medicamento creado','success')
      }
      if (pendingImage && id) {
        const fd = new FormData(); fd.append('file', pendingImage)
        await api.post(`/medicamentos/${id}/imagen`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      }
      setShow(false); setEditing(null); setPendingImage(null); setPreview(null); load()
    } catch (err:any) { toast(err.response?.data?.detail || 'Error','error')}
  }

  const remove = async (m:any) => {
    if (!confirm(`¿Desactivar "${m.nombre}"? Se ocultará del POS pero se conserva historial.`)) return
    try { await api.delete(`/medicamentos/${m.id}`); toast('Medicamento desactivado','success'); load() } catch{ toast('Error','error') }
  }

  const uploadImage = async (id:number, file: File) => {
    setUploading(id)
    try { const fd=new FormData(); fd.append('file', file); await api.post(`/medicamentos/${id}/imagen`, fd, {headers:{'Content-Type':'multipart/form-data'}}); toast('Imagen cargada','success'); load() } catch(err:any){ toast(err.response?.data?.detail||'Error','error')} finally{ setUploading(null) }
  }

  const categorias = Array.from(new Set(meds.map((m:any)=>m.categoria).filter(Boolean)))

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600 rounded-[24px] p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-white/10 rounded-full blur-3xl"/>
        <div className="relative flex flex-col md:flex-row justify-between gap-4">
          <div className="flex gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center"><Package size={28}/></div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Medicamentos</h1>
              <p className="text-blue-100 text-sm mt-1">{meds.length} productos • {meds.filter((m:any)=>m.stock_actual < m.stock_minimo).length} bajo stock • {meds.filter((m:any)=>m.requiere_receta).length} controlados</p>
            </div>
          </div>
          <button onClick={openCreate} className="bg-white text-blue-700 px-6 py-3 rounded-2xl font-semibold shadow-lg hover:scale-[1.02] transition flex items-center gap-2 self-start md:self-auto"><Plus size={18}/> Nuevo Medicamento</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3.5 top-3 text-slate-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()} placeholder="Buscar por nombre, código, principio activo..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm"/>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Filter size={14} className="absolute left-2.5 top-3 text-slate-400"/>
            <select value={categoria} onChange={e=>setCategoria(e.target.value)} className="pl-7 pr-8 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm">
              <option value="">Todas categorías</option>
              {categorias.map((c:any)=><option key={c} value={c}>{c}</option>)}
              <option value="Analgésicos">Analgésicos</option>
              <option value="Antibióticos">Antibióticos</option>
              <option value="Controlados">Controlados</option>
              <option value="Vitaminas">Vitaminas</option>
            </select>
          </div>
          <button onClick={load} className="px-6 bg-slate-900 dark:bg-slate-700 text-white rounded-xl font-medium">Buscar</button>
        </div>
      </div>

      {/* Grid cards for mobile + table for desktop */}
      <div className="grid grid-cols-1 lg:hidden gap-4">
        {meds.map((m:any)=>{
          const low = m.stock_actual < m.stock_minimo
          const out = m.stock_actual <=0
          return (
            <div key={m.id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex gap-3">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-700 border flex items-center justify-center flex-shrink-0">
                  {m.imagen_url ? <img src={m.imagen_url} className="w-full h-full object-cover"/> : <Package size={20} className="text-slate-400"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{m.nombre}</div>
                  <div className="text-xs font-mono text-slate-500">{m.codigo} • {m.presentacion}</div>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    <span className="text-[11px] bg-slate-100 dark:bg-slate-700 border px-2 py-0.5 rounded-full">{m.categoria || '—'}</span>
                    {m.requiere_receta && <span className="text-[11px] bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-bold">RECETA</span>}
                    {!m.activo && <span className="text-[11px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">Inactivo</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-600">{formatPYG(m.precio_venta)}</div>
                  <div className="text-xs text-slate-400">{m.margen_ganancia}%</div>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1"><span className={out ? 'text-red-600 font-bold' : low ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>Stock {m.stock_actual}/{m.stock_maximo}</span><span className="text-slate-400">mín {m.stock_minimo}</span></div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden"><div className={`h-full ${out ? 'bg-red-500' : low ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{width:`${Math.min(100,Math.round(m.stock_actual/Math.max(1,m.stock_maximo)*100))}%`}}/></div>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={()=>openEdit(m)} className="flex-1 bg-slate-900 dark:bg-slate-700 text-white py-2 rounded-xl text-sm flex items-center justify-center gap-1.5"><Pencil size={14}/> Editar</button>
                <label className="px-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 border border-blue-200 rounded-xl flex items-center gap-1 text-xs cursor-pointer"><Upload size={14}/> <input type="file" accept="image/*" className="hidden" onChange={e=>{ const f=e.target.files?.[0]; if(f) uploadImage(m.id,f); e.target.value='' }}/> Foto</label>
                <button onClick={()=>remove(m)} className="px-3 bg-red-50 text-red-600 border border-red-200 rounded-xl"><Trash2 size={16}/></button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="hidden lg:block bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide">
              <tr><th className="p-3 text-left">Producto</th><th className="p-3 text-left">Precio</th><th className="p-3 text-center">Stock</th><th className="p-3 text-center">Receta</th><th className="p-3 text-center">Vence</th><th className="p-3 text-center">Acciones</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {meds.map((m:any)=> {
                const low = m.stock_actual < m.stock_minimo
                const out = m.stock_actual <=0
                return (
                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 group">
                  <td className="p-3">
                    <div className="flex gap-3 items-center">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 border flex items-center justify-center flex-shrink-0">
                        {m.imagen_url ? <img src={m.imagen_url} alt={m.nombre} className="w-full h-full object-cover"/> : <Package size={16} className="text-slate-400"/>}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">{m.nombre} {!m.activo && <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded">Inactivo</span>}</div>
                        <div className="text-xs text-slate-500 font-mono">{m.codigo} • {m.presentacion || '—'}</div>
                        <div className="text-xs text-slate-400">{m.categoria || '—'} • {m.principio_activo || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{formatPYG(m.precio_venta)}</div>
                    <div className="text-xs text-slate-400">{formatPYG(m.precio_costo)} • <span className="text-emerald-600 font-medium">{m.margen_ganancia}%</span></div>
                    <div className="text-xs text-slate-500 flex items-center gap-1"><Building2 size={10}/> {provs.find(p=>p.id===m.proveedor_id)?.nombre || '—'}</div>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${out ? 'bg-red-50 dark:bg-red-900/20 text-red-700 border-red-200' : low ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 border-amber-200' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 border-emerald-200'}`}>
                      {low && <AlertTriangle size={10}/>} {m.stock_actual} / {m.stock_maximo}
                    </span>
                    <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mx-auto mt-1 overflow-hidden"><div className={`h-full ${out ? 'bg-red-500' : low ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{width: `${Math.min(100, Math.round(m.stock_actual/Math.max(1,m.stock_maximo)*100))}%`}}/></div>
                  </td>
                  <td className="p-3 text-center">{m.requiere_receta ? <span className="bg-red-100 dark:bg-red-900/30 text-red-700 border border-red-200 px-2 py-1 rounded-full text-xs font-bold">Sí</span> : <span className="text-slate-400 text-xs">No</span>}</td>
                  <td className="p-3 text-center text-xs">{m.fecha_vencimiento ? <span className={new Date(m.fecha_vencimiento) < new Date(Date.now()+30*86400000) ? 'text-amber-600 font-bold' : 'text-slate-600 dark:text-slate-300'}>{new Date(m.fecha_vencimiento).toLocaleDateString('es-PY')}</span> : '—'}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={()=>openEdit(m)} className="p-2 bg-slate-900 dark:bg-slate-700 text-white rounded-xl hover:bg-slate-800" title="Editar"><Pencil size={14}/></button>
                      <label className={`p-2 rounded-xl cursor-pointer border ${uploading===m.id ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 border-blue-200 hover:bg-blue-100'}`} title="Cambiar foto"><Upload size={14}/><input type="file" accept="image/*" className="hidden" onChange={e=>{ const f=e.target.files?.[0]; if(f) uploadImage(m.id,f); e.target.value='' }} disabled={uploading===m.id}/></label>
                      <button onClick={()=>remove(m)} className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200 rounded-xl hover:bg-red-100" title="Desactivar"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              )})}
              {meds.length===0 && <tr><td colSpan={6} className="p-10 text-center text-slate-400">Sin medicamentos</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {show && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-auto">
          <div className="bg-white dark:bg-slate-800 rounded-[24px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto border border-slate-200 dark:border-slate-700">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 p-6 text-white flex justify-between items-center">
              <div className="flex gap-3 items-center"><div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Pill size={18}/></div><div><h3 className="font-bold text-lg">{editing ? 'Editar Medicamento' : 'Nuevo Medicamento'}</h3><p className="text-xs text-blue-100">Inventario • precios PYG • stock</p></div></div>
              <button onClick={()=>setShow(false)} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"><X size={16}/></button>
            </div>
            <form onSubmit={submit} className="p-6 space-y-4">
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-700 border-2 border-dashed border-slate-300 dark:border-slate-600 overflow-hidden flex items-center justify-center relative group">
                  {preview ? <img src={preview} className="w-full h-full object-cover"/> : <div className="text-center"><ImageIcon className="mx-auto text-slate-400" size={20}/><span className="text-[10px] text-slate-400">Sin foto</span></div>}
                  <label className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs cursor-pointer transition"><Upload size={14}/> Cambiar<input type="file" accept="image/*" className="hidden" onChange={e=>handleFile(e.target.files?.[0]||null)}/></label>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold">Imagen (MinIO, máx 5MB)</label>
                  <input type="file" accept="image/*" onChange={e=>handleFile(e.target.files?.[0]||null)} className="mt-1 block w-full text-sm file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-blue-50 file:text-blue-700"/>
                  <p className="text-xs text-slate-400 mt-1">Se verá en POS y aquí</p>
                  {editing?.imagen_url && <button type="button" onClick={async()=>{ await api.delete(`/medicamentos/${editing.id}/imagen`); toast('Imagen eliminada','success'); load(); setPreview(null)}} className="text-xs text-red-600 underline mt-1">Quitar imagen actual</button>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="text-xs font-semibold">Código barras *</label><input value={form.codigo} onChange={e=>setForm({...form, codigo:e.target.value})} className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border rounded-xl text-sm font-mono" required disabled={!!editing}/></div>
                <div><label className="text-xs font-semibold">Nombre *</label><input value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border rounded-xl text-sm" required/></div>
                <div><label className="text-xs font-semibold flex items-center gap-1"><Tag size={12}/> Principio activo</label><input value={form.principio_activo} onChange={e=>setForm({...form, principio_activo:e.target.value})} className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border rounded-xl text-sm"/></div>
                <div><label className="text-xs font-semibold">Presentación</label><input value={form.presentacion} onChange={e=>setForm({...form, presentacion:e.target.value})} placeholder="Caja x 20" className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border rounded-xl text-sm"/></div>
                <div><label className="text-xs font-semibold">Precio costo PYG *</label><input type="number" value={form.precio_costo} onChange={e=>setForm({...form, precio_costo:Number(e.target.value)})} className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border rounded-xl text-sm" required/></div>
                <div><label className="text-xs font-semibold">Precio venta PYG *</label><input type="number" value={form.precio_venta} onChange={e=>setForm({...form, precio_venta:Number(e.target.value)})} className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border rounded-xl text-sm" required/></div>
                <div><label className="text-xs font-semibold">Stock actual</label><input type="number" value={form.stock_actual} onChange={e=>setForm({...form, stock_actual:Number(e.target.value)})} className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border rounded-xl text-sm"/></div>
                <div className="grid grid-cols-2 gap-2"><div><label className="text-xs font-semibold">Mín</label><input type="number" value={form.stock_minimo} onChange={e=>setForm({...form, stock_minimo:Number(e.target.value)})} className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border rounded-xl text-sm"/></div><div><label className="text-xs font-semibold">Máx</label><input type="number" value={form.stock_maximo} onChange={e=>setForm({...form, stock_maximo:Number(e.target.value)})} className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border rounded-xl text-sm"/></div></div>
                <div><label className="text-xs font-semibold flex items-center gap-1"><Tag size={12}/> Categoría</label><input value={form.categoria} onChange={e=>setForm({...form, categoria:e.target.value})} list="cats" className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border rounded-xl text-sm" placeholder="Analgésicos"/><datalist id="cats"><option value="Analgésicos"/><option value="Antibióticos"/><option value="Controlados"/><option value="Vitaminas"/><option value="Antialérgicos"/></datalist></div>
                <div><label className="text-xs font-semibold flex items-center gap-1"><Building2 size={12}/> Proveedor</label><select value={form.proveedor_id} onChange={e=>setForm({...form, proveedor_id:e.target.value})} className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border rounded-xl text-sm"><option value="">Sin proveedor</option>{provs.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
                <div><label className="text-xs font-semibold flex items-center gap-1"><Calendar size={12}/> Vencimiento</label><input type="date" value={form.fecha_vencimiento} onChange={e=>setForm({...form, fecha_vencimiento:e.target.value})} className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border rounded-xl text-sm"/></div>
                <div className="flex flex-col gap-2 justify-center">
                  <label className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl cursor-pointer"><input type="checkbox" checked={form.requiere_receta} onChange={e=>setForm({...form, requiere_receta:e.target.checked})}/> <span className="text-sm font-medium text-amber-800 dark:text-amber-300">Requiere receta</span></label>
                  {editing && <label className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-700 border rounded-xl cursor-pointer"><input type="checkbox" checked={form.activo} onChange={e=>setForm({...form, activo:e.target.checked})}/> <span className="text-sm">Activo (visible en POS)</span></label>}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShow(false)} className="flex-1 bg-slate-100 dark:bg-slate-700 py-3 rounded-xl">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold shadow">{editing ? 'Guardar cambios' : 'Crear medicamento'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
