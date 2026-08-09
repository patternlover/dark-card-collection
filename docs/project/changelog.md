# CHANGELOG — Dark Card Collection

Documentazione operativa delle modifiche fatte al progetto. Aggiorna questo file a ogni nuovo intervento.
Ultima sessione: **Docs + cleanup** — riorganizzazione documentazione e pulizia codice (commit `f818ce1`, `1599feb`).

---

## Sessione recente 4 — PLP/checkout/hero + SEO + hardening · commit `07cfe77` → `4f4e227`

Interventi dal `07cfe77` in poi: layout filtri PLP, breadcrumb, checkout embedded, hero scroll,
SEO `/llms-full.txt`, hardening sicurezza, pulizia deps, config orchestrator.

### PLP — layout filtri secondo spec + breadcrumb
- **File**: `src/app/shop/page.tsx`, `src/components/sections/{ListingShell,ClientListing}.tsx`, `src/components/ui/Breadcrumb.tsx`
- Griglia 2x2 desktop (Row1: breadcrumb+titolo+search; Row2: filtri+listato), mobile: path/titolo/desc → searchbar → dropdown filtri → listato.
- Componente `Breadcrumb` riutilizzabile con path attivo sottolineato, applicato a tutte le pagine (shop, PDP, cart, checkout, success, privacy, terms, shipping-returns).
- Skeleton PLP per caricamento uniforme; listato a masonry; card filtri allineate con la prima card; gap filtri/listato (`lg:gap-8`); distanza filtri/navbar (`lg:mt-16 aside`, listato `lg:pt-16`).
- `ProductFilters.tsx`/`ProductGallery.tsx` rimossi (morti, sostituiti dai nuovi componenti).

### Hero LP — movimento scroll fluido
- **File**: `src/components/sections/HeroBackground.tsx`
- Niente scale/rotate sul layer (solo parallax translateY), glow non ruotati, rotazione oggetti su se stessi guidata dallo scroll (desktop+mobile). Rispetta `prefers-reduced-motion`.

### Checkout — branding dark/yellow embedded
- **File**: `src/app/checkout/page.tsx`, `src/lib/stripe.ts`
- Rimosso `appearance` embedded (fix `initEmbeddedCheckout`), contenitore neobrutal, gerarchia z-index (navbar>cookie banner), confetti spark da mobile.

### Dashboard + nav
- Rimossa tab "Sincronizzazione" da `/dashboard` (sync solo via cron).
- Sottolineatura voce di menu attiva (current path) in `Header` e `MobileMenu`.

### Security + deps
- Hardening checkout/order/webhook/auth (`b6aaa0a`): prezzo server-side, protezione `/api/stripe/order`, idempotenza webhook + stock.
- Upgrade: next 16.3, payload 3.87.1, sharp 0.35.3.
- `pnpm audit` pulito: dompurify 3.4.13, esbuild 0.25, undici 6.28, postcss 8.5.26, override nanoid 3.3.17 (GHSA-2v37-7h3g-55p8).

### SEO
- **File**: `src/app/llms-full.txt/route.ts`, `src/app/llms.txt/route.ts`
- Aggiunto `/llms-full.txt` con catalogo dinamico; aggiornato `llms.txt`.

### Infra AI + docs
- Config orchestrator lean (`4f4e227`): `.opencode/oh-my-opencode-slim.json` + `orchestrator_append.md` (budget richieste).
- Riorganizzazione documentazione (`f818ce1`): file root obsoleti migrati in `docs/` kebab-case + `AGENTS.md`.
- Cleanup codice (`1599feb`): export non usati resi privati, componenti morti rimossi, deps superflue eliminate.

---

## Sessione recente 3 — UX/UI (7 task) · commit `07cfe77`

Tutti e 7 i punti implementati, test 24/24, build ok, deployato e verificato in produzione.

### 1. Barra di caricamento fluida
- **File**: `src/components/ui/RouteProgress.tsx`
- Riscritta da `setInterval` + `transition` (a scatti) a un loop `requestAnimationFrame` con easing continuo.
- Comportamento: entra a ~0%, crawl lento verso 95% mentre carica, poi completamento morbido a 100% e fade-out.
- Trigger: patch di `history.pushState` / `history.replaceState` + `popstate`; completamento quando cambia `pathname`/`searchParams`.
- Montata nel Root Layout dentro `<Suspense fallback={null}>` (requisito per `useSearchParams`, evita il CSR bailout su `/guide` e `/404`).

