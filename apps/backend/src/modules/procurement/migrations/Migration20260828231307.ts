import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260828231307 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "purchase_lot" ("id" text not null, "purchase_date" timestamptz not null, "source_type" text check ("source_type" in ('newsstand', 'supermarket', 'shop', 'online', 'private', 'other')) not null, "source_name" text null, "extra_costs" real not null default 0, "notes" text null, "receipt_url" text null, "total_cost" real not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "purchase_lot_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_purchase_lot_deleted_at" ON "purchase_lot" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "purchase_line" ("id" text not null, "lot_id" text not null, "variant_id" text not null, "variant_title" text null, "variant_sku" text null, "quantity" integer not null, "unit_cost" real not null, "effective_unit_cost" real not null, "remaining_quantity" integer not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "purchase_line_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_purchase_line_lot_id" ON "purchase_line" ("lot_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_purchase_line_variant_id" ON "purchase_line" ("variant_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_purchase_line_deleted_at" ON "purchase_line" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "purchase_line" add constraint "purchase_line_lot_id_foreign" foreign key ("lot_id") references "purchase_lot" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "purchase_line" drop constraint if exists "purchase_line_lot_id_foreign";`);

    this.addSql(`drop table if exists "purchase_lot" cascade;`);

    this.addSql(`drop table if exists "purchase_line" cascade;`);
  }

}
