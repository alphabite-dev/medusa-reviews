import { z } from "zod";
import { ListReviewsQuerySchema } from "../../../products/reviews/validators";

export const ListProductReviewsQuerySchema = ListReviewsQuerySchema.omit({
  product_ids: true,
});

export type ListProductReviewsQuery = z.infer<
  typeof ListProductReviewsQuerySchema
>;
