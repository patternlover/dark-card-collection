import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Gerarchia stile Google: sostituisce il campo singolo `item_category` con
// `item_category_1` (card|product) + `item_category_2` (spc/box/bundle/etb/tin/
// single/slab/other) + `item_category_3` (text opzionale).
//
// - rename colonna `products.item_category` -> `item_category_1`
// - rename enum `enum_products_item_category` -> `enum_products_item_category_1`
// - nuove colonne `item_category_2` (nuovo enum) e `item_category_3` (text)
// Idempotente: su DB già allineati (push/fresh) è un no-op.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- enum item_category_1 (rename)
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_products_item_category')
         AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_products_item_category_1') THEN
        ALTER TYPE "enum_products_item_category" RENAME TO "enum_products_item_category_1";
      END IF;
    END $$;

    -- colonna item_category_1 (rename)
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'item_category')
         AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'item_category_1') THEN
        ALTER TABLE "products" RENAME COLUMN "item_category" TO "item_category_1";
      END IF;
    END $$;

    -- enum item_category_2
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_products_item_category_2') THEN
        CREATE TYPE "enum_products_item_category_2" AS ENUM
          ('spc', 'box', 'bundle', 'etb', 'tin', 'single', 'slab', 'other');
      END IF;
    END $$;

    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "item_category_2" "enum_products_item_category_2";
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "item_category_3" varchar;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" DROP COLUMN IF EXISTS "item_category_3";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "item_category_2";

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_products_item_category_2') THEN
        DROP TYPE "enum_products_item_category_2";
      END IF;
    END $$;

    -- colonna item_category (rename back)
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'item_category_1')
         AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'item_category') THEN
        ALTER TABLE "products" RENAME COLUMN "item_category_1" TO "item_category";
      END IF;
    END $$;

    -- enum item_category (rename back)
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_products_item_category_1')
         AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_products_item_category') THEN
        ALTER TYPE "enum_products_item_category_1" RENAME TO "enum_products_item_category";
      END IF;
    END $$;
  `)
}
