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

const AUTHORIZED_STORE = "srbija.grad-beograd.vracar";
const UNAUTHORIZED_STORE = "srbija.vojvodina.severnobacki-okrug";
const JWT_SECRET = "foobar";

let stores: express.Express;
let mongod: MongoMemoryServer;
let currentUser: IEmployee;
let testJWT = "";

test.before("setup", async () => {
  // setup & populate a in-memory database
  mongod = await connectToTestDB();
  await populateTestDB(mongod);

  // authenticate the current user
  const auth = await authenticate(AUTHORIZED_STORE, Role.Employee, JWT_SECRET);
  currentUser = auth.currentUser;
  testJWT = auth.jwt;

  // create the test router
  stores = express()
    .use(authenticationMiddleware(JWT_SECRET)) // add auth middleware because it's usually set on the app root level
    .use(express.json())
    .use(new StoreRouter().router);
});

test.after("teardown", async () => {
  await mongod.stop();
});

test("(+) retrieve all employees for one node", async (t) => {
  const response = await request(stores)
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
  const response = await request(stores)
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

test("(-) retrieve managers for authorized node", async (t) => {
  const response = await request(stores)
    .get(`/${AUTHORIZED_STORE}/managers`)
    .set("Authorization", `Bearer ${testJWT}`);
  t.is(response.status, 403);
});

test("(-) retrieve employees from an unauthorized node", async (t) => {
  const response = await request(stores)
    .get(`/${UNAUTHORIZED_STORE}/employees?deep=true`)
    .set("Authorization", `Bearer ${testJWT}`);

  t.is(response.status, 403);
});

test("(-) create employees", async (t) => {
  const newEmployee: IPostEmployee = {
    name: "Employee Employsky",
    email: "employee.employsky@gmail.com",
    role: Role.Employee,
  };

  const response = await request(stores)
    .post(`/${AUTHORIZED_STORE}/employees`)
    .set("Authorization", `Bearer ${testJWT}`)
    .send(newEmployee);

  t.is(response.status, 403);
});

test("(-) delete employees", async (t) => {
  const targetEmployee = await findCoworker(t, currentUser, Role.Employee);

  const response = await request(stores)
    .delete(`/${AUTHORIZED_STORE}/employees/${targetEmployee!._id}`)
    .set("Authorization", `Bearer ${testJWT}`);

  t.is(response.status, 403);
});

test("(-) update employees", async (t) => {
  const targetEmployee = await findCoworker(t, currentUser, Role.Employee);

  const updateOne = { name: "Updated Name" };
  const response = await request(stores)
    .put(`/${AUTHORIZED_STORE}/employees/${targetEmployee!._id}`)
    .set("Authorization", `Bearer ${testJWT}`)
    .send(updateOne);

  t.is(response.status, 403);
});
