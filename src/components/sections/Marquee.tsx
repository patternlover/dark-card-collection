const ITEMS = [
  'BOOSTER BOX',
  'ELITE TRAINER BOX',
  'COLLECTION BOX',
  'SPECIAL PREMIUM COLLECTION',
  'TIN',
  'SINGLE CARDS',
  'GRADED',
  'BUNDLE',
]

export function Marquee() {
  const sequence = [...ITEMS, ...ITEMS]

  return (
    <div className="relative overflow-hidden border-y-2 border-black bg-[#FACC15] py-3">
      <div className="flex w-max animate-marquee whitespace-nowrap">
        {sequence.map((item, i) => (
          <span key={i} className="mx-6 text-sm font-black uppercase tracking-widest text-black">
            {item}
            <span className="mx-6 text-black/40">★</span>
          </span>
        ))}
      </div>
    </div>
  )
}
