import { NextFunction, Request, Response } from "express";
import { BigPromise, CustomErrorHandler } from "../utils";
import { get, omit } from "lodash";
import {
  deleteUser,
  findAllUsers,
  findUser,
  updatePassword,
} from "../services/user.service";
import { UpdatePasswordInput } from "../schema/updatePassword.schema";
import ENV from "../../config";
import sendMail from "../utils/sendMail";
import { ResetPasswordInput } from "../schema/resetPassword.schema";
import { User } from "../models";
import { uploadImage, deleteImage } from "../utils/cloudinaryHelper";
import crypto from "crypto";

class UserController {
  getLoggedInUser = BigPromise(
    async (req: Request, res: Response, next: NextFunction) => {
      const userFromCookie = get(res, "locals.user");
      if (!userFromCookie)
        return next(new CustomErrorHandler(401, "unauthorized user"));

      const user = await User.findById(userFromCookie._id);

      res.status(200).json({
        success: true,
        user: omit(user, [
          "__v",
          "password",
          "updatedAt",
          "forgotPasswordExpiry",
          "forgotPasswordToken",
        ]),
      });
    }
  );

  forgotPassword = BigPromise(
    async (req: Request, res: Response, next: NextFunction) => {
      const accessToken =
        get(req, "cookies.accessToken") ||
        (get(req, "headers.authorization") &&
          get(req, "headers.authorization").replace(/^Bearer\s/, "")) ||
        false;

      const refreshToken =
        get(req, "cookies.refreshToken") ||
        get(req, "headers.x-refresh") ||
        false;

      if (accessToken || refreshToken) {
        return next(
          new CustomErrorHandler(403, "you are not allowed to this route")
        );
      }

      const email = get(req, "body.email");
      if (!email)
        return next(new CustomErrorHandler(422, "please provide your email"));

      const user = await User.findOne({ email });
      if (!user)
        return next(
          new CustomErrorHandler(403, "no user found with that email")
        );

      if (user.isLoggedInWithGoogle) {
        return next(new CustomErrorHandler(400, "bad request"));
      }
      const token = user.getForgotPasswordToken();
      if (!token)
        return next(new CustomErrorHandler(500, "Oops..something went wrong"));
      const uri = `${ENV.frontendUrl}/auth/resetpassword/${token}`;
      const data = {
        to: user.email,
        html: `<p>click the given link to reset your password <br>
                  <a href=${uri}>
                     ${uri}
                  </a>
                </p>`,
      };

      const info = await sendMail(data);
      if (!info)
        return next(new CustomErrorHandler(500, "Oops.. mail cannot be sent"));

      res.status(200).json({
        success: true,
        message: "password reset link sent to your email",
      });
    }
  );

  resetPassword = BigPromise(
    async (
      req: Request<{}, {}, ResetPasswordInput["body"]>,
      res: Response,
      next: NextFunction
    ) => {
      const token = get(req, "params.token");
      if (!token) return next(new CustomErrorHandler(400, "bad request"));

      const [expiry, randomString] = token.split(".bR");

      const forgotPasswordToken = crypto
        .createHmac("sha256", ENV.forgotPasswordTokenSecret)
        .update(`${randomString}.${expiry}`)
        .digest("hex");

      const user = await User.findOne({
        forgotPasswordToken,
      });

      if (!user) return next(new CustomErrorHandler(400, "bad request"));

      if (!(user.forgotPasswordExpiry > Date.now()))
        return next(new CustomErrorHandler(400, "reset link expired"));

      user.password = req.body.password;
      user.forgotPasswordToken = "";
      user.forgotPasswordExpiry = 0;
      user.save();

      return res.status(200).json({
        success: true,
        message: "password reset successfull",
      });
    }
  );

  updatePassword = BigPromise(
    async (
      req: Request<{}, {}, UpdatePasswordInput["body"]>,
      res: Response,
      next: NextFunction
    ) => {
      const user = res.locals.user;

      const { currentPassword, newPassword } = get(req, "body");

      const updatedUser = await updatePassword({
        id: user._id,
        currentPassword,
        newPassword,
      });

      if (!updatedUser)
        return next(new CustomErrorHandler(404, "can't update password"));

      return res.status(200).json({
        success: true,
        message: "password updated",
      });
    }
  );

  updateUserAvatar = BigPromise(
    async (req: Request, res: Response, next: NextFunction) => {
      const avatar =
        get(req, "files.avatar") || get(req, "body.avatar") || null;
      if (!avatar)
        return next(
          new CustomErrorHandler(
            422,
            " please select a photo to update profile pic"
          )
        );

      const user = await User.findById(get(res, "locals.user._id"));
      if (!user) return next(new CustomErrorHandler(400, "user not found"));

      if (user.avatar.public_id !== "") {
        const result = await deleteImage(user.avatar.public_id);
        if (!result)
          return next(
            new CustomErrorHandler(500, "Oops..something went wrong")
          );
      }

      const uploadableFile =
        typeof avatar === "object" ? avatar.tempFilePath : avatar;

      const result = await uploadImage(uploadableFile, {
        folder: `/socialmedia/${get(user, "_id")}/avatar`,
        width: 200,
        crop: "scale",
      });
      if (!result)
        return next(new CustomErrorHandler(500, "Oops..something went wrong"));

      user.avatar = {
        public_id: result.public_id,
        secure_url: result.secure_url,
      };
      user.save({ validateBeforeSave: false });

      return res.status(200).json({
        success: true,
        message: "profile updated successfully",
      });
    }
  );

