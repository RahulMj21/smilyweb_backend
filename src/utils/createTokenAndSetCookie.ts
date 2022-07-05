import { Response } from "express";
import ENV from "../../config";
import { JWT } from "../utils";

const accessTokenPrivateKey = ENV.accessTokenPrivateKey as string;
const refreshTokenPrivateKey = ENV.refreshTokenPrivateKey as string;
const accessTokenTl = ENV.accessTokenTl;
const refreshTokenTl = ENV.refreshTokenTl;

export default function createTokenAndSetCookie(
  user: Object,
  session: string,
  res: Response
) {
  const tokenData = {
    ...user,
    session,
  };

  const accessToken = JWT.signJwt(tokenData, accessTokenPrivateKey, {
    expiresIn: accessTokenTl,
  });
  const refreshToken = JWT.signJwt(tokenData, refreshTokenPrivateKey, {
    expiresIn: refreshTokenTl,
  });

  // set cookies
  res.cookie("accessToken", accessToken, {
    maxAge: 1000 * 60 * 60,
    httpOnly: true,
    secure: false,
    path: "/",
  });
  res.cookie("refreshToken", refreshToken, {
    maxAge: 1000 * 60 * 60 * 24 * 365,
    httpOnly: true,
    secure: false,
    path: "/",
  });
}
