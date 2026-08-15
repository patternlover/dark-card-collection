import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Semplificazione stato: via `status` (listed/hold/sold) e `is_preorder`.
// La disponibilità (availability) resta ed è calcolata automaticamente dalla
// quantità (hook beforeChange). Idempotente.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" DROP COLUMN IF EXISTS "is_preorder";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "status";

    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_products_status') THEN
        DROP TYPE "enum_products_status";
      END IF;
    END $$;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_products_status') THEN
        CREATE TYPE "enum_products_status" AS ENUM ('listed', 'hold', 'sold');
      END IF;
    END $$;

    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "status" "enum_products_status" DEFAULT 'listed';
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_preorder" boolean DEFAULT false;
  `)
}
