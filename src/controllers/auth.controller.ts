import { NextFunction, Request, Response } from "express";
import {
  BigPromise,
  createTokenAndSetCookie,
  CustomErrorHandler,
} from "../utils";
import { get, omit } from "lodash";
import { CreateUserInput } from "../schema/user.schema";
import config from "config";
import {
  createUser,
  findUser,
  validatePassword,
} from "../services/user.service";
import { createOrUpdate, createSession } from "../services/session.service";
import {
  findAndUpdateUser,
  getGoogleUserData,
  getGoogleUserDetails,
} from "../services/googleAuth.service";
import { Session } from "../models";

class AuthController {
  register = BigPromise(
    async (
      req: Request<{}, {}, CreateUserInput["body"]>,
      res: Response,
      next: NextFunction
    ) => {
      // find if the user exists or not
      let user;
      user = await findUser({ email: req.body.email });
      if (user) return next(new CustomErrorHandler(409, "email already taken"));

      // create user
      user = await createUser(req.body);

      // create session
      const session = await createSession({
        user: get(user, "_id"),
        userAgent: req.get("user-agent") || "",
      });
      if (!session)
        return next(new CustomErrorHandler(500, "Oops.. something went wrong"));

      createTokenAndSetCookie(user, get(session, "_id"), res);

      // send response
      res.status(201).json({
        success: true,
        message: "user created successfully",
        user: omit(user, [
          "__v",
          "session",
          "iat",
          "exp",
          "updatedAt",
          "forgotPasswordExpiry",
          "forgotPasswordToken",
        ]),
      });
    }
  );

  login = BigPromise(
    async (req: Request, res: Response, next: NextFunction) => {
      // find if the user exists or not
      const user = await validatePassword(req.body);
      if (!user)
        return next(new CustomErrorHandler(400, "wrong email or password"));

      // create session
      const session = await createOrUpdate(
        {
          user: user._id,
          userAgent: req.get("user-agent") || "",
        },
        {
          user: user._id,
          userAgent: req.get("user-agent") || "",
        },
        { new: true, upsert: true }
      );
      if (!session)
        return next(new CustomErrorHandler(500, "Oops.. something went wrong"));

      createTokenAndSetCookie(user, get(session, "_id"), res);

      // send response
      res.status(200).json({
        success: true,
        message: "logged in successfully",
        user: omit(user, [
          "__v",
          "session",
          "iat",
          "exp",
          "updatedAt",
          "forgotPasswordExpiry",
          "forgotPasswordToken",
        ]),
      });
    }
  );

  googleAuth = BigPromise(
    async (req: Request, res: Response, next: NextFunction) => {
      const code = get(req, "query.code");
      const { access_token, id_token } = await getGoogleUserData(code);
      const userDetails = await getGoogleUserDetails(id_token, access_token);
      if (!userDetails.verified_email)
        return new CustomErrorHandler(403, "Google account is not verified");

      const user = await findAndUpdateUser(
        {
          email: userDetails.email,
        },
        {
          name: userDetails.name,
          email: userDetails.email,
          isLoggedInWithGoogle: true,
        },
        {
          new: true,
          upsert: true,
        }
      );
      if (!user)
        return next(new CustomErrorHandler(500, "Oops..something went wrong"));

      const session = await createOrUpdate(
        {
          user: user._id,
          userAgent: req.get("user-agent") || "",
        },
        {
          user: user._id,
          userAgent: req.get("user-agent") || "",
        },
        { new: true, upsert: true }
      );

      if (!session)
        return next(new CustomErrorHandler(500, "Oops..something went wrong"));

      createTokenAndSetCookie(user, get(session, "_id"), res);

      // send response
      res.status(200).redirect(config.get("frontendUrl"));
    }
  );

  logout = BigPromise(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = res.locals.user;
      const session = await Session.findOne({
        _id: user.session,
      });

      if (!session)
        return next(new CustomErrorHandler(500, "Oops..something went wrong"));

      session.remove();
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      res.status(200).json({
        success: true,
        message: "logged out successfully",
      });
    }
  );
}

export default new AuthController();
