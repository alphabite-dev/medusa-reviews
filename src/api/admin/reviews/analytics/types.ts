import type { ReviewAnalyticsView } from "../../../../modules/review/types/analytics";

export type ReviewAnalyticsResponse = Omit<
  ReviewAnalyticsView,
  "top_products"
> & {
  top_products: Array<{
    product_id: string;
    title: string;
    thumbnail: string | null;
    review_count: number;
    average_rating: number;
  }>;
};
