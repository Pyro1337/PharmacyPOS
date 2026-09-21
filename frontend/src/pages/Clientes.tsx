import { useEffect, useState } from 'react'
import api from '../lib/api'
import { toast } from '../components/Toast'
import { Users, Search, Plus, Pencil, Trash2, X, Mail, Phone, CreditCard, Tag, MapPin, Percent, Sparkles, UserCircle } from 'lucide-react'

type Cliente = { id:number; nombre:string; cedula?:string; email?:string; telefono?:string; descuento:number; alias?:string; direccion?:string }

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [search, setSearch] = useState('')
  const [show, setShow] = useState(false)
  const [editing, setEditing] = useState<Cliente | null>(null)
  const [form, setForm] = useState({ nombre:'', cedula:'', email:'', telefono:'', descuento:0, alias:'', direccion:'' })

  const load = async (q=search) => {
    const { data } = await api.get('/clientes/', { params: { search: q || undefined } })
    setClientes(data)
  }
  useEffect(()=>{ load() }, [])

  const openCreate = () => { setEditing(null); setForm({ nombre:'', cedula:'', email:'', telefono:'', descuento:0, alias:'', direccion:'' }); setShow(true) }
  const openEdit = (c: Cliente) => { setEditing(c); setForm({ nombre:c.nombre, cedula:c.cedula||'', email:c.email||'', telefono:c.telefono||'', descuento:c.descuento, alias:c.alias||'', direccion:c.direccion||'' }); setShow(true) }

  const submit = async (e:any) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.put(`/clientes/${editing.id}`, form)
        toast('Cliente actualizado','success')
      } else {
        await api.post('/clientes/', form)
        toast('Cliente creado','success')
      }
      setShow(false); load()
    } catch (err:any){ toast(err.response?.data?.detail || 'Error','error')}
  }
  const remove = async (id:number) => {
    if (!confirm('¿Eliminar cliente? Esta acción no se puede deshacer.')) return
    try { await api.delete(`/clientes/${id}`); toast('Cliente eliminado','success'); load() } catch { toast('Error al eliminar','error') }
  }

  const totalConDescuento = clientes.filter(c=>c.descuento>0).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-[24px] p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"/>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center"><Users className="text-white" size={28}/></div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Clientes</h1>
              <p className="text-blue-100 text-sm mt-1">{clientes.length} registrados • {totalConDescuento} con descuento • Descuento preferencial para frecuentes</p>
            </div>
          </div>
          <button onClick={openCreate} className="bg-white text-blue-700 px-6 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-2 self-start md:self-auto"><Plus size={18}/> Nuevo Cliente</button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 flex gap-3">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3.5 top-3 text-slate-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load()} placeholder="Buscar por nombre, cédula o alias... (ej: Juan, 12345678, Juancho)" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-slate-100"/>
        </div>
        <button onClick={()=>load()} className="px-6 bg-slate-900 dark:bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-800">Buscar</button>
        <button onClick={()=>{setSearch(''); load('')}} className="px-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm">Limpiar</button>
      </div>

      {/* Grid Cards */}
      {clientes.length===0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-dashed border-slate-200 dark:border-slate-700">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-3"><Users className="text-slate-400" size={28}/></div>
          <p className="text-slate-600 dark:text-slate-300 font-medium">No hay clientes</p><p className="text-sm text-slate-400">Crea tu primer cliente para asignar descuentos y rastrear historial</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clientes.map(c=>(
            <div key={c.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-blue-200 dark:hover:border-slate-600 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-bl-[32px]"/>
              <div className="relative flex gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow">
                  {c.nombre.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-2">{c.nombre} {c.alias && <span className="text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full border border-violet-200 dark:border-violet-800 flex items-center gap-1"><Sparkles size={10}/>{c.alias}</span>}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5"><CreditCard size={12}/> {c.cedula || 'Sin cédula'} • <Phone size={12}/> {c.telefono || '—'}</div>
                </div>
                {c.descuento>0 && <div className="bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow flex items-center gap-1 h-fit"><Percent size={12}/>{c.descuento}%</div>}
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><Mail size={14} className="text-slate-400"/>{c.email || <span className="text-slate-400">Sin email</span>}</div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><MapPin size={14} className="text-slate-400"/>{c.direccion || <span className="text-slate-400">Sin dirección</span>}</div>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={()=>openEdit(c)} className="flex-1 bg-slate-900 dark:bg-slate-700 text-white py-2 rounded-xl text-sm font-medium hover:bg-slate-800 flex items-center justify-center gap-1.5"><Pencil size={14}/> Editar</button>
                <button onClick={()=>remove(c.id)} className="px-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-100"><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {show && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-[24px] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-in">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex justify-between items-center">
              <div className="flex gap-3 items-center"><div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><UserCircle size={20}/></div><div><h3 className="font-bold">{editing ? 'Editar Cliente' : 'Nuevo Cliente'}</h3><p className="text-xs text-blue-100">{editing ? 'Actualiza datos y descuento' : 'Crea cliente para POS y descuentos'}</p></div></div>
              <button onClick={()=>setShow(false)} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30"><X size={16}/></button>
            </div>
            <form onSubmit={submit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nombre *</label>
                <input value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm" placeholder="Juan Lopez" required/>
              </div>
              <div><label className="text-xs font-semibold">Cédula (6-8 dígitos)</label><input value={form.cedula} onChange={e=>setForm({...form, cedula:e.target.value})} className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border rounded-xl text-sm" placeholder="12345678"/></div>
              <div><label className="text-xs font-semibold">Alias</label><input value={form.alias} onChange={e=>setForm({...form, alias:e.target.value})} className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border rounded-xl text-sm" placeholder="Juancho"/></div>
              <div><label className="text-xs font-semibold flex items-center gap-1"><Mail size={12}/> Email</label><input type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border rounded-xl text-sm" placeholder="juan@mail.com"/></div>
              <div><label className="text-xs font-semibold flex items-center gap-1"><Phone size={12}/> Teléfono</label><input value={form.telefono} onChange={e=>setForm({...form, telefono:e.target.value})} className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border rounded-xl text-sm" placeholder="0981 123 456"/></div>
              <div><label className="text-xs font-semibold flex items-center gap-1"><Percent size={12}/> Descuento %</label><input type="number" min={0} max={100} value={form.descuento} onChange={e=>setForm({...form, descuento:Number(e.target.value)})} className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border rounded-xl text-sm"/></div>
              <div><label className="text-xs font-semibold flex items-center gap-1"><Tag size={12}/> Dirección</label><input value={form.direccion} onChange={e=>setForm({...form, direccion:e.target.value})} className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border rounded-xl text-sm" placeholder="Av. España 123"/></div>
              <div className="md:col-span-2 flex gap-3 pt-2">
                <button type="button" onClick={()=>setShow(false)} className="flex-1 bg-slate-100 dark:bg-slate-700 py-2.5 rounded-xl font-medium">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-semibold shadow">{editing ? 'Guardar cambios' : 'Crear cliente'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
