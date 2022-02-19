import express from "express";
const router = express.Router();
import { Request, Response } from "express";

router.get("/healthcheck", (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: "all good" });
});

export default router;
