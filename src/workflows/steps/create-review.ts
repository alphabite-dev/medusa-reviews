import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { REVIEW_MODULE } from "../../modules/review";
import ReviewModuleService, {
  PluginType,
  ReviewsPluginType,
} from "../../modules/review/service";
import { CreateReviewInput } from "../../api/store/reviews/validators";
import { MedusaError } from "@medusajs/framework/utils";

export interface CreateReviewStepInput extends CreateReviewInput {
  is_verified_purchase: boolean;
  customer_id: string;
}

export const createReviewStep = createStep(
  "create-review",
  async (input: CreateReviewStepInput, { container }) => {
    const reviewModuleService: ReviewModuleService =
      container.resolve(REVIEW_MODULE);

    const review = await reviewModuleService.createReviews({
      ...input,
      status: "pending",
    });
    return new StepResponse(review, review.id);
  },
  async (reviewId, { container }) => {
    if (!reviewId) return;
    const reviewModuleService: ReviewModuleService =
      container.resolve(REVIEW_MODULE);
    await reviewModuleService.deleteReviews(reviewId);
  }
);
