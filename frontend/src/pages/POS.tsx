import { useEffect, useState } from 'react'
import api, { formatPYG } from '../lib/api'
import { useCartStore } from '../stores/cartStore'
import { Search, Trash2, Plus, Minus, Package, AlertTriangle, Pill, ShoppingBag, ScanLine } from 'lucide-react'
import { toast } from '../components/Toast'

function stockColor(actual: number, minimo: number, maximo: number) {
  if (actual <= 0) return 'bg-red-500'
  if (actual < minimo) return 'bg-red-500'
  if (actual < minimo * 2) return 'bg-amber-500'
  if (actual < maximo * 0.5) return 'bg-yellow-400'
  return 'bg-emerald-500'
}
function stockTextColor(actual: number, minimo: number) {
  if (actual <= 0) return 'text-red-600 dark:text-red-400'
  if (actual < minimo) return 'text-red-600 dark:text-red-400'
  if (actual < minimo * 2) return 'text-amber-600 dark:text-amber-400'
  return 'text-emerald-600 dark:text-emerald-400'
}
function categoriaColor(cat?: string) {
  const map: Record<string, string> = {
    'Analgésicos': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    'Antibióticos': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
    'Vitaminas': 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    'Controlados': 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    'Antialérgicos': 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800',
  }
  return map[cat || ''] || 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
}

