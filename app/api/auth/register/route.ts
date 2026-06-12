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

    await connectDB();

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
    console.error("[REGISTER] Full error:", err);
    
    // Handle specific MongoDB connection errors
    if (err.message?.includes('querySrv ENOTFOUND') || err.message?.includes('ENOTFOUND')) {
      return errorResponse("Database connection failed - please check MongoDB configuration", 500);
    }
    
    if (err.message?.includes('authentication failed')) {
      return errorResponse("Database authentication failed - please check credentials", 500);
    }
    
    return errorResponse("Registration failed - please try again", 500);
  }
}
