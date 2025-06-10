import {
  InjectManager,
  MedusaService,
  MedusaContext,
} from "@medusajs/framework/utils";
import Review from "./models/review";
import { Context } from "@medusajs/framework/types";
import { EntityManager } from "@mikro-orm/knex";

class ProductReviewModuleService extends MedusaService({
  Review,
}) {
  @InjectManager()
  async getRatingAggregate(
    productId: string,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<{ average: number; counts: { rating: number; count: number }[] }> {
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
      )

      SELECT 
        (SELECT AVG(rating) FROM approved_reviews) as average,
        all_ratings.rating,
        COALESCE(counts_per_rating.count, 0) as count
      FROM all_ratings
      LEFT JOIN counts_per_rating ON all_ratings.rating = counts_per_rating.rating
      ORDER BY all_ratings.rating DESC`
    );

    const result = {
      average: parseFloat(parseFloat(response?.[0]?.average ?? 0).toFixed(2)),
      counts:
        response?.map(
          (row: { average: number; rating: number; count: string }) => ({
            rating: row.rating,
            count: Number(row.count),
          })
        ) ?? [],
    };

    return result;
  }

  @InjectManager()
  async getRatingAverage(
    productIds: string[],
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<{ product_id: string; average: number }[]> {
    const response =
      (await sharedContext?.manager?.execute(
        `SELECT 
        product_id, 
        AVG(rating) AS average
      FROM review
      WHERE product_id IN (${productIds.map((id) => `'${id}'`).join(",")})
        AND status = 'approved'
      GROUP BY product_id`
      )) ?? [];

    return response.map((row) => ({
      ...row,
      average: parseFloat(parseFloat(row.average).toFixed(2)),
    })) as { product_id: string; average: number }[];
  }

  @InjectManager()
  async getRatingCountAndAverage(
    productIds: string[],
    @MedusaContext() sharedContext?: Context<EntityManager>
  ): Promise<{ product_id: string; average: number; count: number }[]> {
    const response: { product_id: string; average: number; count: number }[] =
      (await sharedContext?.manager?.execute(
        `SELECT 
        product_id, 
        AVG(rating) AS average,
        COUNT(*) as count
      FROM review
      WHERE product_id IN (${productIds.map((id) => `'${id}'`).join(",")})
        AND status = 'approved'
      GROUP BY product_id`
      )) ?? [];

    return response.map((row) => ({
      ...row,
      count: Number(row.count),
    }));
  }

  @InjectManager()
  async addReview(
    input: {
      id: string;
      title?: string;
      content?: string;
      rating: number;
      product_id: string;
      first_name: string;
      last_name: string;
      created_at: string;
    },
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    await sharedContext?.manager?.execute(
      `INSERT INTO review (id, title, content, rating, product_id, first_name, last_name, created_at, updated_at, status)
      VALUES ('${input.id}',${input.title ? `'${input.title}'` : "NULL"}, ${
        input.content ? `'${input.content}'` : "NULL"
      }, ${input.rating}, '${input.product_id}', '${input.first_name}', '${
        input.last_name
      }', '${input.created_at}', '${input.created_at}','approved')`
    );
  }
}

export default ProductReviewModuleService;
