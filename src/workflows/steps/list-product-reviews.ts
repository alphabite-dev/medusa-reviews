import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { RemoteQueryFunctionReturnPagination } from "@medusajs/framework/types";
import { Review } from "../../api/store/reviews/types";
import { sanitizeReview } from "../../utils/utils";

export interface ListProductReviewsStepInput {
  fields: string[];
  filters: Record<string, unknown>;
  queryConfig: Record<string, unknown>;
}

export interface ListProductReviewsStepOutput {
  reviews: Review[];
  metadata?: RemoteQueryFunctionReturnPagination;
}

export const listProductReviewsStep = createStep(
  "list-product-reviews",
  async (input: ListProductReviewsStepInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const { data: reviews, metadata } = await query.graph({
      entity: "review",
      ...input.queryConfig,
      fields: input.fields,
      filters: input.filters,
    });

    return new StepResponse<ListProductReviewsStepOutput>({
      reviews: reviews.map(sanitizeReview) as Review[],
      metadata,
    });
  }
);
