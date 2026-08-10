import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- products: rinomina colonne ai nomi Google
    ALTER TABLE "products" RENAME COLUMN "store_price" TO "price";
    ALTER TABLE "products" RENAME COLUMN "price" TO "cost_of_goods_sold";
    ALTER TABLE "products" RENAME COLUMN "compare_at_price" TO "sale_price";
    ALTER TABLE "products" RENAME COLUMN "image_url" TO "image_link";

    -- condition (gradi TCG) -> grade; il tipo enum diventa enum_products_grade
    ALTER TYPE "enum_products_condition" RENAME TO "enum_products_grade";
    ALTER TABLE "products" RENAME COLUMN "condition" TO "grade";

    -- nuovo enum condition Google e colonna availability
    DO $$ BEGIN
      CREATE TYPE "enum_products_condition" AS ENUM('new','refurbished','used');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    DO $$ BEGIN
      CREATE TYPE "enum_products_availability" AS ENUM('in_stock','out_of_stock','preorder','backorder');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    ALTER TABLE "products"
      ADD COLUMN "condition" "enum_products_condition" DEFAULT 'used',
      ADD COLUMN "availability" "enum_products_availability" DEFAULT 'in_stock',
      ADD COLUMN "item_group_id" varchar,
      ADD COLUMN "product_type" varchar,
      ADD COLUMN "google_product_category" varchar;

    -- backfill availability da is_preorder / status / quantity
    UPDATE "products" SET "availability" = 'preorder' WHERE "is_preorder" = true;
    UPDATE "products" SET "availability" = 'out_of_stock'
      WHERE "is_preorder" = false
        AND ("status" = 'sold' OR "quantity" IS NULL OR "quantity" <= 0);

    -- drop campi legacy Google Sheets
    ALTER TABLE "products" DROP COLUMN IF EXISTS "item_id";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "product_state";

    -- orders: rinomina ai parametri GA4 purchase
    ALTER TABLE "orders" RENAME COLUMN "order_id" TO "transaction_id";
    ALTER TABLE "orders" RENAME COLUMN "total" TO "value";
    ALTER TABLE "orders"
      ADD COLUMN "currency" varchar DEFAULT 'EUR',
      ADD COLUMN "shipping" numeric DEFAULT 0,
      ADD COLUMN "tax" numeric DEFAULT 0;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "tax";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "shipping";
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "currency";
    ALTER TABLE "orders" RENAME COLUMN "value" TO "total";
    ALTER TABLE "orders" RENAME COLUMN "transaction_id" TO "order_id";

    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "product_state" varchar;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "item_id" varchar;

    ALTER TABLE "products"
      DROP COLUMN IF EXISTS "google_product_category",
      DROP COLUMN IF EXISTS "product_type",
      DROP COLUMN IF EXISTS "item_group_id",
      DROP COLUMN IF EXISTS "availability",
      DROP COLUMN IF EXISTS "condition";

    ALTER TABLE "products" RENAME COLUMN "grade" TO "condition";
    ALTER TYPE "enum_products_grade" RENAME TO "enum_products_condition";
    DROP TYPE IF EXISTS "enum_products_condition";
    DROP TYPE IF EXISTS "enum_products_availability";

    ALTER TABLE "products" RENAME COLUMN "image_link" TO "image_url";
    ALTER TABLE "products" RENAME COLUMN "sale_price" TO "compare_at_price";
    ALTER TABLE "products" RENAME COLUMN "cost_of_goods_sold" TO "price";
    ALTER TABLE "products" RENAME COLUMN "price" TO "store_price";
  `)
}
