// medusa-source/reviews/src/modules/review/types/analytics.ts
export type ReviewAnalyticsParams = {
  /** ISO date string; defaults to 30 days before `to`. */
  from?: string;
  /** ISO date string; defaults to now. */
  to?: string;
};

export type Delta = {
  value: number;
  previous: number;
  /** Percent change vs the previous equal-length period, rounded to 1 decimal. */
  delta_pct: number;
};

export type ReviewStatus = "approved" | "pending" | "rejected";

export type ReviewAnalyticsView = {
  range: { from: string; to: string };
  kpis: {
    total_reviews: Delta;
    /** Mean star rating over the period (0–5, two decimals). */
    average_rating: Delta;
    /** Approved ÷ total for the period, as a percentage (0–100, one decimal). */
    approval_rate: Delta;
    /** Reviews created in the period that are verified purchases. */
    verified_purchases: Delta;
    /** Distinct customers who left a review in the period. */
    unique_reviewers: Delta;
  };
  /** Current status of reviews created within the period. */
  status_breakdown: { approved: number; pending: number; rejected: number };
  /** Submitted-rating histogram for the period, ordered 5★ → 1★. */
  rating_distribution: Array<{ rating: number; count: number }>;
  /** Per-bucket counts (day if ≤60d span, else week). */
  trend: Array<{ date: string; total: number; approved: number }>;
  top_products: Array<{
    product_id: string;
    review_count: number;
    average_rating: number;
  }>;
};
