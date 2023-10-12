import express from "express";
import dotenv from "dotenv";
import { connect } from "mongoose";

import { StoreRouter } from "./store/router";
import { handleErrors } from "./store/errors";
import { authenticationMiddleware } from "./auth/middleware";

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
    return;
  }

  // JSON middleware
  api.use(express.json());

  // Global error handler
  api.use(handleErrors);

  // Basic ping endpoint used for health checks
  api.get("/ping", (req, res) => {
    res.send("pong");
  });

  // Stores API
  api.use("/stores", authenticationMiddleware(), new StoreRouter().router);

  api.listen(GROCERY_PORT, () => {
    console.log(`Grocery API listening on :${GROCERY_PORT}`);
  });
}

main();
