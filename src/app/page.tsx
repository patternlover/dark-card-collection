import { HeroSection } from '@/components/sections/HeroSection'
import { FeaturedProducts } from '@/components/sections/FeaturedProducts'
import { TrustBadges } from '@/components/sections/TrustBadges'

export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturedProducts />
      <TrustBadges />
    </>
  )
}
