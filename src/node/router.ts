import express from "express";
import { NodeHandler } from "./handler";
import { MongoRepo } from "./repo";
import { managerMiddleware } from "../auth/middleware";

function nodeRouter(repo = new MongoRepo()): express.Router {
  const handler = new NodeHandler(repo);
  const router = express.Router();
  router
    .use(managerMiddleware)
    .route("/:nodeId?")
    .get(handler.handleGetNodes)
    .post(handler.handlePostNode)
    .delete(handler.handleDeleteNode);

  return router;
}

export { nodeRouter };
