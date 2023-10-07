import { Request, Response } from "express";
import { IEmployee } from "./employee";
import { MongoRepo } from "./repo";

class EmployeeHandler {
  constructor(private repo = new MongoRepo()) {}

  public handleGet = async (req: Request, res: Response) => {
    try {
      const employees = await this.repo.get();
      res.json(employees);
    } catch (err) {
      console.error(err);
      res.sendStatus(500);
    }
  };

  public handlePost = async (req: Request, res: Response) => {
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

interface IEmployeeRepo {
  get(): Promise<IEmployee[]>;
  create(employee: IEmployee): Promise<IEmployee>;
  delete(id: string): Promise<void>;
}

export { EmployeeHandler, IEmployeeRepo };
