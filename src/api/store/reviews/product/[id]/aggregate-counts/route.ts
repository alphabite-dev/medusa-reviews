import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { AggregateCounts } from "../../../types";
import ReviewModuleService from "../../../../../../modules/review/service";
import { REVIEW_MODULE } from "../../../../../../modules/review";

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse<AggregateCounts>
) => {
  const product_id = req.params.id;
  const reviewModuleService =
    req.scope.resolve<ReviewModuleService>(REVIEW_MODULE);

  try {
    const average_count = await reviewModuleService.getRatingAggregate(
      product_id
    );

    return res.status(200).json(average_count);
  } catch (error) {
    console.log("Error aggregating review counts:", error);

    return res.status(500).end();
  }
};
