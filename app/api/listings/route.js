
import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb.js";
import Listing from "../../../models/Listing.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function configureCloudinary() {
  const {
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
  } = process.env;

  if (
    !CLOUDINARY_CLOUD_NAME ||
    !CLOUDINARY_API_KEY ||
    !CLOUDINARY_API_SECRET
  ) {
    throw new Error(
      "Cloudinary environment variables are not configured."
    );
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
}

async function uploadImage(file) {
  if (!file || file.size === 0) {
    return "";
  }

  if (!file.type?.startsWith("image/")) {
    throw new Error("Please upload a valid image file.");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("Image size must not exceed 5 MB.");
  }

  configureCloudinary();

  const buffer = Buffer.from(await file.arrayBuffer());

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "campusrent/listings",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          if (!result?.secure_url) {
            reject(new Error("Cloudinary did not return an image URL."));
            return;
          }

          resolve(result.secure_url);
        }
      )
      .end(buffer);
  });
}

function verifyAdmin(request) {
  const token =
    request.headers.get("x-admin-token") ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) return false;

  if (
    process.env.ADMIN_SECRET &&
    token === process.env.ADMIN_SECRET
  ) {
    return true;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "campusrent_jwt_secret"
    );

    return decoded && decoded.role === "admin";
  } catch {
    return false;
  }
}

// GET: Fetch listings
export async function GET() {
  try {
    await connectDB();

    const listings = await Listing.find({
      status: { $ne: "removed" },
    }).sort({ createdAt: 1 });

    const counts = {};
    const fcfsSellers = {};

    for (const item of listings) {
      const key = item.name.toLowerCase().trim();
      const properName = item.name;

      if (item.status === "available" && item.quantity > 0) {
        counts[key] = (counts[key] || 0) + item.quantity;
      }

      if (!fcfsSellers[properName]) {
        fcfsSellers[properName] = [];
      }

      fcfsSellers[properName].push({
        id: item._id.toString(),
        sellerName: item.ownerName || "Student Seller",
        sellerPhone: item.sellerPhone || "Contact via Admin",
        hostel: item.hostel,
        block: item.block,
        room: item.room,
        price: item.price,
        period: item.period || "day",
        note: item.note,
        quantity: item.quantity,
        status: item.status,
        createdAt: item.createdAt,
      });
    }

    return NextResponse.json({
      listings,
      counts,
      fcfsSellers,
      totalCount: listings.reduce(
        (sum, item) => sum + (item.quantity || 0),
        0
      ),
    });
  } catch (error) {
    console.error("Error fetching listings:", error);

    return NextResponse.json(
      {
        message: "Could not fetch database listings.",
      },
      { status: 500 }
    );
  }
}

