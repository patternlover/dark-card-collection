import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" ADD COLUMN "is_preorder" boolean DEFAULT false;
  ALTER TABLE "media" ADD COLUMN "sizes_card_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_card_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_card_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_card_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_card_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_card_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_pdp_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_pdp_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_pdp_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_pdp_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_pdp_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_pdp_filename" varchar;
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_pdp_sizes_pdp_filename_idx" ON "media" USING btree ("sizes_pdp_filename");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "media_sizes_card_sizes_card_filename_idx";
  DROP INDEX "media_sizes_pdp_sizes_pdp_filename_idx";
  ALTER TABLE "products" DROP COLUMN "is_preorder";
  ALTER TABLE "media" DROP COLUMN "sizes_card_url";
  ALTER TABLE "media" DROP COLUMN "sizes_card_width";
  ALTER TABLE "media" DROP COLUMN "sizes_card_height";
  ALTER TABLE "media" DROP COLUMN "sizes_card_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_card_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_card_filename";
  ALTER TABLE "media" DROP COLUMN "sizes_pdp_url";
  ALTER TABLE "media" DROP COLUMN "sizes_pdp_width";
  ALTER TABLE "media" DROP COLUMN "sizes_pdp_height";
  ALTER TABLE "media" DROP COLUMN "sizes_pdp_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_pdp_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_pdp_filename";`)
}
