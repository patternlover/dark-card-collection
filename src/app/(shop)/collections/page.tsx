export default function CollectionsPage() {
  return (
    <div className="bg-black">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-4">Collezioni</h1>
        <p className="text-zinc-400 mb-8">
          Esplora le nostre collezioni di espansioni Pokémon TCG
        </p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Placeholder collections */}
          {['Scarlet & Violet', 'Paldea Evolved', 'Obsidian Flames', '151', 'Crown Zenith'].map((name) => (
            <div
              key={name}
              className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 hover:border-zinc-700 transition-colors"
            >
              <div className="aspect-video bg-zinc-800 rounded mb-4" />
              <h2 className="text-lg font-semibold text-white">{name}</h2>
              <p className="text-sm text-zinc-500 mt-2">Vedi prodotti →</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
