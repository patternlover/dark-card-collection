import { Shield, Truck, Package, CreditCard } from 'lucide-react'

const badges = [
  {
    icon: Shield,
    title: 'Autenticità garantita',
    description: 'Tutti i prodotti sono originali e sigillati',
  },
  {
    icon: Truck,
    title: 'Spedizione tracciabile',
    description: 'Traccia il tuo ordine in tempo reale',
  },
  {
    icon: Package,
    title: 'Packaging sicuro',
    description: 'Protezione professionale per ogni ordine',
  },
  {
    icon: CreditCard,
    title: 'Pagamento sicuro',
    description: 'Transazioni protette con Stripe',
  },
]

export function TrustBadges() {
  return (
    <section className="border-t border-zinc-800 bg-zinc-900 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {badges.map((badge) => {
            const Icon = badge.icon
            return (
              <div key={badge.title} className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Icon className="h-6 w-6 text-zinc-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">{badge.title}</h3>
                  <p className="mt-1 text-sm text-zinc-500">{badge.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
