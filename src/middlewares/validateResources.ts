import { Request, Response, NextFunction } from "express";
import { AnyZodObject } from "zod";
import { CustomErrorHandler } from "../utils";

const validateResources =
  (schema: AnyZodObject) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: any) {
      const err = JSON.parse(error.message);
      return next(new CustomErrorHandler(422, err[0].message));
    }
  };

export default validateResources;
