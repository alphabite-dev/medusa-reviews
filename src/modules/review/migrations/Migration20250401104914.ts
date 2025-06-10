import { Migration } from '@mikro-orm/migrations';

export class Migration20250401104914 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "review" add column if not exists "image_urls" text[] not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "review" drop column if exists "image_urls";`);
  }

}
