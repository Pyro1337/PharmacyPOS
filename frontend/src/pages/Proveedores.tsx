import { useEffect, useState } from 'react'
import api from '../lib/api'
import { toast } from '../components/Toast'
import { Truck, Search, Plus, Pencil, Trash2, X, Phone, Mail, CreditCard, Building2, HandCoins, MapPin } from 'lucide-react'

type Prov = { id:number; nombre:string; contacto?:string; email?:string; telefono?:string; ruc?:string; condiciones_pago?:string }

export default function Proveedores() {
  const [provs, setProvs] = useState<Prov[]>([])
  const [search, setSearch] = useState('')
  const [show, setShow] = useState(false)
  const [editing, setEditing] = useState<Prov | null>(null)
  const [form, setForm] = useState({ nombre:'', contacto:'', email:'', telefono:'', ruc:'', condiciones_pago:'' })

  const load = async (q=search) => {
    const { data } = await api.get('/proveedores/', { params: { search: q || undefined } })
    setProvs(data)
  }
  useEffect(()=>{ load() }, [])

  const openCreate = () => { setEditing(null); setForm({ nombre:'', contacto:'', email:'', telefono:'', ruc:'', condiciones_pago:'' }); setShow(true) }
  const openEdit = (p:Prov) => { setEditing(p); setForm({ nombre:p.nombre, contacto:p.contacto||'', email:p.email||'', telefono:p.telefono||'', ruc:p.ruc||'', condiciones_pago:p.condiciones_pago||'' }); setShow(true) }

  const submit = async (e:any) => {
    e.preventDefault()
    try {
      if (editing) { await api.put(`/proveedores/${editing.id}`, form); toast('Proveedor actualizado','success') }
      else { await api.post('/proveedores/', form); toast('Proveedor creado','success') }
      setShow(false); load()
    } catch (err:any){ toast(err.response?.data?.detail||'Error','error') }
  }
  const remove = async (id:number) => { if(!confirm('¿Eliminar proveedor?')) return; try{ await api.delete(`/proveedores/${id}`); toast('Eliminado','success'); load() } catch{ toast('Error','error') } }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 rounded-[24px] p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-white/10 rounded-full blur-3xl"/>
        <div className="relative flex flex-col md:flex-row justify-between gap-4">
          <div className="flex gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center"><Truck size={28}/></div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Proveedores</h1>
              <p className="text-emerald-100 text-sm mt-1">{provs.length} proveedores • RUC • condiciones de pago • historial compras</p>
            </div>
          </div>
          <button onClick={openCreate} className="bg-white text-emerald-700 px-6 py-3 rounded-2xl font-semibold shadow-lg hover:scale-[1.02] transition flex items-center gap-2 self-start md:self-auto"><Plus size={18}/> Nuevo Proveedor</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 flex gap-3">
        <div className="flex-1 relative"><Search size={18} className="absolute left-3.5 top-3 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()} placeholder="Buscar proveedor por nombre, contacto, RUC..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm"/></div>
        <button onClick={()=>load()} className="px-6 bg-slate-900 dark:bg-slate-700 text-white rounded-xl font-medium">Buscar</button>
      </div>

      {provs.length===0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-dashed"><Building2 className="mx-auto text-slate-300 mb-3" size={32}/><p className="font-medium">Sin proveedores</p><p className="text-sm text-slate-400">Agrega droguerías y laboratorios</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {provs.map(p=>(
            <div key={p.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 rounded-bl-[32px]"/>
              <div className="relative flex gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow"><Building2 size={20}/></div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{p.nombre}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><CreditCard size={12}/> RUC {p.ruc || '—'}</div>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border h-fit ${p.condiciones_pago?.includes('30') ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30' : p.condiciones_pago?.includes('60') ? 'bg-blue-100 text-blue-700 border-blue-200' : p.condiciones_pago?.toLowerCase().includes('contado') ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300'}`}>{p.condiciones_pago || '—'}</span>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><Phone size={14} className="text-slate-400"/>{p.telefono || '—'} <span className="text-slate-300">•</span> <Mail size={14} className="text-slate-400"/>{p.email || '—'}</div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><MapPin size={14} className="text-slate-400"/>{p.contacto ? `Contacto: ${p.contacto}` : 'Sin contacto'}</div>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={()=>openEdit(p)} className="flex-1 bg-slate-900 dark:bg-slate-700 text-white py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5"><Pencil size={14}/> Editar</button>
                <button onClick={()=>remove(p.id)} className="px-4 bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-800 rounded-xl"><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {show && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-[24px] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white flex justify-between items-center">
              <div className="flex gap-3 items-center"><div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><HandCoins size={18}/></div><div><h3 className="font-bold">{editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3><p className="text-xs text-emerald-100">Droguería / laboratorio</p></div></div>
              <button onClick={()=>setShow(false)} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"><X size={16}/></button>
            </div>
            <form onSubmit={submit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><label className="text-xs font-semibold">Nombre *</label><input value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border rounded-xl text-sm" placeholder="Droguería Paraguay S.A." required/></div>
              <div><label className="text-xs font-semibold">Contacto</label><input value={form.contacto} onChange={e=>setForm({...form, contacto:e.target.value})} className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border rounded-xl text-sm" placeholder="Luis Ramirez"/></div>
              <div><label className="text-xs font-semibold flex items-center gap-1"><Phone size={12}/> Teléfono</label><input value={form.telefono} onChange={e=>setForm({...form, telefono:e.target.value})} className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border rounded-xl text-sm" placeholder="021 123 456"/></div>
              <div><label className="text-xs font-semibold flex items-center gap-1"><Mail size={12}/> Email</label><input type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border rounded-xl text-sm" placeholder="ventas@drogueria.py"/></div>
              <div><label className="text-xs font-semibold flex items-center gap-1"><CreditCard size={12}/> RUC</label><input value={form.ruc} onChange={e=>setForm({...form, ruc:e.target.value})} className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border rounded-xl text-sm" placeholder="80012345-1"/></div>
              <div className="md:col-span-2"><label className="text-xs font-semibold">Condiciones de pago</label><select value={form.condiciones_pago} onChange={e=>setForm({...form, condiciones_pago:e.target.value})} className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border rounded-xl text-sm"><option value="">Seleccionar</option><option value="Contado">Contado</option><option value="30 días">30 días</option><option value="60 días">60 días</option><option value="90 días">90 días</option></select></div>
              <div className="md:col-span-2 flex gap-3 pt-2"><button type="button" onClick={()=>setShow(false)} className="flex-1 bg-slate-100 dark:bg-slate-700 py-2.5 rounded-xl">Cancelar</button><button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-semibold">{editing ? 'Guardar cambios' : 'Crear proveedor'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
