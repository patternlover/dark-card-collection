import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Le "Categorie" tornano come collection dinamica (CRUD dashboard) e
// rappresentano i valori del Micro prodotto: `products.item_category_3` passa
// da enum a RELATIONSHIP → categories.
//
// - crea tabella `categories` (id, name, slug, description, timestamps)
// - seed dei valori attuali dell'enum (Spc, Box, Bundle, Etb, Tin, Singola,
//   Slab, Altro)
// - `products.item_category_3_id` popolato dai valori enum (mapping per slug)
// - drop colonna enum + tipo; rels Payload `payload_locked_documents_rels.categories_id`
// Idempotente.

const SEED = `
  INSERT INTO "categories" ("name", "slug", "created_at", "updated_at")
  SELECT v.name, v.slug, now(), now()
  FROM (VALUES
    ('Spc', 'spc'),
    ('Box', 'box'),
    ('Bundle', 'bundle'),
    ('Etb', 'etb'),
    ('Tin', 'tin'),
    ('Singola', 'single'),
    ('Slab', 'slab'),
    ('Altro', 'other')
  ) AS v(name, slug)
  WHERE NOT EXISTS (SELECT 1 FROM "categories");
`

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF to_regclass('public.categories') IS NULL THEN
        CREATE TABLE "categories" (
          "id" serial PRIMARY KEY NOT NULL,
          "name" varchar NOT NULL,
          "slug" varchar NOT NULL,
          "description" varchar,
          "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
          "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
        );
        CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" ("slug");
        CREATE INDEX "categories_created_at_idx" ON "categories" ("created_at");
        CREATE INDEX "categories_updated_at_idx" ON "categories" ("updated_at");
      END IF;
    END $$;

    -- seed valori enum attuali
    DO $$ BEGIN
      IF to_regclass('public.categories') IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM "categories") THEN
        EXECUTE $q$
          ${SEED}
        $q$;
      END IF;
    END $$;

    -- products.item_category_3_id (relationship)
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "item_category_3_id" integer;

    -- migra i dati dall'enum alla relationship
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'item_category_3')
         AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'item_category_3_id') THEN
        EXECUTE $q$
          UPDATE "products" p
          SET "item_category_3_id" = c."id"
          FROM "categories" c
          WHERE c."slug" = p."item_category_3"::text AND p."item_category_3_id" IS NULL
        $q$;
      END IF;
    END $$;

    -- drop colonna enum + tipo
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'item_category_3' AND data_type = 'USER-DEFINED') THEN
        ALTER TABLE "products" DROP COLUMN "item_category_3";
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_products_item_category_3') THEN
        DROP TYPE "enum_products_item_category_3";
      END IF;
    END $$;

    -- rels Payload
    DO $$ BEGIN
      IF to_regclass('public.payload_locked_documents_rels') IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payload_locked_documents_rels' AND column_name = 'categories_id') THEN
        ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "categories_id" integer;
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_categories_fk') IS FALSE
         AND to_regclass('public.payload_locked_documents_rels') IS NOT NULL
         AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payload_locked_documents_rels' AND column_name = 'categories_id') THEN
        ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk"
          FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id")
          ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'payload_locked_documents_rels' AND indexname = 'payload_locked_documents_rels_categories_id_idx') IS FALSE
         AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payload_locked_documents_rels' AND column_name = 'categories_id') THEN
        CREATE INDEX "payload_locked_documents_rels_categories_id_idx"
          ON "payload_locked_documents_rels" USING btree ("categories_id");
      END IF;
    END $$;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "payload_locked_documents_rels_categories_id_idx";
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_categories_fk') THEN
        ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_categories_fk";
      END IF;
    END $$;
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "categories_id";

    -- ricrea enum e colonna (mapping best-effort dalla relationship)
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_products_item_category_3') THEN
        CREATE TYPE "enum_products_item_category_3" AS ENUM
          ('spc', 'box', 'bundle', 'etb', 'tin', 'single', 'slab', 'other');
      END IF;
    END $$;

    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "item_category_3" "enum_products_item_category_3";

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'item_category_3_id')
         AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'item_category_3') THEN
        EXECUTE $q$
          UPDATE "products" p
          SET "item_category_3" = c."slug"::"enum_products_item_category_3"
          FROM "categories" c
          WHERE c."id" = p."item_category_3_id"
        $q$;
      END IF;
    END $$;

    ALTER TABLE "products" DROP COLUMN IF EXISTS "item_category_3_id";

    DO $$ BEGIN
      IF to_regclass('public.categories') IS NOT NULL THEN
        DROP TABLE "categories";
      END IF;
    END $$;
  `)
}
