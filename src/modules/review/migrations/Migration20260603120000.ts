import { Migration } from "@mikro-orm/migrations";

export class Migration20260603120000 extends Migration {
  async up(): Promise<void> {
    // Additive only: creates the singleton settings table. No row is seeded so
    // that the plugin's configured `_options` remain in effect until an admin
    // edits settings (see ReviewModuleService.getSettings / updateSettings).
    this.addSql(
      `create table if not exists "review_settings" (
        "id" text not null,
        "allow_only_verified_purchases" boolean not null default false,
        "allow_multiple_reviews_per_product" boolean not null default false,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "review_settings_pkey" primary key ("id")
      );`,
    );
  }

  async down(): Promise<void> {
    this.addSql(`drop table if exists "review_settings" cascade;`);
  }
}
