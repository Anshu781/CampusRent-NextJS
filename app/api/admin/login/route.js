import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import connectDB from "../../../../lib/mongodb.js";
import User from "../../../../models/User.js";

const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@campusrent.com";
const DEFAULT_ADMIN_PASS = process.env.ADMIN_PASSWORD || "campusadmin123";
const DEFAULT_ADMIN_SECRET = process.env.ADMIN_SECRET || "campusadmin123";
const JWT_SECRET = process.env.JWT_SECRET || "campusrent_jwt_secret";

export async function POST(request) {
  try {
    const { email, password, passkey } = await request.json();

    const normalizedEmail = (email || "").trim().toLowerCase();
    const providedPass = (password || passkey || "").trim();

    if (!providedPass) {
      return NextResponse.json(
        { message: "Admin password or security key is required." },
        { status: 400 }
      );
    }

    // 1. Check against master environment admin credentials or passkey
    const matchesMasterEmail = !normalizedEmail || normalizedEmail === DEFAULT_ADMIN_EMAIL.toLowerCase();
    const matchesMasterPass = providedPass === DEFAULT_ADMIN_PASS || providedPass === DEFAULT_ADMIN_SECRET;

    if (matchesMasterEmail && matchesMasterPass) {
      const token = jwt.sign(
        { role: "admin", email: DEFAULT_ADMIN_EMAIL },
        JWT_SECRET,
        { expiresIn: "12h" }
      );

      return NextResponse.json({
        success: true,
        message: "Admin authentication successful.",
        token,
        admin: {
          email: DEFAULT_ADMIN_EMAIL,
          role: "admin",
          name: "Campus Administrator",
        },
      });
    }

    // 2. Check if user is registered in MongoDB with role: "admin"
    try {
      await connectDB();
      const dbUser = await User.findOne({
        email: normalizedEmail,
        role: "admin",
      }).select("+password");

      if (dbUser && (await bcrypt.compare(providedPass, dbUser.password))) {
        const token = jwt.sign(
          { id: dbUser._id, role: "admin", email: dbUser.email },
          JWT_SECRET,
          { expiresIn: "12h" }
        );

        return NextResponse.json({
          success: true,
          message: "Admin authentication successful.",
          token,
          admin: {
            id: dbUser._id,
            email: dbUser.email,
            role: "admin",
            name: dbUser.name,
          },
        });
      }
    } catch (dbErr) {
      console.warn("DB check during admin login:", dbErr.message);
    }

    // If neither matched
    return NextResponse.json(
      { message: "Access Denied: Invalid admin credentials." },
      { status: 401 }
    );
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { message: "Server error during admin authentication." },
      { status: 500 }
    );
  }
}
