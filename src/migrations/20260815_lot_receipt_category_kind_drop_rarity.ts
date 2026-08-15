import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// 2026-08-15 — categories.kind, products.rarity drop, purchases receipt, remaining_quantity backfill
//
// 1) categories: colonna `kind` (product|card|both) — usata per filtrare le categorie micro
//    nei modali (Slab/Singola solo per carte, Spc/Box/... solo per prodotti).
// 2) products: rimozione completa di `rarity` (colonna + enum) — rimosso dal dominio.
// 3) purchases: campi scontrino Google Drive (file id, nome, url).
// 4) Data fix: purchases_lines.remaining_quantity NULL -> quantity (righe legacy non
//    consumabili dal FIFO; causa della divergenza stock 0 vs residuo visibile).
//
// Idempotente (guardato): eseguibile su schema già aggiornato da push (dev) e su
// schema legacy (prod), come le migration 20260812_* / 20260814_*.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- 1) categories.kind (tipo enum creato PRIMA della colonna: su DB legacy il tipo
    --    non esiste e ADD COLUMN con tipo inesistente fallirebbe)
    DO $$ BEGIN
      CREATE TYPE "enum_categories_kind" AS ENUM('product', 'card', 'both');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "kind" "enum_categories_kind" DEFAULT 'both';
    EXCEPTION WHEN duplicate_column OR undefined_object THEN NULL; END $$;

    -- backfill: mappatura per slug (seed originale della collection)
    DO $$ BEGIN
      UPDATE "categories" SET "kind" = 'product' WHERE "slug" IN ('spc', 'box', 'bundle', 'etb', 'tin');
      UPDATE "categories" SET "kind" = 'card' WHERE "slug" IN ('single', 'slab');
      UPDATE "categories" SET "kind" = 'both' WHERE "slug" = 'other' OR "kind" IS NULL;
    EXCEPTION WHEN undefined_column THEN NULL; END $$;

    -- 2) products.rarity
    DO $$ BEGIN
      ALTER TABLE "products" DROP COLUMN IF EXISTS "rarity";
    END $$;
    DO $$ BEGIN
      DROP TYPE IF EXISTS "enum_products_rarity";
    END $$;

    -- 3) purchases receipt (Google Drive)
    DO $$ BEGIN
      ALTER TABLE "purchases"
        ADD COLUMN IF NOT EXISTS "receipt_file_id" varchar,
        ADD COLUMN IF NOT EXISTS "receipt_name" varchar,
        ADD COLUMN IF NOT EXISTS "receipt_url" varchar;
    EXCEPTION WHEN duplicate_column THEN NULL; END $$;

    -- 4) backfill remaining_quantity NULL -> quantity (righe legacy)
    DO $$ BEGIN
      UPDATE "purchases_lines"
      SET "remaining_quantity" = "quantity"
      WHERE "remaining_quantity" IS NULL;
    EXCEPTION WHEN undefined_column THEN NULL; END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- 3) purchases receipt (rollback)
    DO $$ BEGIN
      ALTER TABLE "purchases"
        DROP COLUMN IF EXISTS "receipt_file_id",
        DROP COLUMN IF EXISTS "receipt_name",
        DROP COLUMN IF EXISTS "receipt_url";
    END $$;

    -- 2) products.rarity (rollback: enum + colonna, valori persi)
    DO $$ BEGIN
      CREATE TYPE "enum_products_rarity" AS ENUM('common', 'uncommon', 'rare', 'rare-holo', 'ultra-rare', 'secret-rare');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "rarity" "enum_products_rarity";
    EXCEPTION WHEN duplicate_column THEN NULL; END $$;

    -- 1) categories.kind (rollback)
    DO $$ BEGIN
      ALTER TABLE "categories" DROP COLUMN IF EXISTS "kind";
    EXCEPTION WHEN undefined_column THEN NULL; END $$;
    DO $$ BEGIN
      DROP TYPE IF EXISTS "enum_categories_kind";
    END $$;
  `)
}
