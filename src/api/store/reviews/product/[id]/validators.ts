import { z } from "zod";
import { ListReviewsQuerySchema } from "../../../products/reviews/validators";

export const ListProductReviewsQuerySchema = ListReviewsQuerySchema.omit({
  product_ids: true,
}).extend({
  include_aggregated_counts: z.coerce.boolean().optional(),
});

export type ListProductReviewsQuery = z.infer<typeof ListProductReviewsQuerySchema>;
