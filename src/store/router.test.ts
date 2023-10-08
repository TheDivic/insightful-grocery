import test from "ava";
import request from "supertest";
import express from "express";
import { StoreRouter } from "./router";
import sinon from "sinon";
import { MongoRepo } from "./repo";

let app: express.Express;

test.before("setup", async () => {
  const repo = sinon.createStubInstance(MongoRepo);
  app = express().use(new StoreRouter(repo).router);
});

test("GET /stores", async (t) => {
  const response = await request(app).get("/");
  t.is(response.status, 200);
});

test("POST /stores", async (t) => {
  const response = await request(app).post("/");
  t.is(response.status, 200);
});

test("DELETE /stores", async (t) => {
  const response = await request(app).delete("/");
  t.is(response.status, 204);
});
