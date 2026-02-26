import {
  authenticate,
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http";
import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";
import multer from "multer";
import { GetAdminReviewsSchema } from "./admin/reviews/route";
import { PostAdminUpdateReviewsStatusSchema } from "./admin/reviews/status/route";
import { ListReviewsQuerySchema } from "./store/products/reviews/validators";
import { ListProductReviewsQuerySchema } from "./store/reviews/product/[id]/validators";
import { CreateReviewInputSchema } from "./store/reviews/validators";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type: ${file.mimetype}. Only JPEG, PNG, WebP, and GIF are allowed.`,
        ),
      );
    }
  },
});

// Simple IP-based rate limiter for upload endpoint
const uploadRateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 10; // max 10 upload requests per window

const rateLimitUpload = (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) => {
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  const now = Date.now();
  const entry = uploadRateLimit.get(ip);

  if (!entry || now > entry.resetAt) {
    uploadRateLimit.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return res
      .status(429)
      .json({ message: "Too many upload requests. Please try again later." });
  }

  entry.count++;
  return next();
};

export default defineMiddlewares({
  routes: [
    //----Create review-----//
    {
      matcher: "/store/reviews",
      method: ["POST"],
      bodyParser: { sizeLimit: "10mb" },
      middlewares: [
        authenticate("customer", ["session", "bearer"]),
        validateAndTransformBody(CreateReviewInputSchema),
      ],
    },
    //----List  reviews-----//
    {
      matcher: "/store/products/reviews",
      method: ["GET"],
      middlewares: [
        authenticate("customer", ["bearer"], {
          allowUnauthenticated: true,
          allowUnregistered: true,
        }),
        validateAndTransformQuery(
          createFindParams().extend(ListReviewsQuerySchema.shape),
          {
            defaults: ["customer.first_name", "customer.last_name"],
            isList: true,
          },
        ),
      ],
    },
    //----List product reviews-----//
    {
      matcher: "/store/reviews/product/:id",
      method: ["GET"],
      middlewares: [
        authenticate("customer", ["bearer"], {
          allowUnauthenticated: true,
          allowUnregistered: true,
        }),
        validateAndTransformQuery(
          createFindParams().extend(ListProductReviewsQuerySchema.shape),
          {
            defaults: ["customer.first_name", "customer.last_name"],
            isList: true,
          },
        ),
      ],
    },
    //----Get Aggregate counts of product reviews-----//
    {
      matcher: "/store/reviews/product/:id/aggregate-counts",
      method: ["GET"],
    },
    //----Delete product review-----//
    {
      matcher: "/store/reviews/:id",
      method: ["DELETE"],
      middlewares: [authenticate("customer", ["bearer"])],
    },
    //----Admin list reviews-----//
    {
      matcher: "/admin/reviews",
      method: ["GET"],
      middlewares: [
        validateAndTransformQuery(GetAdminReviewsSchema, {
          isList: true,
          defaults: [
            "id",
            "title",
            "content",
            "rating",
            "product_id",
            "customer_id",
            "status",
            "created_at",
            "updated_at",
            "product.*",
          ],
        }),
      ],
    },
    //----Admin change reviews status-----//
    {
      matcher: "/admin/reviews/status",
      method: ["POST"],
      middlewares: [
        validateAndTransformBody(PostAdminUpdateReviewsStatusSchema),
      ],
    },
    {
      matcher: "/store/reviews/files/images/upload",
      method: "POST",
      bodyParser: false,
      middlewares: [
        rateLimitUpload,
        // @ts-ignore
        upload.array("files", MAX_FILES),
        authenticate("customer", ["bearer"], {
          allowUnauthenticated: true,
          allowUnregistered: true,
        }),
      ],
    },
  ],
});
