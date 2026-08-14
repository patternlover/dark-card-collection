import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Remap semantico item_category (stile Google):
//   - `expansion` (relationship) -> `item_category_2` (Espansione)
//   - select enum `item_category_2` (sottocategoria) -> `item_category_3` (Micro prodotto)
//   - via text `item_category_3` (introdotto poco prima, dati trascurabili)
//   - MIGRAZIONE DATI: la collection `categories` (e `products.category_id`) viene
//     trasformata in `item_category_3` (mapping per nome, fallback 'other'); poi la
//     collection `categories` viene rimossa (tabella, colonna products, rels Payload).
// Idempotente: su DB già allineati (push/fresh) è un no-op.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- 1) via vecchia text item_category_3 (solo se ancora testo, non l'enum)
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'item_category_3' AND data_type = 'character varying') THEN
        ALTER TABLE "products" DROP COLUMN "item_category_3";
      END IF;
    END $$;

    -- 2) select enum item_category_2 -> item_category_3 (libera il nome item_category_2)
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'item_category_2' AND data_type = 'USER-DEFINED')
         AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'item_category_3') THEN
        ALTER TABLE "products" RENAME COLUMN "item_category_2" TO "item_category_3";
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_products_item_category_2')
         AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_products_item_category_3') THEN
        ALTER TYPE "enum_products_item_category_2" RENAME TO "enum_products_item_category_3";
      END IF;
    END $$;

    -- 3) expansion_id -> item_category_2_id (relationship, naming Payload <field>_id)
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'expansion_id')
         AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'item_category_2_id') THEN
        ALTER TABLE "products" RENAME COLUMN "expansion_id" TO "item_category_2_id";
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_expansion_id_espansioni_id_fk')
         AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_item_category_2_id_espansioni_id_fk') THEN
        ALTER TABLE "products" RENAME CONSTRAINT "products_expansion_id_espansioni_id_fk"
          TO "products_item_category_2_id_espansioni_id_fk";
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'products' AND indexname = 'products_expansion_idx')
         AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'products' AND indexname = 'products_item_category_2_idx') THEN
        ALTER INDEX "products_expansion_idx" RENAME TO "products_item_category_2_idx";
      END IF;
    END $$;

    -- 4) MIGRAZIONE DATI: categories -> item_category_3 (mapping per nome, fallback other)
    DO $$ BEGIN
      IF to_regclass('public.categories') IS NOT NULL
         AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'item_category_3')
         AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'category_id') THEN
        EXECUTE $q$
          UPDATE "products" p
          SET "item_category_3" = CASE
            WHEN c."name" ILIKE '%etb%' THEN 'etb'
            WHEN c."name" ILIKE '%spc%' THEN 'spc'
            WHEN c."name" ILIKE '%tin%' THEN 'tin'
            WHEN c."name" ILIKE '%bundle%' THEN 'bundle'
            WHEN c."name" ILIKE '%box%' OR c."name" ILIKE '%collection%' THEN 'box'
            WHEN c."name" ILIKE '%single%' OR c."name" ILIKE '%singola%' OR c."name" ILIKE '%carta%' THEN 'single'
            WHEN c."name" ILIKE '%slab%' THEN 'slab'
            ELSE 'other'
          END::"enum_products_item_category_3"
          FROM "categories" c
          WHERE p."category_id" = c."id" AND p."item_category_3" IS NULL
        $q$;
      END IF;
    END $$;

    -- 5) rimozione categories: products.category_id (+FK+indice)
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_category_id_categories_id_fk') THEN
        ALTER TABLE "products" DROP CONSTRAINT "products_category_id_categories_id_fk";
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'products' AND indexname = 'products_category_idx') THEN
        DROP INDEX "products_category_idx";
      END IF;
    END $$;

    ALTER TABLE "products" DROP COLUMN IF EXISTS "category_id";

    -- 6) rimozione categories: payload_locked_documents_rels.categories_id (+FK+indice)
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_categories_fk') THEN
        ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_categories_fk";
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'payload_locked_documents_rels' AND indexname = 'payload_locked_documents_rels_categories_id_idx') THEN
        DROP INDEX "payload_locked_documents_rels_categories_id_idx";
      END IF;
    END $$;

    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "categories_id";

    -- 7) drop tabella categories
    DO $$ BEGIN
      IF to_regclass('public.categories') IS NOT NULL THEN
        DROP TABLE "categories";
      END IF;
    END $$;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- ripristino tabella categories vuota (dati migrati in item_category_3; loss documentato)
    DO $$ BEGIN
      IF to_regclass('public.categories') IS NULL THEN
        CREATE TABLE "categories" (
          "id" serial PRIMARY KEY NOT NULL,
          "name" varchar NOT NULL,
          "slug" varchar NOT NULL,
          "description" varchar,
          "release_date" timestamp(3) with time zone,
          "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
        );
        CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" ("slug");
      END IF;
    END $$;

    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "category_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "categories_id" integer;

    -- enum select item_category_3 -> item_category_2 (+ enum rename)
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'item_category_3' AND data_type = 'USER-DEFINED')
         AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'item_category_2' AND data_type = 'USER-DEFINED') THEN
        ALTER TABLE "products" RENAME COLUMN "item_category_3" TO "item_category_2";
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_products_item_category_3')
         AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_products_item_category_2') THEN
        ALTER TYPE "enum_products_item_category_3" RENAME TO "enum_products_item_category_2";
      END IF;
    END $$;

    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "item_category_3" varchar;

    -- item_category_2_id (relationship integer) -> expansion
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'item_category_2_id' AND data_type = 'integer')
         AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'expansion_id') THEN
        ALTER TABLE "products" RENAME COLUMN "item_category_2_id" TO "expansion_id";
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_item_category_2_id_espansioni_id_fk')
         AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_expansion_id_espansioni_id_fk') THEN
        ALTER TABLE "products" RENAME CONSTRAINT "products_item_category_2_id_espansioni_id_fk"
          TO "products_expansion_id_espansioni_id_fk";
      END IF;
    END $$;
  `)
}
