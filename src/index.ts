import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import { connect } from "mongoose";
import yargs from "yargs";
import jwt from "jsonwebtoken";

import { StoreRouter } from "./store/router";
import { Employee, Role } from "./employee/employee";

dotenv.config();

const GROCERY_PORT = +(process.env.GROCERY_PORT || "8080");
const MONGO_URL = process.env.MONGO_URL || "mongodb://mongodb:27017/grocery";
const MONGO_TIMEOUT_MS = +(process.env.MONGO_TIMEOUT || "2000");

async function main() {
  const api = express();

  console.log("connecting to MongoDB...");
  try {
    await connect(MONGO_URL, {
      serverSelectionTimeoutMS: MONGO_TIMEOUT_MS,
    });
  } catch (err) {
    console.error(`failed to connect to MongoDB: ${err}`);
    process.exit(1);
  }

  const args = yargs
    .option("auth", {
      type: "string",
    })
    .option("superuser", {
      type: "string",
    })
    .parseSync();

  if (args.superuser) {
    const superuser = await Employee.create({
      name: "SuperUser",
      email: args.superuser,
      nodePath: "/",
      role: Role.SuperUser,
    });
    console.log(JSON.stringify(superuser, null, "  "));

    process.exit(0);
  }

  if (args.auth) {
    console.log(`q=${args.auth}`);
    const user = await Employee.findOne({ email: args.auth });
    const userString = JSON.stringify(user);

    const key = jwt.sign(userString, "SUPER_SECRET");
    console.log(key);

    process.exit(0);
  }

  api.use(express.json());

  // global error handler
  api.use(
    (
      err: { name: string },
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      if (err.name === "UnauthorizedError") {
        res.status(401).send("invalid token...");
      } else {
        next(err);
      }
    }
  );

  api.get("/ping", (req, res) => {
    res.send("pong");
  });

  api.use("/nodes", new StoreRouter().router);

  api.listen(GROCERY_PORT, () => {
    console.log(`Grocery API listening on :${GROCERY_PORT}`);
  });
}

main();
