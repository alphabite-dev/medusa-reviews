import { Button, Label, Switch, Text, toast } from "@medusajs/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { sdk } from "../../lib/sdk";

type ReviewSettingsView = {
  allow_only_verified_purchases: boolean;
  allow_multiple_reviews_per_product: boolean;
};

const QUERY_KEY = ["reviews", "settings"] as const;

export const ReviewSettingsTab = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () =>
      sdk.client.fetch<ReviewSettingsView>("/admin/reviews/settings", {
        method: "GET",
      }),
  });

  const [onlyVerified, setOnlyVerified] = useState(false);
  const [allowMultiple, setAllowMultiple] = useState(false);

  useEffect(() => {
    if (data) {
      setOnlyVerified(data.allow_only_verified_purchases);
      setAllowMultiple(data.allow_multiple_reviews_per_product);
    }
  }, [data]);

  const isDirty =
    data !== undefined &&
    (onlyVerified !== data.allow_only_verified_purchases ||
      allowMultiple !== data.allow_multiple_reviews_per_product);

  const update = useMutation({
    mutationFn: (patch: Partial<ReviewSettingsView>) =>
      sdk.client.fetch<ReviewSettingsView>("/admin/reviews/settings", {
        method: "PUT",
        body: patch,
      }),
    onSuccess: (next) => {
      queryClient.setQueryData(QUERY_KEY, next);
      toast.success("Review settings updated");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to update";
      toast.error(msg);
    },
  });

  const onSave = () => {
    if (!data) return;
    const patch: Partial<ReviewSettingsView> = {};
    if (onlyVerified !== data.allow_only_verified_purchases) {
      patch.allow_only_verified_purchases = onlyVerified;
    }
    if (allowMultiple !== data.allow_multiple_reviews_per_product) {
      patch.allow_multiple_reviews_per_product = allowMultiple;
    }
    update.mutate(patch);
  };

  return (
    <div className="flex flex-col gap-6 px-6 py-6">
      <div>
        <Text className="text-ui-fg-subtle">
          Control who can leave reviews in your storefront.
        </Text>
      </div>
      {isLoading ? (
        <Text className="text-ui-fg-subtle">Loading…</Text>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col">
              <Label htmlFor="only-verified" className="font-medium">
                Allow only verified purchases
              </Label>
              <Text size="small" className="text-ui-fg-subtle">
                Only customers who purchased the product can leave a review.
              </Text>
            </div>
            <Switch
              id="only-verified"
              checked={onlyVerified}
              onCheckedChange={setOnlyVerified}
            />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col">
              <Label htmlFor="allow-multiple" className="font-medium">
                Allow multiple reviews per product
              </Label>
              <Text size="small" className="text-ui-fg-subtle">
                A customer can submit more than one review for the same product.
              </Text>
            </div>
            <Switch
              id="allow-multiple"
              checked={allowMultiple}
              onCheckedChange={setAllowMultiple}
            />
          </div>

          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={onSave}
              disabled={!isDirty || update.isPending}
              isLoading={update.isPending}
            >
              Save
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
