import { Schema, model } from "mongoose";

interface INode {
  name: string;
}

const nodeSchema = new Schema<INode>({
  name: { type: String, required: true },
});

const Node = model<INode>("Node", nodeSchema);

export { INode, Node };
