import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { REVIEW_MODULE } from "../../../../modules/review";
import ReviewModuleService from "../../../../modules/review/service";
import { UpdateReviewSettingsSchema } from "./validators";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  const service = req.scope.resolve<ReviewModuleService>(REVIEW_MODULE);

  try {
    const view = await service.getSettings();
    return res.status(200).json(view);
  } catch (error) {
    logger.error("[admin/reviews/settings] GET error:", error);
    return res.status(500).json({
      error: "Failed to load review settings",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  const service = req.scope.resolve<ReviewModuleService>(REVIEW_MODULE);

  const parsed = UpdateReviewSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid review settings payload",
      issues: parsed.error.flatten(),
    });
  }

  try {
    const view = await service.updateSettings(parsed.data);
    return res.status(200).json(view);
  } catch (error) {
    logger.error("[admin/reviews/settings] PUT error:", error);
    return res.status(500).json({
      error: "Failed to update review settings",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
