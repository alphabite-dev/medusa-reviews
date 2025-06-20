import { InjectManager, MedusaService, MedusaContext, MedusaError } from "@medusajs/framework/utils";
import Review, { Review as ReviewType } from "./models/review";
import { Context } from "@medusajs/framework/types";
import { EntityManager } from "@mikro-orm/knex";
import { AggregateCounts } from "../../api/store/reviews/types";
import { z } from "zod";

const optionsSchema = z.object({
  allowOnlyVerifiedPurchases: z.boolean().default(false),
  allowMultipleReviewsPerProduct: z.boolean().default(false),
});

export type AlphabiteReviewsPluginOptions = z.infer<typeof optionsSchema>;

export type PluginType = {
  resolve: string;
  options: {};
};

export type ReviewsPluginType = {
  resolve: "@alphabite/medusa-reviews";
  options: AlphabiteReviewsPluginOptions;
};

class ReviewModuleService extends MedusaService({
  Review,
}) {
  public _options: AlphabiteReviewsPluginOptions;

  static validateOptions(_options: AlphabiteReviewsPluginOptions): void | never {
    const parsed = optionsSchema.safeParse(_options);
    if (!parsed.success) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Invalid options provided for WishlistModuleService: ${parsed.error.message}`
      );
    }
  }

  constructor({}, options: AlphabiteReviewsPluginOptions) {
    super(...arguments);
    this._options = options || {};
  }

  @InjectManager()
  async getRatingAggregate(
    productId: string,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<AggregateCounts> {
    const { manager } = sharedContext || {};

    const aggregate_counts = await manager?.transactional(async (manager) => {
      const reviews = (await manager.findAll(Review, {
        where: {
          product_id: productId,
          status: "approved",
        },
        // @ts-ignore
        fields: ["rating"],
      })) as ReviewType[];

      const total_count = reviews?.length;
      const average =
        total_count === 0 ? 0 : reviews.reduce((acc, review) => acc + (review?.rating || 0), 0) / total_count;

      const counts = Array.from({ length: 5 }, (_, i) => {
        const rating = i + 1;
        const count = reviews.filter((review) => review.rating === rating).length;

        return {
          rating,
          count,
        };
      }).sort((a, b) => b.rating - a.rating);

      return {
        total_count,
        average: Number(average.toFixed(2)),
        counts,
      };
    });

    const average = Number((aggregate_counts?.average || 0).toFixed(2));
    const total_count = Number(aggregate_counts?.total_count || 0);
    const counts = aggregate_counts?.counts || [
      { rating: 5, count: 0 },
      { rating: 4, count: 0 },
      { rating: 3, count: 0 },
      { rating: 2, count: 0 },
      { rating: 1, count: 0 },
    ];

    return {
      average,
      total_count,
      product_id: productId,
      counts,
    };
  }
}

export default ReviewModuleService;