export default function POS() {
  const [search, setSearch] = useState('')
  const [meds, setMeds] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [clientSearch, setClientSearch] = useState('')
  const [recetas, setRecetas] = useState<any[]>([])
  const [recetaSearch, setRecetaSearch] = useState('')
  const [metodo, setMetodo] = useState('efectivo')
  const [descuento, setDescuento] = useState(0)
  const [loading, setLoading] = useState(false)
  const cart = useCartStore()

  const fetchMeds = async (q='') => {
    setLoading(true)
    try {
      const { data } = await api.get('/medicamentos/', { params: { search: q } })
      setMeds(data)
    } catch (e:any) { toast(e?.response?.data?.detail || 'Error al cargar medicamentos','error') }
    finally { setLoading(false) }
  }
  const fetchClientes = async (q='') => {
    try {
      const { data } = await api.get('/clientes/', { params: { search: q || undefined } })
      setClientes(data)
    } catch {}
  }
  const fetchRecetas = async (q='') => {
    try {
      const { data } = await api.get('/recetas/', { params: { search: q || undefined } })
      // filtrar solo vigentes en frontend (pendiente/completada y no vencida)
      setRecetas(data)
    } catch {}
  }
  useEffect(()=>{ fetchMeds(); fetchClientes(); fetchRecetas() }, [])
  // keep cart store descuento synced with local input
  useEffect(()=>{ cart.setDescuento(descuento) }, [descuento])

  const addToCart = (m:any) => {
    try {
      if (!m || typeof m.id === 'undefined') {
        toast('Producto inválido','error')
        return
      }
      // stock puede venir como string, asegurar número
      const stock = Number(m.stock_actual ?? 0)
      if (stock <= 0) {
        toast(`Sin stock: ${m.nombre} (stock ${stock})`, 'error')
        return
      }
      if (m.requiere_receta) {
        if (!cart.recetaId) {
          toast(`"${m.nombre}" requiere RECETA. Selecciona una receta vigente abajo.`, 'error')
          return
        }
        // verificar que la receta seleccionada contiene este medicamento
        const receta = recetas.find(r=> r.id === cart.recetaId)
        if (receta) {
          const medIds = (receta.medicamentos || []).map((x:any)=> x.id)
          const venc = receta.fecha_vencimiento ? new Date(receta.fecha_vencimiento) : null
          const isVencida = venc && venc < new Date(new Date().setHours(0,0,0,0))
          const isRechazada = receta.estado === 'rechazada' || receta.estado === 'vencida'
          if (isVencida || isRechazada) {
            toast(`Receta ${receta.codigo} vencida/rechazada. Elige otra.`, 'error')
            return
          }
          if (medIds.length > 0 && !medIds.includes(m.id)) {
            const lista = receta.medicamentos.map((x:any)=> x.nombre).join(', ')
            toast(`Receta ${receta.codigo} no prescribe "${m.nombre}". Cubre: ${lista || 'ninguno'}`, 'error')
            return
          }
        }
      }
      const existing = cart.items.find(i=>i.medicamento_id===m.id)
      if (existing && existing.cantidad >= stock) {
        toast(`Stock máximo alcanzado para "${m.nombre}" (${stock} disponibles)`, 'error')
        return
      }
      cart.addItem({ medicamento_id: m.id, codigo: m.codigo, nombre: m.nombre, precio_unitario: Number(m.precio_venta), cantidad: 1, descuento_item: 0, stock_actual: stock, requiere_receta: m.requiere_receta, imagen_url: m.imagen_url } as any)
      toast(`${m.nombre} agregado`, 'success')
    } catch (e:any) {
      console.error(e)
      toast('Error al agregar al carrito: ' + (e?.message || 'desconocido'),'error')
    }
  }

  const confirmarVenta = async () => {
    if (cart.items.length===0) return toast('Carrito vacío','error')
    try {
      const payload = {
        items: cart.items.map(i=>({ medicamento_id: i.medicamento_id, cantidad: i.cantidad, precio_unitario: i.precio_unitario, descuento_item: i.descuento_item, subtotal: i.precio_unitario*i.cantidad - i.descuento_item })),
        descuento_total_porcentaje: descuento,
        metodo_pago: metodo,
        receta_id: cart.recetaId ? Number(cart.recetaId) : null,
        cliente_id: cart.clienteId
      }
      const { data } = await api.post('/ventas/', payload)
      toast(`Venta #${data.numero_venta} - Total ${formatPYG(data.total)}`, 'success')
      cart.clear()
      setDescuento(0)
      fetchMeds(search)
    } catch (e:any) {
      toast(e.response?.data?.detail || 'Error al vender','error')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT - Buscador + Productos */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-600 rounded-xl"><ShoppingBag className="text-white" size={20}/></div>
            <div>
              <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">Punto de Venta</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Busca por nombre, código o principio activo • Escáner de barras compatible</p>
            </div>
            <div className="ml-auto hidden sm:flex items-center gap-1 text-xs text-slate-400"><ScanLine size={14}/> USB Scanner listo</div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={18}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=> e.key==='Enter' && fetchMeds(search)} placeholder="Buscar... ej: Paracetamol, 77900, Amoxicilina" className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400" />
            </div>
            <button onClick={()=>fetchMeds(search)} className="px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm transition-colors">Buscar</button>
          </div>

          <div className="mt-4 grid gap-2.5 max-h-[58vh] overflow-auto pr-1">
            {loading && <div className="text-center py-8 text-slate-400 animate-pulse">Cargando medicamentos...</div>}
            {!loading && meds.map(m=> {
              const stock = Number(m.stock_actual ?? 0)
              const pct = Math.min(100, Math.round((stock / Math.max(1, Number(m.stock_maximo||100))) * 100))
              const isLow = stock < Number(m.stock_minimo||0)
              const isOut = stock <= 0
              const needsReceta = m.requiere_receta && !cart.recetaId
              const recetaSel = recetas.find((r:any)=> r.id === cart.recetaId)
              const notCovered = m.requiere_receta && cart.recetaId && recetaSel && (recetaSel.medicamentos||[]).length>0 && !(recetaSel.medicamentos||[]).some((x:any)=> x.id===m.id)
              const blockedReason = isOut ? 'sin-stock' : needsReceta ? 'receta' : notCovered ? 'no-cubre' : null
              const isBlocked = !!blockedReason
              return (
              <div key={m.id} className={`flex gap-3 p-3 rounded-xl border transition-all hover:shadow-md ${isOut ? 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                {/* Imagen */}
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center flex-shrink-0">
                  {m.imagen_url ? <img src={m.imagen_url} alt={m.nombre} className="w-full h-full object-cover" loading="lazy" /> : <Package className="text-slate-400" size={22}/>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-tight">{m.nombre}</span>
                    <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">{m.codigo}</span>
                    {m.requiere_receta && <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 px-1.5 py-0.5 rounded font-bold flex items-center gap-1"><Pill size={10}/>RECETA</span>}
                    {isLow && !isOut && <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded font-medium flex items-center gap-1"><AlertTriangle size={10}/>Bajo stock</span>}
                    {isOut && <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold">SIN STOCK</span>}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{m.principio_activo || '—'} • {m.presentacion || '—'} {m.categoria && <span className={`ml-1 inline-flex text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${categoriaColor(m.categoria)}`}>{m.categoria}</span>}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full ${stockColor(m.stock_actual, m.stock_minimo, m.stock_maximo)} transition-all`} style={{width: `${pct}%`}}></div>
                    </div>
                    <span className={`text-[11px] font-bold whitespace-nowrap ${stockTextColor(m.stock_actual, m.stock_minimo)}`}>Stock: {m.stock_actual} / {m.stock_maximo}</span>
                    <span className="text-[10px] text-slate-400">mín {m.stock_minimo}</span>
                  </div>
                  {m.fecha_vencimiento && (()=>{ const d=new Date(m.fecha_vencimiento); const days=Math.ceil((d.getTime()-Date.now())/86400000); if(days<30) return <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">⚠ Vence {d.toLocaleDateString('es-PY')} ({days}d)</div>; return null })()}
                  {needsReceta && <div className="text-[10px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded px-1.5 py-0.5 mt-1">Requiere receta • selecciona una vigente abajo</div>}
                  {notCovered && <div className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded px-1.5 py-0.5 mt-1">Receta {recetaSel?.codigo} no cubre este med</div>}
                </div>
                <div className="text-right flex flex-col items-end justify-between gap-2 min-w-[110px]">
                  <div>
                    <div className="font-bold text-blue-600 dark:text-blue-400 text-[15px]">{formatPYG(m.precio_venta)}</div>
                    <div className="text-[11px] text-slate-400">Costo {formatPYG(m.precio_costo)} • <span className="text-emerald-600 dark:text-emerald-400 font-medium">{m.margen_ganancia}%</span></div>
                  </div>
                  <button onClick={()=>addToCart(m)} disabled={isBlocked} title={blockedReason==='receta' ? 'Requiere receta - selecciona una receta que lo cubra' : blockedReason==='no-cubre' ? `Receta ${recetaSel?.codigo} no prescribe este medicamento` : blockedReason==='sin-stock' ? 'Sin stock' : ''} className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-sm font-semibold transition-all ${isOut ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-600' : needsReceta || notCovered ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 cursor-not-allowed border border-amber-200 dark:border-amber-800' : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm hover:shadow'}`}><Plus size={14}/>{isOut ? 'Agotado' : needsReceta ? 'Receta req.' : notCovered ? 'No cubre' : 'Agregar'}</button>
                </div>
              </div>
            )})}
            {!loading && meds.length===0 && <div className="text-center py-12 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-600"><Package className="mx-auto text-slate-300 dark:text-slate-500 mb-2" size={32}/><p className="text-slate-500 dark:text-slate-400 text-sm">Sin resultados. Pruebe otro término o escanee código.</p></div>}
          </div>
        </div>
      </div>

      {/* RIGHT - Carrito */}
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2"><ShoppingBag size={18} className="text-blue-600"/>Carrito <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">{cart.items.length}</span></h3>
              {cart.items.length>0 && <button onClick={()=>{cart.clear(); setDescuento(0)}} className="text-xs text-slate-500 hover:text-red-600 dark:text-slate-400 flex items-center gap-1"><Trash2 size={12}/>Vaciar</button>}
            </div>
          </div>
          <div className="p-3 space-y-2 max-h-[32vh] overflow-auto">
            {cart.items.map(item=>(
              <div key={item.medicamento_id} className="flex gap-2 p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {(item as any).imagen_url ? <img src={(item as any).imagen_url} alt={item.nombre} className="w-full h-full object-cover"/> : <Package size={16} className="text-slate-400"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{item.nombre}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{formatPYG(item.precio_unitario)} x {item.cantidad} = <span className="font-semibold text-slate-700 dark:text-slate-200">{formatPYG(item.precio_unitario*item.cantidad)}</span></div>
                  <div className="text-[10px] text-slate-400">Stock disp: {item.stock_actual}</div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-600 p-0.5">
                    <button onClick={()=>cart.updateQuantity(item.medicamento_id, Math.max(1, item.cantidad-1))} className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300"><Minus size={12}/></button>
                    <span className="w-6 text-center text-sm font-bold text-slate-900 dark:text-slate-100">{item.cantidad}</span>
                    <button onClick={()=> {
                      const m = meds.find(x=>x.id===item.medicamento_id)
                      if(m && item.cantidad >= m.stock_actual) { toast(`Máximo stock ${m.stock_actual}`, 'error'); return }
                      cart.updateQuantity(item.medicamento_id, item.cantidad+1)
                    }} className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300"><Plus size={12}/></button>
                  </div>
                  <button onClick={()=>cart.removeItem(item.medicamento_id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={14}/></button>
                </div>
              </div>
            ))}
            {cart.items.length===0 && <div className="text-center py-10"><div className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-3"><ShoppingBag className="text-slate-400" size={22}/></div><p className="text-slate-500 dark:text-slate-400 text-sm">Carrito vacío</p><p className="text-xs text-slate-400">Agregue productos desde la izquierda</p></div>}
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-700/20 border-t border-slate-200 dark:border-slate-700 space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-300"><span>Subtotal</span><span className="font-semibold text-slate-900 dark:text-slate-100">{formatPYG(cart.subtotal())}</span></div>
              <div className="flex gap-2 items-center bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-600">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">Descuento %</label>
                <input type="number" value={descuento} onChange={e=>setDescuento(Math.max(0, Math.min(100, Number(e.target.value))))} className="flex-1 px-2 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-slate-100" min={0} max={100}/>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap">-{formatPYG(Math.round(cart.subtotal()*descuento/100))}</span>
              </div>
              {descuento>10 && <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1"><AlertTriangle size={10}/>Descuento &gt;10% requiere autorización</p>}
              <div className="flex justify-between font-bold text-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl p-3"><span className="text-slate-900 dark:text-slate-100">Total</span><span className="text-blue-600 dark:text-blue-400">{formatPYG(cart.total())}</span></div>
            </div>

            <div className="space-y-2">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block flex items-center gap-1.5"><Pill size={12} className="text-red-500"/> Receta (si producto requiere)</label>
                  <div className="flex gap-2">
                    <select value={cart.recetaId ?? ''} onChange={e=>cart.setReceta(e.target.value ? Number(e.target.value) : null)} className="flex-1 px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="">— Sin receta (solo para no controlados)</option>
                      {recetas.map((r:any)=> {
                        const isVenc = r.fecha_vencimiento ? new Date(r.fecha_vencimiento) < new Date(new Date().setHours(0,0,0,0)) : false
                        const disabled = isVenc || r.estado === 'vencida' || r.estado === 'rechazada'
                        return <option key={r.id} value={r.id} disabled={disabled}>{r.codigo} • {r.paciente_nombre} ({r.paciente_cedula}) • {r.estado} {r.fecha_vencimiento ? `• vence ${new Date(r.fecha_vencimiento).toLocaleDateString('es-PY')}` : ''} {disabled ? ' • VENCIDA' : ''} • {r.medicamentos?.length || 0} meds</option>
                      })}
                    </select>
                    <button type="button" onClick={()=>fetchRecetas(recetaSearch)} className="px-3 py-2.5 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs" title="Recargar recetas">↻</button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input value={recetaSearch} onChange={e=>setRecetaSearch(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); fetchRecetas(recetaSearch) } }} placeholder="Buscar receta por código/paciente/cédula" className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400" />
                    <button type="button" onClick={()=>fetchRecetas(recetaSearch)} className="px-3 bg-blue-600 text-white rounded-lg text-xs">Buscar</button>
                  </div>
                  {cart.recetaId ? (()=>{ const rec = recetas.find(r=>r.id===cart.recetaId); return rec ? <div className="mt-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs"><div className="font-semibold text-emerald-800 dark:text-emerald-300">✓ {rec.codigo} • {rec.paciente_nombre} • {rec.estado}</div><div className="text-emerald-700 dark:text-emerald-400">Cubre: {(rec.medicamentos||[]).map((m:any)=>m.nombre).join(', ') || '—'} • Vence: {rec.fecha_vencimiento ? new Date(rec.fecha_vencimiento).toLocaleDateString('es-PY') : '—'}</div></div> : null })() : <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2">ℹ Productos con etiqueta <span className="font-bold">RECETA</span> requieren seleccionar una receta vigente. Carga una en <span className="underline">/recetas</span> o usa las demo: <b>REC-2026-001</b> (Juan Lopez, 4 meds) o <b>REC-2026-002</b> (Maria, Amoxicilina).</p>}
                  {recetas.length===0 && <p className="text-xs text-red-600 dark:text-red-400 mt-1">No hay recetas cargadas. Los controlados no se podrán agregar.</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1 block">Cliente</label>
                  <div className="flex gap-2">
                    <select value={cart.clienteId ?? ''} onChange={e=>cart.setCliente(e.target.value ? Number(e.target.value) : null)} className="flex-1 px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="">🧑‍🤝‍🧑 Cliente mostrador / Anónimo</option>
                      {clientes.map((c:any)=>(
                        <option key={c.id} value={c.id}>{c.nombre} • {c.cedula || 's/c'} {c.descuento ? `• ${c.descuento}% desc` : ''} {c.alias ? `• ${c.alias}` : ''}</option>
                      ))}
                    </select>
                    <button type="button" onClick={()=>fetchClientes(clientSearch)} className="px-3 py-2.5 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs" title="Recargar clientes">↻</button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input value={clientSearch} onChange={e=>setClientSearch(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); fetchClientes(clientSearch) } }} placeholder="Buscar cliente por nombre/cédula/alias" className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400" />
                    <button type="button" onClick={()=>fetchClientes(clientSearch)} className="px-3 bg-blue-600 text-white rounded-lg text-xs">Buscar</button>
                  </div>
                  {cart.clienteId && (()=>{ const cli = clientes.find(c=>c.id===cart.clienteId); return cli ? <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">✓ {cli.nombre} {cli.descuento ? `• ${cli.descuento}% descuento aplicado al total` : ''}</p> : null })()}
                  {!cart.clienteId && <p className="text-xs text-slate-400 mt-1">Venta a cliente mostrador (sin registro)</p>}
                </div>
              </div>
              <select value={metodo} onChange={e=>setMetodo(e.target.value)} className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="efectivo">💵 Efectivo (PYG)</option>
                <option value="tarjeta_debito">💳 Tarjeta Débito</option>
                <option value="tarjeta_credito">💳 Tarjeta Crédito</option>
                <option value="transferencia">🏦 Transferencia</option>
                <option value="cheque">📝 Cheque</option>
                <option value="mixto">🔀 Mixto</option>
              </select>
              <button onClick={confirmarVenta} disabled={cart.items.length===0} className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 disabled:from-slate-200 disabled:to-slate-200 dark:disabled:from-slate-700 dark:disabled:to-slate-700 disabled:text-slate-400 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-2">
                <ShoppingBag size={18}/> Confirmar Venta • {formatPYG(cart.total())}
              </button>
              <p className="text-[11px] text-center text-slate-400">Stock se descuenta automáticamente • Receta validada</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
