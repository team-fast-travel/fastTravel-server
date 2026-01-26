import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";

export const generateToken = (userId: string) => {
  const token = jwt.sign({ userId }, process.env.TOKEN, { expiresIn: '7d' });
  console.log("JWT ISSUED:", token);

  return token;
}

export const generateRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
};