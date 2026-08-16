import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// 2026-08-16 — drop products.image_link + add orders.customer_username
//
// 1) products: `image_link` rimosso dal dominio — le immagini sono gestite SOLO
//    via media (Vercel Blob). Drop colonna (l'enum non esiste: era text).
// 2) orders: nuovo campo `customer_username` (text, opzionale) per le vendite
//    manuali/esterne (canale website incluso) registrate dalla dashboard.
//
// Idempotente (guardato), stile 20260815_*.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- 1) products.image_link
    DO $$ BEGIN
      ALTER TABLE "products" DROP COLUMN IF EXISTS "image_link";
    END $$;

    -- 2) orders.customer_username
    DO $$ BEGIN
      ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customer_username" varchar;
    EXCEPTION WHEN duplicate_column THEN NULL; END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- 2) orders.customer_username (rollback)
    DO $$ BEGIN
      ALTER TABLE "orders" DROP COLUMN IF EXISTS "customer_username";
    END $$;

    -- 1) products.image_link (rollback: valori persi)
    DO $$ BEGIN
      ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "image_link" varchar;
    EXCEPTION WHEN duplicate_column THEN NULL; END $$;
  `)
}
