import { describe, it, expect } from 'vitest'
import { cn, formatPercent, formatNumber } from '@/lib/utils'

describe('utils', () => {
  describe('cn - class name utility', () => {
    it('should merge single class string', () => {
      expect(cn('foo')).toBe('foo')
    })

    it('should merge multiple class strings', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'included', false && 'excluded')).toBe('base included')
    })

    it('should merge conflicting Tailwind classes correctly', () => {
      // twMerge should resolve conflicts - later class wins
      expect(cn('px-2', 'px-4')).toBe('px-4')
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    })

    it('should handle array of classes', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar')
    })

    it('should handle object syntax', () => {
      expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz')
    })

    it('should handle mixed inputs', () => {
      expect(cn('base', { conditional: true }, ['array-class'])).toBe('base conditional array-class')
    })

    it('should handle empty inputs', () => {
      expect(cn()).toBe('')
      expect(cn('')).toBe('')
      expect(cn(null, undefined)).toBe('')
    })

    it('should handle complex Tailwind merging', () => {
      // Background colors should merge
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
      // Different properties should not conflict
      expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white')
    })

    it('should handle hover states correctly', () => {
      expect(cn('hover:bg-red-500', 'hover:bg-blue-500')).toBe('hover:bg-blue-500')
    })
  })

  describe('formatPercent', () => {
    it('should format 0 as 0.0%', () => {
      expect(formatPercent(0)).toBe('0.0%')
    })

    it('should format 1 as 100.0%', () => {
      expect(formatPercent(1)).toBe('100.0%')
    })

    it('should format decimal values correctly', () => {
      expect(formatPercent(0.5)).toBe('50.0%')
      expect(formatPercent(0.25)).toBe('25.0%')
      expect(formatPercent(0.123)).toBe('12.3%')
    })

    it('should round to one decimal place', () => {
      expect(formatPercent(0.1234)).toBe('12.3%')
      expect(formatPercent(0.1235)).toBe('12.4%')
      expect(formatPercent(0.1236)).toBe('12.4%')
    })

    it('should handle values greater than 1', () => {
      expect(formatPercent(1.5)).toBe('150.0%')
    })

    it('should handle negative values', () => {
      expect(formatPercent(-0.1)).toBe('-10.0%')
    })

    it('should handle very small values', () => {
      expect(formatPercent(0.001)).toBe('0.1%')
      expect(formatPercent(0.0001)).toBe('0.0%')
    })
  })

  describe('formatNumber', () => {
    it('should format integers with default decimals', () => {
      expect(formatNumber(5)).toBe('5.0')
      expect(formatNumber(100)).toBe('100.0')
    })

    it('should format decimals with default precision', () => {
      expect(formatNumber(3.14159)).toBe('3.1')
      expect(formatNumber(2.99)).toBe('3.0')
    })

    it('should respect custom decimal places', () => {
      expect(formatNumber(3.14159, 2)).toBe('3.14')
      expect(formatNumber(3.14159, 3)).toBe('3.142')
      expect(formatNumber(3.14159, 0)).toBe('3')
    })

    it('should handle zero correctly', () => {
      expect(formatNumber(0)).toBe('0.0')
      expect(formatNumber(0, 2)).toBe('0.00')
    })

    it('should handle negative numbers', () => {
      expect(formatNumber(-5.5)).toBe('-5.5')
      expect(formatNumber(-5.55, 1)).toBe('-5.5')
    })

    it('should handle large numbers', () => {
      expect(formatNumber(1000000.123, 2)).toBe('1000000.12')
    })

    it('should handle very small numbers', () => {
      expect(formatNumber(0.0001, 4)).toBe('0.0001')
      expect(formatNumber(0.0001, 2)).toBe('0.00')
    })
  })
})
