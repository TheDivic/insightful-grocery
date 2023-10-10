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

  async update(
    id: string,
    fields: Partial<ICreateEmployee>
  ): Promise<IEmployee | null> {
    return Employee.findByIdAndUpdate(id, fields, { new: true });
  }

  async managers(path: string, deep?: boolean): Promise<IEmployee[]> {
    const filter = {
      nodePath: deep ? new RegExp(`${path}`) : path,
      role: Role.Manager,
    };

    return Employee.find(filter);
  }

  async employees(path: string, deep?: boolean): Promise<IEmployee[]> {
    const filter = {
      nodePath: deep ? new RegExp(`${path}`) : path,
      role: Role.Employee,
    };

    return Employee.find(filter);
  }
}

export { MongoRepo };
