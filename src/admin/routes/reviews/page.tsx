import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ChatBubbleLeftRight } from "@medusajs/icons";
import { Container, Heading, Tabs, Toaster } from "@medusajs/ui";
import { ReviewsListTab } from "../../components/reviews/reviews-list-tab";
import { ReviewAnalyticsTab } from "../../components/reviews/analytics-tab";
import { ReviewSettingsTab } from "../../components/reviews/settings-tab";

const ReviewsPage = () => {
  return (
    <Container className="p-0">
      <Tabs defaultValue="reviews">
        <div className="flex flex-col gap-3 border-b px-6 py-4">
          <Heading level="h2">Reviews</Heading>
          <Tabs.List>
            <Tabs.Trigger value="reviews">Reviews</Tabs.Trigger>
            <Tabs.Trigger value="analytics">Analytics</Tabs.Trigger>
            <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
          </Tabs.List>
        </div>
        <Tabs.Content value="reviews">
          <ReviewsListTab />
        </Tabs.Content>
        <Tabs.Content value="analytics">
          <ReviewAnalyticsTab />
        </Tabs.Content>
        <Tabs.Content value="settings">
          <ReviewSettingsTab />
        </Tabs.Content>
      </Tabs>
      <Toaster />
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Reviews",
  icon: ChatBubbleLeftRight,
});

export default ReviewsPage;
