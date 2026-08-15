import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Espansioni multiple: `products.item_category_2` diventa relationship hasMany.
// Payload genera la join table `products_rels` (order, parent_id, path,
// espansioni_id); migriamo i valori dalla colonna singola e poi la droppiamo.
// Idempotente (pulisce anche l'eventuale tabella legacy `products_item_category_2`).

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- drop di eventuale tabella legacy (nome errato di una versione precedente)
    DO $$ BEGIN
      IF to_regclass('public.products_item_category_2') IS NOT NULL THEN
        DROP TABLE "products_item_category_2";
      END IF;
    END $$;

    DO $$ BEGIN
      IF to_regclass('public.products_rels') IS NULL THEN
        CREATE TABLE "products_rels" (
          "id" serial PRIMARY KEY NOT NULL,
          "order" integer,
          "parent_id" integer NOT NULL,
          "path" varchar NOT NULL,
          "espansioni_id" integer
        );
        CREATE INDEX "products_rels_order_idx" ON "products_rels" ("order");
        CREATE INDEX "products_rels_parent_idx" ON "products_rels" ("parent_id");
        CREATE INDEX "products_rels_path_idx" ON "products_rels" ("path");
        CREATE INDEX "products_rels_espansioni_id_idx" ON "products_rels" ("espansioni_id");
      END IF;
    END $$;

    -- migra i dati dalla colonna singola
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'item_category_2_id')
         AND to_regclass('public.products_rels') IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM "products_rels") THEN
        INSERT INTO "products_rels" ("order", "parent_id", "path", "espansioni_id")
        SELECT 0, "id", 'espansioni', "item_category_2_id"
        FROM "products" WHERE "item_category_2_id" IS NOT NULL;
      END IF;
    END $$;

    -- drop colonna singola + FK + indice
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_item_category_2_espansioni_id_fk') THEN
        ALTER TABLE "products" DROP CONSTRAINT "products_item_category_2_espansioni_id_fk";
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'products' AND indexname = 'products_item_category_2_idx') THEN
        DROP INDEX "products_item_category_2_idx";
      END IF;
    END $$;

    ALTER TABLE "products" DROP COLUMN IF EXISTS "item_category_2_id";

    -- FK della join table
    DO $$ BEGIN
      IF to_regclass('public.products_rels') IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_rels_parent_fk') THEN
        ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_parent_fk"
          FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id")
          ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    DO $$ BEGIN
      IF to_regclass('public.products_rels') IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_rels_espansioni_fk') THEN
        ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_espansioni_fk"
          FOREIGN KEY ("espansioni_id") REFERENCES "public"."espansioni"("id")
          ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF to_regclass('public.products_rels') IS NOT NULL THEN
        DROP TABLE "products_rels";
      END IF;
    END $$;

    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "item_category_2_id" integer;
  `)
}
