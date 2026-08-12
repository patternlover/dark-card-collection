import type { Access } from 'payload'

// Access control esplicito deny-by-default (REQ-13).
// Le operazioni interne (server actions, webhook, recordSale) usano
// `overrideAccess: true`: l'accesso REST anonimo è chiuso ovunque.

export const denyAll: Access = () => false

export const allowRead: Access = () => true

export const readPublicWriteDenied: Access = () => true
