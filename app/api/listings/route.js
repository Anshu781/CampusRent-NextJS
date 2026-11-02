import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb.js";
import Listing from "../../../models/Listing.js";
import mongoose from "mongoose";

const initialSeedItems = [
  { name: "Electric kettle", category: "Appliances", price: 25, period: "day", emoji: "🫖", color: "peach", ownerName: "Aarav", hostel: "Kalam", block: "B", note: "1.5L · auto shut-off", quantity: 3 },
  { name: "Steam iron", category: "Appliances", price: 20, period: "day", emoji: "👔", color: "lavender", ownerName: "Mehak", hostel: "Aryabhatta", block: "C", note: "Quick heat · easy to use", quantity: 2 },
  { name: "Scientific calculator", category: "Study", price: 15, period: "day", emoji: "🧮", color: "mint", ownerName: "Rishabh", hostel: "CV Raman", block: "", note: "Exam-week friendly", quantity: 5 },
  { name: "Cycle", category: "Mobility", price: 60, period: "day", emoji: "🚲", color: "blue", ownerName: "Sana", hostel: "Kalam", block: "D", note: "Lock included", quantity: 1 },
  { name: "Desk lamp", category: "Study", price: 12, period: "day", emoji: "💡", color: "yellow", ownerName: "Kabir", hostel: "Aryabhatta", block: "A", note: "Warm + cool light", quantity: 4 },
  { name: "Bluetooth speaker", category: "Electronics", price: 35, period: "day", emoji: "🔊", color: "pink", ownerName: "Ira", hostel: "Ashima", block: "", note: "Portable · great sound", quantity: 2 },
  { name: "Extension board", category: "Appliances", price: 10, period: "day", emoji: "🔌", color: "mint", ownerName: "Dev", hostel: "Married Accommodation", block: "", note: "4 sockets · 2m cable", quantity: 6 },
  { name: "Badminton set", category: "Sports", price: 30, period: "day", emoji: "🏸", color: "peach", ownerName: "Ananya", hostel: "Kalam", block: "A", note: "2 rackets + shuttle", quantity: 2 },
  { name: "Laptop stand", category: "Electronics", price: 20, period: "day", emoji: "💻", color: "blue", ownerName: "Ishaan", hostel: "Kalam", block: "B", note: "Adjustable height", quantity: 3 },
  { name: "Study table", category: "Furniture", price: 45, period: "day", emoji: "🪑", color: "yellow", ownerName: "Riya", hostel: "Aryabhatta", block: "B", note: "Compact study desk", quantity: 1 },
  { name: "Office chair", category: "Furniture", price: 40, period: "day", emoji: "💺", color: "lavender", ownerName: "Arjun", hostel: "CV Raman", block: "", note: "Comfortable seat", quantity: 2 },
  { name: "Room fan", category: "Appliances", price: 30, period: "day", emoji: "🌀", color: "mint", ownerName: "Diya", hostel: "Kalam", block: "C", note: "Portable table fan", quantity: 2 },
  { name: "Mini refrigerator", category: "Appliances", price: 100, period: "day", emoji: "🧊", color: "blue", ownerName: "Nikhil", hostel: "Aryabhatta", block: "D", note: "Compact fridge", quantity: 1 },
  { name: "Power bank", category: "Electronics", price: 20, period: "day", emoji: "🔋", color: "yellow", ownerName: "Aditi", hostel: "Kalam", block: "A", note: "10000 mAh", quantity: 4 },
  { name: "USB-C charger", category: "Electronics", price: 15, period: "day", emoji: "🔌", color: "peach", ownerName: "Rahul", hostel: "CV Raman", block: "", note: "Fast charging", quantity: 5 },
  { name: "HDMI cable", category: "Electronics", price: 8, period: "day", emoji: "🖥️", color: "lavender", ownerName: "Simran", hostel: "Kalam", block: "B", note: "2 metre cable", quantity: 3 },
  { name: "Computer mouse", category: "Electronics", price: 10, period: "day", emoji: "🖱️", color: "mint", ownerName: "Yash", hostel: "Aryabhatta", block: "A", note: "Wireless mouse", quantity: 4 },
  { name: "Keyboard", category: "Electronics", price: 15, period: "day", emoji: "⌨️", color: "blue", ownerName: "Pooja", hostel: "Kalam", block: "D", note: "USB keyboard", quantity: 2 },
  { name: "Headphones", category: "Electronics", price: 25, period: "day", emoji: "🎧", color: "pink", ownerName: "Aditya", hostel: "Ashima", block: "", note: "Over-ear headphones", quantity: 2 },
  { name: "Webcam", category: "Electronics", price: 20, period: "day", emoji: "📷", color: "yellow", ownerName: "Neha", hostel: "CV Raman", block: "", note: "Online classes", quantity: 2 },
  { name: "Backpack", category: "Accessories", price: 15, period: "day", emoji: "🎒", color: "peach", ownerName: "Karan", hostel: "Kalam", block: "A", note: "Spacious backpack", quantity: 3 },
  { name: "Rain umbrella", category: "Accessories", price: 8, period: "day", emoji: "☂️", color: "lavender", ownerName: "Tanya", hostel: "Aryabhatta", block: "C", note: "Full-size umbrella", quantity: 4 },
  { name: "Yoga mat", category: "Sports", price: 12, period: "day", emoji: "🧘", color: "mint", ownerName: "Manav", hostel: "Kalam", block: "B", note: "Non-slip mat", quantity: 2 },
  { name: "Cricket kit", category: "Sports", price: 50, period: "day", emoji: "🏏", color: "blue", ownerName: "Ishita", hostel: "CV Raman", block: "", note: "Bat and ball", quantity: 1 },
  { name: "Football", category: "Sports", price: 20, period: "day", emoji: "⚽", color: "yellow", ownerName: "Varun", hostel: "Kalam", block: "C", note: "Standard football", quantity: 3 },
  { name: "Basketball", category: "Sports", price: 25, period: "day", emoji: "🏀", color: "peach", ownerName: "Kriti", hostel: "Aryabhatta", block: "D", note: "Outdoor basketball", quantity: 2 },
  { name: "Badminton racket", category: "Sports", price: 15, period: "day", emoji: "🏸", color: "lavender", ownerName: "Aman", hostel: "Kalam", block: "B", note: "Single racket", quantity: 4 },
  { name: "Chess board", category: "Sports", price: 10, period: "day", emoji: "♟️", color: "mint", ownerName: "Mira", hostel: "CV Raman", block: "", note: "Wooden chess set", quantity: 2 },
  { name: "Novel collection", category: "Books", price: 12, period: "day", emoji: "📚", color: "blue", ownerName: "Sahil", hostel: "Kalam", block: "D", note: "Fiction and classics", quantity: 6 },
  { name: "Engineering textbook", category: "Books", price: 20, period: "day", emoji: "📖", color: "yellow", ownerName: "Naina", hostel: "Aryabhatta", block: "A", note: "Semester study material", quantity: 8 },
  { name: "Drawing kit", category: "Study", price: 15, period: "day", emoji: "🎨", color: "pink", ownerName: "Om", hostel: "Kalam", block: "C", note: "Pencils and colours", quantity: 2 },
  { name: "Whiteboard", category: "Study", price: 18, period: "day", emoji: "📝", color: "mint", ownerName: "Sara", hostel: "CV Raman", block: "", note: "Includes markers", quantity: 3 },
  { name: "Tripod", category: "Electronics", price: 25, period: "day", emoji: "📱", color: "peach", ownerName: "Rohan", hostel: "Kalam", block: "A", note: "Phone tripod", quantity: 2 },
  { name: "Ring light", category: "Electronics", price: 20, period: "day", emoji: "💡", color: "lavender", ownerName: "Anvi", hostel: "Aryabhatta", block: "B", note: "Adjustable brightness", quantity: 2 },
  { name: "Induction cooktop", category: "Appliances", price: 50, period: "day", emoji: "🍳", color: "yellow", ownerName: "Vivek", hostel: "Ashima", block: "", note: "Portable cooktop", quantity: 1 },
  { name: "Sandwich maker", category: "Appliances", price: 25, period: "day", emoji: "🥪", color: "mint", ownerName: "Isha", hostel: "Kalam", block: "D", note: "Non-stick plates", quantity: 2 },
  { name: "Pressure cooker", category: "Appliances", price: 20, period: "day", emoji: "🍲", color: "peach", ownerName: "Harsh", hostel: "Aryabhatta", block: "C", note: "Small family size", quantity: 2 },
  { name: "Storage boxes", category: "Home", price: 10, period: "day", emoji: "📦", color: "blue", ownerName: "Ayesha", hostel: "CV Raman", block: "", note: "Set of three", quantity: 5 },
  { name: "Bedsheet set", category: "Home", price: 15, period: "day", emoji: "🛏️", color: "pink", ownerName: "Parth", hostel: "Kalam", block: "B", note: "Bedsheet and pillow covers", quantity: 3 },
  { name: "Electric screwdriver", category: "Tools", price: 20, period: "day", emoji: "🪛", color: "yellow", ownerName: "Kush", hostel: "Aryabhatta", block: "D", note: "Basic repair kit", quantity: 2 }
];

