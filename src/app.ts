import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cookieParser from "cookie-parser";
import cloudinary from "cloudinary";
import fileUpload from "express-fileupload";
import config from "config";
import cors from "cors";
import { authRoute, userRoute, postRoute, testRoute } from "./routes";
import { errorHandler } from "./middlewares";

const app = express();

// using swagger
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
const swaggerDocument = YAML.load("./swagger.yaml");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// middlewares
app.use(
  cors({
    credentials: true,
    origin: config.get<string>("frontendUrl"),
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/temp/",
  })
);

// cloudinary config
cloudinary.v2.config({
  cloud_name: config.get<string>("cloudName"),
  api_key: config.get<string>("apiKey"),
  api_secret: config.get<string>("apiSecret"),
});

// using routes
app.use("/api/v1", testRoute);
app.use("/api/v1", authRoute);
app.use("/api/v1", userRoute);
app.use("/api/v1", postRoute);

app.use(errorHandler);
export default app;
