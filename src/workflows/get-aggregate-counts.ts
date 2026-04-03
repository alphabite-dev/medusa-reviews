import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  getAggregateCountsStep,
  GetAggregateCountsStepInput,
} from "./steps/get-aggregate-counts";
import { AggregateCounts } from "../api/store/reviews/types";

export const getAggregateCountsWorkflow = createWorkflow(
  "get-aggregate-counts",
  function (input: GetAggregateCountsStepInput) {
    const aggregate_counts = getAggregateCountsStep(input);

    return new WorkflowResponse<AggregateCounts>(aggregate_counts);
  }
);
