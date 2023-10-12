import { IEmployee } from "./employee";

// IPostEmployee contains all of the employee properties except the id,
// which is generated on insert and the nodePath which is passed as a route parameter.
type IPostEmployee = Omit<IEmployee, "_id" | "nodePath">;

export { IPostEmployee };
