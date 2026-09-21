import { useEffect, useState } from 'react'
import api, { formatPYG } from '../lib/api'
import { toast } from '../components/Toast'

export default function Caja() {
  const [caja, setCaja] = useState<any>(null)
  const [historial, setHistorial] = useState<any[]>([])
  const [saldoInicial, setSaldoInicial] = useState(50000)
  const [saldoReal, setSaldoReal] = useState(0)
  const [mov, setMov] = useState<any>({ tipo:'deposito', monto:0, descripcion:'' })

  const load = async () => {
    try {
      const { data } = await api.get('/cajas/actual')
      setCaja(data)
    } catch { setCaja(null) }
    const h = await api.get('/cajas/')
    setHistorial(h.data)
  }
  useEffect(()=>{ load() }, [])

  const abrir = async () => {
    try { await api.post('/cajas/abrir', { saldo_inicial: saldoInicial, turno:'manana' }); toast('Caja abierta','success'); load() } catch(e:any){ toast(e.response?.data?.detail || 'Error','error')}
  }
  const cerrar = async () => {
    if (!caja) return
    try { await api.post(`/cajas/${caja.id}/cerrar`, { saldo_real: saldoReal }); toast('Caja cerrada','success'); load() } catch(e:any){ toast(e.response?.data?.detail || 'Error','error')}
  }
  const addMov = async () => {
    if (!caja) return
    try { await api.post(`/cajas/${caja.id}/movimiento`, mov); toast('Movimiento agregado','success'); load() } catch(e:any){ toast('Error','error')}
  }
  const descargar = async (id:number) => {
    try {
      const res = await api.get(`/cajas/${id}/pdf`, { responseType:'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a'); link.href=url; link.setAttribute('download', `cierre_${id}.pdf`); document.body.appendChild(link); link.click(); link.remove()
    } catch { toast('Error al descargar PDF','error')}
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Caja Diaria</h1>
      {!caja ? (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow">
          <h3 className="font-bold mb-3">Abrir Caja</h3>
          <div className="flex gap-2">
            <input type="number" value={saldoInicial} onChange={e=>setSaldoInicial(Number(e.target.value))} className="px-3 py-2 border rounded dark:bg-slate-700"/>
            <button onClick={abrir} className="px-6 bg-green-600 text-white rounded-lg">Abrir Caja</button>
          </div>
          <p className="text-xs text-slate-400 mt-2">Saldo inicial en PYG</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow space-y-4">
          <div className="flex justify-between">
            <div><div className="text-sm text-slate-500">Caja #{caja.numero_caja} - {caja.fecha}</div><div className="font-bold">Saldo Inicial: {formatPYG(caja.saldo_inicial)}</div><div className="text-sm">Esperado: {formatPYG(caja.saldo_esperado || 0)} • Estado: {caja.estado}</div></div>
            <div className="text-right"><div className="text-sm text-slate-500">Turno: {caja.turno}</div><button onClick={()=>descargar(caja.id)} className="text-xs bg-blue-600 text-white px-3 py-1 rounded mt-1">Descargar PDF</button></div>
          </div>
          <div className="border-t pt-4 grid grid-cols-3 gap-2">
            <input placeholder="Tipo" value={mov.tipo} onChange={e=>setMov({...mov, tipo:e.target.value})} className="px-2 py-2 border rounded text-sm dark:bg-slate-700"/>
            <input type="number" placeholder="Monto (negativo para egreso)" value={mov.monto} onChange={e=>setMov({...mov, monto:Number(e.target.value)})} className="px-2 py-2 border rounded text-sm dark:bg-slate-700"/>
            <input placeholder="Descripción" value={mov.descripcion} onChange={e=>setMov({...mov, descripcion:e.target.value})} className="px-2 py-2 border rounded text-sm dark:bg-slate-700"/>
          </div>
          <button onClick={addMov} className="w-full bg-slate-800 text-white py-2 rounded-lg text-sm">Agregar Movimiento</button>
          {caja.movimientos?.length>0 && <div className="text-xs space-y-1">{caja.movimientos.map((m:any,i:number)=><div key={i} className="flex justify-between border-b py-1"><span>{m.tipo} - {m.descripcion}</span><span>{formatPYG(m.monto)}</span></div>)}</div>}
          <div className="border-t pt-4 flex gap-2">
            <input type="number" placeholder="Saldo real contado" value={saldoReal} onChange={e=>setSaldoReal(Number(e.target.value))} className="flex-1 px-3 py-2 border rounded dark:bg-slate-700"/>
            <button onClick={cerrar} className="px-6 bg-red-600 text-white rounded-lg">Cerrar Caja</button>
          </div>
        </div>
      )}
      <div className="bg-white dark:bg-slate-800 rounded-xl overflow-auto">
        <h3 className="p-4 font-bold">Historial de Cajas</h3>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-700"><tr><th className="p-2">Fecha</th><th className="p-2">#</th><th className="p-2">Inicial</th><th className="p-2">Esperado</th><th className="p-2">Real</th><th className="p-2">Dif</th><th className="p-2">Estado</th><th className="p-2"></th></tr></thead>
          <tbody>
            {historial.map(c=>(
              <tr key={c.id} className="border-t dark:border-slate-700 text-center">
                <td className="p-2">{c.fecha}</td><td className="p-2">{c.numero_caja}</td><td className="p-2">{formatPYG(c.saldo_inicial)}</td><td className="p-2">{c.saldo_esperado ? formatPYG(c.saldo_esperado):'—'}</td><td className="p-2">{c.saldo_real ? formatPYG(c.saldo_real):'—'}</td><td className="p-2">{c.diferencia !== null ? formatPYG(c.diferencia):'—'}</td><td className="p-2">{c.estado}</td><td className="p-2"><button onClick={()=>descargar(c.id)} className="text-blue-600 text-xs">PDF</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
