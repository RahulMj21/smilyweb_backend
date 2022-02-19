import express from "express";
import { AuthController } from "../controllers";
import { deserializeUser, validateResources } from "../middlewares";
import loginSchema from "../schema/login.schema";
import { createUserSchema } from "../schema/user.schema";
const router = express.Router();

router
  .route("/register")
  .post(validateResources(createUserSchema), AuthController.register);

router
  .route("/login")
  .post(validateResources(loginSchema), AuthController.login);

router.route("/auth/google/callback").get(AuthController.googleAuth);

router.route("/logout").get(deserializeUser, AuthController.logout);

export default router;
