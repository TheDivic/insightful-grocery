import { IPostEmployee } from "./types";
import { IEmployee, Employee, Role } from "./employee";

// IStoreRepo is the interface for the Employee DB layer.
// The actual MongoImplementation is below, but prefer referencing the interface,
// because then we can change the implementation without touching the actual interface.
interface IEmployeeRepo {
  managers(storePath: string, deep?: boolean): Promise<IEmployee[]>;
  manager(storePath: string, id: string): Promise<IEmployee | null>;
  employees(storePath: string, deep?: boolean): Promise<IEmployee[]>;
  employee(storePath: string, id: string): Promise<IEmployee | null>;
  create(storePath: string, employee: IPostEmployee): Promise<IEmployee>;
  delete(storePath: string, id: string, role: Role): Promise<boolean>;
  update(
    storePath: string,
    id: string,
    role: Role,
    fields: Partial<IPostEmployee>
  ): Promise<IEmployee | null>;
}

class MongoRepo implements IEmployeeRepo {
  async create(storePath: string, employee: IPostEmployee): Promise<IEmployee> {
    return Employee.create({
      nodePath: storePath,
      ...employee,
    });
  }

  async delete(storePath: string, id: string, role: Role): Promise<boolean> {
    const what = await Employee.deleteOne({
      _id: id,
      nodePath: storePath,
      role,
    });

    return what.deletedCount > 0;
  }

  async update(
    storePath: string,
    id: string,
    role: Role,
    fields: Partial<IPostEmployee>
  ): Promise<IEmployee | null> {
    return Employee.findOneAndUpdate(
      { _id: id, nodePath: storePath, role: role },
      fields,
      {
        new: true,
      }
    );
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

  async manager(storePath: string, id: string): Promise<IEmployee | null> {
    return Employee.findOne({
      _id: id,
      nodePath: storePath,
      role: Role.Manager,
    });
  }

  async employee(storePath: string, id: string): Promise<IEmployee | null> {
    return Employee.findOne({
      _id: id,
      nodePath: storePath,
      role: Role.Employee,
    });
  }
}

export { MongoRepo, IEmployeeRepo };
