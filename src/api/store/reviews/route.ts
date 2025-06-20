import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { DIGITAL_OCEAN_STORAGE_MODULE } from "../../../modules/do-storage";
import DigitalOceanStorageModuleService from "../../../modules/do-storage/service";
import { CreateReviewInput } from "./validators";
import { Review } from "./types";
import ReviewModuleService, { PluginType, ReviewsPluginType } from "../../../modules/review/service";
import { REVIEW_MODULE } from "../../../modules/review";
import { MedusaError } from "@medusajs/framework/utils";

//-----Create Review-----//

export const POST = async (req: AuthenticatedMedusaRequest<CreateReviewInput>, res: MedusaResponse<Review>) => {
  const logger = req.scope.resolve("logger");
  const config = req.scope.resolve("configModule");

  const reviewsPluginOptions = config.plugins.find(
    (p: PluginType) => p.resolve === "@alphabite/medusa-reviews"
  ) as ReviewsPluginType;

  console.log(reviewsPluginOptions.options);

  const { image_base64s, ...input } = req.validatedBody;
  const customer_id = req.auth_context?.actor_id;

  const reviewModuleService = req.scope.resolve<ReviewModuleService>(REVIEW_MODULE);
  const options = reviewModuleService._options;

  try {
    const query = req.scope.resolve("query");

    const {
      data: [customer],
    } = await query.graph({
      entity: "customer",
      fields: ["first_name", "last_name"],
      filters: {
        id: customer_id,
      },
    });

    // console.log("Customer:", customer);

    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "customer_id", "items.product_id"],
      filters: {
        customer_id,
      },
    });

    const hasOrderedProduct = orders.some((order) => order.items.some((item) => item.product_id === input.product_id));

    // const uploadRes = input.image_base64s
    //   ? await storageModuleService.upload({
    //       base64s: input.image_base64s,
    //       productId: input.product_id,
    //     })
    //   : [];

    if (!hasOrderedProduct && options?.allowOnlyVerifiedPurchases) {
      throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "You can only review products you have purchased.");
    }

    if (!options?.allowMultipleReviewsPerProduct) {
      const existingReview = await reviewModuleService.listReviews(
        {},
        {
          filters: {
            product_id: input.product_id,
            customer_id,
            status: "approved",
          },
        }
      );

      if (existingReview?.length > 0) {
        throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "You have already submitted a review for this product.");
      }
    }

    const created_review = await reviewModuleService.createReviews({
      ...input,
      customer_id,
      is_verified_purchase: hasOrderedProduct,
      status: "pending",
      image_urls: [],
      // image_urls: uploadRes.map((res) => res.url),
    });

    return res.status(201).json({
      ...created_review,
      customer,
    });
  } catch (error) {
    logger.error("Error creating review:", error);

    return res.status(500).end();
  }
};
