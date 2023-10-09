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
      .get(authorizationMiddleware, this.handleGet);

    this.router
      .route("/:storePath/employees/:employeeId?")
      .get(authorizationMiddleware, this.handleGetEmployees)
      .post(authorizationMiddleware, this.handlePostEmployee)
      .delete(authorizationMiddleware, this.handleDeleteEmployee);
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
      const nodes = await this.stores.list();
      res.json(nodes);
    } catch (err) {
      console.error(err);
      res.sendStatus(500);
    }
  };

  private handlePostEmployee = async (req: Request, res: Response) => {
    const targetStore = await this.stores.get(req.params.storePath);
    if (targetStore == null) {
      return res
        .status(404)
        .send({ error: `No store with path=${req.params.storePath}` });
    }

    const newEmployee: ICreateEmployee = {
      nodePath: targetStore.path,
      ...req.body,
    };

    let created: IEmployee;
    try {
      created = await this.employees.create(newEmployee);
    } catch (err) {
      console.error(err);
      return res.status(400).send({ error: err });
    }

    res.status(201).json(created);
  };

  public handleDeleteEmployee = async (req: Request, res: Response) => {
    console.log(`storePath=${req.params.storePath}`);
    const targetStore = await this.stores.get(req.params.storePath);
    if (targetStore == null) {
      return res
        .status(404)
        .send({ error: `No store with path=${req.params.storePath}` });
    }

    try {
      await this.employees.delete(req.params.employeeId);
    } catch (err) {
      console.error(err);
      res.sendStatus(400);
    }
    res.sendStatus(204);
  };
}

interface IStoreRepo {
  list(): Promise<IStore[]>;
  get(path: string): Promise<IStore | null>;
  create(node: Pick<IStore, "name">): Promise<IStore>;
  delete(id: string): Promise<void>;
}

type ICreateEmployee = Omit<IEmployee, "_id">;

interface IEmployeeRepo {
  get(): Promise<IEmployee[]>;
  at(path: string, deep?: boolean, role?: Role): Promise<IEmployee[]>;
  create(employee: ICreateEmployee): Promise<IEmployee>;
  delete(id: string): Promise<void>;
}

type IPostEmployee = Omit<ICreateEmployee, "nodePath">;

export {
  StoreRouter,
  IStoreRepo,
  IEmployeeRepo,
  ICreateEmployee,
  IPostEmployee,
};
