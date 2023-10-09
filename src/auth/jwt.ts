import { IEmployee } from "../employee/employee";
import jwt from "jsonwebtoken";

const generateJWT = (employee: IEmployee, secret: string): string => {
  return jwt.sign(JSON.stringify(employee), secret);
};

export { generateJWT };
