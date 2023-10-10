import test from "ava";
import express from "express";
import { IPostEmployee, StoreRouter } from "../store/router";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { IEmployee, Role } from "../employee/employee";
import { authenticationMiddleware } from "../auth/middleware";
import {
  authenticate,
  connectToTestDB,
  findCoworker,
  populateTestDB,
} from "./_utils";

// Test constants
const AUTHORIZED_STORE = "srbija.grad-beograd.vracar";
const UNAUTHORIZED_STORE = "srbija.vojvodina.severnobacki-okrug";
const JWT_SECRET = "test_secret";

// Dependencies required for tests
let api: express.Express;
let mongod: MongoMemoryServer;
let currentUser: IEmployee;
let testJWT = "";

test.before("setup", async () => {
  // setup & populate a in-memory database
  mongod = await connectToTestDB();
  await populateTestDB(mongod);

  // authenticate the current user
  const auth = await authenticate(AUTHORIZED_STORE, Role.Manager, JWT_SECRET);
  currentUser = auth.currentUser;
  testJWT = auth.jwt;

  // create the test router
  api = express()
    .use(authenticationMiddleware(JWT_SECRET)) // add auth middleware because it's usually set on the app root level
    .use(express.json())
    .use(new StoreRouter().router);
});

test.after("teardown", async () => {
  await mongod.stop();
});

test("(+) retrieve all managers for one node", async (t) => {
  const response = await request(api)
    .get(`/${AUTHORIZED_STORE}/managers`)
    .set("Authorization", `Bearer ${testJWT}`);
  t.is(response.status, 200);

  // check if it returned a non-empty array
  t.assert(Array.isArray(response.body));
  const res: IEmployee[] = response.body;
  t.not(res.length, 0);

  // check if it returs only employees for the target node
  res.map((e) => t.is(e.nodePath, AUTHORIZED_STORE));

  // check if it returns only managers
  res.map((e) => t.is(e.role, Role.Manager));
});

test("(+) retrieve all managers for one node and all his descendants", async (t) => {
  const response = await request(api)
    .get(`/${AUTHORIZED_STORE}/managers?deep=true`)
    .set("Authorization", `Bearer ${testJWT}`);
  t.is(response.status, 200);

  // check if it returned a non-empty array
  t.assert(Array.isArray(response.body));
  const res: IEmployee[] = response.body;
  t.not(res.length, 0);

  // check if it returns only employees for the target node and it's descendants
  res.map((e) => t.assert(e.nodePath.startsWith(AUTHORIZED_STORE)));

  // check that some of the results are descendants and not only belonging to the target node
  t.is(
    res.some(
      (e) =>
        e.nodePath.startsWith(AUTHORIZED_STORE) &&
        e.nodePath !== AUTHORIZED_STORE
    ),
    true
  );

  // check if it returns only managers
  res.map((e) => t.is(e.role, Role.Manager));
});

test("(+) retrieve all employees for one node", async (t) => {
  const response = await request(api)
    .get(`/${AUTHORIZED_STORE}/employees`)
    .set("Authorization", `Bearer ${testJWT}`);
  t.is(response.status, 200);

  // check if it returned a non-empty array
  t.assert(Array.isArray(response.body));
  const res: IEmployee[] = response.body;
  t.not(res.length, 0);

  // check if it returs only employees for the target node
  res.map((e) => t.is(e.nodePath, AUTHORIZED_STORE));

  // check if it returns only employees
  res.map((e) => t.is(e.role, Role.Employee));
});

test("(+) retrieve all employees for one node and all his descendants", async (t) => {
  const response = await request(api)
    .get(`/${AUTHORIZED_STORE}/employees?role=employee&deep=true`)
    .set("Authorization", `Bearer ${testJWT}`);
  t.is(response.status, 200);

  // check if it returned a non-empty array
  t.assert(Array.isArray(response.body));
  const res: IEmployee[] = response.body;
  t.not(res.length, 0);

  // check if it returns only employees for the target node and it's descendants
  res.map((e) => t.assert(e.nodePath.startsWith(AUTHORIZED_STORE)));

  // check that some of the results are descendants and not only belonging to the target node
  t.is(
    res.some(
      (e) =>
        e.nodePath.startsWith(AUTHORIZED_STORE) &&
        e.nodePath !== AUTHORIZED_STORE
    ),
    true
  );

  // check if it returns only employees
  res.map((e) => t.is(e.role, Role.Employee));
});

