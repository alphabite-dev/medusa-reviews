import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { REVIEW_MODULE } from "../../modules/review";
import ReviewModuleService from "../../modules/review/service";

export type CreateReviewStepInput = {
  title?: string;
  content?: string;
  rating: number;
  id: string;
  customer_id?: string;
  first_name: string;
  last_name: string;
  status?: "pending" | "approved" | "rejected";
};

export const createReviewStep = createStep(
  "create-review",
  async (input: CreateReviewStepInput, { container }) => {
    const reviewModuleService: ReviewModuleService =
      container.resolve(REVIEW_MODULE);

    const review = await reviewModuleService.createReviews(input);

    return new StepResponse(review, review.id);
  },
  async (reviewId, { container }) => {
    if (!reviewId) {
      return;
    }

    const reviewModuleService: ReviewModuleService =
      container.resolve(REVIEW_MODULE);

    await reviewModuleService.deleteReviews(reviewId);
  }
);
