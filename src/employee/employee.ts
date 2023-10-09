import { Schema, model, Types } from "mongoose";

enum Role {
  Employee = "employee",
  Manager = "manager",
  SuperUser = "superuser",
}

interface IEmployee {
  _id: Types.ObjectId;
  name: string;
  email: string;
  nodePath: string;
  role: Role;
}

const employeeSchema = new Schema<IEmployee>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  nodePath: { type: String, required: true, index: "text" },
  role: { type: String, enum: Role, required: true },
});

const Employee = model<IEmployee>("Employee", employeeSchema);

export { IEmployee, Employee, Role };
