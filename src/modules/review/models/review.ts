import { model } from "@medusajs/framework/utils";
import { InferTypeOf } from "@medusajs/framework/types";

const Review = model
  .define("review", {
    id: model.id({ prefix: "rev" }).primaryKey(),
    title: model.text().nullable(),
    content: model.text().nullable(),
    rating: model.number(),
    status: model.enum(["pending", "approved", "rejected"]).default("pending"),
    product_id: model.text().index("IDX_REVIEW_PRODUCT_ID"),
    customer_id: model.text(),
    image_urls: model.array().default([]),
    is_verified_purchase: model.boolean().default(false),
  })
  .indexes([
    {
      on: ["product_id", "customer_id"],
    },
  ]);

export type Review = InferTypeOf<typeof Review>;

export default Review;
