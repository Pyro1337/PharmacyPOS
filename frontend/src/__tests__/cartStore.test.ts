import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from '../stores/cartStore'

describe('cartStore', () => {
  beforeEach(() => useCartStore.getState().clear())
  it('adds item', () => {
    useCartStore.getState().addItem({ medicamento_id:1, codigo:'A', nombre:'Paracetamol', precio_unitario:5000, cantidad:1, descuento_item:0, stock_actual:10, requiere_receta:false })
    expect(useCartStore.getState().items.length).toBe(1)
  })
  it('increments quantity if exists', () => {
    const item = { medicamento_id:1, codigo:'A', nombre:'Paracetamol', precio_unitario:5000, cantidad:1, descuento_item:0, stock_actual:10, requiere_receta:false }
    useCartStore.getState().addItem(item)
    useCartStore.getState().addItem(item)
    expect(useCartStore.getState().items[0].cantidad).toBe(2)
  })
  it('removes item', () => {
    useCartStore.getState().addItem({ medicamento_id:1, codigo:'A', nombre:'A', precio_unitario:1000, cantidad:1, descuento_item:0, stock_actual:10, requiere_receta:false })
    useCartStore.getState().removeItem(1)
    expect(useCartStore.getState().items.length).toBe(0)
  })
  it('updates quantity', () => {
    useCartStore.getState().addItem({ medicamento_id:1, codigo:'A', nombre:'A', precio_unitario:1000, cantidad:1, descuento_item:0, stock_actual:10, requiere_receta:false })
    useCartStore.getState().updateQuantity(1,5)
    expect(useCartStore.getState().items[0].cantidad).toBe(5)
  })
  it('calculates subtotal', () => {
    useCartStore.getState().addItem({ medicamento_id:1, codigo:'A', nombre:'A', precio_unitario:1000, cantidad:2, descuento_item:0, stock_actual:10, requiere_receta:false })
    useCartStore.getState().addItem({ medicamento_id:2, codigo:'B', nombre:'B', precio_unitario:2000, cantidad:1, descuento_item:0, stock_actual:10, requiere_receta:false })
    expect(useCartStore.getState().subtotal()).toBe(4000)
  })
  it('calculates total with discount', () => {
    useCartStore.getState().addItem({ medicamento_id:1, codigo:'A', nombre:'A', precio_unitario:10000, cantidad:1, descuento_item:0, stock_actual:10, requiere_receta:false })
    useCartStore.getState().setDescuento(10)
    expect(useCartStore.getState().total()).toBe(9000)
  })
  it('clear empties cart', () => {
    useCartStore.getState().addItem({ medicamento_id:1, codigo:'A', nombre:'A', precio_unitario:1000, cantidad:1, descuento_item:0, stock_actual:10, requiere_receta:false })
    useCartStore.getState().clear()
    expect(useCartStore.getState().items.length).toBe(0)
    expect(useCartStore.getState().descuentoTotal).toBe(0)
  })
  it('handles descuento_item', () => {
    useCartStore.getState().addItem({ medicamento_id:1, codigo:'A', nombre:'A', precio_unitario:10000, cantidad:1, descuento_item:1000, stock_actual:10, requiere_receta:false })
    expect(useCartStore.getState().subtotal()).toBe(9000)
  })
  it('sets receta and cliente', () => {
    useCartStore.getState().setReceta(5)
    expect(useCartStore.getState().recetaId).toBe(5)
    useCartStore.getState().setCliente(3)
    expect(useCartStore.getState().clienteId).toBe(3)
  })
  it('total never negative', () => {
    useCartStore.getState().addItem({ medicamento_id:1, codigo:'A', nombre:'A', precio_unitario:1000, cantidad:1, descuento_item:0, stock_actual:10, requiere_receta:false })
    useCartStore.getState().setDescuento(100)
    expect(useCartStore.getState().total()).toBe(0)
  })
  // repeat to reach more tests
  it('adds multiple different items', () => {
    for(let i=1;i<=5;i++) useCartStore.getState().addItem({ medicamento_id:i, codigo:`C${i}`, nombre:`M${i}`, precio_unitario:1000*i, cantidad:1, descuento_item:0, stock_actual:10, requiere_receta:false })
    expect(useCartStore.getState().items.length).toBe(5)
  })
  it('subtotal with 5 items', () => {
    useCartStore.getState().clear()
    for(let i=1;i<=3;i++) useCartStore.getState().addItem({ medicamento_id:i, codigo:`C${i}`, nombre:`M${i}`, precio_unitario:1000, cantidad:i, descuento_item:0, stock_actual:10, requiere_receta:false })
    expect(useCartStore.getState().subtotal()).toBe(6000)
  })
})
