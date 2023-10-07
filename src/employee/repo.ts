import { IEmployeeRepo } from "./handler";
import { IEmployee, Employee } from "./employee";

class MongoRepo implements IEmployeeRepo {
  async get(): Promise<IEmployee[]> {
    const nodes = await Employee.find();
    return nodes;
  }

  async create(node: IEmployee): Promise<IEmployee> {
    const created = await Employee.create(node);
    return created;
  }

  async delete(id: string): Promise<void> {
    await Employee.deleteOne({ _id: id });
  }
}

export { MongoRepo };
