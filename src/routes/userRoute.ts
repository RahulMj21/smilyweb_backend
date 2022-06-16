import express from "express";
import { UserController } from "../controllers";
import { checkAdmin, deserializeUser, validateResources } from "../middlewares";
import { ResetPasswordSchema } from "../schema/resetPassword.schema";
import { UpdatePasswordSchema } from "../schema/updatePassword.schema";
import { updateUserSchema } from "../schema/updateUserSchema";

const router = express.Router();

router.route("/me").get(deserializeUser, UserController.getLoggedInUser);

router
  .route("/users")
  .get(deserializeUser, checkAdmin("admin"), UserController.getAllUsers);

router
  .route("/user/:id")
  .get(deserializeUser, UserController.getSingleUser)
  .delete(deserializeUser, checkAdmin("admin"), UserController.deleteUser);

router
  .route("/user/password/update")
  .put(
    validateResources(UpdatePasswordSchema),
    deserializeUser,
    UserController.updatePassword
  );

router.route("/user/password/forgot").post(UserController.forgotPassword);

router
  .route("/user/password/reset/:token")
  .put(validateResources(ResetPasswordSchema), UserController.resetPassword);

router
  .route("/user/details/update")
  .put(
    validateResources(updateUserSchema),
    deserializeUser,
    UserController.updateUserDetails
  );

router
  .route("/user/avatar/update")
  .put(deserializeUser, UserController.updateUserAvatar);

router
  .route("/user/follow/:id")
  .put(deserializeUser, UserController.doFollowUser);

router
  .route("/user/unfollow/:id")
  .put(deserializeUser, UserController.doUnFollowUser);

export default router;
