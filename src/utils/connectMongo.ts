import mongoose from "mongoose";
import config from "config";
import { logger } from ".";

const dbUri = config.get<string>("dbUri");

const connectMongo = async () => {
  try {
    await mongoose.connect(dbUri);
    logger.info("db connected..");
  } catch (error: any) {
    logger.error("db connection error", error);
    process.exit(1);
  }
};

export default connectMongo;
