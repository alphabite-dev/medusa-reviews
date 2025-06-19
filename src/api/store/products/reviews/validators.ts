import { z } from "zod";

export const ListReviewsQuerySchema = z.object({
  product_ids: z.preprocess((val) => {
    if (typeof val === "string") {
      return val.split(",");
    }
    return val;
  }, z.array(z.string()).optional()),
  my_reviews_only: z.preprocess(
    (val) => val === "true",
    z.boolean().optional()
  ),
  verified_purchase_only: z.preprocess(
    (val) => val === "true",
    z.boolean().optional()
  ),
  rating: z.preprocess(
    (val) => (val !== undefined ? Number(val) : undefined),
    z.number().min(1).max(5).optional()
  ),
  include_product: z.preprocess(
    (val) => val === "true",
    z.boolean().optional()
  ),
});

export type ListReviewsQuery = z.infer<typeof ListReviewsQuerySchema>;
