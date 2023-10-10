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
  const coworker = await Employee.findOne({
    nodePath: currentUser.nodePath,
    role: role.toString(),
    _id: { $ne: currentUser._id },
  });
  t.truthy(coworker, `no coworker with role=${role} found`);

  return coworker!;
};

// findExternal returns a random person who works in a store outside of your scope (another branch in the tree)
const findExternal = async (
  t: ExecutionContext<unknown>,
  currentUser: IEmployee,
  role: Role
) => {
  const external = await Employee.findOne({
    nodePath: { $ne: new RegExp(currentUser.nodePath) },
    role,
  });
  t.truthy(external);
  return external!;
};

const findDescendant = async (
  t: ExecutionContext<unknown>,
  currentUser: IEmployee,
  role: Role
) => {
  const external = await Employee.findOne({
    nodePath: {
      $ne: currentUser.nodePath,
      $regex: new RegExp(currentUser.nodePath),
    },
    role,
  });
  t.truthy(external);
  t.not(external?.nodePath, currentUser.nodePath);

  return external!;
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

export {
  findCoworker,
  connectToTestDB,
  populateTestDB,
  authenticate,
  findExternal,
  findDescendant,
};
