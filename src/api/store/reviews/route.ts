import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { createReviewWorkflow } from "../../../workflows/create-review";
import { z } from "zod";
import { DIGITAL_OCEAN_STORAGE_MODULE } from "../../../modules/do-storage";
import DigitalOceanStorageModuleService from "../../../modules/do-storage/service";

export const PostStoreReviewSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  rating: z.preprocess((val) => {
    if (val && typeof val === "string") {
      return parseInt(val);
    }
    return val;
  }, z.number().min(1).max(5)),
  product_id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  image_base64s: z.array(z.string()).optional(),
});

type PostStoreReviewReq = z.infer<typeof PostStoreReviewSchema>;

export const POST = async (
  req: AuthenticatedMedusaRequest<PostStoreReviewReq>,
  res: MedusaResponse
) => {
  const input = req.validatedBody;

  const storageModuleService: DigitalOceanStorageModuleService =
    req.scope.resolve(DIGITAL_OCEAN_STORAGE_MODULE);

  const uploadRes = input.image_base64s
    ? await storageModuleService.upload({
        base64s: input.image_base64s,
        productId: input.product_id,
      })
    : [];

  const { result } = await createReviewWorkflow(req.scope).run({
    input: {
      ...input,
      customer_id: req.auth_context?.actor_id,
      image_urls: uploadRes.map((res) => res.url),
    },
  });

  res.json(result);
};
