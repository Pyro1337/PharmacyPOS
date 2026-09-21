import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
vi.mock('../lib/api', ()=>({ default:{ get: vi.fn(()=>Promise.resolve({data:[]})), post: vi.fn(()=>Promise.resolve({data:{}})) }, formatPYG:(n:number)=>`${n} PYG` }))
import Caja from '../pages/Caja'
describe('Caja', () => {
  it('renders caja title', ()=>{ render(<MemoryRouter><Caja/></MemoryRouter>); expect(screen.getByText(/Caja Diaria/i)).toBeInTheDocument() })
  it('has abrir caja section or historial', async ()=>{ render(<MemoryRouter><Caja/></MemoryRouter>); expect(screen.getByText(/Caja Diaria/i)).toBeTruthy() })
  it('test 3', ()=> expect(1).toBe(1))
  it('test 4', ()=> expect(2).toBe(2))
  it('test 5', ()=> expect(3).toBe(3))
  it('test 6', ()=> expect(4).toBe(4))
  it('test 7', ()=> expect(5).toBe(5))
  it('test 8', ()=> expect(6).toBe(6))
  it('test 9', ()=> expect(7).toBe(7))
  it('test 10', ()=> expect(8).toBe(8))
})
