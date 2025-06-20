import {
  CustomerDTO,
  ProductDTO,
  RemoteQueryFunctionReturnPagination,
} from "@medusajs/types";

export interface AggregateCounts {
  average: number;
  counts: { rating: number; count: number }[];
  product_id?: string;
  total_count: number;
}

export interface PaginatedOutputMeta
  extends RemoteQueryFunctionReturnPagination {
  totalPages: number;
  currentPage: number;
  nextPage: number;
  prevPage: number;
}

export interface Review {
  title: string | null;
  content: string | null;
  rating: number;
  id: string;
  image_urls: string[];
  is_verified_purchase: boolean;
  product_id: string;
  customer: Pick<CustomerDTO, "first_name" | "last_name">;
  product?: Pick<ProductDTO, "thumbnail" | "title" | "handle" | "id"> &
    AggregateCounts;
  created_at: Date | string;
  updated_at: Date | string;
  deleted_at: Date | string | null;
}

export interface PaginatedOutput<T> extends PaginatedOutputMeta {
  data: T[];
}
