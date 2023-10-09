import { ICreateEmployee, IEmployeeRepo } from "../store/router";
import { IEmployee, Employee, Role } from "./employee";

class MongoRepo implements IEmployeeRepo {
  async get(): Promise<IEmployee[]> {
    const employees = await Employee.find();
    return employees;
  }

  async at(path: string, deep = false, role?: Role): Promise<IEmployee[]> {
    const filter: { nodePath?: string | RegExp; role?: Role } = {
      nodePath: deep ? new RegExp(`${path}`) : path,
    };
    if (role) {
      filter.role = role;
    }
    const employees = await Employee.find(filter);
    return employees;
  }

  async create(employee: ICreateEmployee): Promise<IEmployee> {
    const created = await Employee.create(employee);
    return created;
  }

  async delete(id: string): Promise<void> {
    await Employee.deleteOne({ _id: id });
  }
}

export { MongoRepo };
