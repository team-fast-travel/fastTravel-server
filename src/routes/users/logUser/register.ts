import { hashPwd } from "../../../middleware/comparePwd.js";
import { generateToken } from "../../../middleware/generateToken.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

interface BodyParam {
    firstName: string;
    lastName: string;
    gender: string;
    email: string;
    phone: string;
    password: string;
    province: string;
    city: string;
}

export const register = async (req: Request<{}, any, BodyParam>, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: 'Email and Password field are required'
        })
    }

    try {
        // Ensure that email isn't already used
        if (await User.findOne({ email })) {
            return res.status(409).json({ error: "Email already exists." });
        }

        const user = await User.create({
            email, 
            password: await hashPwd(password),
        })

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
                : "Failed to register new account.",
        });
    }
}
