import { z } from "zod";

export const ListReviewsQuerySchema = z.object({
  product_ids: z.preprocess((val) => {
    if (typeof val === "string") {
      return val.split(",");
    }
    return val;
  }, z.array(z.string()).optional()),
  my_reviews_only: z.coerce.boolean().optional(),
  verified_purchase_only: z.coerce.boolean().optional(),
  include_product: z.coerce.boolean().optional(),
  rating: z.preprocess(
    (val) => (val !== undefined ? Math.round(Number(val)) : undefined),
    z.number().min(1).max(5).optional()
  ),
  sort_by: z.string().optional(),
});

export type ListReviewsQuery = z.infer<typeof ListReviewsQuerySchema>;
