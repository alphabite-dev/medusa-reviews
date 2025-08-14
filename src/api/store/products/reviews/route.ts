import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ListReviewsQuery } from "./validators";
import { PaginatedOutput, Review } from "../../reviews/types";
import {
  getPagination,
  reviewProductDefaultFields,
} from "../../../../utils/utils";
import ReviewModuleService from "../../../../modules/review/service";
import { REVIEW_MODULE } from "../../../../modules/review";

export const GET = async (
  req: AuthenticatedMedusaRequest<any, ListReviewsQuery>,
  res: MedusaResponse<PaginatedOutput<Review>>
) => {
  const {
    fields,
    include_product,
    my_reviews_only,
    product_ids,
    rating,
    verified_purchase_only,
  } = req.validatedQuery;

  const customer_id = req.auth_context?.actor_id;

  const reviewModuleService =
    req.scope.resolve<ReviewModuleService>(REVIEW_MODULE);

  try {
    const query = req.scope.resolve("query");
    const { data: reviews, metadata } = await query.graph({
      entity: "review",
      ...req.queryConfig.fields,
      fields: [
        "*",
        ...(fields || []),
        ...(include_product ? reviewProductDefaultFields : []),
      ],
      filters: {
        ...((product_ids?.length || 0) > 0 && { product_id: product_ids }),
        ...(verified_purchase_only && { is_verified_purchase: true }),
        ...(my_reviews_only && customer_id && { customer_id }),
        ...(rating && { rating }),
      },
    });

    if (!include_product) {
      return res.status(200).json({
        data: reviews,
        ...getPagination(metadata),
      });
    }

    const unique_product_ids = [...new Set(reviews.map((r) => r.product_id))];

    const aggregate_rating_results = await Promise.all(
      unique_product_ids.map((id) => reviewModuleService.getRatingAggregate(id))
    );

    const ratings_map = new Map(
      aggregate_rating_results.map((result) => [result.product_id, result])
    );

    const enriched_reviews = reviews.map((review) => {
      const { product_id, ...aggregatedCount } =
        ratings_map.get(review.product_id) || {};

      return {
        ...review,
        product: {
          ...review.product,
          ...aggregatedCount,
        },
      };
    });

    return res.status(200).json({
      data: enriched_reviews,
      ...getPagination(metadata!),
    });
  } catch (error) {
    console.log("Error fetching reviews:", error);

    return res.status(500).end();
  }
};
