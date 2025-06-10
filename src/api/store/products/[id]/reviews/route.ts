import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { PRODUCT_REVIEW_MODULE } from "../../../../../modules/review";
import ProductReviewModuleService from "../../../../../modules/review/service";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";

export const GetStoreReviewsSchema = createFindParams();

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params;

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const reviewModuleService: ProductReviewModuleService = req.scope.resolve(
    PRODUCT_REVIEW_MODULE
  );

  // Get reviews for product
  const {
    data: reviews,
    metadata: { count, take, skip } = { count: 0, take: 10, skip: 0 },
  } = await query.graph({
    entity: "review",
    filters: {
      product_id: id,
      status: "approved" as any,
    },
    ...req.queryConfig,
    fields: [
      "id",
      "rating",
      "title",
      "first_name",
      "last_name",
      "content",
      "created_at",
      "image_urls",
    ],
    pagination: {
      ...req.queryConfig.pagination,
      order: { created_at: "desc" },
    },
  });

  const totalPages = Math.ceil(count / take);

  res.json({
    reviews,
    count,
    limit: take,
    offset: skip,
    rating_aggregate: await reviewModuleService.getRatingAggregate(id),
    total_pages: totalPages === 0 ? 1 : totalPages,
  });
};
