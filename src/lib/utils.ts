import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export function formatNumber(value: number, decimals: number = 1): string {
  return value.toFixed(decimals)
}
