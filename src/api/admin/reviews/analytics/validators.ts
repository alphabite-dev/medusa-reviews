import { z } from "@medusajs/framework/zod";

export const ReviewAnalyticsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type ReviewAnalyticsQueryInput = z.infer<
  typeof ReviewAnalyticsQuerySchema
>;
