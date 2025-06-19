import { model } from "@medusajs/framework/utils";

const Review = model
  .define("review", {
    id: model.id({ prefix: "rev" }).primaryKey(),
    title: model.text().nullable(),
    content: model.text().nullable(),
    rating: model.float(),
    status: model.enum(["pending", "approved", "rejected"]).default("pending"),
    product_id: model.text().index("IDX_REVIEW_PRODUCT_ID"),
    customer_id: model.text().nullable(),
    image_urls: model.array().default([]),
    is_verified_purchase: model.boolean().default(false),
  })
  .checks([
    {
      name: "rating_range",
      expression: (columns) =>
        `${columns.rating} >= 1 AND ${columns.rating} <= 5`,
    },
  ])
  .indexes([
    {
      on: ["product_id", "customer_id"],
    },
  ]);

export default Review;