test("(-) retrieve employees for an unauthorized node", async (t) => {
  const response = await request(api)
    .get(`/${UNAUTHORIZED_STORE}/employees?role=manager&deep=true`)
    .set("Authorization", `Bearer ${testJWT}`);

  t.is(response.status, 403);
});

test("(+) create new manager at a node", async (t) => {
  const newManager: IPostEmployee = {
    name: "Manager Managersky",
    email: "manager.managersky@gmail.com",
    role: Role.Manager,
  };

  const response = await request(api)
    .post(`/${AUTHORIZED_STORE}/employees`)
    .set("Authorization", `Bearer ${testJWT}`)
    .send(newManager);
  t.is(response.status, 201);

  const created: IEmployee = response.body;
  t.is(created.name, newManager.name);
  t.is(created.email, newManager.email);
  t.is(created.role, newManager.role);
  t.is(created.nodePath, AUTHORIZED_STORE);
});

test("(+) create new employee at a node", async (t) => {
  const newEmployee: IPostEmployee = {
    name: "Employee Employsky",
    email: "employee.employsky@gmail.com",
    role: Role.Employee,
  };

  const response = await request(api)
    .post(`/${AUTHORIZED_STORE}/employees`)
    .set("Authorization", `Bearer ${testJWT}`)
    .send(newEmployee);
  t.is(response.status, 201);

  const created: IEmployee = response.body;
  t.is(created.name, newEmployee.name);
  t.is(created.email, newEmployee.email);
  t.is(created.role, newEmployee.role);
  t.is(created.nodePath, AUTHORIZED_STORE);
});

// Ava runs tests concurrently by default, so we need to make this deletion serial
// so it runs before any other tests try to access the deleted node.
// The alternative was to perform DB setup and teardown after each test,
// which would make tests significantly slower.
test.serial("(+) delete an employee from a node", async (t) => {
  const targetEmployee = await findCoworker(t, currentUser, Role.Employee);

  const response = await request(api)
    .delete(`/${AUTHORIZED_STORE}/employees/${targetEmployee!._id}`)
    .set("Authorization", `Bearer ${testJWT}`);

  t.is(response.status, 204);
});

test("(+) update an employee at a node", async (t) => {
  const targetEmployee = await findCoworker(t, currentUser, Role.Employee);

  // update just one property
  const updateOne = { name: "Updated Name" };
  let response = await request(api)
    .put(`/${AUTHORIZED_STORE}/employees/${targetEmployee!._id}`)
    .set("Authorization", `Bearer ${testJWT}`)
    .send(updateOne);
  t.is(response.status, 200);

  t.truthy(response.body);
  t.is(response.body.name, updateOne.name);
  t.is(response.body.email, targetEmployee.email);
  t.is(response.body.role, targetEmployee.role);
  t.is(response.body.nodePath, AUTHORIZED_STORE);

  // now update multiple (all) properties
  const updateMultiple = {
    name: "Updated Name Again",
    email: "updated.email@gmail.com",
    role: Role.Manager,
    nodePath: UNAUTHORIZED_STORE,
  };

  response = await request(api)
    .put(`/${AUTHORIZED_STORE}/employees/${targetEmployee!._id}`)
    .set("Authorization", `Bearer ${testJWT}`)
    .send(updateMultiple);
  t.is(response.status, 200);

  t.truthy(response.body);
  t.is(response.body.name, updateMultiple.name);
  t.is(response.body.email, updateMultiple.email);
  t.is(response.body.role, updateMultiple.role);
  t.is(response.body.nodePath, updateMultiple.nodePath);
});

test.todo("(+) update manager");

test.todo("(-) delete manager");
