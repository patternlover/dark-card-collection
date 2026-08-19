import { MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Aggiunge campo sale_date alla collection orders (data di vendita reale inserita nel modale).

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "sale_date" varchar;
    EXCEPTION WHEN duplicate_column THEN NULL; END $$;
  `)
}

export async function down({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "orders" DROP COLUMN IF EXISTS "sale_date";
  `)
}
