# 2026-09-06 — Fix import-history + install taste-skill + audit visivo

## 1. Fix "smarcati" (working tree sporco → committato `b9438cc`)

- `apps/backend/src/scripts/import-history/listino.ts`: idempotenza reale
  (check `product_variant_price_set` prima di creare price set; `updateProducts`
  in forma `(selector, data)`; link canale Website solo se assente).
- `run.ts`: `updateProducts({ id }, { status: "published" })`.
- Nuovi: `attach-images.ts` (medusa exec, thumbnail+gallery da manifest, idempotente)
  + `scripts/upload-product-images.ts` (upload Blob + manifest, dry-run default).
- **Verifica**: backend `tsc` 0 · jest 25/25 · storefront `pnpm lint` 0 · `pnpm test` 52/52.
- Fuori dal commit (da decidere): `mockup_form_nuovo_acquisto.html` (5 KB, mockup orfano in root).

## 2. Skill installata

`npx skills add … --skill "redesign-existing-projects"` → `.agents/skills/redesign-existing-projects`
(Safe, 0 Socket alerts, Low Risk Snyk). Non committata: decidere se vendorizzarla in repo
o tenerla come setup locale (`.agents/` è per-agent; verificare `.gitignore`).

## 3. Audit preserve (subagent, read-only, report integrale in chat di sessione)

KEEP (firma brand da non toccare): accento singolo `#FACC15`, ombre brutal tinte,
headline `font-black uppercase`, hover/active translate+ombra, badge squadrati,
FAQ `<details>`, footer compatto, copy IT senza cliché AI, semantica + meta/OG/JSON-LD.

FIX P1 (funzionali/proposti per il primo batch, branch `feat/visual-replatform`):
- F1: `bg-black` puro ovunque vs `--background:#0a0a0a` mai usato (LayoutShell, ListingShell, cart, checkout).
- F2: nessun `focus-visible:ring` (ClientListing, AddToCartButton, checkout, login).
- F3: link morto `/shop/preorders` (Hero + Footer) — serve decisione prodotto: creare route o rimuovere link.
- F4: social proof con numeri fake seedati `80-200` (CartSocialProof) — rimuovere o dati reali.
- F5: footer con dati aziendali placeholder + TODO legale/Stripe.

FIX P2/P3 (estetici, batch successivi): accenti extra fuori brand nei Badge/Cookie/ContactForm,
ombre bianche vs nere incoerenti, `uppercase` su testi lunghi, niente `text-balance`,
`strokeWidth` 2/2.5/3 misto, z-index senza scala (55–130), `min-h-screen` → `min-h-dvh`,
card espansioni/guide identiche a ProductCard, emoji 📦🃏★ al posto di icone,
`Geist_Mono` importato mai usato, `div` invece di `article` in ProductCard.

## 4. Prossimo passo (in attesa di decisione)

Batch P1 (F1–F5) su `feat/visual-replatform` — ma F3/F4/F5 richiedono decisioni prodotto
e il perimetro include checkout/account (aree R3 appena chiuse): confermare se procedere ora
(override del vincolo "dopo R3") o dopo E2E checkout su live.
