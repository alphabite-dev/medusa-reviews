// medusa-source/reviews/src/modules/review/types/settings.ts
export type ReviewSettingsView = {
  allow_only_verified_purchases: boolean;
  allow_multiple_reviews_per_product: boolean;
};

export type ReviewSettingsPatch = Partial<ReviewSettingsView>;
