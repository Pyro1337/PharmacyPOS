import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
vi.mock('../lib/api', () => ({
  default: { get: vi.fn(()=>Promise.resolve({data:[]})), post: vi.fn(()=>Promise.resolve({data:{}})) },
  formatPYG: (n:number)=>`${n} PYG`
}))
import Medicamentos from '../pages/Medicamentos'
describe('Medicamentos page', () => {
  it('renders title', () => { render(<MemoryRouter><Medicamentos/></MemoryRouter>); expect(screen.getByText(/Medicamentos/i)).toBeInTheDocument() })
  it('shows nuevo button', () => { render(<MemoryRouter><Medicamentos/></MemoryRouter>); expect(screen.getByText(/Nuevo Medicamento/i)).toBeInTheDocument() })
  it('shows buscar input', () => { render(<MemoryRouter><Medicamentos/></MemoryRouter>); expect(screen.getByPlaceholderText(/Buscar/i)).toBeInTheDocument() })
  it('shows table header Código', () => { render(<MemoryRouter><Medicamentos/></MemoryRouter>); expect(screen.getByText('Código')).toBeInTheDocument() })
  it('shows table header Nombre', () => { render(<MemoryRouter><Medicamentos/></MemoryRouter>); expect(screen.getByText('Nombre')).toBeInTheDocument() })
  it('shows table header Precio', () => { render(<MemoryRouter><Medicamentos/></MemoryRouter>); expect(screen.getByText('Precio')).toBeInTheDocument() })
  it('shows table header Stock', () => { render(<MemoryRouter><Medicamentos/></MemoryRouter>); expect(screen.getByText('Stock')).toBeInTheDocument() })
  it('buscar button exists', () => { render(<MemoryRouter><Medicamentos/></MemoryRouter>); expect(screen.getByText('Buscar')).toBeInTheDocument() })
  it('renders without crash', () => { const {container}=render(<MemoryRouter><Medicamentos/></MemoryRouter>); expect(container).toBeTruthy() })
  it('has 2 renders consistent', () => { render(<MemoryRouter><Medicamentos/></MemoryRouter>); expect(screen.getAllByText(/Medicamentos/i).length).toBeGreaterThan(0) })
})
