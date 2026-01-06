/**
 * @swagger
 * /fetch_grp:
 *   get:
 *     summary: Fetch groups for which user is admin
 *     tags: [Group]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Groups list
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
import { Group } from "../../../models/chats/group.js";
import type { Request, Response } from "express";

export const fetchAllGroupByAdmin = async (req: Request, res: Response) => {
  const adminId = req.user.id;

  try {
    const groups = await Group.find({
      admins: adminId,
    });

    return res.status(200).json({
      message: "Groups fetched successfully",
      data: groups,
    });
  } catch (error) {
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to fetch groups",
    });
  }
};
