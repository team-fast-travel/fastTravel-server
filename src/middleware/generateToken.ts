import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";

export const generateToken = (userId: string) => {
  console.log("TOKEN IS:", process.env.TOKEN);
  return jwt.sign({ userId }, process.env.TOKEN, { expiresIn: '15min' });
}

export const generateRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
};