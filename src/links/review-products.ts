import { defineLink } from "@medusajs/framework/utils";
import ProductReviewModule from "../modules/review";
import ProductModule from "@medusajs/medusa/product";

// export default defineLink(
//   {
//     linkable: ProductReviewModule.linkable.review,
//     field: "product_id",
//     isList: false,
//   },
//   ProductModule.linkable.product,
//   {
//     readOnly: true,
//   }
// );

export default defineLink(ProductModule.linkable.product, {
  linkable: ProductReviewModule.linkable.review,
  isList: true,
});
