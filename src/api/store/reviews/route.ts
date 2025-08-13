import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { CreateReviewInput } from "./validators";
import { Review } from "./types";

import { createReviewWorkflow } from "../../../workflows/create-review";

//-----Create Review-----//

export const POST = async (
  req: AuthenticatedMedusaRequest<CreateReviewInput>,
  res: MedusaResponse<Review>
) => {
  const logger = req.scope.resolve("logger");
  const customer_id = req.auth_context?.actor_id;

  try {
    const { result } = await createReviewWorkflow(req.scope).run({
      input: {
        ...req.validatedBody,
        customer_id,
      },
    });

    const { created_review, customer } = result;

    return res.status(201).json({
      ...created_review,
      customer,
    });
  } catch (error) {
    logger.error("Error creating review:", error);

    return res.status(500).end();
  }
};
