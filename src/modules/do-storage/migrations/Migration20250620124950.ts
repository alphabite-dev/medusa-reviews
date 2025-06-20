import { Migration } from '@mikro-orm/migrations';

export class Migration20250620124950 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "do_file" ("id" text not null, "url" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "do_file_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_do_file_deleted_at" ON "do_file" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "do_file" cascade;`);
  }

}