### 2. LP — oggetti hero in movimento con lo scroll
- **File**: `src/components/sections/HeroBackground.tsx`
- Ogni elemento decorativo (quadrati, punti, `+`, bagliori) ora ha attributi `data-x`, `data-y`, `data-phase`:
  - parallasse in funzione dello scroll con profondità diverse per elemento (strati a velocità differenti),
  - floating/rotazione "su se stessi" calcolati in JS (`sin`/`cos` nel tempo),
  - rotazione complessiva e zoom del contenitore legati allo scroll.
- Rimossi `rotate-12`/`rotate-45` statici e l'animazione CSS `hero-bob` (ora gestita in JS).
- Rispetta `prefers-reduced-motion` (nessun movimento).

### 3. PLP — più distanza tra tab filtri e navbar
- **File**: `src/components/sections/ListingShell.tsx`
- Padding del contenitore: `py-8` → `pt-12 pb-10` (mobile) / `pt-16` (desktop).

### 4. PLP — animazione pop ATC cyberpunk
- **File**: `src/app/globals.css` (`@keyframes atc-pop`)
- Nuova animazione `0.5s cubic-bezier(0.22,1,0.36,1)`: scale 1.22 + rotazione −7°, neon glow accent (`color-mix(var(--accent))`), flash `brightness`, rimbalzo e ritorno.
- Colore sempre `var(--accent)`. Applicata a `QuickAddButton` (PLP) e `AddToCartButton` (PDP).

### 5. PLP — altezza contenitore filtri stabile
- **File**: `src/components/sections/ClientListing.tsx`
- Il bottone mobile "Azzera filtri" ora è SEMPRE renderizzato: quando nessun filtro è attivo usa `invisible` (riserva lo spazio) invece di sparire. Nessun salto di altezza della card quando applichi/rimuovi un filtro.

### 6. PLP — cursore mano sull'ATC
- **File**: `QuickAddButton.tsx`, `AddToCartButton.tsx`
- Aggiunto `cursor-pointer` (il bottone `disabled:cursor-not-allowed` resta prioritaro quando disabilitato).

### 7. Coerenza larghezza pagine info
- **File**: `src/app/info/{about,faq,privacy,shipping-returns,terms}/page.tsx`
- Tutte portate da `max-w-3xl` a `max-w-2xl`, uguale a `/info/contact`. Verificato live su `/info/faq` e `/info/about`.

---

## Sessione recente 2 — Fix Stripe live + Google OAuth · commit `2378918`

### Stripe — fix "Failed to load Stripe.js" (root cause trovata)
- **Causa**: la Content-Security-Policy di `next.config.ts` aveva `script-src 'self' 'unsafe-inline' 'unsafe-eval'` senza `https://js.stripe.com` → il browser bloccava lo script Stripe → esattamente l'errore visto.
- **Fix**: aggiunto `https://js.stripe.com` a `script-src`. Verificato in produzione con l'header CSP live.
- **Modalità**: il bundle client ora inlina `pk_live_...` (Stripe **live**); `STRIPE_SECRET_KEY` e webhook devono essere `sk_live_...` / `whsec_live_...` (confermato dal proprietario su Vercel).
- Stripe check: pagina checkout → `loadStripe` → `createEmbeddedCheckoutPage` con `client_secret` restituito da `/api/stripe/checkout`.

### Google OAuth — cookie impostati direttamente sulla response
- **File**: `src/app/api/auth/google/route.ts`, `src/app/api/auth/google/callback/route.ts`, `src/lib/dash-auth.ts`
- I cookie `dcc-oauth-state` e di sessione `dcc-dash` ora vengono impostati con `res.cookies.set(...)` direttamente sulla `NextResponse`, invece che via cookies-store + redirect (quirk noto di Next.js che poteva far perdere il cookie).
- Verificato live: la route `/api/auth/google` emette `Set-Cookie: dcc-oauth-state=...; SameSite=lax; Secure; HttpOnly`.
- Flusso: `/dashboard` → "Accedi con Google" → `/api/auth/google` (state nonce) → accounts.google.com → callback (code exchange, verify ID token, whitelist `DASHBOARD_GOOGLE_EMAILS`) → cookie sessione → `/dashboard`.
- OAuth app pubblicata ("In produzione") dal proprietario; variabili su Vercel OK.

