import test from "ava";
import request from "supertest";
import express from "express";
import { employeeRouter } from "./router";
import sinon from "sinon";
import { MongoRepo } from "./repo";

let app: express.Express;

test.before("setup", async () => {
  const repo = sinon.createStubInstance(MongoRepo);
  app = express().use(employeeRouter(repo));
});

test("GET /node", async (t) => {
  const response = await request(app).get("/");
  t.is(response.status, 200);
});

test("POST /node", async (t) => {
  const response = await request(app).post("/");
  t.is(response.status, 200);
});

test("DELETE /node", async (t) => {
  const response = await request(app).delete("/");
  t.is(response.status, 204);
});
