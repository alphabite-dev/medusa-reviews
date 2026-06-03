import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { REVIEW_MODULE } from "../../../../modules/review";
import ReviewModuleService from "../../../../modules/review/service";
import { ReviewAnalyticsQuerySchema } from "./validators";
import type { ReviewAnalyticsResponse } from "./types";

type ProductRow = { id: string; title: string; thumbnail: string | null };

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const service = req.scope.resolve<ReviewModuleService>(REVIEW_MODULE);

  const parsed = ReviewAnalyticsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid analytics query",
      issues: parsed.error.flatten(),
    });
  }

  try {
    const view = await service.getAnalytics(parsed.data);

    const productIds = view.top_products.map((p) => p.product_id);

    const products = productIds.length
      ? await query.graph({
          entity: "product",
          fields: ["id", "title", "thumbnail"],
          filters: { id: productIds },
        })
      : { data: [] };

    const productMap = new Map(
      (products.data as ProductRow[]).map((p) => [p.id, p]),
    );

    const response: ReviewAnalyticsResponse = {
      ...view,
      top_products: view.top_products.map((p) => {
        const product = productMap.get(p.product_id);

        return {
          ...p,
          title: product?.title ?? p.product_id,
          thumbnail: product?.thumbnail ?? null,
        };
      }),
    };

    return res.status(200).json(response);
  } catch (error) {
    logger.error("[admin/reviews/analytics] GET error:", error);
    return res.status(500).json({
      error: "Failed to load review analytics",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
