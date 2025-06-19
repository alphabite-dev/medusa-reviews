import {
  defineMiddlewares,
  authenticate,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http";
// import { PostStoreReviewSchema } from "./store/reviews/route";
import { GetAdminReviewsSchema } from "./admin/reviews/route";
import { PostAdminUpdateReviewsStatusSchema } from "./admin/reviews/status/route";
import { GetStoreReviewsSchema } from "./store/products/[id]/reviews/route";
import { CreateReviewInputSchema } from "./store/reviews/validators";
import { ListReviewsQuerySchema } from "./store/products/reviews/validators";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";

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
    //----List product reviews-----//
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
          { defaults: [], isList: true }
        ),
      ],
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
    //----Admin list product reviews -----//
    {
      matcher: "/store/products/:id/reviews",
      method: ["GET"],
      middlewares: [
        validateAndTransformQuery(GetStoreReviewsSchema, {
          isList: true,
          defaults: [
            "id",
            "rating",
            "title",
            "first_name",
            "last_name",
            "content",
            "created_at",
          ],
        }),
      ],
    },
  ],
});
