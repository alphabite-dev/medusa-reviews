import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { OrderDTO } from "@medusajs/framework/types";

export interface CheckOrderedProductStepInput {
  orders: OrderDTO[];
  product_id: string;
}

export const checkOrderedProductStep = createStep(
  "check-ordered-product",
  async (
    { orders, product_id }: CheckOrderedProductStepInput,
    { container }
  ) => {
    const hasOrderedProduct = orders.some((order) =>
      order?.items?.some((item) => item.product_id === product_id)
    );

    return new StepResponse<Boolean>(hasOrderedProduct);
  }
);
