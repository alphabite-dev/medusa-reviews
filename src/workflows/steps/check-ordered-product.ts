import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { OrderDTO } from "@medusajs/framework/types";

export interface CheckOrderedProductStepInput {
  product_id: string;
  customer_id: string;
}

export const checkOrderedProductStep = createStep(
  "check-ordered-product",
  async (
    { customer_id, product_id }: CheckOrderedProductStepInput,
    { container }
  ) => {
    const query = container.resolve("query");
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "customer_id", "items.product_id"],
      filters: { customer_id },
    });

    const hasOrderedProduct = orders.some((order) =>
      order?.items?.some((item) => item.product_id === product_id)
    );

    return new StepResponse<Boolean>(hasOrderedProduct);
  }
);
