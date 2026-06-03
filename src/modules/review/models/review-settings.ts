// medusa-source/reviews/src/modules/review/models/review-settings.ts
import { model } from "@medusajs/framework/utils";
import { InferTypeOf } from "@medusajs/framework/types";

export const ReviewSettings = model.define("review_settings", {
  id: model.id({ prefix: "revs" }).primaryKey(),
  allow_only_verified_purchases: model.boolean().default(false),
  allow_multiple_reviews_per_product: model.boolean().default(false),
});

export type ReviewSettingsType = InferTypeOf<typeof ReviewSettings>;
