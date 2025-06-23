// src/workflows/create-review.ts
import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { fetchCustomerStep } from "./steps/fetch-customer";
import { checkOrderedProductStep } from "./steps/check-ordered-product";
import { createReviewStep } from "./steps/create-review";
import { CreateReviewInput } from "../api/store/reviews/validators";
import { canCreateReviewStep } from "./steps/can-create-review";

export interface CreateReviewWorkflowInput extends CreateReviewInput {
  customer_id: string;
}

export const createReviewWorkflow = createWorkflow(
  "create-review",
  (input: CreateReviewWorkflowInput) => {
    const customer = fetchCustomerStep({ customer_id: input.customer_id });

    const is_verified_purchase = checkOrderedProductStep({
      customer_id: input.customer_id,
      product_id: input.product_id,
    }).valueOf();

    canCreateReviewStep({
      is_verified_purchase,
      customer_id: input.customer_id,
      product_id: input.product_id,
    });

    const created_review = createReviewStep({
      is_verified_purchase,
      ...input,
    });

    return new WorkflowResponse({ created_review, customer });
  }
);
