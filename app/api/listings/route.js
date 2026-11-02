import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb.js";
import Listing from "../../../models/Listing.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const initialSeedItems = [
  { name: "Cycle", category: "Mobility", price: 60, period: "day", emoji: "🚲", color: "blue", ownerName: "Sana", sellerName: "Sana", sellerPhone: "9876543214", hostel: "Kalam", block: "D", room: "204", note: "Lock included · good brakes", quantity: 1, isNegotiable: true, createdAt: new Date(Date.now() - 86400000 * 3) },
  { name: "Cycle", category: "Mobility", price: 50, period: "day", emoji: "🚲", color: "blue", ownerName: "Rohit", sellerName: "Rohit", sellerPhone: "9876543225", hostel: "Aryabhatta", block: "B", room: "112", note: "Geared mountain cycle", quantity: 1, isNegotiable: true, createdAt: new Date(Date.now() - 86400000 * 2) },
  { name: "Electric kettle", category: "Appliances", price: 25, period: "day", emoji: "🫖", color: "peach", ownerName: "Aarav", sellerName: "Aarav", sellerPhone: "9876543210", hostel: "Kalam", block: "B", room: "305", note: "1.5L · auto shut-off", quantity: 2, isNegotiable: true, createdAt: new Date(Date.now() - 86400000 * 4) },
  { name: "Electric kettle", category: "Appliances", price: 20, period: "day", emoji: "🫖", color: "peach", ownerName: "Priya", sellerName: "Priya", sellerPhone: "9876543211", hostel: "Ashima", block: "A", room: "102", note: "Pigeon electric kettle 1.2L", quantity: 1, isNegotiable: true, createdAt: new Date(Date.now() - 86400000 * 1) },
  { name: "Steam iron", category: "Appliances", price: 20, period: "day", emoji: "👔", color: "lavender", ownerName: "Mehak", sellerName: "Mehak", sellerPhone: "9876543212", hostel: "Aryabhatta", block: "C", room: "219", note: "Quick heat · non-stick soleplate", quantity: 2, isNegotiable: true, createdAt: new Date(Date.now() - 86400000 * 5) },
  { name: "Scientific calculator", category: "Study", price: 15, period: "day", emoji: "🧮", color: "mint", ownerName: "Rishabh", sellerName: "Rishabh", sellerPhone: "9876543213", hostel: "CV Raman", block: "A", room: "401", note: "Casio fx-991EX · exam approved", quantity: 3, isNegotiable: true, createdAt: new Date(Date.now() - 86400000 * 6) },
  { name: "Desk lamp", category: "Study", price: 12, period: "day", emoji: "💡", color: "yellow", ownerName: "Kabir", sellerName: "Kabir", sellerPhone: "9876543215", hostel: "Aryabhatta", block: "A", room: "108", note: "Warm + cool light with USB", quantity: 2, isNegotiable: true, createdAt: new Date(Date.now() - 86400000 * 2) },
  { name: "Bluetooth speaker", category: "Electronics", price: 35, period: "day", emoji: "🔊", color: "pink", ownerName: "Ira", sellerName: "Ira", sellerPhone: "9876543216", hostel: "Ashima", block: "B", room: "201", note: "boAt stone · great bass", quantity: 1, isNegotiable: true, createdAt: new Date(Date.now() - 86400000 * 3) },
  { name: "Extension board", category: "Appliances", price: 10, period: "day", emoji: "🔌", color: "mint", ownerName: "Dev", sellerName: "Dev", sellerPhone: "9876543217", hostel: "Married Accommodation", block: "A", room: "12", note: "4 sockets · 2m cable surge protect", quantity: 4, isNegotiable: true, createdAt: new Date(Date.now() - 86400000 * 7) },
  { name: "Badminton set", category: "Sports", price: 30, period: "day", emoji: "🏸", color: "peach", ownerName: "Ananya", sellerName: "Ananya", sellerPhone: "9876543218", hostel: "Kalam", block: "A", room: "310", note: "Yonex 2 rackets + 3 shuttles", quantity: 2, isNegotiable: true, createdAt: new Date(Date.now() - 86400000 * 4) },
  { name: "Study table", category: "Furniture", price: 45, period: "day", emoji: "🪑", color: "yellow", ownerName: "Riya", sellerName: "Riya", sellerPhone: "9876543219", hostel: "Aryabhatta", block: "B", room: "220", note: "Foldable wooden study desk", quantity: 1, isNegotiable: true, createdAt: new Date(Date.now() - 86400000 * 8) },
  { name: "Room fan", category: "Appliances", price: 30, period: "day", emoji: "🌀", color: "mint", ownerName: "Diya", sellerName: "Diya", sellerPhone: "9876543220", hostel: "Kalam", block: "C", room: "105", note: "High speed table fan", quantity: 2, isNegotiable: true, createdAt: new Date(Date.now() - 86400000 * 3) },
  { name: "Mini refrigerator", category: "Appliances", price: 100, period: "day", emoji: "🧊", color: "blue", ownerName: "Nikhil", sellerName: "Nikhil", sellerPhone: "9876543221", hostel: "Aryabhatta", block: "D", room: "315", note: "Compact 45L fridge in good cooling condition", quantity: 1, isNegotiable: true, createdAt: new Date(Date.now() - 86400000 * 9) },
];

