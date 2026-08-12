import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- enums per il nuovo modello Purchases + sales_channel su Orders
    DO $$ BEGIN
      CREATE TYPE "enum_purchases_source_type" AS ENUM('newsstand', 'supermarket', 'shop', 'online', 'private', 'other');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      CREATE TYPE "enum_orders_sales_channel" AS ENUM('website', 'vinted', 'ebay', 'cardmarket', 'other');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    -- tabella array Purchases.lines (stessa convenzione Payload di products_images/orders_items)
    CREATE TABLE IF NOT EXISTS "purchases_lines" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "product_id" integer NOT NULL,
      "quantity" numeric NOT NULL,
      "unit_cost" numeric NOT NULL,
      "effective_unit_cost" numeric,
      "remaining_quantity" numeric
    );

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchases_lines_product_id_products_id_fk') THEN
        ALTER TABLE "purchases_lines" ADD CONSTRAINT "purchases_lines_product_id_products_id_fk"
          FOREIGN KEY ("product_id") REFERENCES "public"."products"("id")
          ON DELETE set null ON UPDATE no action;
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchases_lines_parent_id_fk') THEN
        ALTER TABLE "purchases_lines" ADD CONSTRAINT "purchases_lines_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "public"."purchases"("id")
          ON DELETE cascade ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "purchases_lines_order_idx" ON "purchases_lines" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "purchases_lines_parent_id_idx" ON "purchases_lines" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "purchases_lines_product_idx" ON "purchases_lines" USING btree ("product_id");

    -- nuove colonne purchases (prima del backfill che le usa)
    ALTER TABLE "purchases"
      ADD COLUMN IF NOT EXISTS "source_type" "enum_purchases_source_type",
      ADD COLUMN IF NOT EXISTS "source_name" varchar,
      ADD COLUMN IF NOT EXISTS "extra_costs" numeric DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "total_cost" numeric;

    -- backfill: converte le righe flat esistenti in lines SOLO se esiste il modello flat legacy
    -- (su uno schema già creato da push le colonne legacy non ci sono)
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchases' AND column_name = 'linked_product_id') THEN
        INSERT INTO "purchases_lines" ("_order", "_parent_id", "id", "product_id", "quantity", "unit_cost", "effective_unit_cost", "remaining_quantity")
        SELECT 0, "id", gen_random_uuid()::varchar, "linked_product_id", "quantity", "cost_of_goods_sold", "cost_of_goods_sold", "quantity"
        FROM "purchases"
        WHERE "linked_product_id" IS NOT NULL AND "quantity" > 0;

        UPDATE "purchases" SET "source_name" = "store" WHERE "source_name" IS NULL AND "store" IS NOT NULL;
        UPDATE "purchases" SET "total_cost" = "cost_of_goods_sold" * "quantity" WHERE "total_cost" IS NULL;
      END IF;
    END $$;

    UPDATE "purchases" SET "source_type" = 'other' WHERE "source_type" IS NULL;
    UPDATE "purchases" SET "purchase_date" = "created_at" WHERE "purchase_date" IS NULL;
    UPDATE "purchases" SET "extra_costs" = 0 WHERE "extra_costs" IS NULL;

    CREATE INDEX IF NOT EXISTS "purchases_updated_at_idx" ON "purchases" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "purchases_created_at_idx" ON "purchases" USING btree ("created_at");

    -- orders: sales_channel + snapshot costo per item
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "sales_channel" "enum_orders_sales_channel" DEFAULT 'website';
    ALTER TABLE "orders_items" ADD COLUMN IF NOT EXISTS "unit_cost_snapshot" numeric;

    -- drop del modello flat legacy
    DROP INDEX IF EXISTS "purchases_linked_product_idx";
    ALTER TABLE "purchases" DROP COLUMN IF EXISTS "title";
    ALTER TABLE "purchases" DROP COLUMN IF EXISTS "cost_of_goods_sold";
    ALTER TABLE "purchases" DROP COLUMN IF EXISTS "quantity";
    ALTER TABLE "purchases" DROP COLUMN IF EXISTS "store";
    ALTER TABLE "purchases" DROP COLUMN IF EXISTS "linked_product_id";
    ALTER TABLE "purchases" DROP COLUMN IF EXISTS "status";
    DROP TYPE IF EXISTS "enum_purchases_status";
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- ripristina il modello flat legacy
    DO $$ BEGIN
      CREATE TYPE "enum_purchases_status" AS ENUM('received', 'pending', 'archived');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    ALTER TABLE "purchases"
      ADD COLUMN IF NOT EXISTS "title" varchar,
      ADD COLUMN IF NOT EXISTS "cost_of_goods_sold" numeric DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "quantity" numeric DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "store" varchar,
      ADD COLUMN IF NOT EXISTS "linked_product_id" integer REFERENCES "products"("id") ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS "status" "enum_purchases_status" DEFAULT 'received';

    UPDATE "purchases" SET
      "title" = COALESCE("source_name", 'Lotto'),
      "cost_of_goods_sold" = COALESCE((SELECT MIN("effective_unit_cost") FROM "purchases_lines" WHERE "_parent_id" = "purchases"."id"), 0),
      "quantity" = COALESCE((SELECT SUM("quantity") FROM "purchases_lines" WHERE "_parent_id" = "purchases"."id"), 0),
      "store" = "source_name",
      "linked_product_id" = (SELECT "product_id" FROM "purchases_lines" WHERE "_parent_id" = "purchases"."id" ORDER BY "_order" LIMIT 1),
      "status" = 'received'
    WHERE "title" IS NULL;

    CREATE INDEX IF NOT EXISTS "purchases_linked_product_idx" ON "purchases" ("linked_product_id");

    ALTER TABLE "purchases"
      DROP COLUMN IF EXISTS "total_cost",
      DROP COLUMN IF EXISTS "extra_costs",
      DROP COLUMN IF EXISTS "source_name",
      DROP COLUMN IF EXISTS "source_type";

    DROP TABLE IF EXISTS "purchases_lines";

    ALTER TABLE "orders_items" DROP COLUMN IF EXISTS "unit_cost_snapshot";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "sales_channel";
    DROP TYPE IF EXISTS "enum_orders_sales_channel";
    DROP TYPE IF EXISTS "enum_purchases_source_type";
  `)
}
