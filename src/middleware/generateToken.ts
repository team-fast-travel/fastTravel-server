import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";

export const generateToken = (userId: string) => {
    return jwt.sign({ userId }, process.env.TOKEN, { expiresIn: '15min' });
}