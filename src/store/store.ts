import { Schema, model } from "mongoose";

interface IStore {
  name: string;
  path: string;
}

const storeSchema = new Schema<IStore>({
  name: { type: String, required: true },
  path: { type: String, required: true, index: true, unique: true },
});
storeSchema.index({ path: "text" });

const Store = model<IStore>("Store", storeSchema);

export { IStore, Store };
