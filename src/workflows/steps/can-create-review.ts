import { MedusaError } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import ReviewModuleService from "../../modules/review/service";
import { REVIEW_MODULE } from "../../modules/review";

export interface CanCreateReviewStepInput {
  is_verified_purchase: boolean;
  product_id: string;
  customer_id: string;
}

export const canCreateReviewStep = createStep(
  "can-create-review",
  async (input: CanCreateReviewStepInput, { container }) => {
    const reviewModuleService =
      container.resolve<ReviewModuleService>(REVIEW_MODULE);

    // Editable settings (review_settings singleton) take precedence; they fall
    // back to the plugin's configured `_options` until an admin saves settings.
    const settings = await reviewModuleService.getSettings();

    if (!input.is_verified_purchase && settings.allow_only_verified_purchases) {
      throw new MedusaError(
        MedusaError.Types.UNAUTHORIZED,
        "You can only review products you have purchased."
      );
    }

    if (!settings.allow_multiple_reviews_per_product) {
      const existingReview = await reviewModuleService.listReviews({
        product_id: input.product_id,
        customer_id: input.customer_id,
        status: "approved",
      });

      if (existingReview?.length > 0) {
        throw new MedusaError(
          MedusaError.Types.UNAUTHORIZED,
          "You have already submitted a review for this product."
        );
      }
    }
    return new StepResponse(true);
  }
);
