import { Schema, model } from "mongoose";

interface INode {
  name: string;
  path: string;
}

const nodeSchema = new Schema<INode>({
  name: { type: String, required: true },
  path: { type: String, required: true, index: true, unique: true },
});
nodeSchema.index({ path: "text" });

const Node = model<INode>("Node", nodeSchema);

export { INode, Node };
