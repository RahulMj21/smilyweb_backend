import axios from "axios";
import config from "config";
import { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import qs from "qs";
import { User } from "../models";
import { UserDocument } from "../models/user.model";
import { logger } from "../utils";

interface GoogleTokensResult {
  access_token: string;
  expires_in: Number;
  refresh_token: string;
  scope: string;
  id_token: string;
}

export async function getGoogleUserData(
  code: string
): Promise<GoogleTokensResult> {
  const url = "https://oauth2.googleapis.com/token";
  const values = {
    code,
    client_id: config.get<string>("googleClientId"),
    client_secret: config.get<string>("googleClientSecret"),
    redirect_uri: config.get("googleRedirectUri"),
    grant_type: "authorization_code",
  };
  try {
    const res = await axios.post<GoogleTokensResult>(
      url,
      qs.stringify(values),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return res.data;
  } catch (error: any) {
    logger.error(error, "google data fetching error");
    throw new Error("google data fetching error");
  }
}

export interface GoogleUserResult {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

export async function getGoogleUserDetails(
  id_token: string,
  access_token: string
): Promise<GoogleUserResult> {
  try {
    const res = await axios.get<GoogleUserResult>(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
      {
        headers: {
          Authorization: `Bearer ${id_token}`,
        },
      }
    );
    return res.data;
  } catch (error: any) {
    logger.error(error, "Error fetching Google user");
    throw new Error(error.message);
  }
}

export async function findAndUpdateUser(
  query: FilterQuery<UserDocument>,
  update: UpdateQuery<UserDocument>,
  options: QueryOptions = {}
) {
  const user = await User.findOneAndUpdate(query, update, options);
  return user?.toJSON();
}
