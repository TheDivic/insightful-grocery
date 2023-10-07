import express from "express";
import { EmployeeHandler } from "./handler";
import { MongoRepo } from "./repo";

function employeeRouter(repo = new MongoRepo()): express.Router {
  const handler = new EmployeeHandler(repo);
  const router = express.Router();
  router
    .route("/:employeeId?")
    .get(handler.handleGet)
    .post(handler.handlePost)
    .delete(handler.handleDelete);

  return router;
}

export { employeeRouter };