---

## Sessione recente 1 — 18 task QA · commit `f57d54c`

1. **Google login** — dashboard protetta con OAuth Google (vedi sessione 2 per lo stato).
2. **LP**: rimosse sezioni "Spedizione gratuita dagli 80€" (banda) e "Domande Frequenti" dalla home (`PromoBand.tsx`, `HomepageFaq.tsx` eliminati).
3. **Banner spedizione gratis 80€**: fisso SOPRA la navbar su TUTTE le pagine (`LayoutShell` + `--banner-h` + header sticky offset).
4. (Caricamento) — completato nella sessione 3.
5. **PLP**: titolo/sottotitolo spostati nella colonna listato sopra la griglia (`ClientListing`), fuori dalla colonna filtri.
6. **Sticky ATC**: si solleva quando il footer è visibile (`StickyAddToCart` + IntersectionObserver), non copre più fascia privacy/termini/spedizione.
7. **PDP prodotti correlati**: lingua "IT" ora visibile, non coperta dal QuickAdd (`ProductCard` pr-14).
8. **Mobile PDP**: breadcrumb + badge sopra l'immagine (`lg:hidden`/`hidden lg:block`).
9. **LP hero**: movimento scroll-based al posto del mouse (esteso nella sessione 3).
10. **Ricerca**: deduplicazione per titolo — 1 card per prodotto (la quantità resta per ATC/PDP).
11. **/guide**: card articoli altezza uguale (`h-full`).
12. **Banner 80€ su ogni pagina** (vedi punto 3).
13. **Checkout**: hover riga riepilogo con colore accent.
14. **Checkout**: `cursor-pointer` su +/−/cestino.
15. **Carrello**: merge per `id` prodotto (quantità sommate, non righe duplicate) + test.
16. **Stripe env**: aggiunta `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (poi completata con fix CSP sessione 2).
17. **Struttura PDP/PLP**: popolamento automatico senza errori con prodotti dal DB (validato).
18. **Animazioni/titoli**: Reveal unificato su cart/checkout/success/ListingShell; titoli info unificati (completato sessione 3).

---

## Stato attuale (su cui riprendere)

| Area | Stato |
|------|-------|
| Stripe | CSP fixata e live. **DA FARE**: test di pagamento reale (carta) end-to-end, verifica webhook live `whsec_live_...` |
| Google dashboard | Cookie su response verificati. **DA FARE**: test end-to-end dal browser desktop (account autorizzato → dashboard) |
| PLP | Layout filtri 2x2/mobile, breadcrumb, skeleton, masonry, distanza navbar — attivi |
| Hero | Movimento scroll fluido (translateY + rotazione oggetti) — attivo |
| Checkout | Embedded con branding dark/yellow, confetti — attivo |
| Filtri PLP | Altezza stabile, distanza da navbar aumentata |
| ATC | Pop cyberpunk accent, cursore mano |
| Info | Larghezza uniforme `max-w-2xl` |
| SEO | `/llms-full.txt` attivo; audit in `docs/seo/audit.md` |
| Security | Hardening checkout/order/webhook/applied; REQ-08..15 non ancora applicati (vedi `docs/security/changelog.md`) |

**In attesa del segnale del proprietario per procedere con i fix Stripe/Google.**

---

## Comandi utili

```bash
pnpm test                                   # test Vitest (24/24)
NODE_OPTIONS="--max-old-space-size=4096" pnpm build   # build locale (workaround heap WSL)
npx vercel env ls production               # elenco variabili (timestamps = creazione, non modifica)
npx vercel env pull /tmp/env.prod --environment=production --yes   # valori (mascherati [SENSITIVE] se criptati)
npx vercel --prod                          # deploy
```

## Note operative

- Vercel ora maschera i valori criptati in `env pull` (`[SENSITIVE]`): per verificare il prefisso `pk_/sk_/whsec_` usare il Dashboard Vercel o un endpoint di test.
- Modificare una `NEXT_PUBLIC_*` su Vercel richiede un **redeploy** per essere inlinata nel bundle.
- `script-src` CSP include `https://js.stripe.com` — non rimuoverlo, altrimenti il checkout si rompe di nuovo.
- I cookie OAuth vanno impostati con `res.cookies.set()` (non cookies-store) per evitare che si perdano col redirect.
