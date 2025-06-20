import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { OrderDTO } from "@medusajs/framework/types";

export interface FetchOrdersStepInput {
  customer_id: string;
}

export interface FetchOrdersStepOutput {
  orders: OrderDTO[];
}

export const fetchOrdersStep = createStep(
  "fetch-orders",
  async ({ customer_id }: FetchOrdersStepInput, { container }) => {
    const query = container.resolve("query");
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "customer_id", "items.product_id"],
      filters: { customer_id },
    });

    return new StepResponse(orders);
  }
);
