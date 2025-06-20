import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";
import { AggregateCounts, PaginatedOutput, Review } from "../../types";
import ReviewModuleService from "../../../../../modules/review/service";
import { REVIEW_MODULE } from "../../../../../modules/review";
import { getPagination, reviewProductDefaultFields } from "../../../../../utils/utils";
import { ListProductReviewsQuery } from "./validators";

export interface ListProductReviewsOutput extends PaginatedOutput<Omit<Review, "product">>, Partial<AggregateCounts> {}

export const GET = async (
  req: AuthenticatedMedusaRequest<any, ListProductReviewsQuery>,
  res: MedusaResponse<ListProductReviewsOutput>
) => {
  const logger = req.scope.resolve("logger");

  const { fields, include_product, my_reviews_only, rating, verified_purchase_only, include_aggregated_counts } =
    req.validatedQuery;

  const product_id = req.params.id;
  const customer_id = req?.auth_context?.actor_id;

  const reviewModuleService = req.scope.resolve<ReviewModuleService>(REVIEW_MODULE);

  try {
    const query = req.scope.resolve("query");
    const { data: reviews, metadata } = await query.graph({
      entity: "review",
      ...req.queryConfig,
      fields: [
        "*",
        ...(fields || []),
        ...(include_product ? reviewProductDefaultFields : []),
        ...req.queryConfig.fields,
      ],
      filters: {
        product_id,
        ...(verified_purchase_only && { is_verified_purchase: true }),
        ...(my_reviews_only && customer_id && { customer_id }),
        ...(rating && { rating }),
      },
    });

    if (include_aggregated_counts) {
      const { product_id: _, ...aggregate_counts_result } = await reviewModuleService.getRatingAggregate(product_id);

      return res.status(200).json({
        data: reviews,
        ...getPagination(metadata!),
        ...aggregate_counts_result,
      });
    }

    return res.status(200).json({
      data: reviews,
      ...getPagination(metadata!),
    });
  } catch (error) {
    logger.error("Error fetching reviews:", error);

    return res.status(500).end();
  }
};
