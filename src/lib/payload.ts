import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'

let cachedPayload: Payload | null = null

export async function getPayloadClient(): Promise<Payload> {
  if (cachedPayload) return cachedPayload
  cachedPayload = await getPayload({ config })
  return cachedPayload
}
