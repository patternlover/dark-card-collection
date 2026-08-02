export interface ProductImageInfo {
  url: string | null
  cardUrl: string | null
  pdpUrl: string | null
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
  const fallback =
    typeof product?.imageUrl === 'string' && product.imageUrl
      ? product.imageUrl
      : null

  const url = media?.url || fallback
  const cardUrl = media?.sizes?.card?.url || url
  const pdpUrl = media?.sizes?.pdp?.url || url

  return { url, cardUrl, pdpUrl }
}

export function getProductImage(product: any): string | null {
  return getProductImageInfo(product).url
}
