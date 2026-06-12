import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { signToken } from "@/lib/auth";
import { successResponse, errorResponse } from "@/utils/apiResponse";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return errorResponse("All fields are required");
    }

    // Validate MongoDB URI is present
    if (!process.env.MONGODB_URI) {
      console.error("[REGISTER] MONGODB_URI environment variable not found");
      return errorResponse("Database configuration error", 500);
    }

    // Try to connect to database with specific error handling
    try {
      await connectDB();
    } catch (dbErr: any) {
      console.error("[REGISTER] Database connection failed:", dbErr.message);
      return errorResponse("Database connection failed. Please try again later.", 500);
    }

    const existing = await User.findOne({ email });
    if (existing) return errorResponse("Email already in use", 409);

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashed });

    const token = signToken({ userId: user._id, email: user.email });

    return successResponse(
      { token, user: { id: user._id, name: user.name, email: user.email } },
      201
    );
  } catch (err: any) {
    console.error("[REGISTER] Registration error:", err);
    
    // Handle specific MongoDB connection errors
    if (err.message?.includes('querySrv ENOTFOUND') || err.message?.includes('ENOTFOUND')) {
      return errorResponse("Database connection failed. Please try again later.", 500);
    }
    
    if (err.message?.includes('authentication failed')) {
      return errorResponse("Database authentication failed. Please try again later.", 500);
    }

    if (err.message?.includes('timeout')) {
      return errorResponse("Database connection timeout. Please try again later.", 500);
    }
    
    return errorResponse("Registration failed. Please try again later.", 500);
  }
}
