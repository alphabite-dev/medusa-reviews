import DigitalOceanStorageModuleService from "./service";
import { Module } from "@medusajs/framework/utils";

export const DIGITAL_OCEAN_STORAGE_MODULE = "do_storage";

export default Module(DIGITAL_OCEAN_STORAGE_MODULE, {
  service: DigitalOceanStorageModuleService,
});
