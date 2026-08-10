# AGENTS.md — Dark Card Collection

## Identità
- E-commerce Pokémon TCG (sealed products, carte singole, slab) su **darkcardcollection.com**.
- Repo: `github.com/patternlover/dark-card-collection` · branch `main` · git identity: `patternlover` (edocavalcanti@gmail.com).
- Contesto completo: [`docs/project/overview.md`](docs/project/overview.md) (architettura, schema, decisioni) · `README.md` (setup, deploy) · [`docs/database/schema-and-flows.md`](docs/database/schema-and-flows.md) (schema DB) · [`docs/project/changelog.md`](docs/project/changelog.md) (storico) · [`docs/project/sessions/`](docs/project/sessions/README.md) (storico per sessione OpenCode: plan + changelog).

## Stack
- Next.js (App Router) + TypeScript strict
- Payload CMS 3.87 (collections + globals)
- PostgreSQL su Neon.io
- Stripe (Checkout embedded + webhooks) — **chiavi live**
- Vercel Blob Storage (immagini)
- Resend (`@payloadcms/email-resend`) per email conferma ordine
- Tailwind CSS 4 — stile neobrutalism, accent giallo `#FACC15`, footer tutto nero
- Vitest (unit test) + GitHub Actions (CI)

## Comandi (verifica SEMPRE prima di chiudere)
- Dev: `pnpm dev`
- Lint/typecheck: `pnpm lint` (= `tsc --noEmit`)
- Test: `pnpm test` (unit test in `tests/`)
- Build: `NODE_OPTIONS="--max-old-space-size=6144" pnpm build`

## Regole
- Usa SEMPRE `pnpm`, mai npm.
- Non toccare né committare mai `.env*` (contengono chiavi live Stripe/DB/Resend). Riferirsi a `.env.example` per i nomi delle variabili.
- Non cambiare mai git user.name/user.email.
- Modifiche a collections Payload richiedono: `payload generate:types` + nuova migration (`payload migrate:create`) prima di buildare.
- I prodotti vengono raggruppati per `title` (variants) — la logica è in `src/lib/group-products.ts`. Non esporre i variants nel frontend: shop e PDP mostrano solo il "parent product".
- Filtro visibilità storefront: `AND: [{ status: { in: ['listed', 'hold'] } }, { is_visible: { equals: true } }]`.
- Il checkout crea `price_data` ad-hoc (niente Stripe Products); il webhook usa `product.metadata.payloadProductId` per creare l'order.
- Payload `id` è `string | number`: castare SEMPRE con `as number` quando si creano ordini.
- Test: se tocchi `group-products.ts`, `slug.ts` o la logica sticky ATC, aggiorna i test in `tests/`.
- Build process: `payload generate:db-schema && payload migrate && next build` — la schema DB è sempre in sync con il config Payload.
- Ogni sessione OpenCode deve avere un file plan+changelog in `docs/project/sessions/` (vedi README lì) e aggiornare `docs/project/changelog.md`. Creare il plan PRIMA di iniziare, compilare il changelog a fine sessione.

## Struttura chiave
- `src/app/` → route (shop, products/[slug], cart, checkout, dashboard, api/*)
- `src/components/` → layout/, product/, sections/, ui/, dashboard/
- `src/lib/` → logica pura e client: payload, stripe, group-products, slug, dash-auth, db-query, order-email
- `src/payload/collections/` → Products, Categories, Collections, Orders, Media, Messages
- `src/payload/globals/` → SiteSettings, Header
- `src/migrations/` → migration Payload (genera da build)
- `tests/` → unit test Vitest

## Workflow AI (efficienza)
- OpenCode free tier = ~200 richieste modello / 5h (condivise tra tutti i modelli free).
- Default: lavora col **main agent** (big-pickle) — cache prompt ~97%, molto più economico.
- `@orchestrator` solo per modifiche grandi multi-fase, con spec completa così delega in 1-2 round.
- `wait_for_user` disabilitato e orchestrator senza skills/MCP: vedi `.opencode/oh-my-opencode-slim.json` e `.opencode/oh-my-opencode-slim/orchestrator_append.md`.
- Verifica SEMPRE `pnpm lint` e `pnpm test` prima di chiudere.

## Note operative
- `/dashboard` è protetto da Google OAuth (whitelist `DASHBOARD_GOOGLE_EMAILS`).
- WSL: `tsc --noEmit` e `pnpm build` possono andare in OOM — usare la build con heap aumentata. `pnpm generate:types` può andare in timeout.
- Footer: dati business (BUSINESS in `Footer.tsx`) e `CONTACT_EMAIL` ancora placeholder.
