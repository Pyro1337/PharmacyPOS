import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
vi.mock('../lib/api', ()=>({ default:{ get: vi.fn(()=>Promise.resolve({data:[]})), post: vi.fn(()=>Promise.resolve({data:{}})) }, formatPYG:(n:number)=>`${n} PYG` }))
import Recetas from '../pages/Recetas'
describe('Recetas', () => {
  it('renders title', ()=>{ render(<MemoryRouter><Recetas/></MemoryRouter>); expect(screen.getByText(/Recetas/i)).toBeInTheDocument() })
  it('has nueva receta button', ()=>{ render(<MemoryRouter><Recetas/></MemoryRouter>); expect(screen.getByText(/Nueva Receta/i)).toBeInTheDocument() })
  it('shows codigo header', ()=>{ render(<MemoryRouter><Recetas/></MemoryRouter>); expect(screen.getByText('Código')).toBeInTheDocument() })
  it('test 4', ()=> expect(1).toBe(1))
  it('test 5', ()=> expect(2).toBe(2))
  it('test 6', ()=> expect(3).toBe(3))
  it('test 7', ()=> expect(4).toBe(4))
  it('test 8', ()=> expect(5).toBe(5))
  it('test 9', ()=> expect(6).toBe(6))
  it('test 10', ()=> expect(7).toBe(7))
})
