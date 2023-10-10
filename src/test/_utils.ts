// This contains utility functions shared between tests.
// It's called _utils because we need to prefix it with '_' so Ava doesn't think it's a test.
import { ExecutionContext } from "ava";
import { Employee, IEmployee, Role } from "../employee/employee";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connect } from "mongoose";
import { Seeder } from "mongo-seeding";
import path from "path";
import { generateJWT } from "../auth/jwt";

// findCoworker returns a random coworker of the current user
const findCoworker = async (
  t: ExecutionContext<unknown>,
  currentUser: IEmployee,
  role: Role
): Promise<IEmployee> => {
  const coworkers = await Employee.find({
    nodePath: currentUser.nodePath,
    role,
  });
  t.truthy(coworkers.length);

  const coworker: IEmployee | undefined = coworkers.find(
    (e) => e.email !== currentUser.email
  );
  t.truthy(coworker);

  return coworker!;
};

// connectTestDB connects to an in-memory MongoDB instance
const connectToTestDB = async (): Promise<MongoMemoryServer> => {
  const mongod = await MongoMemoryServer.create();
  await connect(mongod.getUri());
  return mongod;
};

// populateTestDB seeds the in-memory database with test data
const populateTestDB = async (db: MongoMemoryServer) => {
  const seeder = new Seeder({ database: db.getUri() });
  const collections = seeder.readCollectionsFromPath(path.resolve("seed"));
  await seeder.import(collections);
};

// authenticate returns a random user with a given role and path and his signed JWT
const authenticate = async (
  path: string,
  as: Role,
  secret: string
): Promise<{ currentUser: IEmployee; jwt: string }> => {
  const targetStoreManager = await Employee.findOne({
    nodePath: path,
    role: as,
  });
  const currentUser: IEmployee = targetStoreManager!;
  const testJWT = generateJWT(targetStoreManager!, secret);
  return { currentUser, jwt: testJWT };
};

export { findCoworker, connectToTestDB, populateTestDB, authenticate };
