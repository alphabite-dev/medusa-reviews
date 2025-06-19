import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ListReviewsQuery } from "./validators";
import { PaginatedOutput, Review } from "../../reviews/types";
import { getPagination } from "../../../../utils/utils";

export const GET = async (
  req: AuthenticatedMedusaRequest<any, ListReviewsQuery>,
  res: MedusaResponse<PaginatedOutput<Review>>
) => {
  const {
    fields: extra_fields,
    include_product,
    my_reviews_only,
    product_ids,
    rating,
    verified_purchase_only,
    limit,
    offset,
    order,
  } = req.validatedQuery;

  const customer_id = req.auth_context?.actor_id;
  const query = req.scope.resolve("query");

  try {
    const { data: reviews, metadata } = await query.graph({
      entity: "review",
      fields: [
        "*",
        "product.*",
        "customer.*",
        ...(extra_fields ? [extra_fields] : []),
        ...(include_product ? ["product"] : []),
      ],
      filters: {
        ...(product_ids &&
          product_ids.length > 0 && { product_id: product_ids }),
        ...(verified_purchase_only && { is_verified_purchase: true }),
        ...(my_reviews_only && customer_id && { customer_id }),
        ...(rating && { rating }),
      },
      pagination: {
        order: {},
        skip: offset,
        take: limit,
      },
    });

    return res.status(200).json({
      data: reviews,
      take: metadata?.take || 5,
      skip: metadata?.skip || 0,
      ...getPagination(metadata!),
    });
  } catch (error) {
    console.log("Error fetching reviews:", error);

    return res.status(500).end();
  }
};
