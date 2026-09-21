import { create } from 'zustand'

export interface CartItem {
  medicamento_id: number
  codigo: string
  nombre: string
  precio_unitario: number
  cantidad: number
  descuento_item: number
  stock_actual: number
  requiere_receta: boolean
}

interface CartState {
  items: CartItem[]
  descuentoTotal: number
  recetaId: number | null
  clienteId: number | null
  addItem: (item: CartItem) => void
  removeItem: (id: number) => void
  updateQuantity: (id: number, cantidad: number) => void
  clear: () => void
  setDescuento: (val: number) => void
  setReceta: (id: number | null) => void
  setCliente: (id: number | null) => void
  subtotal: () => number
  total: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  descuentoTotal: 0,
  recetaId: null,
  clienteId: null,
  addItem: (item) => set((s) => {
    const exists = s.items.find(i => i.medicamento_id === item.medicamento_id)
    if (exists) {
      return { items: s.items.map(i => i.medicamento_id === item.medicamento_id ? { ...i, cantidad: i.cantidad + item.cantidad } : i) }
    }
    return { items: [...s.items, item] }
  }),
  removeItem: (id) => set((s) => ({ items: s.items.filter(i => i.medicamento_id !== id) })),
  updateQuantity: (id, cantidad) => set((s) => ({ items: s.items.map(i => i.medicamento_id === id ? { ...i, cantidad } : i)})),
  clear: () => set({ items: [], descuentoTotal: 0, recetaId: null, clienteId: null }),
  setDescuento: (val) => set({ descuentoTotal: val }),
  setReceta: (id) => set({ recetaId: id }),
  setCliente: (id) => set({ clienteId: id }),
  subtotal: () => {
    const { items } = get()
    return items.reduce((acc, i) => acc + (i.precio_unitario * i.cantidad - i.descuento_item), 0)
  },
  total: () => {
    const sub = get().subtotal()
    const desc = get().descuentoTotal
    return Math.max(0, sub - Math.round(sub * desc / 100))
  }
}))
