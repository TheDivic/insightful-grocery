import dotenv from "dotenv";
import { connect, disconnect } from "mongoose";
import { Employee } from "../employee/employee";
import jwt from "jsonwebtoken";

dotenv.config();

const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/grocery";
const JWT_SECRET = process.env.JWT_SECRET || "";

// authenticate generates and signs a new JWT for an arbitrary user, used for local testing.
// Example: ts-node src/scripts/authenticate.ts Dane_Kub@gmail.com
const authenticate = async () => {
  if (process.argv.length !== 3) {
    console.error(`usage: ts-node src/scripts/authenticate.ts <email>`);
    process.exit(1);
  }

  const email = process.argv[2];

  await connect(MONGO_URL, {
    serverSelectionTimeoutMS: 2000,
  });

  const user = await Employee.findOne({ email });
  if (!user) {
    console.error(`no user with email=${email}`);
    process.exit(1);
  }

  const userString = JSON.stringify(user);
  const key = jwt.sign(userString, JWT_SECRET);
  console.log(key);

  await disconnect();
};

authenticate();
