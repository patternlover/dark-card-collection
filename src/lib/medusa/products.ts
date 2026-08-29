/**
 * Catalogo Medusa → shape storefront (compatibilità con i componenti esistenti:
 * `groupProducts`, ProductCard, PDP, StickyAddToCart…). L'`id` è il variant id
 * Medusa (l'unità vendibile), il `slug` è l'handle del product.
 */
import { medusaFetch } from "./client"

// ---------------------------------------------------------------------------
// Tipi Medusa (store API) — sottoinsieme minimo
// ---------------------------------------------------------------------------

export interface MedusaPrice {
  amount: number
  currency_code: string
}

export interface MedusaVariant {
  id: string
  title: string
  sku?: string | null
  inventory_quantity?: number
  manage_inventory?: boolean
  prices?: MedusaPrice[]
}

export interface MedusaImage {
  id: string
  url: string
  alt?: string | null
}

export interface MedusaCategory {
  id: string
  name: string
  handle?: string | null
}

export interface MedusaCollection {
  id: string
  title: string
  handle?: string | null
}

export interface MedusaProduct {
  id: string
  title: string
  handle: string
  description?: string | null
  thumbnail?: string | null
  images?: MedusaImage[]
  metadata?: Record<string, unknown> | null
  status?: string
  variants?: MedusaVariant[]
  categories?: MedusaCategory[]
  collection?: MedusaCollection | null
}

export interface MedusaListResponse<T> {
  products?: T[]
  collections?: MedusaCollection[]
  product_categories?: MedusaCategory[]
  count?: number
  limit?: number
  offset?: number
}

// ---------------------------------------------------------------------------
// Shape storefront (compatibile con il vecchio doc Payload)
// ---------------------------------------------------------------------------

export interface StorefrontProduct {
  id: string
  variantId: string
  productId: string
  title: string
  slug: string
  description?: string
  price: number
  sale_price?: number
  quantity: number
  status: "listed" | "hold" | "sold"
  availability: "in_stock" | "out_of_stock" | "preorder"
  condition?: string
  grade?: string
  language?: string
  category?: { id: string; name: string; slug: string } | null
  item_category_2?:
    | { id: string; name: string; slug: string }[]
    | { id: string; name: string; slug: string }
    | null
  item_category_1?: string
  item_group_id?: string
  images?: Array<{ image: { url: string; alt: string } }>
  image_link?: string | null
  featured?: boolean
  average_sale_price?: number
  /** Costo medio (FIFO) calcolato dal modulo procurement — metadata variant. */
  cost_of_goods_sold?: number
  google_product_category?: string
  set_name?: string
}

export const CATALOG_FIELDS = [
  "id",
  "title",
  "handle",
  "description",
  "thumbnail",
  "images.url",
  "images.alt",
  "metadata",
  "categories.id",
  "categories.name",
  "categories.handle",
  "collection.id",
  "collection.title",
  "collection.handle",
  "variants.id",
  "variants.title",
  "variants.sku",
  "variants.manage_inventory",
  "variants.inventory_quantity",
  "variants.prices.amount",
  "variants.prices.currency_code",
].join(",")

function eurPrice(variant: MedusaVariant | undefined): number {
  if (!variant) return 0
  const price = variant.prices?.find((p) => p.currency_code === "eur")
  return price ? price.amount / 100 : 0
}

function toSlug(handle?: string | null): string {
  return handle || ""
}

