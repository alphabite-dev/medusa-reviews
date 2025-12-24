import { RemoteQueryFunctionReturnPagination } from "@medusajs/framework/types";
import { Review } from "../types";

export const getPagination = (options?: RemoteQueryFunctionReturnPagination) => {
  const { count = 0, take = 5, skip = 0 } = options || {};

  const totalPages = Math.max(Math.ceil(count / take), 1);
  const currentPage = skip / take + 1;
  const nextPage = Math.min(currentPage + 1, totalPages);
  const prevPage = Math.max(currentPage - 1, 1);

  return { count, nextPage, currentPage, prevPage, totalPages, take, skip };
};

export const REVIEW_DEFAULT_FIELDS = [
  "id",
  "product_id",
  "title",
  "content",
  "image_urls",
  "created_at",
  "updated_at",
  "rating",
  "is_verified_purchase",
  "customer.first_name",
  "customer.last_name",
];

export const reviewProductDefaultFields = ["product.title", "product.handle", "product.thumbnail"];

export const isNotNull = <T>(v: T | null): v is T => v !== null;

export const sanitizeReview = (review: Review & { customer_id?: string; customer?: { id?: string } }): Review => {
  const { customer = { id: undefined, first_name: "", last_name: "" }, customer_id = undefined, ...rest } = review;
  const { id = undefined, ...sanitizedCustomer } = customer;

  return {
    ...rest,
    customer: sanitizedCustomer,
  };
};
