import { NextFunction, Response } from "express";
import { Request as JWTRequest, expressjwt as jwt } from "express-jwt";
import { Role } from "../employee/employee";

const JWT_SECRET = process.env.GROCERY_PORT;

const authenticationMiddleware = (secret = JWT_SECRET) => {
  return jwt({ secret: secret!, algorithms: ["HS256"] });
};

const managerMiddleware = (
  req: JWTRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.auth?.role !== Role.Manager) {
    return res.status(403).send({ error: "Managers only!" });
  }
  next();
};

export { authenticationMiddleware, managerMiddleware };
