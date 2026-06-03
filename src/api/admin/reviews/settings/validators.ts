import { z } from "@medusajs/framework/zod";

export const UpdateReviewSettingsSchema = z.object({
  allow_only_verified_purchases: z.boolean().optional(),
  allow_multiple_reviews_per_product: z.boolean().optional(),
});

export type UpdateReviewSettingsInput = z.infer<
  typeof UpdateReviewSettingsSchema
>;
