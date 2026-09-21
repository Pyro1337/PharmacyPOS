import { useEffect, useState } from 'react'
import api, { formatPYG } from '../lib/api'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function Dashboard() {
  const [resumen, setResumen] = useState<any>(null)
  const [periodo, setPeriodo] = useState('hoy')
  const [ventasPeriodo, setVentasPeriodo] = useState<any[]>([])
  const [financiero, setFinanciero] = useState<any>(null)
  const [metodos, setMetodos] = useState<any[]>([])

  const load = async () => {
    const r = await api.get('/dashboard/resumen', { params: { periodo } })
    setResumen(r.data)
    const vp = await api.get('/dashboard/ventas-por-periodo', { params: { periodo } })
    setVentasPeriodo(vp.data)
    try {
      const f = await api.get('/dashboard/financiero', { params: { periodo } })
      setFinanciero(f.data)
    } catch {}
    const m = await api.get('/dashboard/metodos-pago', { params: { periodo } })
    setMetodos(m.data)
  }
  useEffect(()=>{ load() }, [periodo])

  if (!resumen) return <div className="p-8">Cargando dashboard...</div>

  const COLORS = ['#2563eb','#10b981','#f59e0b','#ef4444','#8b5cf6']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <select value={periodo} onChange={e=>setPeriodo(e.target.value)} className="px-3 py-2 border rounded-lg dark:bg-slate-700">
          <option value="hoy">Hoy</option>
          <option value="semana">Últimos 7 días</option>
          <option value="mes">Este mes</option>
          <option value="30dias">Últimos 30 días</option>
          <option value="12meses">Últimos 12 meses</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow">
          <div className="text-sm text-slate-500">Ventas Totales</div>
          <div className="text-2xl font-bold text-blue-600">{formatPYG(resumen.total_ventas)}</div>
          <div className="text-xs text-slate-400">{resumen.cantidad_transacciones} transacciones</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow">
          <div className="text-sm text-slate-500">Ticket Promedio</div>
          <div className="text-2xl font-bold">{formatPYG(resumen.ticket_promedio)}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow">
          <div className="text-sm text-slate-500">Con Receta / Sin Receta</div>
          <div className="text-lg font-bold">{resumen.con_receta} / {resumen.sin_receta}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow">
          <div className="text-sm text-slate-500">Top Producto</div>
          <div className="text-sm font-bold">{resumen.top_productos[0]?.nombre || '—'}</div>
          <div className="text-xs text-slate-400">{resumen.top_productos[0]?.cantidad || 0} unidades</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow">
          <h3 className="font-bold mb-4">Ventas por Período</h3>
          <ResponsiveContainer width="100%" height={250}>
            {periodo==='hoy' ? (
              <LineChart data={ventasPeriodo}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="hora"/><YAxis/><Tooltip formatter={(v:any)=>formatPYG(v)}/><Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2}/></LineChart>
            ) : (
              <BarChart data={ventasPeriodo}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey={ventasPeriodo[0]?.fecha ? 'fecha' : 'mes'}/><YAxis/><Tooltip formatter={(v:any)=>formatPYG(v)}/><Bar dataKey="total" fill="#2563eb"/></BarChart>
            )}
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow">
          <h3 className="font-bold mb-4">Métodos de Pago</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={metodos} dataKey="total" nameKey="metodo" cx="50%" cy="50%" outerRadius={80} label>
                {metodos.map((_, i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Pie>
              <Tooltip formatter={(v:any)=>formatPYG(v)}/>
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2">
            {metodos.map(m=><span key={m.metodo} className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{m.metodo}: {formatPYG(m.total)} ({m.count})</span>)}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow">
        <h3 className="font-bold mb-3">Top 5 Productos Más Vendidos</h3>
        <div className="space-y-2">
          {resumen.top_productos.map((p:any)=>(
            <div key={p.id} className="flex justify-between items-center p-2 border rounded dark:border-slate-600">
              <span className="text-sm font-medium">{p.nombre} <span className="text-xs text-slate-400">{p.codigo}</span></span>
              <span className="text-sm font-bold">{p.cantidad} un. • {formatPYG(p.precio_venta)}</span>
            </div>
          ))}
          {resumen.top_productos.length===0 && <div className="text-sm text-slate-400">Sin ventas aún</div>}
        </div>
      </div>

      {financiero && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow">
          <h3 className="font-bold mb-3">Análisis Financiero (solo admin/contador)</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><div className="text-sm text-slate-500">Ingresos</div><div className="text-xl font-bold text-green-600">{formatPYG(financiero.ingresos)}</div></div>
            <div><div className="text-sm text-slate-500">Egresos</div><div className="text-xl font-bold text-red-600">{formatPYG(financiero.egresos)}</div></div>
            <div><div className="text-sm text-slate-500">Ganancia</div><div className="text-xl font-bold">{formatPYG(financiero.ganancia)} ({financiero.margen}%)</div></div>
          </div>
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={financiero.historico}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="mes"/><YAxis/><Tooltip formatter={(v:any)=>formatPYG(v)}/><Bar dataKey="ingresos" fill="#10b981" name="Ingresos"/><Bar dataKey="egresos" fill="#ef4444" name="Egresos"/></BarChart>
            </ResponsiveContainer>
            <div className="text-xs text-slate-400 mt-2">Proyección próximo mes: {formatPYG(financiero.proyeccion)}</div>
          </div>
        </div>
      )}
    </div>
  )
}
