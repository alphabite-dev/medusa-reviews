import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import ReviewModuleService from "../../../../modules/review/service";
import { REVIEW_MODULE } from "../../../../modules/review";
import { MedusaError, MedusaErrorTypes } from "@medusajs/framework/utils";

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const productIdsString = req.query.product_ids as string;

  if (!productIdsString) {
    throw new MedusaError(
      MedusaErrorTypes.INVALID_DATA,
      "product_ids query parameter is required"
    );
  }

  const reviewModuleService: ReviewModuleService =
    req.scope.resolve(REVIEW_MODULE);

  const product_ids = productIdsString.includes(",")
    ? productIdsString.split(",")
    : [productIdsString];

  const response = await reviewModuleService.getRatingCountAndAverage(
    product_ids
  );

  const result = response.reduce((acc, item) => {
    acc[item.product_id] = {
      average_rating: item.average,
      reviews_count: item.count,
    };
    return acc;
  }, {} as Record<string, { average_rating: number; reviews_count: number }>);

  res.json(result);
};
