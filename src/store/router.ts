import express, { Request, Response } from "express";
import { MongoRepo } from "./repo";
import { IStore } from "./store";

class StoreRouter {
  public router: express.Router;

  constructor(private repo: IStoreRepo = new MongoRepo()) {
    this.router = express.Router();
    this.router
      .route("/:storeId?")
      .get(this.handleGet)
      .post(this.handlePost)
      .delete(this.handleDelete);
  }

  private handleGet = async (req: Request, res: Response) => {
    try {
      const nodes = await this.repo.get();
      res.json(nodes);
    } catch (err) {
      console.error(err);
      res.sendStatus(500);
    }
  };

  private handlePost = async (req: Request, res: Response) => {
    try {
      const created = await this.repo.create(req.body);
      res.json(created);
    } catch (err) {
      console.error(`body=${req.body}, error=${err}`);
      res.sendStatus(400);
    }
  };

  public handleDelete = async (req: Request, res: Response) => {
    try {
      await this.repo.delete(req.params.id);
    } catch (err) {
      console.error(err);
      res.sendStatus(400);
    }

    res.sendStatus(204);
  };
}

interface IStoreRepo {
  get(): Promise<IStore[]>;
  create(node: Pick<IStore, "name">): Promise<IStore>;
  delete(id: string): Promise<void>;
}

export { StoreRouter, IStoreRepo };
