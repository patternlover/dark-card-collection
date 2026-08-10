import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "enum_purchases_status" AS ENUM('received', 'pending', 'archived');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    CREATE TABLE IF NOT EXISTS "purchases" (
      "id" serial PRIMARY KEY,
      "title" varchar NOT NULL,
      "cost_of_goods_sold" numeric NOT NULL,
      "quantity" numeric NOT NULL DEFAULT 1,
      "store" varchar,
      "purchase_date" timestamp(3) with time zone,
      "notes" varchar,
      "linked_product_id" integer REFERENCES "products"("id") ON DELETE SET NULL,
      "status" "enum_purchases_status" DEFAULT 'received',
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS "purchases_linked_product_idx" ON "purchases" ("linked_product_id");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "purchases";
    DROP TYPE IF EXISTS "enum_purchases_status";
  `)
}
