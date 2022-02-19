import { Response, Request, NextFunction } from "express";

const errorHandler = async (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let status = 500;
  let message = "internal server error";

  if (err.status) {
    status = err.status;
    message = err.message;
  }

  res.status(status).json({ message });
};

export default errorHandler;