// GET: Fetch all database listings and product counts
export async function GET() {
  try {
    await connectDB();

    let listings = await Listing.find({ status: { $ne: "removed" } }).sort({ createdAt: -1 });

    // If database has 0 listings, auto-seed initial items
    if (listings.length === 0) {
      await Listing.insertMany(initialSeedItems);
      listings = await Listing.find({ status: { $ne: "removed" } }).sort({ createdAt: -1 });
    }

    // Calculate count of each product present in DB
    const counts = {};
    for (const item of listings) {
      const key = item.name.toLowerCase().trim();
      counts[key] = (counts[key] || 0) + (item.quantity || 1);
    }

    return NextResponse.json({
      listings,
      counts,
      totalCount: listings.reduce((sum, item) => sum + (item.quantity || 1), 0),
    });
  } catch (error) {
    console.error("Error fetching listings:", error);
    return NextResponse.json(
      { message: "Could not fetch database listings.", listings: [], counts: {} },
      { status: 500 }
    );
  }
}

// POST: Add a new rental or buy product into the database
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
      ownerName: ownerName?.trim() || "Campus Admin",
      status: "available",
    });

    return NextResponse.json(
      { message: "Product added to database listings successfully.", listing },
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

// DELETE: Remove product from database
export async function DELETE(request) {
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
