import test from "ava";
import express from "express";
import { StoreRouter } from "../store/router";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connect } from "mongoose";
import { Seeder } from "mongo-seeding";
import path from "path";
import { IEmployee, Role } from "../employee/employee";

let stores: express.Express;
let mongod: MongoMemoryServer;

const storePath = "srbija.grad-beograd.vracar";

test.before("setup", async () => {
  // const repo = sinon.createStubInstance(MongoRepo);
  mongod = await MongoMemoryServer.create();
  await connect(mongod.getUri());

  // seed the database with test data
  const seeder = new Seeder({ database: mongod.getUri() });
  const collections = seeder.readCollectionsFromPath(path.resolve("seed"));
  await seeder.import(collections);

  stores = express().use(new StoreRouter().router);
});

test.after("teardown", async () => {
  await mongod.stop();
});

test("Retrieve all people (managers+employees) for one node", async (t) => {
  const response = await request(stores).get(`/${storePath}/employees`);
  t.is(response.status, 200);

  // check if it returned a non-empty array
  t.assert(Array.isArray(response.body));
  const res: IEmployee[] = response.body;
  t.not(res.length, 0);

  // check if it returned only employees for the target node
  res.map((e) => t.is(e.nodePath, storePath));
});

test("Retrieve all managers for one node", async (t) => {
  const response = await request(stores).get(
    `/${storePath}/employees?role=manager`
  );
  t.is(response.status, 200);

  // check if it returned a non-empty array
  t.assert(Array.isArray(response.body));
  const res: IEmployee[] = response.body;
  t.not(res.length, 0);

  // check if it returs only employees for the target node
  res.map((e) => t.is(e.nodePath, storePath));

  // check if it returns only managers
  res.map((e) => t.is(e.role, Role.Manager));
});

test("Retrieve all employees for one node", async (t) => {
  const response = await request(stores).get(
    `/${storePath}/employees?role=employee`
  );
  t.is(response.status, 200);

  // check if it returned a non-empty array
  t.assert(Array.isArray(response.body));
  const res: IEmployee[] = response.body;
  t.not(res.length, 0);

  // check if it returs only employees for the target node
  res.map((e) => t.is(e.nodePath, storePath));

  // check if it returns only employees
  res.map((e) => t.is(e.role, Role.Employee));
});

// test("Retrieve all employees for one node and all his descendants", async (t) => {
//   const response = await request(stores).get(
//     `/${storePath}/employees?role=employee&deep=true`
//   );
//   t.is(response.status, 200);
// });

// test("Retrieves all managers for one node and all his descendants", async (t) => {
//   const response = await request(stores).get(
//     `/${storePath}/employees?role=manager&deep=true`
//   );
//   t.is(response.status, 200);
// });

test.todo("Can't retrieve anything for an unauthorized node");

test.todo("Create new employee/manager at a node");

test.todo("Delete an employee/manager from a node");

test.todo("Update an employee/manager at a node");