  updateUserDetails = BigPromise(
    async (req: Request, res: Response, next: NextFunction) => {
      const _id = get(res, "locals.user._id");
      if (!get(req, "body.name") && !get(req, "body.email")) {
        return next(new CustomErrorHandler(400, "nothing to update"));
      }

      const user = await User.findById(_id);
      if (!user) return next(new CustomErrorHandler(404, "user not found"));

      user.name = get(req, "body.name") || user.name;
      user.email = get(req, "body.email") || user.email;
      user.save({ validateBeforeSave: false });

      res.status(200).json({
        success: true,
        message: "user updated successfully",
      });
    }
  );

  getAllUsers = BigPromise(
    async (req: Request, res: Response, next: NextFunction) => {
      const users = await findAllUsers();
      if (!users)
        return next(new CustomErrorHandler(500, "Oops..something went wrong"));

      return res.status(200).json({
        success: true,
        users,
      });
    }
  );

  getSingleUser = BigPromise(
    async (req: Request, res: Response, next: NextFunction) => {
      const _id = get(req, "params.id");
      if (!_id)
        return next(
          new CustomErrorHandler(
            400,
            "user id dosen't exist on the request params"
          )
        );

      const user = await findUser({ _id });
      if (!user) return next(new CustomErrorHandler(404, "user not found"));

      res.status(200).json({
        success: true,
        user: omit(
          user,
          "password",
          "__v",
          "updatedAt",
          "forgotPasswordExpiry",
          "forgotPasswordToken"
        ),
      });
    }
  );

  deleteUser = BigPromise(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = get(res, "locals.user");
      const id = get(req, "params.id");
      if (!id)
        return next(
          new CustomErrorHandler(
            400,
            "user id dosen't exist on the request params"
          )
        );
      if (user._id === id)
        return next(new CustomErrorHandler(404, "you can't delete yourself"));

      const isDeleted = await deleteUser(id);
      if (!isDeleted)
        return next(new CustomErrorHandler(404, "user not found"));

      res.status(200).json({
        success: true,
        message: "user deleted",
      });
    }
  );

  doFollowUser = BigPromise(
    async (req: Request, res: Response, next: NextFunction) => {
      const loggedInUser = res.locals.user;
      const user = await User.findById(get(req, "params.id"));
      if (!user) return next(new CustomErrorHandler(404, "user not found"));

      if (
        user.followers.find(
          (follower) => follower.user.toString() === loggedInUser._id.toString()
        )
      ) {
        return res
          .status(200)
          .json({ success: true, message: "already following" });
      }

      const newFollowers = [...user.followers, { user: loggedInUser._id }];
      user.followers = newFollowers as [{ user: any }];
      user.save({ validateBeforeSave: false });

      const currentUpdatedUser = await User.findByIdAndUpdate(
        loggedInUser._id,
        {
          following: [...loggedInUser.following, { user: user._id }],
        },
        {
          new: true,
        }
      );
      if (!currentUpdatedUser)
        return new CustomErrorHandler(500, "Oops..something went wrong");

      res
        .status(200)
        .json({ success: true, message: `following ${user.name}` });
    }
  );

  doUnFollowUser = BigPromise(
    async (req: Request, res: Response, next: NextFunction) => {
      const loggedInUser = res.locals.user;
      const user = await User.findById(get(req, "params.id"));
      if (!user) return next(new CustomErrorHandler(404, "user not found"));

      if (
        !user.followers.find(
          (follower) => follower.user.toString() === loggedInUser._id.toString()
        )
      ) {
        return res
          .status(200)
          .json({ success: true, message: "you are not following the user" });
      }

      const newFollowers = user.followers.filter(
        (follower) => follower.user.toString() !== loggedInUser._id.toString()
      );

      const newFollowings = loggedInUser.following.filter(
        (following: { user: string }) =>
          following.user.toString() !== user.toString()
      );

      user.followers = newFollowers as [{ user: any }];
      user.save({ validateBeforeSave: false });

      const currentUpdatedUser = await User.findByIdAndUpdate(
        loggedInUser._id,
        {
          following: newFollowings,
        },
        {
          new: true,
        }
      );

      if (!currentUpdatedUser)
        return new CustomErrorHandler(500, "Oops..something went wrong");

      res.status(200).json({
        success: true,
        message: `now you are not following ${user.name}`,
      });
    }
  );
}

export default new UserController();
