'use client'

import { getProductImageInfo } from '@/lib/product-image'
import { proxyImageUrl } from '@/lib/proxy-image'
import { Badge } from './ui'
import type { BadgeTone } from './ui'

export const STATUS_LABELS: Record<string, string> = {
  listed: 'Disponibile',
  hold: 'In Attesa',
  sold: 'Venduto',
}

export const STATUS_TONES: Record<string, BadgeTone> = {
  listed: 'success',
  hold: 'warning',
  sold: 'neutral',
}

export const GRADE_LABELS: Record<string, string> = {
  mint: 'Mint',
  'near-mint': 'NM',
  'lightly-played': 'LP',
  'moderately-played': 'MP',
  'heavily-played': 'HP',
  damaged: 'Damaged',
  graded: 'Graded',
}

export const LANGUAGE_LABELS: Record<string, string> = {
  italian: 'IT',
  english: 'EN',
  chinese: 'CN',
  japanese: 'JP',
}

export function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONES[status] || 'neutral'
  return (
    <Badge tone={tone}>
      {STATUS_LABELS[status] || status}
    </Badge>
  )
}

export function VariantThumb({ product }: { product: any }) {
  const info = getProductImageInfo(product)
  const src = proxyImageUrl(info.cardUrl || info.url)
  if (!src) {
    return (
      <div className="h-12 w-9 shrink-0 rounded border border-[var(--ui-border-strong)] bg-[var(--ui-surface-alt)]" />
    )
  }
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      className="h-12 w-9 shrink-0 rounded border border-[var(--ui-border-strong)] bg-[var(--ui-surface-alt)] object-cover"
    />
  )
}
