import { supabase } from "../config/supabaseConfig.js";
import type { Multer } from "multer";
import type { Express } from "express";

// Multer file interface
type MulterFile = Express.Multer.File;

export async function uploadFileToSupabase(
  file: MulterFile,
  folder: string
): Promise<string> {
  const fileName = `${Date.now()}-${file.originalname}`;
  const filePath = `${folder}/${fileName}`;

  const { data, error } = await supabase.storage
    .from("fastTravel")
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    console.error("Supabase upload error:", error);
    throw new Error(error.message);
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from("yumunity")
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}
