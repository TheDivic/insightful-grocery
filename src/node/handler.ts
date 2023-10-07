import { Request, Response } from "express";
import { INode } from "./node";
import { MongoRepo } from "./repo";

class NodeHandler {
  constructor(private repo = new MongoRepo()) {}

  public handleGetNodes = async (req: Request, res: Response) => {
    try {
      const nodes = await this.repo.getNodes();
      res.json(nodes);
    } catch (err) {
      console.error(err);
      res.sendStatus(500);
    }
  };

  public handlePostNode = async (req: Request, res: Response) => {
    try {
      const created = await this.repo.createNode(req.body);
      res.json(created);
    } catch (err) {
      console.error(`body=${req.body}, error=${err}`);
      res.sendStatus(400);
    }
  };

  public handleDeleteNode = async (req: Request, res: Response) => {
    try {
      await this.repo.deleteNode(req.params.id);
    } catch (err) {
      console.error(err);
      res.sendStatus(400);
    }

    res.sendStatus(204);
  };
}

interface INodeRepo {
  getNodes(): Promise<INode[]>;
  createNode(node: Pick<INode, "name">): Promise<INode>;
  deleteNode(id: string): Promise<void>;
}

export { NodeHandler, INodeRepo };