// POST: Create listing and upload image
export async function POST(request) {
  try {
    const formData = await request.formData();

    const name = formData.get("name");
    const category = formData.get("category");
    const price = formData.get("price");
    const period = formData.get("period");
    const hostel = formData.get("hostel");
    const block = formData.get("block");
    const room = formData.get("room");
    const note = formData.get("note");
    const emoji = formData.get("emoji");
    const color = formData.get("color");
    const quantity = formData.get("quantity");
    const owner = formData.get("owner");
    const ownerName = formData.get("ownerName");
    const sellerName = formData.get("sellerName");
    const sellerPhone = formData.get("sellerPhone");

    const imageFile = formData.get("photo");

    // Validate product name
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { message: "Product name is required." },
        { status: 400 }
      );
    }

    // Validate image
    if (
      imageFile &&
      typeof imageFile !== "string" &&
      imageFile.size > 0 &&
      !imageFile.type?.startsWith("image/")
    ) {
      return NextResponse.json(
        { message: "Please upload a valid image file." },
        { status: 400 }
      );
    }

    if (
      imageFile &&
      typeof imageFile !== "string" &&
      imageFile.size > MAX_IMAGE_SIZE
    ) {
      return NextResponse.json(
        { message: "Image size must not exceed 5 MB." },
        { status: 400 }
      );
    }

    // Validate price and quantity
    const numericPrice = Number(price || 0);
    const numericQuantity = Number(quantity || 1);

    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      return NextResponse.json(
        { message: "Please enter a valid product price." },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(numericQuantity) ||
      numericQuantity < 1
    ) {
      return NextResponse.json(
        { message: "Quantity must be at least 1." },
        { status: 400 }
      );
    }

    // Connect MongoDB
    await connectDB();

    // Upload image
    let photoUrl = "";

    if (
      imageFile &&
      typeof imageFile !== "string" &&
      imageFile.size > 0
    ) {
      photoUrl = await uploadImage(imageFile);
    }

    const resolvedOwnerName =
      (typeof ownerName === "string" && ownerName.trim()) ||
      (typeof sellerName === "string" && sellerName.trim()) ||
      "Campus Student";

    // Save listing
    const listing = await Listing.create({
      name: name.trim(),

      category:
        typeof category === "string" && category.trim()
          ? category.trim()
          : "Other",

      price: numericPrice,

      period:
        typeof period === "string" && period.trim()
          ? period.trim()
          : "day",

      hostel:
        typeof hostel === "string" && hostel.trim()
          ? hostel.trim()
          : "Kalam",

      block:
        typeof block === "string" && block.trim()
          ? block.trim()
          : "A",

      room: typeof room === "string" ? room.trim() : "",

      note: typeof note === "string" ? note.trim() : "",

      photo: photoUrl,

      emoji:
        typeof emoji === "string" && emoji.trim()
          ? emoji
          : "📦",

      color:
        typeof color === "string" && color.trim()
          ? color
          : "mint",

      quantity: numericQuantity,

      owner:
        typeof owner === "string" &&
        mongoose.Types.ObjectId.isValid(owner)
          ? owner
          : undefined,

      ownerName: resolvedOwnerName,

      sellerPhone:
        typeof sellerPhone === "string"
          ? sellerPhone.trim()
          : "",

      isNegotiable: true,
      status: "available",
    });

    return NextResponse.json(
      {
        message: "Listing created successfully!",
        listing,
      },
      { status: 201 }
    );

  } catch (error) {
    // IMPORTANT: Check Vercel Runtime Logs for this error.
    console.error("Listing creation error:", error);

    return NextResponse.json(
      {
        message: "Could not add product to database.",
        error: error.message || "Unknown server error",
        errorName: error.name || "Error",
      },
      { status: 500 }
    );
  }
}

// PATCH: Update listing (admin only)
export async function PATCH(request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json(
      { message: "Admin authorization required." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    const { id, status, quantity } = body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "A valid listing ID is required." },
        { status: 400 }
      );
    }

    const updateFields = {};

    if (status) {
      const allowedStatuses = [
        "available",
        "rented",
        "lent",
        "sold",
        "removed",
      ];

      if (!allowedStatuses.includes(status)) {
        return NextResponse.json(
          { message: "Invalid listing status." },
          { status: 400 }
        );
      }

      updateFields.status = status;
    }

    if (quantity !== undefined) {
      const parsedQuantity = Number(quantity);

      if (
        !Number.isInteger(parsedQuantity) ||
        parsedQuantity < 0
      ) {
        return NextResponse.json(
          { message: "Invalid quantity." },
          { status: 400 }
        );
      }

      updateFields.quantity = parsedQuantity;
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { message: "No valid update fields provided." },
        { status: 400 }
      );
    }

    await connectDB();

    const updated = await Listing.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json(
        { message: "Listing not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Listing updated successfully.",
      listing: updated,
    });

  } catch (error) {
    console.error("Error updating listing:", error);

    return NextResponse.json(
      { message: "Could not update listing." },
      { status: 500 }
    );
  }
}

// DELETE: Remove product (admin only)
export async function DELETE(request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json(
      { message: "Admin authorization required." },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "A valid product ID is required." },
        { status: 400 }
      );
    }

    await connectDB();

    const deleted = await Listing.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { message: "Listing not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Product removed from database listings.",
    });

  } catch (error) {
    console.error("Error deleting listing:", error);

    return NextResponse.json(
      { message: "Could not remove product." },
      { status: 500 }
    );
  }
}
