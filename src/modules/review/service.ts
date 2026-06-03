import { Context } from "@medusajs/framework/types";
import {
  InjectManager,
  MedusaContext,
  MedusaError,
  MedusaService,
} from "@medusajs/framework/utils";
import { EntityManager } from "@mikro-orm/knex";
import { z } from "@medusajs/framework/zod";
import { AggregateCounts } from "../../api/store/reviews/types";
import Review, { Review as ReviewType } from "./models/review";
import { ReviewSettings } from "./models/review-settings";
import type { ReviewSettingsView, ReviewSettingsPatch } from "./types/settings";
import type {
  ReviewAnalyticsParams,
  ReviewAnalyticsView,
  Delta,
} from "./types/analytics";

const REVIEW_SETTINGS_SINGLETON_ID = "revs_singleton";

const optionsSchema = z.object({
  allowOnlyVerifiedPurchases: z.boolean().default(false),
  allowMultipleReviewsPerProduct: z.boolean().default(false),
});

export type AlphabiteReviewsPluginOptionsType = z.infer<typeof optionsSchema>;

export type AlphabiteReviewsPluginOptions = {
  /**
   * Whether only verified purchases are allowed to leave reviews.
   * Default: false
   */
  allowOnlyVerifiedPurchases?: boolean;

  /**
   * Whether a customer can leave multiple reviews for the same product.
   * Default: false
   */
  allowMultipleReviewsPerProduct?: boolean;
};

export type PluginType = {
  resolve: string;
  options: {};
};

export type ReviewsPluginType = {
  resolve: "@alphabite/medusa-reviews";
  options: AlphabiteReviewsPluginOptionsType;
};

