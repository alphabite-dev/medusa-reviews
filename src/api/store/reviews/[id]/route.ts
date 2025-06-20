import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { MedusaError } from "@medusajs/framework/utils";
import { REVIEW_MODULE } from "../../../../modules/review";
import ReviewModuleService from "../../../../modules/review/service";

export interface DeleteReviewOutput {
  id: string;
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<DeleteReviewOutput>
) => {
  const review_id = req.params.id;
  const customer_id = req?.auth_context?.actor_id;

  console.log("Customer ID:", customer_id);

  if (!customer_id) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Authorization required to delete a review"
    );
  }

  const reviewModuleService =
    req.scope.resolve<ReviewModuleService>(REVIEW_MODULE);

  try {
    const query = req.scope.resolve("query");
    const review = await query.graph({
      entity: "review",
      filters: { id: review_id },
      fields: ["id", "customer_id"],
    });

    if (review[0] && review[0].customer_id !== customer_id) {
      throw new MedusaError(
        MedusaError.Types.UNAUTHORIZED,
        "You are not authorized to delete this review"
      );
    }

    await reviewModuleService.deleteReviews(review_id);

    return res.status(200).json({ id: review_id });
  } catch (error) {
    console.log("Error deleting review:", error);

    return res.status(500).end();
  }
};
