import express, { Request, Response } from "express";
import { MongoRepo } from "./repo";
import { MongoRepo as EmployeeMongoRepo } from "../employee/repo";
import { IStore } from "./store";
import { IEmployee } from "../employee/employee";
import { authorizationMiddleware, managerMiddleware } from "../auth/middleware";
import { Request as JWTRequest } from "express-jwt";

class StoreRouter {
  constructor(
    private stores: IStoreRepo = new MongoRepo(),
    private employees: IEmployeeRepo = new EmployeeMongoRepo(),
    public router = express.Router()
  ) {
    // The following routing logic is ugly because I have to pass the authorization middleware to each endpoint.
    // The reason is that the middleware accesses a route parameter (:storePath) and that is undefined if you
    // try to use the middleware globally (e.g. this.router.use(authorizationMiddleware)).

    // List all managers and create a new manager
    this.router
      .route("/:storePath/managers")
      .get(authorizationMiddleware, managerMiddleware, this.handleGetManagers)
      .post(authorizationMiddleware, managerMiddleware, this.handlePostManager);

    // CRUD operations on a single manager
    this.router
      .route("/:storePath/managers/:managerId")
      .get(authorizationMiddleware, managerMiddleware, this.handleGetManager)
      .delete(
        authorizationMiddleware,
        managerMiddleware,
        this.handleDeleteManager
      )
      .put(
        authorizationMiddleware,
        managerMiddleware,
        this.handleUpdateManager
      );

    // List all employees or create a new employee
    this.router
      .route("/:storePath/employees")
      .get(authorizationMiddleware, this.handleGetEmployees)
      .post(
        authorizationMiddleware,
        managerMiddleware,
        this.handlePostEmployee
      );

    // CRUD operations on a single manager
    this.router
      .route("/:storePath/employees/:employeeId")
      .get(authorizationMiddleware, this.handleGetEmployee)
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

  private handlePostManager = async (req: Request, res: Response) => {
    console.log(`storePath=${req.params.storePath}`);
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

  private handleGetManagers = async (req: JWTRequest, res: Response) => {
    const deep = req.query.deep
      ? (req.query.deep as unknown as boolean)
      : false;

    const managers = await this.employees.managers(req.params.storePath, deep);
    res.json(managers);
  };

  private handleGetManager = async (req: JWTRequest, res: Response) => {
    const manager = await this.employees.manager(req.params.managerId);
    if (!manager) {
      return res
        .status(404)
        .json({ error: `no manager with id=${req.params.managerId}` });
    }

    if (manager.nodePath !== req.params.storePath) {
      return res.status(404).json({
        error: `no manager with id=${req.params.managerId} at store=${req.params.storePath}`,
      });
    }

    return res.json(manager);
  };

  public handleUpdateManager = async (req: Request, res: Response) => {
    // TODO: Check if the given employee belongs to the target store!
    const updated = await this.employees.update(req.params.managerId, req.body);
    if (updated == null) {
      return res
        .status(404)
        .json({ error: `No employee with id=${req.params.employeeId}` });
    }

    res.json(updated);
  };

  public handleDeleteManager = async (req: Request, res: Response) => {
    // TODO: Check if the given employee belongs to the target store!
    await this.employees.delete(req.params.managerId);
    res.sendStatus(204);
  };

  // TODO: implement get by employeeId
  private handleGetEmployees = async (req: JWTRequest, res: Response) => {
    const deep = req.query.deep
      ? (req.query.deep as unknown as boolean)
      : undefined;

    const managers = await this.employees.employees(req.params.storePath, deep);
    res.json(managers);
  };

  private handleGetEmployee = async (req: JWTRequest, res: Response) => {
    const manager = await this.employees.employee(req.params.employeeId);
    if (!manager) {
      return res
        .status(404)
        .json({ error: `no employee with id=${req.params.employeeId}` });
    }

    if (manager.nodePath !== req.params.storePath) {
      return res.status(404).json({
        error: `no employee with id=${req.params.employeeId} at store=${req.params.storePath}`,
      });
    }
    return res.json(manager);
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

    await this.employees.delete(req.params.employeeId);

    res.sendStatus(204);
  };

  public handleUpdateEmployee = async (req: Request, res: Response) => {
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
  managers(path: string, deep?: boolean): Promise<IEmployee[]>;
  manager(id: string): Promise<IEmployee | null>;
  employees(path: string, deep?: boolean): Promise<IEmployee[]>;
  employee(id: string): Promise<IEmployee | null>;
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
