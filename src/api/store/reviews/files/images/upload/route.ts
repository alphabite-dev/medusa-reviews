import { MedusaResponse } from "@medusajs/framework";
import { FileDTO } from "@medusajs/framework/types";
import { uploadFilesWorkflow } from "@medusajs/medusa/core-flows";
import { MedusaMulterFileUploadRequest } from "../../../../../../types/custom";

export interface MappedFile {
  filename: string;
  mimeType: string;
  content: string;
  access: "public" | "private";
}

export const POST = async (
  req: MedusaMulterFileUploadRequest,
  res: MedusaResponse<FileDTO[]>
) => {
  const logger = req.scope.resolve("logger");
  const files = req.files;

  try {
    if (!files || files.length === 0) {
      logger.error("Files not founded!");
      return res.status(500).end();
    }

    const mappedFiles: MappedFile[] = files.map((f) => ({
      filename: f.originalname,
      mimeType: f.mimetype,
      content: f.buffer.toString("binary"),
      access: "public",
    }));

    const { result } = await uploadFilesWorkflow(req.scope).run({
      input: { files: mappedFiles },
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error("File upload failed!", error);
    return res.status(500).end();
  }
};
