import { Schema, model } from "mongoose";

enum Role {
  Employee = "employee",
  Manager = "manager",
  SuperUser = "superuser",
}

interface IEmployee {
  name: string;
  email: string;
  nodePath: string;
  role: Role;
}

const employeeSchema = new Schema<IEmployee>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  nodePath: { type: String, required: true },
  role: { type: String, enum: Role, required: true },
});

const Employee = model<IEmployee>("Employee", employeeSchema);

export { IEmployee, Employee, Role };
