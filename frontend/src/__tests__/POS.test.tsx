import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Mock api
vi.mock('../lib/api', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(() => Promise.resolve({ data: {} }))
  },
  formatPYG: (n:number) => `${n} PYG`
}))

// Mock stores
vi.mock('../stores/cartStore', () => ({
  useCartStore: () => ({
    items: [{ medicamento_id:1, nombre:'Paracetamol', precio_unitario:5000, cantidad:2, codigo:'A' }],
    subtotal: () => 10000,
    total: () => 9000,
    addItem: vi.fn(),
    removeItem: vi.fn(),
    updateQuantity: vi.fn(),
    clear: vi.fn(),
    setDescuento: vi.fn(),
    setReceta: vi.fn(),
    setCliente: vi.fn(),
    descuentoTotal: 10,
    recetaId: null,
    clienteId: null
  })
}))

import POS from '../pages/POS'

describe('POS page', () => {
  it('renders POS title', async () => {
    render(<MemoryRouter><POS /></MemoryRouter>)
    expect(screen.getByText(/Punto de Venta/i)).toBeInTheDocument()
  })
  it('shows buscar input', () => {
    render(<MemoryRouter><POS /></MemoryRouter>)
    expect(screen.getByPlaceholderText(/Buscar por nombre/i)).toBeInTheDocument()
  })
  it('shows carrito', () => {
    render(<MemoryRouter><POS /></MemoryRouter>)
    expect(screen.getAllByText(/Carrito/i).length).toBeGreaterThan(0)
  })
  it('shows confirmar venta button', () => {
    render(<MemoryRouter><POS /></MemoryRouter>)
    expect(screen.getByText(/Confirmar Venta/i)).toBeInTheDocument()
  })
  it('shows subtotal', () => {
    render(<MemoryRouter><POS /></MemoryRouter>)
    expect(screen.getByText(/Subtotal/i)).toBeInTheDocument()
  })
  it('shows total', () => {
    render(<MemoryRouter><POS /></MemoryRouter>)
    expect(screen.getAllByText(/Total/i).length).toBeGreaterThan(0)
  })
  it('has metodo pago select', () => {
    render(<MemoryRouter><POS /></MemoryRouter>)
    expect(screen.getByDisplayValue(/Efectivo/i)).toBeInTheDocument()
  })
  it('search button exists', () => {
    render(<MemoryRouter><POS /></MemoryRouter>)
    expect(screen.getByText('Buscar')).toBeInTheDocument()
  })
  it('descuento input exists', () => {
    render(<MemoryRouter><POS /></MemoryRouter>)
    expect(screen.getByText(/Descuento/i)).toBeInTheDocument()
  })
  it('receta input exists', () => {
    render(<MemoryRouter><POS /></MemoryRouter>)
    expect(screen.getByPlaceholderText(/ID Receta/i)).toBeInTheDocument()
  })
})
