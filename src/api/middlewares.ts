import {
  defineMiddlewares,
  authenticate,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http";
import { GetAdminReviewsSchema } from "./admin/reviews/route";
import { PostAdminUpdateReviewsStatusSchema } from "./admin/reviews/status/route";
import { CreateReviewInputSchema } from "./store/reviews/validators";
import { ListReviewsQuerySchema } from "./store/products/reviews/validators";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";
import { ListProductReviewsQuerySchema } from "./store/reviews/product/[id]/validators";

export default defineMiddlewares({
  routes: [
    //----Create review-----//
    {
      matcher: "/store/reviews",
      method: ["POST"],
      bodyParser: { sizeLimit: "10mb" },
      middlewares: [
        authenticate("customer", ["session", "bearer"]),
        validateAndTransformBody(CreateReviewInputSchema),
      ],
    },
    //----List  reviews-----//
    {
      matcher: "/store/products/reviews",
      method: ["GET"],
      middlewares: [
        authenticate("customer", ["bearer"], {
          allowUnauthenticated: true,
          allowUnregistered: true,
        }),
        validateAndTransformQuery(
          createFindParams().extend(ListReviewsQuerySchema.shape),
          {
            defaults: ["customer.first_name", "customer.last_name"],
            isList: true,
          }
        ),
      ],
    },
    //----List product reviews-----//
    {
      matcher: "/store/reviews/product/:id",
      method: ["GET"],
      middlewares: [
        authenticate("customer", ["bearer"], {
          allowUnauthenticated: true,
          allowUnregistered: true,
        }),
        validateAndTransformQuery(
          createFindParams().extend(ListProductReviewsQuerySchema.shape),
          {
            defaults: ["customer.first_name", "customer.last_name"],
            isList: true,
          }
        ),
      ],
    },
    //----Get Aggregate counts of product reviews-----//
    {
      matcher: "/store/reviews/product/:id/aggregate-counts",
      method: ["GET"],
    },
    //----Delete product review-----//
    {
      matcher: "/store/reviews/:id",
      method: ["DELETE"],
      middlewares: [authenticate("customer", ["bearer"])],
    },
    //----Admin get reviews-----//
    {
      matcher: "/admin/reviews",
      method: ["GET"],
      middlewares: [
        validateAndTransformQuery(GetAdminReviewsSchema, {
          isList: true,
          defaults: [
            "id",
            "title",
            "content",
            "rating",
            "product_id",
            "customer_id",
            "status",
            "created_at",
            "updated_at",
            "product.*",
          ],
        }),
      ],
    },
    //----Admin change reviews status-----//
    {
      matcher: "/admin/reviews/status",
      method: ["POST"],
      middlewares: [
        validateAndTransformBody(PostAdminUpdateReviewsStatusSchema),
      ],
    },
  ],
});
