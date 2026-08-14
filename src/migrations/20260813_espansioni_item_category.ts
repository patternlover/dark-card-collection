import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Rename completo "Collezioni" -> "Espansioni" + nuovo campo item_category.
//
// - Tabella `collections` -> `espansioni` (indici/PK seguono il rename; la
//   sequence va rinominata a mano).
// - Products: colonna `collection_id` -> `expansion_id` (+ FK e indice).
// - payload_locked_documents_rels: colonna `collections_id` -> `espansioni_id`
//   (tabella di sistema Payload, come da lezione sulla migration obbligatoria).
// - Products: nuovo campo `item_category` (enum product|card, default 'product').
//
// Idempotente: su DB già allineati (push/fresh) è un no-op; se `collections`
// esiste ancora vuota accanto a `espansioni` (caso push fresh) viene rimossa.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- 1) rename tabella (solo se espansioni non esiste ancora)
    DO $$ BEGIN
      IF to_regclass('public.collections') IS NOT NULL
         AND to_regclass('public.espansioni') IS NULL THEN
        ALTER TABLE "collections" RENAME TO "espansioni";
      END IF;
    END $$;

    -- 1b) legacy vuota rimasta dopo un push fresh accanto a espansioni
    DO $$ BEGIN
      IF to_regclass('public.collections') IS NOT NULL
         AND to_regclass('public.espansioni') IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM "collections") THEN
          DROP TABLE "collections";
        END IF;
      END IF;
    END $$;

    -- 2) sequence
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'collections_id_seq')
         AND NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'espansioni_id_seq') THEN
        ALTER SEQUENCE "collections_id_seq" RENAME TO "espansioni_id_seq";
      END IF;
    END $$;

    -- 3) products.collection_id -> expansion_id (+ FK + indice)
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'collection_id')
         AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'expansion_id') THEN
        ALTER TABLE "products" RENAME COLUMN "collection_id" TO "expansion_id";
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_collection_id_collections_id_fk')
         AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_expansion_id_espansioni_id_fk') THEN
        ALTER TABLE "products" RENAME CONSTRAINT "products_collection_id_collections_id_fk"
          TO "products_expansion_id_espansioni_id_fk";
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'products' AND indexname = 'products_collection_idx')
         AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'products' AND indexname = 'products_expansion_idx') THEN
        ALTER INDEX "products_collection_idx" RENAME TO "products_expansion_idx";
      END IF;
    END $$;

    -- 4) payload_locked_documents_rels.collections_id -> espansioni_id (+ FK + indice)
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payload_locked_documents_rels' AND column_name = 'collections_id')
         AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payload_locked_documents_rels' AND column_name = 'espansioni_id') THEN
        ALTER TABLE "payload_locked_documents_rels" RENAME COLUMN "collections_id" TO "espansioni_id";
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_collections_fk')
         AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_espansioni_fk') THEN
        ALTER TABLE "payload_locked_documents_rels" RENAME CONSTRAINT "payload_locked_documents_rels_collections_fk"
          TO "payload_locked_documents_rels_espansioni_fk";
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'payload_locked_documents_rels' AND indexname = 'payload_locked_documents_rels_collections_id_idx')
         AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'payload_locked_documents_rels' AND indexname = 'payload_locked_documents_rels_espansioni_id_idx') THEN
        ALTER INDEX "payload_locked_documents_rels_collections_id_idx"
          RENAME TO "payload_locked_documents_rels_espansioni_id_idx";
      END IF;
    END $$;

    -- 5) item_category su products
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_products_item_category') THEN
        CREATE TYPE "enum_products_item_category" AS ENUM('product', 'card');
      END IF;
    END $$;

    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "item_category" "enum_products_item_category" DEFAULT 'product';
    UPDATE "products" SET "item_category" = 'product' WHERE "item_category" IS NULL;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- item_category
    ALTER TABLE "products" DROP COLUMN IF EXISTS "item_category";
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_products_item_category') THEN
        DROP TYPE "enum_products_item_category";
      END IF;
    END $$;

    -- payload_locked_documents_rels
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'payload_locked_documents_rels' AND indexname = 'payload_locked_documents_rels_espansioni_id_idx')
         AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'payload_locked_documents_rels' AND indexname = 'payload_locked_documents_rels_collections_id_idx') THEN
        ALTER INDEX "payload_locked_documents_rels_espansioni_id_idx"
          RENAME TO "payload_locked_documents_rels_collections_id_idx";
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_espansioni_fk')
         AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_collections_fk') THEN
        ALTER TABLE "payload_locked_documents_rels" RENAME CONSTRAINT "payload_locked_documents_rels_espansioni_fk"
          TO "payload_locked_documents_rels_collections_fk";
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payload_locked_documents_rels' AND column_name = 'espansioni_id')
         AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payload_locked_documents_rels' AND column_name = 'collections_id') THEN
        ALTER TABLE "payload_locked_documents_rels" RENAME COLUMN "espansioni_id" TO "collections_id";
      END IF;
    END $$;

    -- products
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'products' AND indexname = 'products_expansion_idx')
         AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'products' AND indexname = 'products_collection_idx') THEN
        ALTER INDEX "products_expansion_idx" RENAME TO "products_collection_idx";
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_expansion_id_espansioni_id_fk')
         AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_collection_id_collections_id_fk') THEN
        ALTER TABLE "products" RENAME CONSTRAINT "products_expansion_id_espansioni_id_fk"
          TO "products_collection_id_collections_id_fk";
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'expansion_id')
         AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'collection_id') THEN
        ALTER TABLE "products" RENAME COLUMN "expansion_id" TO "collection_id";
      END IF;
    END $$;

    -- sequence
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'espansioni_id_seq')
         AND NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'collections_id_seq') THEN
        ALTER SEQUENCE "espansioni_id_seq" RENAME TO "collections_id_seq";
      END IF;
    END $$;

    -- tabella
    DO $$ BEGIN
      IF to_regclass('public.espansioni') IS NOT NULL
         AND to_regclass('public.collections') IS NULL THEN
        ALTER TABLE "espansioni" RENAME TO "collections";
      END IF;
    END $$;
  `)
}
