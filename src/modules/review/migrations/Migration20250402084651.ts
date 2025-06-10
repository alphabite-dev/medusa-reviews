import { Migration } from '@mikro-orm/migrations';

export class Migration20250402084651 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "review" drop constraint if exists "review_product_id_customer_id_unique";`);
    this.addSql(`alter table if exists "review" alter column "image_urls" type text[] using ("image_urls"::text[]);`);
    this.addSql(`alter table if exists "review" alter column "image_urls" set default '{}';`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_review_product_id_customer_id_unique" ON "review" (product_id, customer_id) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_review_product_id_customer_id_unique";`);

    this.addSql(`alter table if exists "review" alter column "image_urls" drop default;`);
    this.addSql(`alter table if exists "review" alter column "image_urls" type text[] using ("image_urls"::text[]);`);
  }

}
