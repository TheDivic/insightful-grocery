import { INodeRepo } from "./handler";
import { INode, Node } from "./node";

class MongoRepo implements INodeRepo {
  async getNodes(): Promise<INode[]> {
    const nodes = await Node.find();
    return nodes;
  }

  async createNode(node: Pick<INode, "name">): Promise<INode> {
    const created = await Node.create(node);
    return created;
  }

  async deleteNode(id: string): Promise<void> {
    await Node.deleteOne({ _id: id });
  }
}

export { MongoRepo };
