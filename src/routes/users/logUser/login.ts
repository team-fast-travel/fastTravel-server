/**
 * @openapi
 * /login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in
 */
import { comparePwd } from "../../../middleware/comparePwd.js";
import { generateToken } from "../../../middleware/generateToken.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

interface BodyParam {
    email: string;
    password: string;
}

export const login = async (req: Request<{}, any, BodyParam>, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: 'Email and Password field are required'
        })
    }

    try {
        // Ensure user exist
        const user = await User.findOne({ email }).select("-password");

        if (!user) {
            return res.status(404).json({ error: "User does not exist" });
        }

        // Validate password
        const validPwd = await comparePwd({ email, password }, User);
        if (!validPwd) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const token = generateToken(user._id.toString())
        return res.status(200).json({
            message: "Login Successful",
            data: user,
            token: token
        });
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error
                ? error.message
                : "Failed to login",
        });
    }
}