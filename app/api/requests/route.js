import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import connectDB from "../../../lib/mongodb";
import Request from "../../../models/Request";
import Listing from "../../../models/Listing";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const JWT_SECRET = process.env.JWT_SECRET || "campusrent_jwt_secret";
const DEFAULT_ADMIN_SECRET = process.env.ADMIN_SECRET || "campusadmin123";

const allowedTypes = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

// Helper to verify admin authorization for sensitive endpoints
function verifyAdmin(request) {
  const token =
    request.headers.get("x-admin-token") ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) return false;
  if (token === DEFAULT_ADMIN_SECRET) return true;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded && decoded.role === "admin";
  } catch {
    return false;
  }
}

// GET: Fetch all buyer and rental requests (Admin only)
export async function GET(request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json(
      { message: "Access Denied: Admin authentication required." },
      { status: 401 }
    );
  }

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");
    const status = searchParams.get("status");

    const filter = {};
    if (mode && mode !== "all") filter.mode = mode;
    if (status && status !== "all") filter.status = status;

    const requests = await Request.find(filter).sort({ createdAt: -1 });

    return NextResponse.json({ requests }, { status: 200 });
  } catch (error) {
    console.error("Error fetching requests:", error);
    return NextResponse.json(
      { message: "Could not fetch requests." },
      { status: 500 }
    );
  }
}

// POST: Submit a new rental or buy request (Public for students)
export async function POST(request) {
  try {
    const formData = await request.formData();

    const itemId = String(formData.get("itemId") || "").trim();
    const itemName = String(formData.get("itemName") || "").trim();
    const mode = String(formData.get("mode") || "rent").trim();
    const hostel = String(formData.get("hostel") || "Kalam").trim();
    const block = String(formData.get("block") || "A").trim() || "A";
    const room = String(formData.get("room") || "").trim();
    const userId = String(formData.get("userId") || "").trim() || `user_${Date.now()}`;
    const userName = String(formData.get("userName") || "").trim() || "Campus Student";
    const phone = String(formData.get("phone") || "").trim();
    const photo = formData.get("photo");

    if (!itemId || !itemName || !["rent", "buy"].includes(mode)) {
      return NextResponse.json(
        { message: "Please specify the item and whether you want to rent or buy." },
        { status: 400 }
      );
    }

    if (!hostel || !room) {
      return NextResponse.json(
        { message: "Please provide your hostel and room number." },
        { status: 400 }
      );
    }

    if (!phone || phone.replace(/\D/g, "").length < 7) {
      return NextResponse.json(
        { message: "Please enter a valid contact phone number so our admin team can reach you." },
        { status: 400 }
      );
    }

    let photoUrl = "";

    // Photo is OPTIONAL. If provided, store as base64 Data URL to work cleanly on serverless runtimes
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

      const bytes = Buffer.from(await photo.arrayBuffer());
      photoUrl = `data:${photo.type};base64,${bytes.toString("base64")}`;
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
      userName,
      phone,
      photo: photoUrl,
      status: "pending",
    });

    return NextResponse.json(
      {
        message: "Request submitted! Our campus admin will verify your request and contact you at your phone number.",
        request: newRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Request submission error:", error);

    return NextResponse.json(
      { message: error?.message || "Could not submit your request. Please try again." },
      { status: 500 }
    );
  }
}

// PATCH: Admin updates request status (verify, contact, reject, etc.)
export async function PATCH(request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json(
      { message: "Access Denied: Admin authentication required." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { id, status, adminNotes } = body;

    if (!id) {
      return NextResponse.json({ message: "Request ID is required." }, { status: 400 });
    }

    await connectDB();

    const existingReq = await Request.findById(id);
    if (!existingReq) {
      return NextResponse.json({ message: "Request not found." }, { status: 404 });
    }

    const isNewlyApproved =
      (status === "verified" || status === "approved") &&
      existingReq.status !== "verified" &&
      existingReq.status !== "approved";

    // Dynamic stock adjustment upon admin approval:
    if (isNewlyApproved) {
      if (existingReq.mode === "buy") {
        // Buyer approved: decrease available stock in DB
        await Listing.findOneAndUpdate(
          {
            name: new RegExp(`^${existingReq.itemName.trim()}$`, "i"),
            quantity: { $gt: 0 },
          },
          { $inc: { quantity: -1 } }
        );
      } else if (existingReq.mode === "rent") {
        // Rental product approved: increase available stock in DB
        await Listing.findOneAndUpdate(
          {
            name: new RegExp(`^${existingReq.itemName.trim()}$`, "i"),
          },
          { $inc: { quantity: 1 } }
        );
      }
    }

    const updateFields = {};
    if (status) updateFields.status = status;
    if (adminNotes !== undefined) updateFields.adminNotes = adminNotes;

    const updated = await Request.findByIdAndUpdate(id, updateFields, { new: true });

    return NextResponse.json({ message: "Request updated successfully.", request: updated });
  } catch (error) {
    console.error("Error updating request:", error);
    return NextResponse.json({ message: "Could not update request." }, { status: 500 });
  }
}

// DELETE: Admin removes a request
export async function DELETE(request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json(
      { message: "Access Denied: Admin authentication required." },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Request ID is required." }, { status: 400 });
    }

    await connectDB();
    await Request.findByIdAndDelete(id);

    return NextResponse.json({ message: "Request deleted successfully." });
  } catch (error) {
    console.error("Error deleting request:", error);
    return NextResponse.json({ message: "Could not delete request." }, { status: 500 });
  }
}
