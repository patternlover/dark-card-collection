/** Etichette condivise della dashboard (ordini, prodotti, vendite). */

export const STATUS_LABELS: Record<string, string> = {
  pending: 'In Attesa pagamento',
  paid: 'Pagato',
  shipped: 'Spedito',
  delivered: 'Consegnato',
  cancelled: 'Annullato',
}

export const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))

export const SALES_CHANNEL_LABELS: Record<string, string> = {
  website: 'Sito web',
  vinted: 'Vinted',
  ebay: 'eBay',
  cardmarket: 'Cardmarket',
  other: 'Altro',
}

export const GRADE_LABELS: Record<string, string> = {
  mint: 'Mint',
  'near-mint': 'Near Mint',
  'lightly-played': 'Lightly Played',
  'moderately-played': 'Moderately Played',
  'heavily-played': 'Heavily Played',
  damaged: 'Damaged',
  graded: 'Graded',
}

export const GRADE_OPTIONS = Object.entries(GRADE_LABELS).map(([value, label]) => ({ value, label }))

export const CONDITION_LABELS: Record<string, string> = {
  new: 'Nuovo',
  used: 'Usato',
  refurbished: 'Rigenerato',
}

export const CONDITION_OPTIONS = Object.entries(CONDITION_LABELS).map(([value, label]) => ({ value, label }))

export const LANGUAGE_LABELS: Record<string, string> = {
  italian: 'Italiano',
  english: 'Inglese',
  chinese: 'Cinese',
  japanese: 'Giapponese',
}

export const LANGUAGE_OPTIONS = Object.entries(LANGUAGE_LABELS).map(([value, label]) => ({ value, label }))
