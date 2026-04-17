import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { AggregateCounts } from "../../../types";
import { getAggregateCountsWorkflow } from "../../../../../../workflows/get-aggregate-counts";

export const GET = async (req: MedusaRequest, res: MedusaResponse<AggregateCounts>) => {
  const { result } = await getAggregateCountsWorkflow(req.scope).run({
    input: { product_id: req.params.id },
  });

  return res.status(200).json(result);
};
