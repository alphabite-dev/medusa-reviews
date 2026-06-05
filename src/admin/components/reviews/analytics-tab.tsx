import { Badge, Heading, Select, Table, Text } from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { sdk } from "../../lib/sdk";

type Delta = { value: number; previous: number; delta_pct: number };

type AnalyticsResponse = {
  range: { from: string; to: string };
  kpis: {
    total_reviews: Delta;
    average_rating: Delta;
    approval_rate: Delta;
    verified_purchases: Delta;
    reviews_with_media: Delta;
  };
  status_breakdown: { approved: number; pending: number; rejected: number };
  rating_distribution: Array<{ rating: number; count: number }>;
  trend: Array<{ date: string; total: number }>;
  top_products: Array<{
    product_id: string;
    title: string;
    thumbnail: string | null;
    review_count: number;
    average_rating: number;
  }>;
};

const RANGE_PRESETS: Record<string, number> = {
  "1": 1,
  "7": 7,
  "30": 30,
  "90": 90,
};

const KpiCard = ({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: number;
}) => (
  <div className="flex flex-col gap-1 rounded-lg border p-4">
    <Text size="small" className="text-ui-fg-subtle">
      {label}
    </Text>
    <div className="flex items-baseline gap-2">
      <Text size="xlarge" weight="plus">
        {value}
      </Text>
      {delta !== undefined && (
        <Badge
          size="2xsmall"
          color={delta > 0 ? "green" : delta < 0 ? "red" : "grey"}
        >
          {delta > 0 ? "+" : ""}
          {delta}%
        </Badge>
      )}
    </div>
  </div>
);

export const ReviewAnalyticsTab = () => {
  const [rangeDays, setRangeDays] = useState("30");

  const range = useMemo(() => {
    const to = new Date();
    const from = new Date(
      to.getTime() - RANGE_PRESETS[rangeDays] * 24 * 60 * 60 * 1000,
    );
    return { from: from.toISOString(), to: to.toISOString() };
  }, [rangeDays]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["reviews", "analytics", range],
    queryFn: () => {
      const params = new URLSearchParams({ from: range.from, to: range.to });
      return sdk.client.fetch<AnalyticsResponse>(
        `/admin/reviews/analytics?${params.toString()}`,
        { method: "GET" },
      );
    },
  });

  const maxTrend = useMemo(
    () =>
      Math.max(1, ...(data?.trend.map((t) => t.total) ?? [1])),
    [data],
  );

  const maxDist = useMemo(
    () =>
      Math.max(
        1,
        ...(data?.rating_distribution.map((d) => d.count) ?? [1]),
      ),
    [data],
  );

  if (isError) {
    return (
      <div className="px-6 py-6">
        <Text className="text-ui-fg-error">Failed to load analytics.</Text>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="px-6 py-6">
        <Text className="text-ui-fg-subtle">Loading analytics…</Text>
      </div>
    );
  }

  const hasData =
    data.kpis.total_reviews.value > 0 || data.top_products.length > 0;

  return (
    <div className="flex flex-col gap-6 px-6 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full sm:w-48">
          <Select value={rangeDays} onValueChange={setRangeDays}>
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="1">Last 24 hours</Select.Item>
              <Select.Item value="7">Last 7 days</Select.Item>
              <Select.Item value="30">Last 30 days</Select.Item>
              <Select.Item value="90">Last 90 days</Select.Item>
            </Select.Content>
          </Select>
        </div>
      </div>

      {!hasData ? (
        <Text className="text-ui-fg-subtle">
          No review activity in this period yet.
        </Text>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <KpiCard
              label="Total reviews"
              value={String(data.kpis.total_reviews.value)}
              delta={data.kpis.total_reviews.delta_pct}
            />
            <KpiCard
              label="Average rating"
              value={`${data.kpis.average_rating.value.toFixed(2)} ★`}
              delta={data.kpis.average_rating.delta_pct}
            />
            <KpiCard
              label="Approval rate"
              value={`${data.kpis.approval_rate.value}%`}
              delta={data.kpis.approval_rate.delta_pct}
            />
            <KpiCard
              label="Approved / Pending / Rejected"
              value={`${data.status_breakdown.approved} / ${data.status_breakdown.pending} / ${data.status_breakdown.rejected}`}
            />
            <KpiCard
              label="Verified purchases"
              value={String(data.kpis.verified_purchases.value)}
              delta={data.kpis.verified_purchases.delta_pct}
            />
            <KpiCard
              label="Reviews with media"
              value={String(data.kpis.reviews_with_media.value)}
              delta={data.kpis.reviews_with_media.delta_pct}
            />
          </div>

          <div className="flex flex-col gap-2 rounded-lg border p-4">
            <Text size="small" weight="plus">
              Rating distribution
            </Text>
            <div className="flex flex-col gap-1.5">
              {data.rating_distribution.map((d) => (
                <div key={d.rating} className="flex items-center gap-2">
                  <Text size="xsmall" className="w-8 text-ui-fg-subtle">
                    {d.rating} ★
                  </Text>
                  <div className="h-3 flex-1 overflow-hidden rounded bg-ui-bg-subtle">
                    <div
                      className="h-full rounded bg-ui-fg-interactive"
                      style={{ width: `${(d.count / maxDist) * 100}%` }}
                    />
                  </div>
                  <Text size="xsmall" className="w-10 text-right">
                    {d.count}
                  </Text>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-lg border p-4">
            <Text size="small" weight="plus">
              Reviews over time
            </Text>
            <div className="flex h-40 items-end gap-1 overflow-x-auto">
              {data.trend.map((t) => (
                <div
                  key={t.date}
                  className="flex min-w-[16px] flex-1 flex-col items-center justify-end gap-0.5"
                  title={`${t.date}: ${t.total} reviews`}
                >
                  <div className="flex h-32 w-full items-end justify-center rounded-t bg-ui-bg-component">
                    <div
                      className="w-full rounded-t bg-ui-fg-interactive"
                      style={{
                        height: `${(t.total / maxTrend) * 100}%`,
                        minHeight: t.total > 0 ? "2px" : undefined,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-4">
              <Text size="xsmall" className="text-ui-fg-subtle">
                ▮ Total
              </Text>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Heading level="h3">Most-reviewed products (top 10)</Heading>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Product</Table.HeaderCell>
                  <Table.HeaderCell className="text-right">
                    Reviews
                  </Table.HeaderCell>
                  <Table.HeaderCell className="text-right">
                    Avg rating
                  </Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {data.top_products.map((p) => (
                  <Table.Row key={p.product_id}>
                    <Table.Cell>
                      <Link
                        to={`/products/${p.product_id}`}
                        className="flex items-center gap-2 hover:underline"
                      >
                        {p.thumbnail ? (
                          <img
                            src={p.thumbnail}
                            alt=""
                            className="h-8 w-8 rounded object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded bg-ui-bg-subtle" />
                        )}
                        <Text size="small" className="text-ui-fg-interactive">
                          {p.title}
                        </Text>
                      </Link>
                    </Table.Cell>
                    <Table.Cell className="text-right">
                      {p.review_count}
                    </Table.Cell>
                    <Table.Cell className="text-right">
                      {p.average_rating.toFixed(2)} ★
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        </>
      )}
    </div>
  );
};
