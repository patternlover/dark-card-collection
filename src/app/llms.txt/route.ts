const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://darkcardcollection.com'

export async function GET() {
  const content = `# Dark Card Collection

> Negozio online di prodotti Pokémon TCG sigillati: booster box, ETB, collection box e SPC, originali al 100%, con spedizione gratuita in Italia dagli 80 €.

## Servizi

- [Shop Pokémon TCG](${SITE_URL}/shop) - Booster box, ETB, collection box e SPC sigillati delle ultime espansioni.
- [Collezioni in vendita](${SITE_URL}/shop/collections) - Tutte le collezioni attualmente disponibili.
- [Preordini](${SITE_URL}/shop/preorders) - Prodotti in arrivo e attualmente in hold.
- [Novità](${SITE_URL}/shop/new-arrivals) - Ultimi prodotti aggiunti al catalogo.
- [Bestseller](${SITE_URL}/shop/bestsellers) - I prodotti più venduti del negozio.

## Key pages

- [Guida: Dove comprare carte Pokémon originali](${SITE_URL}/guide/dove-comprare-carte-pokemon-originali)
- [Guida: Come scegliere una booster box](${SITE_URL}/guide/come-scegliere-booster-box)
- [Guida: ETB - Cosa sono le Elite Trainer Box](${SITE_URL}/guide/etb-cosa-sono-elite-trainer-box)
- [FAQ](${SITE_URL}/info/faq)
- [Chi Siamo](${SITE_URL}/info/about)
- [Contatti](${SITE_URL}/info/contact)
- [Spedizioni e resi](${SITE_URL}/info/shipping-returns)
`
  return new Response(content, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
