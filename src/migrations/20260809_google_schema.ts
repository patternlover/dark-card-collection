import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- products: rinomina colonne ai nomi Google.
    -- Il DB può presentarsi in due stati (gestito via push o migration):
    -- - "price" già presente (prezzo di vendita) + "store_price" ridondante -> price resta, store_price viene droppato
    -- - solo "store_price" -> viene rinominato in "price"
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'store_price') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'price') THEN
          ALTER TABLE "products" RENAME COLUMN "store_price" TO "price";
        ELSE
          -- preserva eventuali MSRP presenti solo su store_price prima di droppare
          UPDATE "products" SET "compare_at_price" = "store_price"
            WHERE "compare_at_price" IS NULL AND "store_price" IS NOT NULL;
          ALTER TABLE "products" DROP COLUMN "store_price";
        END IF;
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'compare_at_price')
        AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'sale_price') THEN
        ALTER TABLE "products" RENAME COLUMN "compare_at_price" TO "sale_price";
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'image_url')
        AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'image_link') THEN
        ALTER TABLE "products" RENAME COLUMN "image_url" TO "image_link";
      END IF;
    END $$;

    -- condition (gradi TCG) -> grade; il tipo enum diventa enum_products_grade
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_products_condition')
        AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_products_grade') THEN
        ALTER TYPE "enum_products_condition" RENAME TO "enum_products_grade";
      END IF;
    END $$;

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'condition')
        AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'grade') THEN
        ALTER TABLE "products" RENAME COLUMN "condition" TO "grade";
      END IF;
    END $$;

    -- nuovo enum condition Google e colonna availability
    DO $$ BEGIN
      CREATE TYPE "enum_products_condition" AS ENUM('new','refurbished','used');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      CREATE TYPE "enum_products_availability" AS ENUM('in_stock','out_of_stock','preorder','backorder');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "cost_of_goods_sold" numeric DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "condition" "enum_products_condition" DEFAULT 'used',
      ADD COLUMN IF NOT EXISTS "availability" "enum_products_availability" DEFAULT 'in_stock',
      ADD COLUMN IF NOT EXISTS "item_group_id" varchar,
      ADD COLUMN IF NOT EXISTS "product_type" varchar,
      ADD COLUMN IF NOT EXISTS "google_product_category" varchar;

    -- backfill availability da is_preorder / status / quantity
    UPDATE "products" SET "availability" = 'preorder' WHERE "is_preorder" = true;
    UPDATE "products" SET "availability" = 'out_of_stock'
      WHERE "is_preorder" = false
        AND ("status" = 'sold' OR "quantity" IS NULL OR "quantity" <= 0);

    -- drop campi legacy Google Sheets
    ALTER TABLE "products" DROP COLUMN IF EXISTS "item_id";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "product_state";

    -- orders: rinomina ai parametri GA4 purchase
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'order_id')
        AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'transaction_id') THEN
        ALTER TABLE "orders" RENAME COLUMN "order_id" TO "transaction_id";
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'total')
        AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'value') THEN
        ALTER TABLE "orders" RENAME COLUMN "total" TO "value";
      END IF;
    END $$;

    ALTER TABLE "orders"
      ADD COLUMN IF NOT EXISTS "currency" varchar DEFAULT 'EUR',
      ADD COLUMN IF NOT EXISTS "shipping" numeric DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "tax" numeric DEFAULT 0;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "tax";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "shipping";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "currency";

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'value')
        AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'total') THEN
        ALTER TABLE "orders" RENAME COLUMN "value" TO "total";
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'transaction_id')
        AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'order_id') THEN
        ALTER TABLE "orders" RENAME COLUMN "transaction_id" TO "order_id";
      END IF;
    END $$;

    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "product_state" varchar;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "item_id" varchar;

    ALTER TABLE "products"
      DROP COLUMN IF EXISTS "google_product_category",
      DROP COLUMN IF EXISTS "product_type",
      DROP COLUMN IF EXISTS "item_group_id",
      DROP COLUMN IF EXISTS "availability",
      DROP COLUMN IF EXISTS "condition",
      DROP COLUMN IF EXISTS "cost_of_goods_sold";

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'grade')
        AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'condition') THEN
        ALTER TABLE "products" RENAME COLUMN "grade" TO "condition";
      END IF;
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_products_grade')
        AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_products_condition') THEN
        ALTER TYPE "enum_products_grade" RENAME TO "enum_products_condition";
      END IF;
    END $$;

    DROP TYPE IF EXISTS "enum_products_availability";

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'image_link')
        AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'image_url') THEN
        ALTER TABLE "products" RENAME COLUMN "image_link" TO "image_url";
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'sale_price')
        AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'compare_at_price') THEN
        ALTER TABLE "products" RENAME COLUMN "sale_price" TO "compare_at_price";
      END IF;
    END $$;
  `)
}
