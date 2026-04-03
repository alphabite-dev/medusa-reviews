import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { REVIEW_MODULE } from "../../modules/review";
import ReviewModuleService from "../../modules/review/service";
import { AggregateCounts } from "../../api/store/reviews/types";

export interface GetAggregateCountsStepInput {
  product_id: string;
}

export const getAggregateCountsStep = createStep(
  "get-aggregate-counts",
  async (input: GetAggregateCountsStepInput, { container }) => {
    const reviewModuleService: ReviewModuleService =
      container.resolve(REVIEW_MODULE);

    const aggregate_counts: AggregateCounts =
      await reviewModuleService.getRatingAggregate(input.product_id);

    return new StepResponse(aggregate_counts);
  }
);
