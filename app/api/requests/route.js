
import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import connectDB from "../../../lib/mongodb";
import Request from "../../../models/Request";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const allowedTypes = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export async function POST(request) {
  let savedPhotoPath = null;

  try {
    const formData = await request.formData();

    const itemId = String(formData.get("itemId") || "").trim();
    const itemName = String(formData.get("itemName") || "").trim();
    const mode = String(formData.get("mode") || "").trim();
    const hostel = String(formData.get("hostel") || "").trim();
    const block = String(formData.get("block") || "").trim();
    const room = String(formData.get("room") || "").trim();
    const userId = String(formData.get("userId") || "").trim();
    const photo = formData.get("photo");

    if (
      !itemId ||
      !itemName ||
      !["rent", "buy"].includes(mode) ||
      !hostel ||
      !block ||
      !room ||
      !userId
    ) {
      return NextResponse.json(
        { message: "Please fill in all required fields." },
        { status: 400 }
      );
    }

    let photoUrl = "";

    if (mode === "rent" && (!photo || typeof photo.arrayBuffer !== "function")) {
      return NextResponse.json(
        { message: "Please upload a photo for a rental request." },
        { status: 400 }
      );
    }

    if (photo && typeof photo.arrayBuffer === "function" && photo.size > 0) {
      if (!allowedTypes[photo.type]) {
        return NextResponse.json(
          { message: "Upload a JPG, PNG, or WebP image." },
          { status: 400 }
        );
      }

      if (photo.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { message: "Image size must be 5 MB or less." },
          { status: 400 }
        );
      }

      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });

      const filename = `${randomUUID()}${allowedTypes[photo.type]}`;
      const absolutePath = path.join(uploadDir, filename);

      const bytes = Buffer.from(await photo.arrayBuffer());
      await writeFile(absolutePath, bytes);

      savedPhotoPath = absolutePath;
      photoUrl = `/uploads/${filename}`;
    }

    await connectDB();

    const newRequest = await Request.create({
      itemId,
      itemName,
      mode,
      hostel,
      block,
      room,
      userId,
      photo: photoUrl,
    });

    return NextResponse.json(
      {
        message: "Request submitted successfully.",
        request: {
          id: newRequest._id.toString(),
          mode: newRequest.mode,
          itemName: newRequest.itemName,
          photo: newRequest.photo,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (savedPhotoPath) {
      const { unlink } = await import("node:fs/promises");
      await unlink(savedPhotoPath).catch(() => {});
    }

    console.error("Request submission error:", error);

    return NextResponse.json(
      { message: "Could not submit your request. Please try again." },
      { status: 500 }
    );
  }
}
