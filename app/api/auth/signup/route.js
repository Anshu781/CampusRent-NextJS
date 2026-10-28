import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "../../../../lib/mongodb.js";
import User from "../../../../models/User.js";

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { message: "Name, email and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    await connectDB();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    return NextResponse.json(
      {
        message: "Account created successfully.",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error?.code === 11000) {
      return NextResponse.json(
        { message: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // console.error("Signup error:", error);

    console.error("Signup error:", error);

return NextResponse.json(
  {
    message: error.message || "Unknown signup error",
  },
  { status: 500 }
);
    // return NextResponse.json(
    //   { message: "Unable to create account. Check your database configuration." },
    //   { status: 500 }
    // );
  }
}
