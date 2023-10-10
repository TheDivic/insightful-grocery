import express, { Request, Response } from "express";
import { MongoRepo } from "./repo";
import { MongoRepo as EmployeeMongoRepo } from "../employee/repo";
import { IStore } from "./store";
import { IEmployee, Role } from "../employee/employee";
import { authorizationMiddleware, managerMiddleware } from "../auth/middleware";
import { Request as JWTRequest } from "express-jwt";

class StoreRouter {
  constructor(
    private stores: IStoreRepo = new MongoRepo(),
    private employees: IEmployeeRepo = new EmployeeMongoRepo(),
    public router = express.Router()
  ) {
    this.router
      .route("/:storePath/managers/:managerId?")
      .get(authorizationMiddleware, managerMiddleware, this.handleGetManagers)
      .post(authorizationMiddleware, managerMiddleware, this.handlePostEmployee)
      .delete(
        authorizationMiddleware,
        managerMiddleware,
        this.handleDeleteEmployee
      )
      .put(
        authorizationMiddleware,
        managerMiddleware,
        this.handleUpdateEmployee
      );

    this.router
      .route("/:storePath/employees/:employeeId?")
      .get(authorizationMiddleware, this.handleGetEmployees)
      .post(authorizationMiddleware, managerMiddleware, this.handlePostEmployee)
      .delete(
        authorizationMiddleware,
        managerMiddleware,
        this.handleDeleteEmployee
      )
      .put(
        authorizationMiddleware,
        managerMiddleware,
        this.handleUpdateEmployee
      );
  }

  // TODO: implement get by managerId
  private handleGetManagers = async (req: JWTRequest, res: Response) => {
    const deep = req.query.deep
      ? (req.query.deep as unknown as boolean)
      : undefined;

    const managers = await this.employees.managers(req.params.storePath, deep);
    res.json(managers);
  };

  // TODO: implement get by managerId
  private handleGetEmployees = async (req: JWTRequest, res: Response) => {
    const deep = req.query.deep
      ? (req.query.deep as unknown as boolean)
      : undefined;

    const managers = await this.employees.employees(req.params.storePath, deep);
    res.json(managers);
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

    // TODO: Check if the given employee belongs to the target store!
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
    const targetStore = await this.stores.get(req.params.storePath);
    if (targetStore == null) {
      return res
        .status(404)
        .send({ error: `No store with path=${req.params.storePath}` });
    }

    // TODO: Check if the given employee belongs to the target store!
    await this.employees.delete(req.params.employeeId);

    res.sendStatus(204);
  };

  public handleUpdateEmployee = async (req: Request, res: Response) => {
    const targetStore = await this.stores.get(req.params.storePath);
    if (targetStore == null) {
      return res
        .status(404)
        .json({ error: `No store with path=${req.params.storePath}` });
    }

    // TODO: Check if the given employee belongs to the target store!
    const updated = await this.employees.update(
      req.params.employeeId,
      req.body
    );
    if (updated == null) {
      return res
        .status(404)
        .json({ error: `No employee with id=${req.params.employeeId}` });
    }

    res.json(updated);
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
  managers(path: string, deep?: boolean): Promise<IEmployee[]>;
  employees(path: string, deep?: boolean): Promise<IEmployee[]>;
  create(employee: ICreateEmployee): Promise<IEmployee>;
  delete(id: string): Promise<void>;
  update(
    id: string,
    fields: Partial<ICreateEmployee>
  ): Promise<IEmployee | null>;
}

type IPostEmployee = Omit<ICreateEmployee, "nodePath">;

export {
  StoreRouter,
  IStoreRepo,
  IEmployeeRepo,
  ICreateEmployee,
  IPostEmployee,
};
