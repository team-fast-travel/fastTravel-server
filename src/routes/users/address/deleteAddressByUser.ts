/**
 * @swagger
 * /delete_address/{addressId}:
 *   delete:
 *     summary: Delete an address
 *     tags: [Address]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *         description: The address ID
 *     responses:
 *       200:
 *         description: Address deleted
 *       400:
 *         description: Bad request
 *       404:
 *         description: Address not found
 *       500:
 *         description: Server error
 */
import { getSocket } from "../../../config/connection.js";
import { Address } from "../../../models/users/address.js";
import { User } from "../../../models/users/user.js";
import type { Request, Response } from "express";

export const deleteAddressByUser = async (req: Request<{addressId: string}>, res: Response) => {
    const userId = req.user.userId;
    const { addressId } = req.params;

    if(!addressId) {
        return res.status(400).json({
            messgae: "Address ID is required"
        })
    }

    try {
        // Ensure rider exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        };

        // Ensure address exists
        const address = await Address.findById(addressId);
        if (!address) return res.status(404).json({ message: "Address not found" });

        if (address.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }

        await Address.findByIdAndDelete(addressId);

        // Emit socket
        const io = getSocket();
        io?.to(userId.toString()).emit("address_deleted", address);

        return res.status(200).json({
            message: "Address deleted successfully",
            data: address,
        });
    } catch (error) {
        return res.status(500).json({
            error:
                error instanceof Error ? error.message : "Failed to delete address",
        });
    }
};
