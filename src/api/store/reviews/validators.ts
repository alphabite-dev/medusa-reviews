import { z } from "zod";

export const CreateReviewInputSchema = z.object({
  content: z.string(),
  rating: z.preprocess((val) => {
    if (val && typeof val === "string") {
      return parseInt(val);
    }
    return val;
  }, z.number().min(1).max(5)),
  product_id: z.string(),
  image_base64s: z.array(z.string()).default([]),
  title: z.string().optional(),
});

export type CreateReviewInput = z.infer<typeof CreateReviewInputSchema>;
