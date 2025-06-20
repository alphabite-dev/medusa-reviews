import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { AggregateCounts, PaginatedOutput, Review } from "../../types";
import ReviewModuleService from "../../../../../modules/review/service";
import { REVIEW_MODULE } from "../../../../../modules/review";
import {
  getPagination,
  reviewProductDefaultFields,
} from "../../../../../utils/utils";
import { ListProductReviewsQuery } from "./validators";

export interface ListProductReviewsOutput
  extends PaginatedOutput<Omit<Review, "product">>,
    AggregateCounts {}

export const GET = async (
  req: AuthenticatedMedusaRequest<any, ListProductReviewsQuery>,
  res: MedusaResponse<ListProductReviewsOutput>
) => {
  const {
    fields: extra_fields,
    include_product,
    my_reviews_only,
    rating,
    verified_purchase_only,
    limit,
    offset,
    order,
    sort_by,
  } = req.validatedQuery;

  const product_id = req.params.id;
  const customer_id = req.auth_context?.actor_id;

  const reviewModuleService =
    req.scope.resolve<ReviewModuleService>(REVIEW_MODULE);

  try {
    const query = req.scope.resolve("query");
    const { data: reviews, metadata } = await query.graph({
      entity: "review",
      fields: [
        "*",
        ...(extra_fields ? [extra_fields] : []),
        ...(include_product ? reviewProductDefaultFields : []),
        ...req.queryConfig.fields,
      ],
      filters: {
        product_id,
        ...(verified_purchase_only && { is_verified_purchase: true }),
        ...(my_reviews_only && customer_id && { customer_id }),
        ...(rating && { rating }),
      },
      pagination: {
        order: {
          ...(sort_by && { [sort_by]: order || "asc" }),
        },
        skip: offset,
        take: limit,
      },
    });

    const { product_id: id, ...rating_results } =
      await reviewModuleService.getRatingAggregate(product_id);

    return res.status(200).json({
      data: reviews,
      take: metadata?.take || 5,
      skip: metadata?.skip || 0,
      ...getPagination(metadata!),
      ...rating_results,
    });
  } catch (error) {
    console.log("Error fetching reviews:", error);

    return res.status(500).end();
  }
};
