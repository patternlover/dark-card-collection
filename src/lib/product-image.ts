export interface ProductImageInfo {
  url: string | null
  cardUrl: string | null
  pdpUrl: string | null
  hasImage: boolean
}

function mediaDoc(product: any): any {
  const first = Array.isArray(product?.images) ? product.images[0] : null
  const arrayMedia = typeof first === 'object' && first ? first.image : null
  const singleMedia =
    product?.image && typeof product.image === 'object' ? product.image : null
  return arrayMedia || singleMedia || null
}

export function getProductImageInfo(product: any): ProductImageInfo {
  const media = mediaDoc(product)

  const url = media?.url ?? null
  const cardUrl = media?.sizes?.card?.url ?? url
  const pdpUrl = media?.sizes?.pdp?.url ?? url

  return { url, cardUrl, pdpUrl, hasImage: Boolean(url) }
}