/** Mappa un MedusaProduct (usando il primo variant) nel doc storefront attuale. */
export function toStorefrontProduct(p: MedusaProduct): StorefrontProduct | null {
  const variant = p.variants?.[0]
  if (!variant) return null

  const meta = p.metadata ?? {}
  const quantity = Number(variant.inventory_quantity ?? 0)
  const preorder = meta.preorder === true
  const status: StorefrontProduct["status"] = preorder
    ? "hold"
    : quantity > 0
      ? "listed"
      : "sold"
  const availability: StorefrontProduct["availability"] = preorder
    ? "preorder"
    : quantity > 0
      ? "in_stock"
      : "out_of_stock"

  const collection = p.collection
    ? { id: p.collection.id, name: p.collection.title, slug: toSlug(p.collection.handle) }
    : null
  const category = p.categories?.[0]
    ? { id: p.categories[0].id, name: p.categories[0].name, slug: toSlug(p.categories[0].handle) }
    : null

  const salePrice =
    typeof meta.sale_price === "number" && meta.sale_price > 0
      ? meta.sale_price
      : undefined
  const averageSalePrice =
    typeof meta.average_sale_price === "number" && meta.average_sale_price > 0
      ? meta.average_sale_price
      : undefined
  const costOfGoodsSold =
    typeof meta.cost_of_goods_sold === "number" && meta.cost_of_goods_sold >= 0
      ? meta.cost_of_goods_sold
      : undefined

  return {
    id: variant.id,
    variantId: variant.id,
    productId: p.id,
    title: p.title,
    slug: toSlug(p.handle),
    description: p.description ?? undefined,
    price: eurPrice(variant),
    ...(salePrice !== undefined ? { sale_price: salePrice } : {}),
    quantity,
    status,
    availability,
    condition: typeof meta.condition === "string" ? meta.condition : undefined,
    grade: typeof meta.grade === "string" ? meta.grade : undefined,
    language: typeof meta.language === "string" ? meta.language : undefined,
    category,
    item_category_2: collection,
    item_category_1: typeof meta.product_type === "string" ? meta.product_type : "product",
    item_group_id: p.id,
    images: (p.images ?? []).map((img) => ({
      image: { url: img.url, alt: img.alt || p.title },
    })),
    image_link: p.thumbnail ?? null,
    featured: meta.featured === true,
    ...(averageSalePrice !== undefined ? { average_sale_price: averageSalePrice } : {}),
    ...(costOfGoodsSold !== undefined ? { cost_of_goods_sold: costOfGoodsSold } : {}),
    ...(typeof meta.google_product_category === "string"
      ? { google_product_category: meta.google_product_category }
      : {}),
    ...(typeof meta.set_name === "string" ? { set_name: meta.set_name } : {}),
  }
}

// ---------------------------------------------------------------------------
// Fetcher catalogo
// ---------------------------------------------------------------------------

export interface CatalogOptions {
  categoryId?: string
  collectionId?: string
  featured?: boolean
  limit?: number
  offset?: number
}

export async function listCatalogProducts(
  opts: CatalogOptions = {},
): Promise<StorefrontProduct[]> {
  const params = new URLSearchParams({ fields: CATALOG_FIELDS })
  if (opts.categoryId) params.set("category_id", opts.categoryId)
  if (opts.collectionId) params.set("collection_id", opts.collectionId)
  if (opts.limit) params.set("limit", String(opts.limit))
  if (opts.offset) params.set("offset", String(opts.offset))

  const data = await medusaFetch<MedusaListResponse<MedusaProduct>>(
    `/products?${params.toString()}`,
  )
  return (data.products ?? []).map(toStorefrontProduct).filter(Boolean) as StorefrontProduct[]
}

export async function getCatalogProduct(slug: string): Promise<StorefrontProduct | null> {
  const params = new URLSearchParams({ fields: CATALOG_FIELDS, handle: slug })
  const data = await medusaFetch<MedusaListResponse<MedusaProduct>>(
    `/products?${params.toString()}`,
  )
  const product = data.products?.[0]
  return product ? toStorefrontProduct(product) : null
}

export async function listCatalogCollections(): Promise<MedusaCollection[]> {
  const data = await medusaFetch<MedusaListResponse<MedusaProduct>>(`/collections?limit=100`)
  return data.collections ?? []
}

export async function listCatalogCategories(): Promise<MedusaCategory[]> {
  const data = await medusaFetch<MedusaListResponse<MedusaProduct>>(
    `/product-categories?limit=100&include_descendants_tree=false`,
  )
  return data.product_categories ?? []
}

export async function getCatalogCollectionByHandle(handle: string): Promise<MedusaCollection | null> {
  const data = await medusaFetch<MedusaListResponse<MedusaProduct>>(
    `/collections?handle=${encodeURIComponent(handle)}`,
  )
  return data.collections?.[0] ?? null
}

export async function getCatalogCategoryByHandle(handle: string): Promise<MedusaCategory | null> {
  const data = await medusaFetch<MedusaListResponse<MedusaProduct>>(
    `/product-categories?handle=${encodeURIComponent(handle)}`,
  )
  return data.product_categories?.[0] ?? null
}

// ---------------------------------------------------------------------------
// Mapping per i componenti di listing (shape storico: { id, name, slug })
// ---------------------------------------------------------------------------

export interface ListingRef {
  id: string
  name: string
  slug: string
  description?: string
  releaseDate?: string | null
}

export function toCollectionRef(c: MedusaCollection): ListingRef {
  return {
    id: c.id,
    name: c.title,
    slug: c.handle ?? "",
  }
}

export function toCategoryRef(c: MedusaCategory): ListingRef {
  return {
    id: c.id,
    name: c.name,
    slug: c.handle ?? "",
  }
}