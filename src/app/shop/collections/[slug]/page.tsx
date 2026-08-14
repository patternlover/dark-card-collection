import { redirect } from 'next/navigation'

export default function CollectionSlugRedirect({ params }: { params: Promise<{ slug: string }> }) {
  return params.then(({ slug }) => redirect(`/shop/espansioni/${slug}`))
}