function verifyAdmin(request) {
  const token =
    request.headers.get("x-admin-token") ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) return false;
  if (token === (process.env.ADMIN_SECRET || "campusadmin123")) return true;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "campusrent_jwt_secret");
    return decoded && decoded.role === "admin";
  } catch {
    return false;
  }
}

// GET: Fetch all database listings, counts, and FCFS seller queues
export async function GET() {
  try {
    await connectDB();

    let listings = await Listing.find({ status: { $ne: "removed" } }).sort({ createdAt: 1 });

    // Auto-seed if database is completely fresh
    if (listings.length === 0) {
      await Listing.insertMany(initialSeedItems);
      listings = await Listing.find({ status: { $ne: "removed" } }).sort({ createdAt: 1 });
    }

    // Real database counts (sum of quantities of available items)
    const counts = {};
    const fcfsSellers = {};

    for (const item of listings) {
      const key = item.name.toLowerCase().trim();
      const properName = item.name;

      if (item.status === "available" && item.quantity > 0) {
        counts[key] = (counts[key] || 0) + item.quantity;
      }

      // Group sellers in First-Come, First-Served (FCFS) order
      if (!fcfsSellers[properName]) {
        fcfsSellers[properName] = [];
      }

      fcfsSellers[properName].push({
        id: item._id.toString(),
        sellerName: item.sellerName || item.ownerName || "Student Seller",
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
      totalCount: listings.reduce((sum, item) => sum + (item.quantity || 0), 0),
    });
  } catch (error) {
    console.error("Error fetching listings:", error);
    return NextResponse.json(
      { message: "Could not fetch database listings.", listings: [], counts: {}, fcfsSellers: {} },
      { status: 500 }
    );
  }
}

// POST: Add a new rental/lending listing (by student seller or admin)
export async function POST(request) {
  try {
    const body = await request.json();

    const {
      name,
      category,
      price,
      period,
      hostel,
      block,
      room,
      note,
      photo,
      emoji,
      color,
      quantity,
      owner,
      ownerName,
      sellerName,
      sellerPhone,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { message: "Product name is required." },
        { status: 400 }
      );
    }

    await connectDB();

    const listing = await Listing.create({
      name: name.trim(),
      category: category || "Other",
      price: Number(price) || 0,
      period: period || "day",
      hostel: hostel?.trim() || "Kalam",
      block: block?.trim() || "A",
      room: room?.trim() || "",
      note: note || "",
      photo: photo || "",
      emoji: emoji || "📦",
      color: color || "mint",
      quantity: Number(quantity) > 0 ? Number(quantity) : 1,
      owner: owner && mongoose.Types.ObjectId.isValid(owner) ? owner : undefined,
      ownerName: ownerName?.trim() || sellerName?.trim() || "Campus Student",
      sellerName: sellerName?.trim() || ownerName?.trim() || "Campus Student",
      sellerPhone: sellerPhone?.trim() || "",
      isNegotiable: true,
      status: "available",
    });

    return NextResponse.json(
      { message: "Listing added to database and placed in FCFS seller queue!", listing },
      { status: 201 }
    );
  } catch (error) {
    console.error("Listing creation error:", error);

    return NextResponse.json(
      { message: "Could not add product to database." },
      { status: 500 }
    );
  }
}

// PATCH: Update listing (e.g. mark as lent, update quantity, etc.)
export async function PATCH(request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ message: "Admin authorization required." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status, quantity } = body;

    if (!id) {
      return NextResponse.json({ message: "Listing ID is required." }, { status: 400 });
    }

    await connectDB();
    const updateFields = {};
    if (status) updateFields.status = status;
    if (quantity !== undefined) updateFields.quantity = Number(quantity);

    const updated = await Listing.findByIdAndUpdate(id, updateFields, { new: true });

    return NextResponse.json({ message: "Listing updated successfully.", listing: updated });
  } catch (error) {
    console.error("Error updating listing:", error);
    return NextResponse.json({ message: "Could not update listing." }, { status: 500 });
  }
}

// DELETE: Remove product from database
export async function DELETE(request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ message: "Admin authorization required." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Product ID is required." }, { status: 400 });
    }

    await connectDB();
    await Listing.findByIdAndDelete(id);

    return NextResponse.json({ message: "Product removed from database listings." });
  } catch (error) {
    console.error("Error deleting listing:", error);
    return NextResponse.json({ message: "Could not remove product." }, { status: 500 });
  }
}
