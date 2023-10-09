import express, { Request, Response } from "express";
import { MongoRepo } from "./repo";
import { MongoRepo as EmployeeMongoRepo } from "../employee/repo";
import { IStore } from "./store";
import { IEmployee, Role } from "../employee/employee";
import { authorizationMiddleware } from "../auth/middleware";

class StoreRouter {
  constructor(
    private stores: IStoreRepo = new MongoRepo(),
    private employees: IEmployeeRepo = new EmployeeMongoRepo(),
    public router = express.Router()
  ) {
    // TODO: Add authorization here also
    this.router
      .route("/:storePath?")
      .get(authorizationMiddleware, this.handleGet)
      .post(authorizationMiddleware, this.handlePost)
      .delete(authorizationMiddleware, this.handleDelete);

    this.router
      .route("/:storePath/employees")
      .get(authorizationMiddleware, this.handleGetEmployees);
  }

  private handleGetEmployees = async (req: Request, res: Response) => {
    const employees = await this.employees.at(
      req.params.storePath,
      // TODO: parse and validate the following query parameters
      req.query.deep ? (req.query.deep as unknown as boolean) : undefined,
      req.query.role ? (req.query.role as Role) : undefined
    );
    res.json(employees);
  };

  private handleGet = async (req: Request, res: Response) => {
    try {
      const nodes = await this.stores.get();
      res.json(nodes);
    } catch (err) {
      console.error(err);
      res.sendStatus(500);
    }
  };

  private handlePost = async (req: Request, res: Response) => {
    try {
      const created = await this.stores.create(req.body);
      res.json(created);
    } catch (err) {
      console.error(`body=${req.body}, error=${err}`);
      res.sendStatus(400);
    }
  };

  public handleDelete = async (req: Request, res: Response) => {
    try {
      await this.stores.delete(req.params.id);
    } catch (err) {
      console.error(err);
      res.sendStatus(400);
    }

    res.sendStatus(204);
  };
}

interface IStoreRepo {
  get(): Promise<IStore[]>;
  // getOne(path: string): Promise<IStore>;
  create(node: Pick<IStore, "name">): Promise<IStore>;
  delete(id: string): Promise<void>;
}

interface IEmployeeRepo {
  get(): Promise<IEmployee[]>;
  at(path: string, deep?: boolean, role?: Role): Promise<IEmployee[]>;
  create(employee: IEmployee): Promise<IEmployee>;
  delete(id: string): Promise<void>;
}

export { StoreRouter, IStoreRepo, IEmployeeRepo };
