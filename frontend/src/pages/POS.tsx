import { useEffect, useState } from 'react'
import api, { formatPYG } from '../lib/api'
import { useCartStore } from '../stores/cartStore'
import { Search, Trash2, Plus, Minus } from 'lucide-react'
import { toast } from '../components/Toast'

export default function POS() {
  const [search, setSearch] = useState('')
  const [meds, setMeds] = useState<any[]>([])
  const [recetaId, setRecetaId] = useState('')
  const [metodo, setMetodo] = useState('efectivo')
  const [descuento, setDescuento] = useState(0)
  const cart = useCartStore()

  const fetchMeds = async (q='') => {
    const { data } = await api.get('/medicamentos/', { params: { search: q } })
    setMeds(data)
  }
  useEffect(()=>{ fetchMeds() }, [])

  const addToCart = (m:any) => {
    if (m.requiere_receta && !cart.recetaId) {
      toast('Medicamento requiere receta válida', 'error')
      return
    }
    if (m.stock_actual <=0) {
      toast('Sin stock', 'error')
      return
    }
    cart.addItem({ medicamento_id: m.id, codigo: m.codigo, nombre: m.nombre, precio_unitario: m.precio_venta, cantidad: 1, descuento_item: 0, stock_actual: m.stock_actual, requiere_receta: m.requiere_receta })
    toast(`${m.nombre} agregado`, 'success')
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
      fetchMeds(search)
    } catch (e:any) {
      toast(e.response?.data?.detail || 'Error al vender','error')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow">
          <h2 className="font-bold text-lg mb-3">Punto de Venta</h2>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={18}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=> e.key==='Enter' && fetchMeds(search)} placeholder="Buscar por nombre, código o principio activo... Escanee barras" className="w-full pl-10 pr-4 py-2.5 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <button onClick={()=>fetchMeds(search)} className="px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Buscar</button>
          </div>
          <div className="mt-4 grid gap-2 max-h-[45vh] overflow-auto">
            {meds.map(m=>(
              <div key={m.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 dark:border-slate-600">
                <div>
                  <div className="font-medium">{m.nombre} <span className="text-xs bg-slate-100 dark:bg-slate-600 px-2 py-0.5 rounded">{m.codigo}</span> {m.requiere_receta && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded ml-1">RECETA</span>}</div>
                  <div className="text-xs text-slate-500">{m.principio_activo} • {m.presentacion} • Stock: {m.stock_actual} {m.stock_actual < m.stock_minimo && <span className="text-red-500">¡Bajo stock!</span>}</div>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <div className="font-bold text-blue-600">{formatPYG(m.precio_venta)}</div>
                    <div className="text-xs text-slate-400">Costo {formatPYG(m.precio_costo)}</div>
                  </div>
                  <button onClick={()=>addToCart(m)} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus size={16}/></button>
                </div>
              </div>
            ))}
            {meds.length===0 && <div className="text-center py-8 text-slate-400">Sin resultados. Pruebe buscar.</div>}
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow">
          <h3 className="font-bold mb-3">Carrito ({cart.items.length})</h3>
          <div className="space-y-2 max-h-[30vh] overflow-auto">
            {cart.items.map(item=>(
              <div key={item.medicamento_id} className="flex items-center justify-between p-2 border rounded dark:border-slate-600">
                <div className="flex-1">
                  <div className="text-sm font-medium">{item.nombre}</div>
                  <div className="text-xs text-slate-500">{formatPYG(item.precio_unitario)} x {item.cantidad}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={()=>cart.updateQuantity(item.medicamento_id, Math.max(1, item.cantidad-1))} className="p-1 border rounded"><Minus size={12}/></button>
                  <span className="w-6 text-center text-sm">{item.cantidad}</span>
                  <button onClick={()=>cart.updateQuantity(item.medicamento_id, item.cantidad+1)} className="p-1 border rounded"><Plus size={12}/></button>
                  <button onClick={()=>cart.removeItem(item.medicamento_id)} className="p-1 text-red-500"><Trash2 size={14}/></button>
                </div>
              </div>
            ))}
            {cart.items.length===0 && <div className="text-center py-6 text-slate-400 text-sm">Carrito vacío</div>}
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span className="font-medium">{formatPYG(cart.subtotal())}</span></div>
            <div className="flex gap-2 items-center">
              <label className="text-xs">Descuento %</label>
              <input type="number" value={descuento} onChange={e=>setDescuento(Number(e.target.value))} className="w-20 px-2 py-1 border rounded dark:bg-slate-700" min={0} max={100}/>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total</span><span className="text-blue-600">{formatPYG(cart.total())}</span></div>
          </div>
          <div className="mt-4 space-y-2">
            <input placeholder="ID Receta (si requiere)" value={cart.recetaId || ''} onChange={e=>cart.setReceta(e.target.value ? Number(e.target.value) : null)} className="w-full px-3 py-2 border rounded text-sm dark:bg-slate-700" />
            <select value={metodo} onChange={e=>setMetodo(e.target.value)} className="w-full px-3 py-2 border rounded text-sm dark:bg-slate-700">
              <option value="efectivo">Efectivo (PYG)</option>
              <option value="tarjeta_debito">Tarjeta Débito</option>
              <option value="tarjeta_credito">Tarjeta Crédito</option>
              <option value="transferencia">Transferencia</option>
              <option value="cheque">Cheque</option>
              <option value="mixto">Mixto</option>
            </select>
            <button onClick={confirmarVenta} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700">Confirmar Venta</button>
            <button onClick={()=>cart.clear()} className="w-full border py-2 rounded-lg text-sm">Limpiar Carrito</button>
          </div>
        </div>
      </div>
    </div>
  )
}
