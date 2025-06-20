import { InjectManager, MedusaService, MedusaContext, MedusaError } from "@medusajs/framework/utils";
import Review from "./models/review";
import { Context } from "@medusajs/framework/types";
import { EntityManager } from "@mikro-orm/knex";
import { AggregateCounts } from "../../api/store/reviews/types";
import { z } from "zod";

const optionsSchema = z.object({
  allowOnlyVerifiedPurchases: z.boolean().default(false),
  allowMultipleReviewsPerProduct: z.boolean().default(false),
});

export type AlphabiteReviewsPluginOptions = z.infer<typeof optionsSchema>;

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
    // const test = await sharedContext?.manager?.

    const response = await sharedContext?.manager?.execute(
      `WITH approved_reviews AS (
      SELECT rating
      FROM review
      WHERE product_id = '${productId}' AND status = 'approved'
    ),
    all_ratings AS (
      SELECT 1 AS rating UNION ALL
      SELECT 2 UNION ALL
      SELECT 3 UNION ALL
      SELECT 4 UNION ALL
      SELECT 5
    ),
    counts_per_rating AS (
      SELECT rating, COUNT(*) as count
      FROM approved_reviews
      GROUP BY rating
    ),
    total_count AS (
      SELECT COUNT(*) as total
      FROM approved_reviews
    )

    SELECT
      (SELECT AVG(rating) FROM approved_reviews) as average,
      (SELECT total FROM total_count) as total_count,
      all_ratings.rating,
      COALESCE(counts_per_rating.count, 0) as count
    FROM all_ratings
    LEFT JOIN counts_per_rating ON all_ratings.rating = counts_per_rating.rating
    ORDER BY all_ratings.rating DESC`
    );

    // console.log("Rating Aggregate Response:", response);

    const average = Number((response?.[0]?.average || 0).toFixed(2));
    const total_count = Number(response?.[0]?.total_count || 0);
    const counts = response!.map((row) => ({
      rating: row.rating,
      count: Number(row.count),
    }));

    return {
      average,
      total_count,
      product_id: productId,
      counts,
    };
  }
}

export default ReviewModuleService;
