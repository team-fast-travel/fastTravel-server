import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

interface JwtUserPayload extends jwt.JwtPayload {
  id: string;
  email: string;
  // add more if your token includes them
}

declare module "express-serve-static-core" {
  interface Request {
    user?: any;
  }
}

export const authToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access Denied: No Token Provided" });
  }

  try {
    const verified = jwt.verify(
      token,
      process.env.TOKEN_SECRET as string
    ) as JwtUserPayload;

    req.user = verified;

    next();
  } catch (err) {
    return res.status(400).json({
      error: err instanceof Error ? err.message : "Invalid token",
    });
  }
};
