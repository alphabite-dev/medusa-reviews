import { AuthenticatedMedusaRequest } from "@medusajs/framework";
import { File } from "multer";

declare global {
  namespace Express {
    interface Request {
      files?: File[];
    }
  }
}

export interface MedusaMulterFileUploadRequest
  extends AuthenticatedMedusaRequest {
  files?: File[];
}
