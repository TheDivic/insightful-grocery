import test from "ava";
import express from "express";
import { ICreateEmployee, IPostEmployee, StoreRouter } from "../store/router";
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

let currentUser: IEmployee;
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
  currentUser = targetStoreManager!;
  testJWT = generateJWT(targetStoreManager!, TEST_JWT_SECRET);

  // create the test router
  stores = express()
    .use(authenticationMiddleware(TEST_JWT_SECRET)) // add auth middleware because it's usually set on the app root level
    .use(express.json())
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

test("Create new manager at a node", async (t) => {
  const newManager: IPostEmployee = {
    name: "Manager Managersky",
    email: "manager.managersky@gmail.com",
    role: Role.Manager,
  };

  const response = await request(stores)
    .post(`/${storePath}/employees`)
    .set("Authorization", `Bearer ${testJWT}`)
    .send(newManager);
  t.is(response.status, 201);

  const created: IEmployee = response.body;
  t.is(created.name, newManager.name);
  t.is(created.email, newManager.email);
  t.is(created.role, newManager.role);
  t.is(created.nodePath, storePath);
});

test("Create new employee at a node", async (t) => {
  const newEmployee: IPostEmployee = {
    name: "Employee Employsky",
    email: "employee.employsky@gmail.com",
    role: Role.Employee,
  };

  const response = await request(stores)
    .post(`/${storePath}/employees`)
    .set("Authorization", `Bearer ${testJWT}`)
    .send(newEmployee);
  t.is(response.status, 201);

  const created: IEmployee = response.body;
  t.is(created.name, newEmployee.name);
  t.is(created.email, newEmployee.email);
  t.is(created.role, newEmployee.role);
  t.is(created.nodePath, storePath);
});

test("Delete an employee/manager from a node", async (t) => {
  // find an employee in my store that's not me
  const storeEmployees = await Employee.find({ nodePath: storePath });
  t.truthy(storeEmployees.length);

  const targetEmployee: IEmployee | undefined = storeEmployees.find(
    (e) => e.email !== currentUser.email
  );
  t.truthy(targetEmployee);

  const response = await request(stores)
    .delete(`/${storePath}/employees/${targetEmployee!._id}`)
    .set("Authorization", `Bearer ${testJWT}`);
  t.is(response.status, 204);
});

test.todo("Update an employee/manager at a node");
