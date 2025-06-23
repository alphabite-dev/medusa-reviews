// src/workflows/create-review.ts
import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { fetchCustomerStep } from "./steps/fetch-customer";
import { fetchOrdersStep } from "./steps/fetch-orders";
import { checkOrderedProductStep } from "./steps/check-ordered-product";
import { createReviewStep } from "./steps/create-review";
import { CreateReviewInput } from "../api/store/reviews/validators";
import { Review } from "../api/store/reviews/types";

export interface CreateReviewWorkflowInput extends CreateReviewInput {
  customer_id: string;
}

export const createReviewWorkflow = createWorkflow(
  "create-review",
  (input: CreateReviewWorkflowInput) => {
    //----Get customer first & last name
    const customer = fetchCustomerStep({ customer_id: input.customer_id });

    //----Get orders for the customer
    const orders = fetchOrdersStep({ customer_id: input.customer_id });

    //----Check if the customer has ordered the product
    const hasOrderedProduct = checkOrderedProductStep({
      orders,
      product_id: input.product_id,
    });
    //----Create the review
    const created_review = createReviewStep({
      is_verified_purchase: hasOrderedProduct.valueOf(),
      ...input,
    });

    return new WorkflowResponse({ created_review, customer });
  }
);
