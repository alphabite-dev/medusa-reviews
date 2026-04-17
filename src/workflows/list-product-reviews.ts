import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { RemoteQueryFunctionReturnPagination } from "@medusajs/framework/types";
import {
  listProductReviewsStep,
  ListProductReviewsStepInput,
} from "./steps/list-product-reviews";
import {
  getAggregateCountsStep,
} from "./steps/get-aggregate-counts";
import { AggregateCounts, Review } from "../api/store/reviews/types";

export interface ListProductReviewsWorkflowInput extends ListProductReviewsStepInput {
  product_id: string;
  include_aggregated_counts?: boolean;
}

export interface ListProductReviewsWorkflowOutput extends Partial<Omit<AggregateCounts, "product_id">> {
  reviews: Review[];
  metadata?: RemoteQueryFunctionReturnPagination;
}

export const listProductReviewsWorkflow = createWorkflow(
  "list-product-reviews",
  function (input: ListProductReviewsWorkflowInput) {
    const { reviews, metadata } = listProductReviewsStep({
      fields: input.fields,
      filters: input.filters,
      queryConfig: input.queryConfig,
    });

    const aggregateCounts = when(
      { include_aggregated_counts: input.include_aggregated_counts },
      (data) => !!data.include_aggregated_counts
    ).then(() => {
      return getAggregateCountsStep({
        product_id: input.product_id,
      });
    });

    const result = transform(
      { reviews, metadata, aggregateCounts },
      (data): ListProductReviewsWorkflowOutput => {
        const { product_id: _, ...aggregateWithoutProductId } =
          data.aggregateCounts || {};

        return {
          reviews: data.reviews,
          metadata: data.metadata,
          ...(data.aggregateCounts ? aggregateWithoutProductId : {}),
        };
      }
    );

    return new WorkflowResponse<ListProductReviewsWorkflowOutput>(result);
  }
);
