import test from "ava";
import express from "express";
import { StoreRouter } from "../store/router";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connect } from "mongoose";
import { Seeder } from "mongo-seeding";
import path from "path";
import { Employee, IEmployee, Role } from "../employee/employee";
import { authenticationMiddleware } from "../auth/middleware";
import { generateJWT } from "../auth/jwt";

let stores: express.Express;
let mongod: MongoMemoryServer;

const storePath = "srbija.grad-beograd.vracar";
const TEST_JWT_SECRET = "test_secret";
let testJWT = "";

test.before("setup", async () => {
  // connect to an in-memory Mongo instance for tests
  mongod = await MongoMemoryServer.create();
  await connect(mongod.getUri());

  // seed the database with test data
  const seeder = new Seeder({ database: mongod.getUri() });
  const collections = seeder.readCollectionsFromPath(path.resolve("seed"));
  await seeder.import(collections);

  const targetStoreManager = await Employee.findOne({
    nodePath: storePath,
    role: Role.Manager,
  });
  testJWT = generateJWT(targetStoreManager!, TEST_JWT_SECRET);

  // create the test router
  stores = express()
    .use(authenticationMiddleware(TEST_JWT_SECRET)) // add auth middleware because it's usually set on the app root level
    .use(new StoreRouter().router);
});

test.after("teardown", async () => {
  await mongod.stop();
});

test("Retrieve all people (managers+employees) for one node", async (t) => {
  const response = await request(stores)
    .get(`/${storePath}/employees`)
    .set("Authorization", `Bearer ${testJWT}`);
  t.is(response.status, 200);

  // check if it returned a non-empty array
  t.assert(Array.isArray(response.body));
  const res: IEmployee[] = response.body;
  t.not(res.length, 0);

  // check if it returned only employees for the target node
  res.map((e) => t.is(e.nodePath, storePath));
});

test("Retrieve all managers for one node", async (t) => {
  const response = await request(stores)
    .get(`/${storePath}/employees?role=manager`)
    .set("Authorization", `Bearer ${testJWT}`);
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
  const response = await request(stores)
    .get(`/${storePath}/employees?role=employee`)
    .set("Authorization", `Bearer ${testJWT}`);
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

test("Retrieve all employees for one node and all his descendants", async (t) => {
  const response = await request(stores)
    .get(`/${storePath}/employees?role=employee&deep=true`)
    .set("Authorization", `Bearer ${testJWT}`);
  t.is(response.status, 200);

  // check if it returned a non-empty array
  t.assert(Array.isArray(response.body));
  const res: IEmployee[] = response.body;
  t.not(res.length, 0);

  // check if it returns only employees for the target node and it's descendants
  res.map((e) => t.assert(e.nodePath.startsWith(storePath)));

  // check that some of the results are descendants and not only belonging to the target node
  t.is(
    res.some(
      (e) => e.nodePath.startsWith(storePath) && e.nodePath !== storePath
    ),
    true
  );

  // check if it returns only employees
  res.map((e) => t.is(e.role, Role.Employee));
});

test("Retrieves all managers for one node and all his descendants", async (t) => {
  const response = await request(stores)
    .get(`/${storePath}/employees?role=manager&deep=true`)
    .set("Authorization", `Bearer ${testJWT}`);
  t.is(response.status, 200);

  // check if it returned a non-empty array
  t.assert(Array.isArray(response.body));
  const res: IEmployee[] = response.body;
  t.not(res.length, 0);

  // check if it returns only employees for the target node and it's descendants
  res.map((e) => t.assert(e.nodePath.startsWith(storePath)));

  // check that some of the results are descendants and not only belonging to the target node
  t.is(
    res.some(
      (e) => e.nodePath.startsWith(storePath) && e.nodePath !== storePath
    ),
    true
  );

  // check if it returns only managers
  res.map((e) => t.is(e.role, Role.Manager));
});

test("Can't retrieve anything for an unauthorized node", async (t) => {
  const unauthorizedNode = "srbija.vojvodina.severnobacki-okrug";

  const response = await request(stores)
    .get(`/${unauthorizedNode}/employees?role=manager&deep=true`)
    .set("Authorization", `Bearer ${testJWT}`);
  t.is(response.status, 403);
});

test.todo("Create new employee/manager at a node");

test.todo("Delete an employee/manager from a node");

test.todo("Update an employee/manager at a node");
