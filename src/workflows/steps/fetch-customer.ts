import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { CustomerDTO } from "@medusajs/framework/types";

export interface FetchCustomerStepInput {
  customer_id: string;
}

export interface FetchCustomerStepOutput
  extends Pick<CustomerDTO, "first_name" | "last_name"> {}

export const fetchCustomerStep = createStep(
  "fetch-customer",
  async ({ customer_id }: FetchCustomerStepInput, { container }) => {
    const query = container.resolve("query");
    const {
      data: [customer],
    } = await query.graph({
      entity: "customer",
      fields: ["first_name", "last_name"],
      filters: { id: customer_id },
    });
    return new StepResponse<FetchCustomerStepOutput>(customer);
  }
);
