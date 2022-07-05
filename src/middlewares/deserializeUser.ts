import { NextFunction, Request, Response } from "express";
import { get } from "lodash";
import { CustomErrorHandler, JWT } from "../utils";
import ENV from "../../config";

export default async function deserializeUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const accessToken =
    get(req, "cookies.accessToken") ||
    (get(req, "headers.authorization") &&
      get(req, "headers.authorization").replace(/^Bearer\s/, "")) ||
    false;

  const refreshToken =
    get(req, "cookies.refreshToken") || get(req, "headers.x-refresh") || false;

  if (!accessToken && !refreshToken) {
    return next(new CustomErrorHandler(401, "unauthorized user"));
  }

  if (accessToken) {
    const { decoded, expired } = JWT.verifyJwt(
      accessToken,
      ENV.accessTokenPublicKey
    );
    if (decoded && !expired) {
      res.locals.user = decoded;
      return next();
    }
  } else if (refreshToken) {
    const newAccessToken = await JWT.reIssueAccessToken(
      refreshToken,
      ENV.refreshTokenPublicKey
    );
    if (!newAccessToken)
      return next(new CustomErrorHandler(401, "unauthorized user"));

    res.setHeader("x-access-token", newAccessToken as string);

    res.cookie("accessToken", newAccessToken, {
      maxAge: 1000 * 60 * 60,
      httpOnly: true,
      secure: false,
      path: "/",
    });
    const { decoded, expired } = JWT.verifyJwt(
      newAccessToken,
      ENV.accessTokenPublicKey
    );
    res.locals.user = decoded;
    return next();
  } else {
    return next(new CustomErrorHandler(401, "unauthorized user"));
  }
}
