/**
 * @openapi
 * /edit_user:
 *   put:
 *     tags:
 *       - User
 *     summary: Edit authenticated user's profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: User updated
 */
import { getSocket } from "../../../config/connection.js";
import { hashPwd } from "../../../middleware/comparePwd.js";
import { generateToken } from "../../../middleware/generateToken.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

interface BodyParam {
  firstName?: string;
  lastName?: string;
  gender?: string;
  email?: string;
  phone?: string;
  province?: string;
  city?: string;
}

export const editUser = async (req: Request<{}, any, BodyParam>, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const updates: BodyParam = {};
    const allowed: (keyof BodyParam)[] = [
      "firstName",
      "lastName",
      "gender",
      "email",
      "phone",
      "province",
      "city",
    ];

    for (const key of allowed) {
      const val = req.body[key];
      if (typeof val === "string") {
        const trimmed = val.trim();
        if (trimmed.length > 0) updates[key] = trimmed;
      }
    }

    // If email is changing, enforce unique email
    if (updates.email && updates.email.toLowerCase() !== user.email.toLowerCase()) {
      const existing = await User.findOne({
        email: updates.email.toLowerCase(),
        _id: { $ne: user._id },
      }).select("_id");

      if (existing) {
        return res.status(409).json({ message: "Email already in use" });
      }

      updates.email = updates.email.toLowerCase();
    }

    // Apply updates
    Object.assign(user, updates);
    await user.save();

    // return sanitized user (no password)
    const safeUser = await User.findById(user._id).select("-password");

    // Emit socket
    const io = getSocket();
    io?.to(userId.toString()).emit("user_updated", safeUser);

    return res.status(200).json({
      message: "User updated successfully",
      data: safeUser,
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update user.",
    });
  }
};