class ReviewModuleService extends MedusaService({
  Review,
  ReviewSettings,
}) {
  public _options: AlphabiteReviewsPluginOptionsType;

  static validateOptions(
    _options: AlphabiteReviewsPluginOptionsType,
  ): void | never {
    const parsed = optionsSchema.safeParse(_options);
    if (!parsed.success) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Invalid options provided for WishlistModuleService: ${parsed.error.message}`,
      );
    }
  }

  constructor({}, options: AlphabiteReviewsPluginOptionsType) {
    super(...arguments);
    this._options = options || {};
  }

  @InjectManager()
  async getRatingAggregate(
    productId: string,
    @MedusaContext() sharedContext?: Context<EntityManager>,
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
        total_count === 0
          ? 0
          : reviews.reduce((acc, review) => acc + (review?.rating || 0), 0) /
            total_count;

      const counts = Array.from({ length: 5 }, (_, i) => {
        const rating = i + 1;
        const count = reviews.filter(
          (review) => review.rating === rating,
        ).length;

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

  // ── Settings ──────────────────────────────────────────────────────────────
  // Backed by a singleton `review_settings` row. Until that row exists (i.e. no
  // admin has saved settings yet), the plugin's configured `_options` are the
  // effective values, so an existing deployment's behaviour is unchanged.

  async getSettings(): Promise<ReviewSettingsView> {
    const rows = await this.listReviewSettings(
      { id: REVIEW_SETTINGS_SINGLETON_ID },
      { take: 1 },
    );
    const row = rows[0];

    if (!row) {
      return {
        allow_only_verified_purchases:
          this._options?.allowOnlyVerifiedPurchases ?? false,
        allow_multiple_reviews_per_product:
          this._options?.allowMultipleReviewsPerProduct ?? false,
      };
    }

    return {
      allow_only_verified_purchases: row.allow_only_verified_purchases,
      allow_multiple_reviews_per_product:
        row.allow_multiple_reviews_per_product,
    };
  }

  async updateSettings(patch: ReviewSettingsPatch): Promise<ReviewSettingsView> {
    const current = await this.getSettings();
    const next = {
      allow_only_verified_purchases:
        patch.allow_only_verified_purchases ??
        current.allow_only_verified_purchases,
      allow_multiple_reviews_per_product:
        patch.allow_multiple_reviews_per_product ??
        current.allow_multiple_reviews_per_product,
    };

    const rows = await this.listReviewSettings(
      { id: REVIEW_SETTINGS_SINGLETON_ID },
      { take: 1 },
    );

    if (rows[0]) {
      await this.updateReviewSettings({
        id: REVIEW_SETTINGS_SINGLETON_ID,
        ...next,
      });
    } else {
      await this.createReviewSettings({
        id: REVIEW_SETTINGS_SINGLETON_ID,
        ...next,
      });
    }

    return this.getSettings();
  }

  // ── Analytics ─────────────────────────────────────────────────────────────

  @InjectManager()
  async getAnalytics(
    params: ReviewAnalyticsParams = {},
    @MedusaContext() context: Context<EntityManager> = {},
  ): Promise<ReviewAnalyticsView> {
    const knex = context.manager!.getConnection().getKnex();
    const n = (v: unknown): number => Number(v ?? 0);

    const DAY_MS = 24 * 60 * 60 * 1000;
    const to = params.to ? new Date(params.to) : new Date();
    const from = params.from
      ? new Date(params.from)
      : new Date(to.getTime() - 30 * DAY_MS);
    const periodMs = to.getTime() - from.getTime();
    const prevFrom = new Date(from.getTime() - periodMs);
    const prevTo = from;
    const bucket = periodMs <= 60 * DAY_MS ? "day" : "week";

    const mkDelta = (value: number, previous: number): Delta => ({
      value,
      previous,
      delta_pct:
        previous === 0
          ? value > 0
            ? 100
            : 0
          : Math.round(((value - previous) / previous) * 1000) / 10,
    });

    // Status counts (also yields the period total) for a [lo, hi) window.
    const statusCounts = async (
      lo: Date,
      hi: Date,
    ): Promise<{ approved: number; pending: number; rejected: number }> => {
      const rows = (await knex("review")
        .where("created_at", ">=", lo)
        .andWhere("created_at", "<", hi)
        .whereNull("deleted_at")
        .select("status")
        .count("* as c")
        .groupBy("status")) as { status: string; c: string }[];

      const acc = { approved: 0, pending: 0, rejected: 0 };
      for (const r of rows) {
        if (r.status === "approved") acc.approved = n(r.c);
        else if (r.status === "pending") acc.pending = n(r.c);
        else if (r.status === "rejected") acc.rejected = n(r.c);
      }
      return acc;
    };

    const avgRating = async (lo: Date, hi: Date): Promise<number> => {
      const row = (await knex("review")
        .where("created_at", ">=", lo)
        .andWhere("created_at", "<", hi)
        .whereNull("deleted_at")
        .avg("rating as a")) as { a: string | null }[];
      return Math.round(n(row[0]?.a) * 100) / 100;
    };

    const countVerified = async (lo: Date, hi: Date): Promise<number> => {
      const row = (await knex("review")
        .where("created_at", ">=", lo)
        .andWhere("created_at", "<", hi)
        .whereNull("deleted_at")
        .andWhere("is_verified_purchase", true)
        .count("* as c")) as { c: string }[];
      return n(row[0]?.c);
    };

    const countUniqueReviewers = async (
      lo: Date,
      hi: Date,
    ): Promise<number> => {
      const row = (await knex("review")
        .where("created_at", ">=", lo)
        .andWhere("created_at", "<", hi)
        .whereNull("deleted_at")
        .countDistinct("customer_id as c")) as { c: string }[];
      return n(row[0]?.c);
    };

    const [
      status,
      prevStatus,
      avg,
      prevAvg,
      verified,
      prevVerified,
      reviewers,
      prevReviewers,
    ] = await Promise.all([
      statusCounts(from, to),
      statusCounts(prevFrom, prevTo),
      avgRating(from, to),
      avgRating(prevFrom, prevTo),
      countVerified(from, to),
      countVerified(prevFrom, prevTo),
      countUniqueReviewers(from, to),
      countUniqueReviewers(prevFrom, prevTo),
    ]);

    const total = status.approved + status.pending + status.rejected;
    const prevTotal =
      prevStatus.approved + prevStatus.pending + prevStatus.rejected;
    const rate = total ? Math.round((status.approved / total) * 1000) / 10 : 0;
    const prevRate = prevTotal
      ? Math.round((prevStatus.approved / prevTotal) * 1000) / 10
      : 0;

    // Rating distribution (1–5) for the current period.
    const distRows = (await knex("review")
      .where("created_at", ">=", from)
      .andWhere("created_at", "<", to)
      .whereNull("deleted_at")
      .select("rating")
      .count("* as c")
      .groupBy("rating")) as { rating: number; c: string }[];
    const distMap = new Map<number, number>();
    for (const r of distRows) distMap.set(Number(r.rating), n(r.c));
    const rating_distribution = [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: distMap.get(rating) ?? 0,
    }));

    // Trend — total + approved per bucket. Group/order by the SELECT ordinal:
    // repeating date_trunc(?, ...) would bind a separate parameter that Postgres
    // does not treat as the same expression ("must appear in GROUP BY").
    const totalTrendQb = knex("review")
      .where("created_at", ">=", from)
      .andWhere("created_at", "<", to)
      .whereNull("deleted_at")
      .select(
        knex.raw("to_char(date_trunc(?, created_at), 'YYYY-MM-DD') as date", [
          bucket,
        ]),
      )
      .count("* as count")
      .groupByRaw("1")
      .orderByRaw("1");

    const approvedTrendQb = knex("review")
      .where("created_at", ">=", from)
      .andWhere("created_at", "<", to)
      .whereNull("deleted_at")
      .andWhere("status", "approved")
      .select(
        knex.raw("to_char(date_trunc(?, created_at), 'YYYY-MM-DD') as date", [
          bucket,
        ]),
      )
      .count("* as count")
      .groupByRaw("1")
      .orderByRaw("1");

    const [totalTrendRows, approvedTrendRows] = (await Promise.all([
      totalTrendQb,
      approvedTrendQb,
    ])) as [
      { date: string; count: string }[],
      { date: string; count: string }[],
    ];

    const trendMap = new Map<string, { total: number; approved: number }>();
    for (const r of totalTrendRows) {
      trendMap.set(r.date, { total: n(r.count), approved: 0 });
    }
    for (const r of approvedTrendRows) {
      const e = trendMap.get(r.date) ?? { total: 0, approved: 0 };
      e.approved = n(r.count);
      trendMap.set(r.date, e);
    }
    const trend = [...trendMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, total: v.total, approved: v.approved }));

    // Top products by review count (with mean rating) for the period.
    const topRows = (await knex("review")
      .where("created_at", ">=", from)
      .andWhere("created_at", "<", to)
      .whereNull("deleted_at")
      .select("product_id")
      .count("* as review_count")
      .avg("rating as average_rating")
      .groupBy("product_id")
      .orderBy("review_count", "desc")
      .limit(10)) as {
      product_id: string;
      review_count: string;
      average_rating: string;
    }[];

    return {
      range: { from: from.toISOString(), to: to.toISOString() },
      kpis: {
        total_reviews: mkDelta(total, prevTotal),
        average_rating: mkDelta(avg, prevAvg),
        approval_rate: mkDelta(rate, prevRate),
        verified_purchases: mkDelta(verified, prevVerified),
        unique_reviewers: mkDelta(reviewers, prevReviewers),
      },
      status_breakdown: status,
      rating_distribution,
      trend,
      top_products: topRows.map((r) => ({
        product_id: r.product_id,
        review_count: n(r.review_count),
        average_rating: Math.round(n(r.average_rating) * 100) / 100,
      })),
    };
  }
}

export default ReviewModuleService;
