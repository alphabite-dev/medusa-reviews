import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { checkOrderedProductStep } from "./steps/check-ordered-product";
import { createReviewStep } from "./steps/create-review";
import { CreateReviewInput } from "../api/store/reviews/validators";
import { canCreateReviewStep } from "./steps/can-create-review";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import { CustomerDTO } from "@medusajs/framework/types";
import { Review } from "../modules/review/models/review";

export interface CreateReviewWorkflowInput extends CreateReviewInput {
  customer_id: string;
}

export interface CreateReviewWorkflowOutput {
  created_review: Review;
  customer: Pick<CustomerDTO, "first_name" | "last_name">;
}

export const createReviewWorkflow = createWorkflow(
  "create-review",
  (input: CreateReviewWorkflowInput) => {
    const { data } = useQueryGraphStep<"customer">({
      entity: "customer",
      fields: ["first_name", "last_name"],
      filters: { id: input.customer_id },
      options: {
        throwIfKeyNotFound: true,
      },
    });

    const customer = data[0] as CreateReviewWorkflowOutput["customer"];

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

    return new WorkflowResponse<CreateReviewWorkflowOutput>({
      created_review,
      customer,
    });
  }
);
