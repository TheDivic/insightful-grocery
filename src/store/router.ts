import express, { NextFunction, Request, Response } from "express";
import { IStoreRepo, MongoRepo } from "./repo";
import {
  MongoRepo as EmployeeMongoRepo,
  IEmployeeRepo,
} from "../employee/repo";
import { Role } from "../employee/employee";
import { authorizationMiddleware, managerMiddleware } from "../auth/middleware";
import { Request as JWTRequest } from "express-jwt";
import { body, matchedData, query, validationResult } from "express-validator";
import { PersonNotFoundError, StoreNotFoundError } from "./errors";

class StoreRouter {
  constructor(
    private stores: IStoreRepo = new MongoRepo(),
    private employees: IEmployeeRepo = new EmployeeMongoRepo(),
    public router = express.Router()
  ) {
    // The following routing logic is ugly because I have to pass the authorization middleware to each endpoint directly.
    // The reason is that the middleware accesses a route parameter (:storePath) and that is undefined if you
    // try to use the middleware globally (e.g. this.router.use(authorizationMiddleware)).
    const requireManager = [authorizationMiddleware, managerMiddleware];

    // List all managers and create a new manager
    this.router
      .route("/:storePath/managers")
      .get(
        ...requireManager,
        query("deep").optional().default(false),
        this.handleGetManagers
      )
      .post(
        ...requireManager,
        body("email").isEmail().notEmpty(),
        body("name").notEmpty().isLength({ max: 100 }),
        this.handlePostManager
      );

    // CRUD operations on a single manager
    this.router
      .route("/:storePath/managers/:managerId")
      .get(...requireManager, this.handleGetManager)
      .delete(...requireManager, this.handleDeleteManager)
      .put(
        ...requireManager,
        body("email").optional().isEmail(),
        body("name").optional().isLength({ max: 100 }),
        body("nodePath").optional().isLength({ max: 10000 }), // sanity check
        body("role").optional().isIn([Role.Manager, Role.Employee]),
        this.handleUpdateManager
      );

    // List all employees or create a new employee
    this.router
      .route("/:storePath/employees")
      .get(
        authorizationMiddleware, // available for employees too
        query("deep").optional().default(false),
        this.handleGetEmployees
      )
      .post(
        ...requireManager,
        body("email").isEmail().notEmpty(),
        body("name").notEmpty().isLength({ max: 100 }),
        this.handlePostEmployee
      );

    // CRUD operations on a single employee
    this.router
      .route("/:storePath/employees/:employeeId")
      .get(authorizationMiddleware, this.handleGetEmployee) // available for employees too
      .delete(...requireManager, this.handleDeleteEmployee)
      .put(
        ...requireManager,
        body("email").optional().isEmail(),
        body("name").optional().isLength({ max: 100 }),
        body("nodePath").optional().isLength({ max: 10000 }), // sanity check
        body("role").optional().isIn([Role.Manager, Role.Employee]),
        this.handleUpdateEmployee
      );
  }

  private handlePostManager = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = validationResult(req);
      if (!result.isEmpty()) {
        return res.status(400).json({ errors: result.array() });
      }
      const valid = matchedData(req);

      const targetStore = await this.stores.get(req.params.storePath);
      if (targetStore == null) {
        throw new StoreNotFoundError(req.params.storePath);
      }

      const created = await this.employees.create(targetStore.path, {
        email: valid.email,
        name: valid.name,
        role: Role.Manager,
      });

      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  };

  private handleGetManagers = async (
    req: JWTRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = validationResult(req);
      if (!result.isEmpty()) {
        return res.status(400).json({ errors: result.array() });
      }
      const valid = matchedData(req);

      const targetStore = await this.stores.get(req.params.storePath);
      if (targetStore == null) {
        throw new StoreNotFoundError(req.params.storePath);
      }

      const managers = await this.employees.managers(
        req.params.storePath,
        valid.deep
      );
      res.json(managers);
    } catch (err) {
      next(err);
    }
  };

  private handleGetManager = async (
    req: JWTRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const manager = await this.employees.manager(
        req.params.storePath,
        req.params.managerId
      );

      if (!manager) {
        throw new PersonNotFoundError(
          req.params.storePath,
          req.params.managerId
        );
      }

      return res.json(manager);
    } catch (err) {
      next(err);
    }
  };

  public handleUpdateManager = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const updated = await this.employees.update(
        req.params.storePath,
        req.params.managerId,
        Role.Manager,
        req.body
      );

      if (updated == null) {
        throw new PersonNotFoundError(
          req.params.storePath,
          req.params.managerId
        );
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  };

  public handleDeleteManager = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const deleted = await this.employees.delete(
        req.params.storePath,
        req.params.managerId,
        Role.Manager
      );

      if (!deleted) {
        throw new PersonNotFoundError(
          req.params.storePath,
          req.params.managerId
        );
      }

      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  };

  private handleGetEmployees = async (
    req: JWTRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = validationResult(req);
      if (!result.isEmpty()) {
        return res.status(400).json({ errors: result.array() });
      }
      const valid = matchedData(req);

      const employees = await this.employees.employees(
        req.params.storePath,
        valid.deep
      );

      res.json(employees);
    } catch (err) {
      next(err);
    }
  };

  private handleGetEmployee = async (
    req: JWTRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const manager = await this.employees.employee(
        req.params.storePath,
        req.params.employeeId
      );

      if (!manager) {
        throw new PersonNotFoundError(
          req.params.storePath,
          req.params.employeeId
        );
      }

      return res.json(manager);
    } catch (err) {
      next(err);
    }
  };

  private handlePostEmployee = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const targetStore = await this.stores.get(req.params.storePath);
      if (targetStore == null) {
        throw new StoreNotFoundError(req.params.storePath);
      }

      const created = await this.employees.create(targetStore.path, {
        email: req.body.email,
        name: req.body.name,
        role: Role.Employee,
      });

      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  };

  public handleDeleteEmployee = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const deleted = await this.employees.delete(
        req.params.storePath,
        req.params.employeeId,
        Role.Employee
      );

      if (!deleted) {
        throw new PersonNotFoundError(
          req.params.storePath,
          req.params.employeeId
        );
      }

      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  };

  public handleUpdateEmployee = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const updated = await this.employees.update(
        req.params.storePath,
        req.params.employeeId,
        Role.Employee,
        req.body
      );

      if (updated == null) {
        throw new PersonNotFoundError(
          req.params.storePath,
          req.params.employeeId
        );
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  };
}

export { StoreRouter };
