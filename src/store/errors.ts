import { NextFunction, Request, Response } from "express";

const handleErrors = (
  err: { name: string },
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err.name === "UnauthorizedError") {
    res.status(401).send("invalid token");
  } else if (
    err instanceof PersonNotFoundError ||
    err instanceof StoreNotFoundError
  ) {
    res.status(404).send(err.message);
  } else {
    next(err);
  }
};

class PersonNotFoundError extends Error {
  constructor(storePath: string, personId: string) {
    super(`id=${personId} not found at storePath=${storePath}`);
  }
}

class StoreNotFoundError extends Error {
  constructor(storePath: string) {
    super(`storePath=${storePath} not found`);
  }
}

export { handleErrors, PersonNotFoundError, StoreNotFoundError };
