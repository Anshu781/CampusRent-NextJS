import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectDB from "../../../../lib/mongodb.js";
import User from "../../../../models/User.js";

const DEFAULT_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@campusrent.com").toLowerCase();
const DEFAULT_ADMIN_PASS = process.env.ADMIN_PASSWORD || "campusadmin123";
const JWT_SECRET = process.env.JWT_SECRET || "campusrent_jwt_secret";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email?.trim() || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 }
      );
    }

    const inputEmail = email.trim().toLowerCase();

    // 1. Check if entering Master Admin credentials
    if (inputEmail === DEFAULT_ADMIN_EMAIL && password === DEFAULT_ADMIN_PASS) {
      const token = jwt.sign(
        { role: "admin", email: DEFAULT_ADMIN_EMAIL },
        JWT_SECRET,
        { expiresIn: "12h" }
      );

      return NextResponse.json({
        message: "Admin login successful! Unlocking Admin Console...",
        token,
        user: {
          id: "admin",
          name: "Campus Administrator",
          email: DEFAULT_ADMIN_EMAIL,
          role: "admin",
        },
      });
    }

    // 2. Check standard user in MongoDB
    await connectDB();

    const user = await User.findOne({
      email: inputEmail,
    }).select("+password");

    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Check if this DB user has admin role
    const isAdmin = user.role === "admin";
    let token = "";
    if (isAdmin) {
      token = jwt.sign(
        { id: user._id.toString(), role: "admin", email: user.email },
        JWT_SECRET,
        { expiresIn: "12h" }
      );
    }

    return NextResponse.json({
      message: isAdmin ? "Admin login successful!" : "Login successful!",
      token: isAdmin ? token : undefined,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role || "user",
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      { message: "Server error. Check the terminal." },
      { status: 500 }
    );
  }
}
