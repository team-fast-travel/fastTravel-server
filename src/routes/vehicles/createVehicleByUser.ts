/**
 * @swagger
 * /create_vehicle:
 *   post:
 *     tags:
 *       - Vehicle
 *     summary: Create a vehicle for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - carName
 *               - carType
 *               - carModel
 *               - year
 *               - color
 *               - plateNumber
 *               - vin
 *               - vehiclePhoto
 *               - seats
 *               - vehicleFeatures
 *             properties:
 *               carName:
 *                 type: string
 *                 example: Honda
 *               carType:
 *                 type: string
 *                 example: Sedan
 *               carModel:
 *                 type: string
 *                 example: Accord
 *               year:
 *                 type: integer
 *                 example: 2025
 *               color:
 *                 type: string
 *                 example: Black
 *               plateNumber:
 *                 type: string
 *                 example: SKS-247
 *               vin:
 *                 type: string
 *                 example: 12345678901234567
 *               vehiclePhoto:
 *                 type: string
 *                 format: binary
 *                 description: Image file of the vehicle
 *               seats:
 *                 type: string
 *                 description: JSON string of seats, e.g., '{"front_seat":"2","middle_seat":"2","back_seat":"3"}'
 *                 example: '{"front_seat":"2","middle_seat":"2","back_seat":"3"}'
 *               vehicleFeatures:
 *                 type: string
 *                 description: JSON string array of features, e.g., '["Air Conditioning","Bluetooth"]'
 *                 example: '["Air Conditioning","Bluetooth","Heated Seats"]'
 *     responses:
 *       201:
 *         description: Vehicle created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Vehicle created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Vehicle'
 *       400:
 *         description: Missing fields or invalid data
 *       401:
 *         description: Unauthorized (invalid token)
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

import { getSocket } from "../../config/connection.js";
import { User } from "../../models/users/user.js";
import type { Request, Response } from "express";
import { Vehicle, type VehicleDocument } from "../../models/vehicle/vehicle.js";
import multer from "multer";
import { supabase } from "../../config/supabaseConfig.js";

function parseJsonField<T>(value: unknown, fallback: T): T {
    if (typeof value !== "string") return fallback;
    try {
        return JSON.parse(value) as T;
    } catch {
        return fallback;
    }
}

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
})

export const uploadVehicleImage = upload.single("vehiclePhoto");

type Seats = { front_seat: string; middle_seat: string; back_seat: string };

export const createVehicleByUser = async (req: Request<{}, any, VehicleDocument>, res: Response) => {
    const userId = req.user.userId;
    const { carName, carType, carModel, year, color, plateNumber, vin } = req.body;
    const seats = parseJsonField<Seats>(req.body.seats, { front_seat: "", middle_seat: "", back_seat: "" });
    const vehicleFeatures = parseJsonField<string[]>(req.body.vehicleFeatures, []);

    const vehiclePhoto = req.file;

    if (!vehiclePhoto) return res.status(400).json({ message: "Vehicle photo is required" });
    if (!carName || !carType || !carModel || !year || !color || !plateNumber || !vin || !vehicleFeatures || !seats) {
        return res.status(400).json({ message: "All vechile fields are required" });
    }
    if (!Array.isArray(vehicleFeatures) || vehicleFeatures.length === 0) {
        return res.status(400).json({ message: "Vehicle features are required" });
    }
    if (!seats?.front_seat || !seats?.middle_seat || !seats?.back_seat) {
        return res.status(400).json({ message: "Seats are required" });
    }

    try {
        // Ensure rider exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        };

        // Uploading image
        const fileName = `${Date.now()}-${vehiclePhoto.originalname}`;
        const filePath = `user/vehicles/${user._id}/${fileName}`;

        const bucket = "fast";

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, vehiclePhoto.buffer, {
                contentType: vehiclePhoto.mimetype,
                upsert: true,
            });

        if (uploadError) {
            console.log(uploadError, uploadError.message)
            return res.status(400).json({ message: "Failed to upload image", error: uploadError.message });
        }

        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        const publicUrl = data.publicUrl;

        const newVehicle = await Vehicle.create(
            {
                driverId: user._id,
                carName,
                carType,
                carModel,
                year,
                color,
                plateNumber,
                vin,
                vehicleFeatures,
                vehiclePhoto: publicUrl,
                seats,
                status: 'Under review'
            }
        );

        // Emit socket
        const io = getSocket();
        io?.to(userId.toString()).emit("new_vehicle", newVehicle);

        return res.status(201).json({
            message: "Vehicle created successfully",
            data: newVehicle,
        });
    } catch (error) {
        return res.status(500).json({
            error: error instanceof Error ? error.message : "Failed to create Vehicle",
        });
    }
};
