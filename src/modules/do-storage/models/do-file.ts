import { model } from "@medusajs/framework/utils";
import { InferTypeOf } from "@medusajs/framework/types";

const DoFile = model.define("do_file", {
  id: model.id({ prefix: "dof" }).primaryKey(),
  url: model.text(),
});

export type DoFile = InferTypeOf<typeof DoFile>;

export default DoFile;
