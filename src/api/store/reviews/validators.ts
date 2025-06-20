import { z } from "zod";

export const CreateReviewInputSchema = z.object({
  content: z.string(),
  rating: z.preprocess(
    (val) => (val !== undefined ? Math.round(Number(val)) : undefined),
    z.number().min(1).max(5)
  ),
  product_id: z.string(),
  image_urls: z.array(z.string()).default([]),
  title: z.string().optional(),
});

export type CreateReviewInput = z.infer<typeof CreateReviewInputSchema>;
