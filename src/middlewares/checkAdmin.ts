import { NextFunction, Response, Request } from "express";
import { CustomErrorHandler } from "../utils";
import { get } from "lodash";

const checkAdmin =
  (...roles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const user = get(res, "locals.user");
    if (roles.includes(user.role)) {
      return next();
    } else {
      return next(
        new CustomErrorHandler(403, "you are not authorized for this route")
      );
    }
  };

export default checkAdmin;
