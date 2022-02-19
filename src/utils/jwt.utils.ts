import jwt from "jsonwebtoken";
import { get } from "lodash";
import { Session, User } from "../models";
import config from "config";
class JWT {
  signJwt = (
    payload: Object,
    key: string,
    options: jwt.SignOptions | undefined
  ) => {
    const secret = Buffer.from(key, "base64").toString("ascii");

    const token = jwt.sign(payload, secret, {
      ...(options && options),
      algorithm: "RS256",
    });
    return token;
  };
  verifyJwt = (token: string, key: string) => {
    try {
      const secret = Buffer.from(key, "base64").toString("ascii");
      const decoded = jwt.verify(token, secret);
      return {
        expired: false,
        decoded,
      };
    } catch (error: any) {
      return {
        expired: true,
        decoded: null,
      };
    }
  };

  reIssueAccessToken = async (
    refreshToken: string,
    refreshTokenSecret: string
  ) => {
    try {
      const tokenSecret = Buffer.from(refreshTokenSecret, "base64").toString(
        "ascii"
      );
      const decoded = jwt.verify(refreshToken, tokenSecret);
      if (!decoded) return false;
      const user = await User.findById(get(decoded, "_id"));
      if (!user) return false;
      const session = await Session.findById(get(decoded, "session"));
      if (!session) return false;

      const secret = Buffer.from(
        config.get<string>("accessTokenPrivateKey"),
        "base64"
      ).toString("ascii");
      const accessToken = jwt.sign(
        {
          ...user.toJSON(),
          session: session._id,
        },
        secret,
        {
          algorithm: "RS256",
          expiresIn: config.get<string>("accessTokenTl"),
        }
      );

      return accessToken;
    } catch (error: any) {
      return false;
    }
  };
}

export default new JWT();
