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

    const config = container.resolve("configModule");
    const { options } = config.plugins.find(
      (p: PluginType) => p.resolve === "@alphabite/medusa-reviews"
    ) as ReviewsPluginType;

    if (!input.is_verified_purchase && options?.allowOnlyVerifiedPurchases) {
      throw new MedusaError(
        MedusaError.Types.UNAUTHORIZED,
        "You can only review products you have purchased."
      );
    }

    if (!options?.allowMultipleReviewsPerProduct) {
      const existingReview = await reviewModuleService.listReviews(
        {},
        {
          filters: {
            product_id: input.product_id,
            customer_id: input.customer_id,
            status: "approved",
          },
        }
      );

      if (existingReview?.length > 0) {
        throw new MedusaError(
          MedusaError.Types.UNAUTHORIZED,
          "You have already submitted a review for this product."
        );
      }
    }

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
