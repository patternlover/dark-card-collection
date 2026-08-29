import { describe, it, expect } from 'vitest'
import { toStorefrontProduct, MedusaProduct } from '@/lib/medusa/products'

function fixture(overrides: Partial<MedusaProduct> = {}): MedusaProduct {
  return {
    id: 'prod_1',
    title: 'Bundle Paldea Evolved',
    handle: 'bundle-paldea-evolved',
    description: 'Booster box sigillata',
    thumbnail: 'https://img/card.jpg',
    images: [{ id: 'img_1', url: 'https://img/card.jpg', alt: 'front' }],
    metadata: {
      product_type: 'sealed',
      set_name: 'Paldea Evolved',
      language: 'english',
      condition: 'new',
      grade: 'mint',
    },
    variants: [
      {
        id: 'variant_1',
        title: 'Default',
        sku: 'PALDEA-BOX',
        inventory_quantity: 6,
        manage_inventory: true,
        prices: [{ amount: 12000, currency_code: 'eur' }],
      },
    ],
    collection: { id: 'col_1', title: 'Paldea Evolved', handle: 'paldea-evolved' },
    categories: [{ id: 'cat_1', name: 'Sealed', handle: 'sealed' }],
    ...overrides,
  }
}

describe('toStorefrontProduct', () => {
  it('maps a sealed product to the storefront shape', () => {
    const p = toStorefrontProduct(fixture())!
    expect(p).toMatchObject({
      id: 'variant_1',
      variantId: 'variant_1',
      productId: 'prod_1',
      title: 'Bundle Paldea Evolved',
      slug: 'bundle-paldea-evolved',
      price: 120,
      quantity: 6,
      status: 'listed',
      availability: 'in_stock',
      condition: 'new',
      grade: 'mint',
      language: 'english',
      item_category_1: 'sealed',
      item_group_id: 'prod_1',
      image_link: 'https://img/card.jpg',
      category: { id: 'cat_1', name: 'Sealed', slug: 'sealed' },
    })
    expect((p.item_category_2 as any)?.name).toBe('Paldea Evolved')
    expect(p.images?.[0].image.url).toBe('https://img/card.jpg')
  })

  it('marks sold/out_of_stock when stock is 0', () => {
    const p = toStorefrontProduct(fixture({ variants: [{ ...fixture().variants![0]!, inventory_quantity: 0 }] }))!
    expect(p.status).toBe('sold')
    expect(p.availability).toBe('out_of_stock')
  })

  it('marks hold/preorder from metadata', () => {
    const p = toStorefrontProduct(
      fixture({ metadata: { ...fixture().metadata, preorder: true } }),
    )!
    expect(p.status).toBe('hold')
    expect(p.availability).toBe('preorder')
  })

  it('maps sale_price and average_sale_price from metadata', () => {
    const p = toStorefrontProduct(
      fixture({ metadata: { ...fixture().metadata, sale_price: 140, average_sale_price: 115.5 } }),
    )!
    expect(p.sale_price).toBe(140)
    expect(p.average_sale_price).toBe(115.5)
  })

  it('returns null when the product has no variants', () => {
    expect(toStorefrontProduct(fixture({ variants: [] }))).toBeNull()
  })
})