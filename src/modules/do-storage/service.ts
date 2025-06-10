import { MedusaError } from "@medusajs/framework/utils";
import { Logger } from "@medusajs/framework/types";
import { ProviderFileResultDTO } from "@medusajs/types";
import { PutObjectCommand, S3 } from "@aws-sdk/client-s3";

type InjectedDependencies = {
  logger: Logger;
};

type Options = {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
};

export default class DigitalOceanStorageModuleService {
  protected logger: Logger;
  protected options: Options;
  protected s3Client: S3;

  static identifier = "do_storage";

  static validateOptions(options: Record<any, any>): void | never {
    if (!options.accessKeyId || !options.secretAccessKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Missing required options for DigitalOcean Storage"
      );
    }
  }
  constructor({ logger }: InjectedDependencies, options: Options) {
    this.logger = logger;
    this.options = options;

    this.s3Client = new S3({
      endpoint: `https://${options.region}.digitaloceanspaces.com`,
      region: options.region,
      forcePathStyle: true,
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      },
    });
  }

  async upload({
    base64s,
    productId,
  }: {
    base64s: string[];
    productId: string;
  }): Promise<ProviderFileResultDTO[]> {
    const bucket = process.env.DO_STORAGE_BUCKET;
    const region = process.env.DO_STORAGE_REGION;

    console.log("DigitalOcean Storage configuration:", {
      bucket,
      region,
    });

    if (!bucket || !region) {
      throw new Error("Missing DigitalOcean storage configuration.");
    }

    console.log("Uploading file to DigitalOcean Storage");

    const date = Date.now();

    const uploadPromises = base64s?.map(async (base64, index) => {
      const { fileKey, fileType } = this.getFileDetails({
        base64,
        productId,
        date,
        index,
      });

      if (!fileType.includes("image")) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `File type ${fileType} is not supported`
        );
      }

      const url = `https://${bucket}.${region}.digitaloceanspaces.com/${fileKey}`;

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: fileKey,
          Body: Buffer.from(base64.split(",")[1], "base64"),
          ACL: "public-read",
          ContentType: fileType,
        })
      );

      return {
        url,
        key: fileKey,
      };
    });

    const results = await Promise.all(uploadPromises);

    return results;
  }

  private getFileDetails({
    base64,
    productId,
    date,
    index,
  }: {
    base64: string;
    productId: string;
    date: number;
    index: number;
  }): { fileKey: string; fileType: string } {
    const base64Header = base64.split(",")[0];

    const fileType = base64Header.split(";")[0].split(":")[1];

    const fileKey = `${productId}/${date}-${index}.${fileType.split("/")[1]}`;

    return { fileKey, fileType };
  }
}
