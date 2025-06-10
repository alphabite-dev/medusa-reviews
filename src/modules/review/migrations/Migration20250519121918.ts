import { Migration } from '@mikro-orm/migrations';

export class Migration20250519121918 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "review" alter column "content" type text using ("content"::text);`);
    this.addSql(`alter table if exists "review" alter column "content" drop not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "review" alter column "content" type text using ("content"::text);`);
    this.addSql(`alter table if exists "review" alter column "content" set not null;`);
  }

}
