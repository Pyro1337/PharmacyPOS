import { describe, it, expect } from 'vitest'
import { formatPYG } from '../lib/api'

describe('formatPYG', () => {
  it('formats 50000', () => expect(formatPYG(50000)).toContain('50'))
  it('formats 1000', () => expect(formatPYG(1000)).toContain('1'))
  it('formats 0', () => expect(formatPYG(0)).toBeTruthy())
  it('formats large number', () => expect(formatPYG(1000000)).toContain('1'))
  it('includes currency symbol', () => expect(formatPYG(50000)).toContain('₲'))
  it('handles 15000', () => expect(formatPYG(15000)).toBeTruthy())
  it('handles 25000', () => expect(formatPYG(25000)).toBeTruthy())
  it('handles 100', () => expect(formatPYG(100)).toBeTruthy())
  it('handles 999', () => expect(formatPYG(999)).toBeTruthy())
  it('handles 123456', () => expect(formatPYG(123456)).toBeTruthy())
  it('consistent formatting', () => {
    const a = formatPYG(50000)
    const b = formatPYG(50000)
    expect(a).toBe(b)
  })
  it('different values different output', () => {
    expect(formatPYG(1000)).not.toBe(formatPYG(2000))
  })
})
