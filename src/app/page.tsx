import { HeroSection } from '@/components/sections/HeroSection'
import { FeaturedProducts } from '@/components/sections/FeaturedProducts'
import { TrustBadges } from '@/components/sections/TrustBadges'

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturedProducts />
      <TrustBadges />
    </>
  )
}
