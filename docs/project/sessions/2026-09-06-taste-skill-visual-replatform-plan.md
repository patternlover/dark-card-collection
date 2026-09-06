# 2026-09-06 — Piano replatforming visivo con taste-skill (approvato, post-R3)

Sessione di valutazione (plan → build): analisi della skill
https://github.com/Leonxlnx/taste-skill per un restyle dello storefront.
Nessuna modifica al codice: esecuzione rimandata a dopo la chiusura di R3/R3b.

## Decisioni utente (via domande)

- **Direzione**: preserve — evolvere il neobrutalist esistente (giallo `#FACC15`, ombre brutal, uppercase), nessun overhaul.
- **Timing**: dopo checkout — si parte solo a R3/R3b chiusi e verificati E2E su live.
- **Perimetro**: tutto lo storefront (vetrina + checkout + account + guide/info).

## Verdetto tecnico

- Skill corretta: **`redesign-existing-projects`** (protocollo audit-first su codice esistente),
  NON il default `design-taste-frontend` v2 (sperimentale, per landing/portfolio greenfield).
- Secondaria candidata: `industrial-brutalist-ui` (contrappeso per non snaturare il brand verso il premium generico).
- Stack compatibile: Next.js 16 + React 19 + Tailwind 4 in `src/`.
- Installazione prevista: `npx skills add https://github.com/Leonxlnx/taste-skill --skill "redesign-existing-projects"`.
  Da verificare dove OpenCode risolve le skill; eventuale vendoring di `SKILL.md` in repo.

## Audit preliminare (da confermare con la skill alla mano)

Punti che la skill flaggherà sullo stato attuale (`globals.css`, `HeroSection.tsx`, `ProductCard.tsx`):
all-caps ovunque, hero centrato, icone Lucide (default AI per la skill), ombre nere pure
invece che tinte, card generiche border+shadow. Geist già in uso = ok, niente font swap.
Bg `#0a0a0a` = già off-black, ok.

## Piano esecutivo (prossima sessione, post-R3)

1. Install skill + verifica caricamento in OpenCode (+ valutare `industrial-brutalist-ui`).
2. Design read (una riga) + dial proposti: VARIANCE ~5, MOTION ~4, DENSITY ~4 (commerce = leggibilità).
3. Audit scritto su `src/` secondo priorità skill: font → palette → hover/active → layout/spacing → componenti → stati loading/empty/error → type-scale.
4. Pilota su branch `feat/visual-replatform`: `ProductCard` + `HeroSection`, verifica `pnpm lint` / `pnpm test` / `next build`.
5. Rollout: shop/PDP/cart → checkout/account (per ultimi, aree fragili post-R3, con E2E Playwright) → guide/info/footer.
6. Guardrail: mai `apps/backend/`, mai logica cart/checkout, mai `src/lib/analytics.ts` (pattern `ecommerce: null`), mai feed Merchant; nuove dipendenze (Motion/GSAP/icone) solo dopo check `package.json` + peso bundle; `prefers-reduced-motion`, LCP/CLS presidiati.
7. Chiusura: changelog + PENDING, commit/push, verifica CI + live.

## Rischi registrati

- La skill spinge a palette/font "con carattere": vincolo preserve obbligatorio.
- Sostituzione Lucide → Phosphor = churn: solo standardizzazione `strokeWidth`, cambio set solo se il pilota lo giustifica.
- Voce PENDING aggiunta: **V1 — Replatforming visivo (taste-skill)**, `blocked (R3/R3b)`.
