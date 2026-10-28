import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb.js";
import Listing from "../../../models/Listing.js";
import mongoose from "mongoose";

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      name,
      category,
      price,
      hostel,
      block,
      room,
      note,
      photo,
      owner,
    } = body;

    if (
      !name?.trim() ||
      !hostel?.trim() ||
      !block?.trim() ||
      !room?.trim() ||
      !photo ||
      !owner
    ) {
      return NextResponse.json(
        { message: "Please provide the item photo and all required details." },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(owner)) {
      return NextResponse.json(
        { message: "Invalid user. Please log in again." },
        { status: 400 }
      );
    }

    await connectDB();

    const listing = await Listing.create({
      name: name.trim(),
      category: category || "Other",
      price: Number(price) || 0,
      hostel: hostel.trim(),
      block: block.trim(),
      room: room.trim(),
      note: note || "",
      photo,
      owner,
    });

    return NextResponse.json(
      { message: "Listing created successfully.", listing },
      { status: 201 }
    );
  } catch (error) {
    console.error("Listing creation error:", error);

    return NextResponse.json(
      { message: "Could not create listing. Check the server terminal." },
      { status: 500 }
    );
  }
}
