import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";
import { AggregateCounts, PaginatedOutput, Review } from "../../types";
import {
  getPagination,
  REVIEW_DEFAULT_FIELDS,
  reviewProductDefaultFields,
} from "../../../../../utils/utils";
import { ListProductReviewsQuery } from "./validators";
import { listProductReviewsWorkflow } from "../../../../../workflows/list-product-reviews";

export interface ListProductReviewsOutput extends PaginatedOutput<Omit<Review, "product">>, Partial<AggregateCounts> {}

export const GET = async (
  req: AuthenticatedMedusaRequest<any, ListProductReviewsQuery>,
  res: MedusaResponse<ListProductReviewsOutput>
) => {
  const { fields, include_product, my_reviews_only, rating, verified_purchase_only, include_aggregated_counts } =
    req.validatedQuery;

  const product_id = req.params.id;
  const customer_id = req?.auth_context?.actor_id;

  const { result } = await listProductReviewsWorkflow(req.scope).run({
    input: {
      product_id,
      include_aggregated_counts,
      fields: [
        ...REVIEW_DEFAULT_FIELDS,
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
      queryConfig: req.queryConfig,
    },
  });

  const { reviews, metadata, ...aggregateFields } = result;

  return res.status(200).json({
    data: reviews,
    ...getPagination(metadata!),
    ...aggregateFields,
  });
};
